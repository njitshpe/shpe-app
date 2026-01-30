import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventRow {
  id: string; // UUID is string
  event_id: string; // The text slug
  name: string;
  start_time: string;
  end_time: string;
  is_active: boolean;
  deleted_at: string | null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Create Supabase client with user's auth token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Verify authentication using Supabase's built-in JWT verification
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({
          error: "Unauthorized",
          code: "UNAUTHORIZED",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse request
    const url = new URL(req.url);
    const eventIdParam = url.pathname.split("/").pop(); // This is the 'event_id' (slug) passed in URL

    if (!eventIdParam) {
      return new Response(JSON.stringify({ error: "Event ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin (any valid, non-revoked admin role)
    const { data: adminRole, error: adminError } = await supabase
      .from("admin_roles")
      .select("id, role_type")
      .eq("user_id", user.id)
      .is("revoked_at", null)
      .maybeSingle();

    if (adminError || !adminRole) {
      console.error("Admin role check failed:", adminError);
      return new Response(
        JSON.stringify({
          error: "Forbidden: Admin access required",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get event details
    // Note: We use the 'event_id' column (slug) for lookup, not UUID, since that's likely what front-end sends.
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", eventIdParam)
      .is("deleted_at", null) // Use deleted_at instead of is_archived
      .single<EventRow>();

    if (eventError || !event) {
      console.error("Event lookup failed:", eventError);
      return new Response(
        JSON.stringify({
          error: "Event not found",
          errorCode: "EVENT_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if event is active
    if (!event.is_active) {
      return new Response(
        JSON.stringify({
          error: "Event is not active",
          errorCode: "EVENT_INACTIVE",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate time window
    const now = new Date();
    const startTime = new Date(event.start_time);
    const endTime = new Date(event.end_time);

    const checkInOpens = startTime;
    const checkInCloses = endTime;

    // Check if current time is within check-in window
    if (now < checkInOpens) {
      return new Response(
        JSON.stringify({
          error: "Check-in has not opened yet",
          errorCode: "CHECK_IN_NOT_OPEN",
          opensAt: checkInOpens.toISOString(),
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (now > checkInCloses) {
      return new Response(
        JSON.stringify({
          error: "Check-in has closed",
          errorCode: "CHECK_IN_CLOSED",
          closedAt: checkInCloses.toISOString(),
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Generate JWT token
    const jwtSecret = Deno.env.get("CHECK_IN_JWT_SECRET");
    if (!jwtSecret) {
      console.error("CHECK_IN_JWT_SECRET not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(jwtSecret),
      { name: "HMAC", hash: "SHA-256" },
      true,
      ["sign", "verify"]
    );

    // Payload uses 'id' (UUID) for internal consistency, and 'event_id' (slug) for record keeping
    const payload = {
      event_id: event.id, // Using UUID for the token payload is usually safer
      event_slug: event.event_id,
      event_name: event.name,
      iat: Math.floor(now.getTime() / 1000),
      exp: Math.floor(checkInCloses.getTime() / 1000),
      type: "check_in",
    };

    const token = await create({ alg: "HS256", typ: "JWT" }, payload, key);

    return new Response(
      JSON.stringify({
        success: true,
        token,
        event: {
          id: event.id,
          slug: event.event_id,
          name: event.name,
          checkInOpens: checkInOpens.toISOString(),
          checkInCloses: checkInCloses.toISOString(),
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating check-in token:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
