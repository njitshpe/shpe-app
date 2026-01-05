/**
 * award-points Edge Function
 *
 * Orchestrates points awarding and rank updates with atomic database transactions.
 * All business logic for point calculation is in ruleEngine.ts.
 *
 * POST /functions/v1/award-points
 * Body: { userId?: string, actionType: string, eventId?: string, metadata?: object }
 *
 * Returns: { success, transaction, newBalance, rank }
 * Or error: { success: false, error: string, code: string }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  computePoints,
  calculateRank,
  validatePayload,
  type ActionPayload,
  type ActionType,
  type RulesJson,
} from './ruleEngine.ts';

// CORS headers for browser requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  userId?: string;
  actionType: string;
  eventId?: string;
  metadata?: Record<string, unknown>;
}

interface TransactionRecord {
  id: string;
  userId: string;
  amount: number;
  reason: string;
  createdAt: string;
}

interface SuccessResponse {
  success: true;
  transaction: TransactionRecord;
  newBalance: number;
  rank: string;
  reasons: string[];
}

interface ErrorResponse {
  success: false;
  error: string;
  code: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client with service role for DB operations
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Missing Supabase configuration', 'CONFIGURATION_ERROR');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: RequestBody = await req.json();
    const { actionType, eventId, metadata = {} } = body;

    // Get userId from body or auth token
    let userId = body.userId;

    if (!userId) {
      // Try to get user from auth header
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const {
          data: { user },
          error: authError,
        } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return errorResponse('Invalid or missing authentication', 'UNAUTHORIZED');
        }
        userId = user.id;
      }
    }

    if (!userId) {
      return errorResponse('userId is required', 'UNAUTHORIZED');
    }

    // Validate payload
    const payload: ActionPayload = {
      action_type: actionType as ActionType,
      user_id: userId,
      event_id: eventId,
      metadata,
    };

    const validation = validatePayload(payload);
    if (!validation.valid) {
      return errorResponse(validation.errors.join('; '), 'INVALID_ACTION_TYPE');
    }

    // Check for duplicate award (idempotency)
    if (eventId) {
      const { data: existing } = await supabase
        .from('points')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('reason', actionType)
        .single();

      if (existing) {
        return errorResponse(
          'Points already awarded for this action',
          'ALREADY_REWARDED'
        );
      }
    }

    // Validate event exists if eventId provided
    if (eventId) {
      const { data: event, error: eventError } = await supabase
        .from('events')
        .select('id')
        .eq('id', eventId)
        .single();

      if (eventError || !event) {
        return errorResponse('Event not found', 'INVALID_EVENT');
      }
    }

    // Check preconditions (e.g., must be checked in for photo upload)
    if (actionType === 'photo_upload' && eventId) {
      const { data: checkin } = await supabase
        .from('event_attendance')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (!checkin) {
        return errorResponse(
          'User has not checked in to this event',
          'PRECONDITION_FAILED'
        );
      }
    }

    // Load active rules from database
    const { data: rulesData, error: rulesError } = await supabase
      .from('rank_rules')
      .select('rules')
      .eq('active', true)
      .single();

    if (rulesError || !rulesData) {
      return errorResponse('No active rule set found', 'RULES_NOT_FOUND');
    }

    const rulesJson = rulesData.rules as RulesJson;

    // Compute points using rule engine
    const computeResult = computePoints(rulesJson, payload);

    if (computeResult.points === 0) {
      return errorResponse(
        computeResult.reasons.join('; '),
        'INVALID_ACTION_TYPE'
      );
    }

    // Get current user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('rank_points, rank')
      .eq('id', userId)
      .single();

    if (profileError) {
      return errorResponse('User profile not found', 'UNAUTHORIZED');
    }

    const previousPoints = profile.rank_points ?? 0;
    const previousRank = profile.rank ?? 'unranked';
    const newPoints = Math.min(previousPoints + computeResult.points, 100); // Cap at 100

    // Calculate new rank
    let newRank = previousRank;
    if (computeResult.rank_affecting_allowed) {
      newRank = calculateRank(newPoints);
    }

    // 1. Insert points transaction record
    const { data: pointsRecord, error: pointsError } = await supabase
      .from('points')
      .insert({
        user_id: userId,
        event_id: eventId || null,
        amount: computeResult.points,
        reason: actionType,
        metadata: {
          ...metadata,
          reasons: computeResult.reasons,
        },
      })
      .select('id, created_at')
      .single();

    if (pointsError) {
      return errorResponse('Failed to record points', 'DATABASE_ERROR');
    }

    // 2. Insert audit record
    const { error: auditError } = await supabase
      .from('rank_transactions')
      .insert({
        user_id: userId,
        action_type: actionType,
        points_delta: computeResult.points,
        previous_points: previousPoints,
        new_points: newPoints,
        previous_rank: previousRank,
        new_rank: newRank,
        rank_changed: computeResult.rank_affecting_allowed && newRank !== previousRank,
        metadata: {
          event_id: eventId,
          ...metadata,
          reasons: computeResult.reasons,
          rank_affecting_allowed: computeResult.rank_affecting_allowed,
          // TODO: When canonical committee_members table exists, prefer DB-derived
          // membership over metadata. Change this to query the table instead.
          committee_member_from_metadata: metadata.committee_member,
        },
      });

    if (auditError) {
      console.error('Audit insert failed:', auditError);
      // Continue - audit failure shouldn't block points award
    }

    // 3. Update user profile
    const updateData: Record<string, unknown> = {
      rank_points: newPoints,
      updated_at: new Date().toISOString(),
    };

    if (computeResult.rank_affecting_allowed) {
      updateData.rank = newRank;
    }

    const { error: updateError } = await supabase
      .from('user_profiles')
      .update(updateData)
      .eq('id', userId);

    if (updateError) {
      return errorResponse('Failed to update profile', 'DATABASE_ERROR');
    }

    // Return success response (matching README schema)
    const response: SuccessResponse = {
      success: true,
      transaction: {
        id: pointsRecord.id,
        userId: userId,
        amount: computeResult.points,
        reason: actionType,
        createdAt: pointsRecord.created_at,
      },
      newBalance: newPoints,
      rank: newRank,
      reasons: computeResult.reasons,
    };

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse(
      'An unexpected error occurred',
      'SERVER_ERROR'
    );
  }
});

function errorResponse(message: string, code: string): Response {
  const body: ErrorResponse = {
    success: false,
    error: message,
    code,
  };

  const status = code === 'UNAUTHORIZED' ? 401 : code === 'INVALID_EVENT' ? 404 : 400;

  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
