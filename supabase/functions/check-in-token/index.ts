import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { create, verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EventRow {
  id: number;
  event_id: string;
  name: string;
  start_time: string;
  end_time: string;
  check_in_opens: string | null;
  check_in_closes: string | null;
  created_by: string;
  is_active: boolean;
  is_archived: boolean;
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
    const eventId = url.pathname.split("/").pop();

    if (!eventId) {
      return new Response(JSON.stringify({ error: "Event ID required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user is admin (event_manager or super_admin)
    const { data: adminRoles, error: adminError } = await supabase
      .from("admin_roles")
      .select("id, role_type")
      .eq("user_id", user.id)
      .in("role_type", ["event_manager", "super_admin"])
      .is("revoked_at", null)
      .limit(1);

    if (adminError || !adminRoles || adminRoles.length === 0) {
      console.error("Admin role check failed:", adminError);
      return new Response(
        JSON.stringify({
          error: "Forbidden: Event manager or super admin access required",
          code: "FORBIDDEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get event details
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("*")
      .eq("event_id", eventId)
      .eq("is_archived", false)
      .single<EventRow>();

    if (eventError || !event) {
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
    const checkInOpens = event.check_in_opens
      ? new Date(event.check_in_opens)
      : startTime;
    const checkInCloses = event.check_in_closes
      ? new Date(event.check_in_closes)
      : endTime;

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

    const payload = {
      event_id: event.event_id,
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
          id: event.event_id,
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
  } catch (error) {
    console.error("Error generating check-in token:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        errorCode: "INTERNAL_ERROR",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
