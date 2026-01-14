// supabase/functions/push-notifications/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  type: 'INSERT' | 'UPDATE' | 'ANNOUNCEMENT'
  table?: string
  record?: any
  schema?: string
  old_record?: any
  title?: string
  body?: string
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log("--- 1. FUNCTION STARTED ---")

    // Initialize Supabase Client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const payload: NotificationPayload = await req.json()
    const { type, record, old_record } = payload

    let title = ''
    let body = ''
    let dataPayload = {}

    // --- CASE A: MANUAL ANNOUNCEMENT ---
    if (type === 'ANNOUNCEMENT') {
      console.log("--- Logic: Manual Announcement")

      // Verify Admin Authorization for manual announcements
      // Note: Since this function uses SERVICE_ROLE_KEY, we must manually verify the user token if passed header
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        console.error("Missing Authorization header")
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Missing Auth Header' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } }
      )

      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (authError || !user) {
        console.error("Auth error:", authError)
        return new Response(JSON.stringify({ success: false, error: 'Unauthorized: Invalid Token' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log("User authenticated:", user.id)

      const { data: adminRoles, error: roleError } = await supabase
        .from('admin_roles')
        .select('id, role_type')
        .eq('user_id', user.id)
        .eq('role_type', 'super_admin')
        .is('revoked_at', null)
        .limit(1)

      if (roleError) {
        console.error("Role check error:", roleError)
      }

      if (!adminRoles || adminRoles.length === 0) {
        console.error("User is not a super admin:", user.id)
        return new Response(JSON.stringify({ success: false, error: 'Forbidden: Super Admin Access Required' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      console.log("Admin role confirmed")

      title = payload.title || 'Announcement'
      body = payload.body || ''
      dataPayload = { type: 'announcement' }

      // --- FETCH TOKENS & SEND ---
      const { data: profiles, error: profileError } = await supabase
        .from('user_profiles')
        .select('push_token')
        .not('push_token', 'is', null)

      if (profileError) {
        console.error("Profile fetch error:", profileError)
        return new Response(JSON.stringify({ success: false, error: 'Database Error' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const tokens = profiles.map((p) => p.push_token).filter((t) => t && t.length > 0)

      if (tokens.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No devices to notify' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: dataPayload,
      }))

      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })

      const receipt = await expoResponse.json()
      return new Response(JSON.stringify(receipt), { headers: { 'Content-Type': 'application/json' } })

    }
    // --- CASE B: DATABASE TRIGGER (INSERT/UPDATE) ---
    else {

      // --- 1. IDENTIFY THE EVENT ---
      // Your DB uses 'event_id', not 'id'
      const eventId = record?.event_id || old_record?.event_id

      // --- 2. GET THE REAL NAME ---
      // Your DB uses 'name', not 'title'
      let eventName = record?.name || old_record?.name || 'SHPE Event'

      // If we have an ID but no Name (phantom update), fetch it from DB
      if (eventId && (!eventName || eventName === 'SHPE Event')) {
        console.log(`--- Fetching name for event_id: ${eventId}`)
        const { data: eventData, error: eventError } = await supabase
          .from('events')
          .select('name')  // Select 'name' specifically
          .eq('event_id', eventId) // Match 'event_id'
          .single()

        if (!eventError && eventData?.name) {
          eventName = eventData.name
          console.log(`--- Found Real Name: ${eventName}`)
        }
      }

      let title = ''
      let body = ''

      if (type === 'INSERT') {
        console.log("--- Logic: New Event")
        title = `New Event: ${eventName} 📅`
        body = `Check out the details in the app!`

      } else if (type === 'UPDATE') {
        console.log("--- Logic: Update")

        const wasActive = old_record?.is_active ?? true
        const isActive = record.is_active

        // 1. CANCELLATION
        if (wasActive && !isActive) {
          title = `Cancelled: ${eventName} 🚫`
          body = `This event is no longer happening.`
        }
        // 2. RE-ACTIVATION
        else if (!wasActive && isActive) {
          title = `Back On: ${eventName} ✅`
          body = `This event is active again!`
        }
        // 3. GENERAL UPDATE
        else {
          title = `Update: ${eventName} 📢`
          body = `Details have been updated.`
        }
      } else {
        return new Response('Event type not supported', { status: 200 })
      }

      // --- FETCH TOKENS ---
      const { data: profiles, error } = await supabase
        .from('user_profiles')
        .select('push_token')
        .not('push_token', 'is', null)

      if (error) throw error

      const tokens = profiles.map((p) => p.push_token).filter((t) => t && t.length > 0)

      if (tokens.length === 0) {
        return new Response('No tokens found', { status: 200 })
      }

      // --- SEND TO EXPO ---
      const messages = tokens.map((token) => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: { eventId: eventId },
      }))

      const expoResponse = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messages),
      })

      const receipt = await expoResponse.json()
      return new Response(JSON.stringify(receipt), { headers: { 'Content-Type': 'application/json' } })
    }

  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})