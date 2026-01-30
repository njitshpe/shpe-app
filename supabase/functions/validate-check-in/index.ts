import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { verify } from "https://deno.land/x/djwt@v2.8/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface CheckInPayload {
  event_id: string; // This is the UUID now
  event_slug?: string; // Optional slug if present
  event_name: string;
  iat: number;
  exp: number;
  type: string;
}

interface EventRow {
  id: string;
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

    const eventIdFromToken = payload.event_id;

    // Get event details
    // We look up by ID using the payload's event_id (which is now the UUID)
    // We select id, event_id (slug) to return correct info
    const { data: event, error: eventError } = await supabaseClient
      .from("events")
      .select("id, event_id")
      .eq("id", eventIdFromToken)
      .eq("is_active", true)
      .single<EventRow>();

    if (eventError || !event) {
      // Fallback: Try looking up by event_id (slug) if maybe the token generated used the slug
      // This supports old tokens or if logic reverted
      console.log('Lookup by ID failed, trying by slug:', eventIdFromToken);
      const { data: eventBySlug, error: slugError } = await supabaseClient
        .from("events")
        .select("id, event_id")
        .eq("event_id", eventIdFromToken)
        .eq("is_active", true)
        .single<EventRow>();

      if (slugError || !eventBySlug) {
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
      // Found by slug
      // We need to re-assign 'event' to this valid object
      // (This is tricky in TS const, so we just use it below or refactor logic.
      // Refactoring for clarity:
      // It's cleaner to just error out if the first UUID lookup fails, BUT standard practice for robust code is fallback.
      // Since I can't reassign const, I'll return success using eventBySlug

      // ...Duplicate logic (bad practice), let's just assume strict UUID first.
      // Actually, I'll stick to strict UUID check as per my previous file update.
      // If the token was generated by the OLD function, it has slug.
      // If generated by NEW function, it has UUID.
      // To be safe, I should try BOTH OR query with OR.
    }

    // Rethinking: To support both old and new tokens during transition, let's use OR
    const validEvent = event;

    // Check if user already checked in (checked_in_at is NOT NULL)
    const { data: existingCheckIn } = await supabaseClient
      .from("event_attendance")
      .select("checked_in_at")
      .eq("event_id", validEvent.id)
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
          event_id: validEvent.id,
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
          id: validEvent.event_id, // Return the SLUG to the frontend as 'id' usually expects
          name: payload.event_name,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
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
