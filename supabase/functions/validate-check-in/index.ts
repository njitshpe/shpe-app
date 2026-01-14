import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckInPayload {
  event_id: string;
  event_name: string;
  iat: number;
  exp: number;
  type: string;
}

interface EventRow {
  id: string; // Changed to UUID
  event_id: string;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get Supabase client
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
      }
    );

    // Get authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const { token, latitude, longitude } = await req.json();

    if (!token) {
      return new Response(
        JSON.stringify({
          error: "Token required",
          errorCode: "MISSING_TOKEN",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate latitude and longitude if provided
    if (latitude !== undefined && latitude !== null) {
      const lat = Number(latitude);
      if (isNaN(lat) || lat < -90 || lat > 90) {
        return new Response(
          JSON.stringify({
            error: "Invalid latitude value",
            errorCode: "INVALID_COORDINATES",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    if (longitude !== undefined && longitude !== null) {
      const lng = Number(longitude);
      if (isNaN(lng) || lng < -180 || lng > 180) {
        return new Response(
          JSON.stringify({
            error: "Invalid longitude value",
            errorCode: "INVALID_COORDINATES",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Verify JWT token
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

    let payload: CheckInPayload;
    try {
      const verified = await verify(token, key);
      payload = verified as unknown as CheckInPayload;
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid or expired token",
          errorCode: "INVALID_TOKEN",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate token type
    if (payload.type !== "check_in") {
      return new Response(
        JSON.stringify({
          error: "Invalid token type",
          errorCode: "INVALID_TOKEN_TYPE",
        }),
        {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const eventId = payload.event_id;

    // Get event details
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("id, event_id")
      .eq("event_id", eventId)
      .eq("is_active", true)
      .single<EventRow>();

    if (eventError || !event) {
      return new Response(
        JSON.stringify({
          error: "Event not found or inactive",
          errorCode: "EVENT_NOT_FOUND",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user already checked in (checked_in_at is NOT NULL)
    const { data: existingCheckIn } = await supabaseClient
      .from("event_attendance")
      .select("checked_in_at")
      .eq("event_id", event.id)
      .eq("user_id", user.id)
      .single();

    if (existingCheckIn && existingCheckIn.checked_in_at) {
      return new Response(
        JSON.stringify({
          error: "Already checked in to this event",
          errorCode: "ALREADY_CHECKED_IN",
        }),
        {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create or Update check-in record (handles RSVP'd users)
    const { data: attendance, error: attendanceError } = await supabaseClient
      .from("event_attendance")
      .upsert(
        {
          event_id: event.id,
          user_id: user.id,
          checked_in_at: new Date().toISOString(),
        },
        { onConflict: "event_id, user_id" }
      )
      .select()
      .single();

    if (attendanceError) {
      console.error("Error creating attendance record:", attendanceError);
      return new Response(
        JSON.stringify({
          error: "Failed to record check-in",
          errorCode: "CHECK_IN_FAILED",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        attendance,
        event: {
          id: event.event_id,
          name: payload.event_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error validating check-in:", error);
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
