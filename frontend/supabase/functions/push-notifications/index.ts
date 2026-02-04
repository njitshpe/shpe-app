// supabase/functions/push-notifications/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

interface NotificationPayload {
  type: 'INSERT' | 'UPDATE' | 'ANNOUNCEMENT'
  table?: string
  record?: any
  schema?: string
  old_record?: any
  title?: string
  body?: string
}

type SettingKey = 'announcements_enabled' | 'new_events_enabled' | 'event_reminders_enabled'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const EXPO_BATCH_SIZE = 100
const INBOX_BATCH_SIZE = 500

// ── Helpers ──────────────────────────────────────────────────────────────

/** Batch-insert inbox notifications for a list of users. */
async function writeInboxNotifications(
  supabase: SupabaseClient,
  userIds: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
  category: string,
) {
  if (userIds.length === 0) return

  const rows = userIds.map((uid) => ({
    user_id: uid,
    title,
    body,
    data,
    category,
    is_read: false,
  }))

  for (let i = 0; i < rows.length; i += INBOX_BATCH_SIZE) {
    const { error } = await supabase
      .from('notifications')
      .insert(rows.slice(i, i + INBOX_BATCH_SIZE))

    if (error) console.error('Inbox insert error:', error)
  }
}

/**
 * Return Expo push tokens for users who have:
 *   1. notifications_enabled = true  (master toggle)
 *   2. [settingKey] = true           (category toggle)
 *
 * Users with no settings row are treated as all-defaults-ON (legacy users).
 */
async function getEligiblePushTokens(
  supabase: SupabaseClient,
  userIds: string[],
  settingKey: SettingKey,
): Promise<string[]> {
  if (userIds.length === 0) return []

  // Fetch push tokens for the target users
  const { data: profiles, error: profileErr } = await supabase
    .from('user_profiles')
    .select('id, push_token')
    .in('id', userIds)
    .not('push_token', 'is', null)

  if (profileErr || !profiles || profiles.length === 0) return []

  const profileUserIds = profiles.map((p: any) => p.id)

  // Fetch settings rows for those users — filter to allowed
  const { data: settings, error: settingsErr } = await supabase
    .from('user_notification_settings')
    .select('user_id')
    .in('user_id', profileUserIds)
    .eq('notifications_enabled', true)
    .eq(settingKey, true)

  if (settingsErr) {
    console.error('Settings query error:', settingsErr)
  }

  const allowedBySettings = new Set((settings ?? []).map((s: any) => s.user_id))

  // Users WITHOUT a settings row → treat as defaults-ON (legacy users)
  const usersWithSettings = new Set(
    (await supabase
      .from('user_notification_settings')
      .select('user_id')
      .in('user_id', profileUserIds)
    ).data?.map((s: any) => s.user_id) ?? []
  )

  return profiles
    .filter((p: any) => {
      if (!usersWithSettings.has(p.id)) return true // No row → default ON
      return allowedBySettings.has(p.id)
    })
    .map((p: any) => p.push_token)
    .filter((t: string) => t && t.length > 0)
}

/** Get user IDs who RSVP'd to an event (going, confirmed, waitlist, pending). */
async function getAffectedUserIds(
  supabase: SupabaseClient,
  eventUUID: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from('event_attendance')
    .select('user_id')
    .eq('event_id', eventUUID)
    .in('status', ['going', 'confirmed', 'waitlist', 'pending'])

  if (error) {
    console.error('Attendance query error:', error)
    return []
  }

  return (data ?? []).map((r: any) => r.user_id)
}

/** Get all user IDs (for announcements and new events). */
async function getAllUserIds(supabase: SupabaseClient): Promise<string[]> {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id')

  if (error) {
    console.error('User profiles query error:', error)
    return []
  }

  return (data ?? []).map((r: any) => r.id)
}

/** Send push notifications to Expo in batches. */
async function sendExpoPush(
  tokens: string[],
  title: string,
  body: string,
  data: Record<string, unknown>,
): Promise<any[]> {
  if (tokens.length === 0) return []

  const messages = tokens.map((token) => ({
    to: token,
    sound: 'default',
    title,
    body,
    data,
  }))

  const receipts: any[] = []

  for (let i = 0; i < messages.length; i += EXPO_BATCH_SIZE) {
    const batch = messages.slice(i, i + EXPO_BATCH_SIZE)
    try {
      const res = await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Accept-encoding': 'gzip, deflate',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batch),
      })
      const receipt = await res.json()
      receipts.push(receipt)
    } catch (err) {
      console.error('Expo push error (batch):', err)
    }
  }

  return receipts
}

// ── Main Handler ─────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('--- FUNCTION STARTED ---')

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const payload: NotificationPayload = await req.json()
    const { type, record, old_record } = payload

    // ── CASE A: MANUAL ANNOUNCEMENT ────────────────────────────────────
    if (type === 'ANNOUNCEMENT') {
      console.log('--- Logic: Announcement')

      // Verify admin authorization
      const authHeader = req.headers.get('Authorization')
      if (!authHeader) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Missing Auth Header' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const authClient = createClient(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_ANON_KEY')!,
        { global: { headers: { Authorization: authHeader } } },
      )

      const { data: { user }, error: authError } = await authClient.auth.getUser()
      if (authError || !user) {
        return new Response(
          JSON.stringify({ success: false, error: 'Unauthorized: Invalid Token' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const { data: adminRoles } = await supabase
        .from('admin_roles')
        .select('id')
        .eq('user_id', user.id)
        .eq('role_type', 'super_admin')
        .is('revoked_at', null)
        .limit(1)

      if (!adminRoles || adminRoles.length === 0) {
        return new Response(
          JSON.stringify({ success: false, error: 'Forbidden: Super Admin Access Required' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const title = payload.title || 'Announcement'
      const body = payload.body || ''
      const dataPayload = { type: 'announcement' }

      // Audience: all users
      const allUserIds = await getAllUserIds(supabase)

      // Inbox: all users
      await writeInboxNotifications(supabase, allUserIds, title, body, dataPayload, 'announcement')

      // Push: filtered by announcements_enabled
      const tokens = await getEligiblePushTokens(supabase, allUserIds, 'announcements_enabled')

      if (tokens.length === 0) {
        return new Response(
          JSON.stringify({ success: true, message: 'Inbox written. No push devices eligible.' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      const receipts = await sendExpoPush(tokens, title, body, dataPayload)
      return new Response(
        JSON.stringify({ success: true, push_receipts: receipts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── CASE B: DATABASE TRIGGER (INSERT / UPDATE) ─────────────────────
    // Guard against empty payloads (e.g. hard-delete triggers)
    if (!record && !old_record) {
      return new Response('No record data', { status: 200 })
    }

    // Resolve identifiers
    // record.id = UUID (PK), record.event_id = text slug (for deep-linking)
    const eventUUID = record?.id || old_record?.id
    const eventSlug = record?.event_id || old_record?.event_id
    let eventName = record?.name || old_record?.name || 'SHPE Event'

    // If name is missing (phantom update), fetch from DB
    if (eventSlug && (!eventName || eventName === 'SHPE Event')) {
      const { data: eventData } = await supabase
        .from('events')
        .select('name')
        .eq('event_id', eventSlug)
        .single()

      if (eventData?.name) eventName = eventData.name
    }

    // ── INSERT: New Event ──────────────────────────────────────────────
    if (type === 'INSERT') {
      console.log('--- Logic: New Event')

      const isFeatured = record?.is_featured === true
      const title = isFeatured ? `Featured: ${eventName}` : `New Event: ${eventName}`
      const body = 'Check out the details in the app!'
      const dataPayload = { eventId: eventSlug, is_featured: isFeatured }

      // Audience: all users
      const allUserIds = await getAllUserIds(supabase)

      // Inbox: all users
      await writeInboxNotifications(supabase, allUserIds, title, body, dataPayload, 'new_event')

      // Push: filtered by new_events_enabled
      const tokens = await getEligiblePushTokens(supabase, allUserIds, 'new_events_enabled')
      const receipts = await sendExpoPush(tokens, title, body, dataPayload)

      return new Response(
        JSON.stringify({ success: true, inbox: allUserIds.length, push: tokens.length, receipts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // ── UPDATE: Event Change ───────────────────────────────────────────
    if (type === 'UPDATE') {
      console.log('--- Logic: Event Update')

      const wasActive = old_record?.is_active ?? true
      const isActive = record?.is_active ?? true

      let title = ''
      let body = ''

      if (wasActive && !isActive) {
        title = `Cancelled: ${eventName}`
        body = 'This event is no longer happening.'
      } else if (!wasActive && isActive) {
        title = `Back On: ${eventName}`
        body = 'This event is active again!'
      } else {
        title = `Update: ${eventName}`
        body = 'Details have been updated.'
      }

      const dataPayload = { eventId: eventSlug }

      // Audience: RSVP'd users only
      const affectedUserIds = await getAffectedUserIds(supabase, eventUUID)

      if (affectedUserIds.length === 0) {
        console.log('--- No RSVP\'d users for this event, skipping')
        return new Response(
          JSON.stringify({ success: true, message: 'No affected users' }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
        )
      }

      // Inbox: affected users
      await writeInboxNotifications(supabase, affectedUserIds, title, body, dataPayload, 'event_update')

      // Push: filtered by event_reminders_enabled
      const tokens = await getEligiblePushTokens(supabase, affectedUserIds, 'event_reminders_enabled')
      const receipts = await sendExpoPush(tokens, title, body, dataPayload)

      return new Response(
        JSON.stringify({ success: true, inbox: affectedUserIds.length, push: tokens.length, receipts }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    return new Response('Unsupported event type', { status: 200 })

  } catch (err) {
    console.error(err)
    return new Response(String(err), { status: 500 })
  }
})
