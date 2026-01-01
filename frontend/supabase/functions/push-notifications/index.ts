// supabase/functions/push-notifications/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  type: 'INSERT' | 'UPDATE'
  table: string
  record: any       // The new data
  schema: string
  old_record: any   // The old data (before the update)
}

Deno.serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json()
    const { type, record, old_record } = payload

    // 1. Determine Message Content
    let title = ''
    let body = ''

    if (type === 'INSERT') {
      // --- NEW EVENT ---
      title = 'New SHPE Event!'
      body = `${record.title} is happening on ${new Date(record.date).toLocaleDateString()}`
    
    } else if (type === 'UPDATE') {
      // --- UPDATE Logic ---
      
      // Check for Cancellation (Active changed from true -> false)
      const wasActive = old_record?.is_active ?? true
      const isActive = record.is_active

      if (wasActive && !isActive) {
        title = 'Event Cancelled'
        body = `${record.title} has been cancelled.`
      } else {
        // Just a general update (Time, Room, etc.)
        title = 'Event Update'
        body = `Details for ${record.title} have been updated. Check the app for info.`
      }
    } else {
      // We don't care about Deletes for now
      return new Response('Event type not supported', { status: 200 })
    }

    // 2. Connect to Supabase to get user tokens
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // 3. Fetch all push tokens
    const { data: profiles, error } = await supabase
      .from('user_profiles')
      .select('push_token')
      .not('push_token', 'is', null)

    if (error) throw error

    const tokens = profiles
      .map((p) => p.push_token)
      .filter((t) => t && t.length > 0)

    if (tokens.length === 0) {
      return new Response('No tokens found', { status: 200 })
    }

    // 4. Send to Expo
    const messages = tokens.map((token) => ({
      to: token,
      sound: 'default',
      title: title,
      body: body,
      data: { eventId: record.id },
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

  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})