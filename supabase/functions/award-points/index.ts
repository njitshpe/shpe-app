
/**
 * award-points Edge Function (Consolidated Single File)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ==========================================
// PART 1: Rule Engine Logic
// ==========================================

export type ActionType =
  | 'attendance'
  | 'feedback'
  | 'photo_upload'
  | 'rsvp'
  | 'early_checkin'
  | 'committee_setup'
  | 'verified'
  | 'college_year';

export type PhotoType = 'alumni' | 'professional' | 'member_of_month';

export interface RuleDefinition {
  action_type: ActionType;
  base_points: number;
  multipliers?: MultiplierCondition[];
  requires_committee_for_rank?: boolean;
  max_points?: number;
  enabled?: boolean;
}

export interface MultiplierCondition {
  field: string;
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists';
  value?: unknown;
  multiplier: number;
}

export interface RulesJson {
  version: string;
  rules: RuleDefinition[];
}

export interface ActionPayload {
  action_type: ActionType;
  user_id: string;
  event_id?: string;
  metadata: Record<string, unknown>;
}

export interface ComputeResult {
  points: number;
  reasons: string[];
  rank_affecting_allowed: boolean;
}

function computePoints(
  rulesJson: RulesJson,
  payload: ActionPayload
): ComputeResult {
  const { action_type, metadata } = payload;

  const rule = rulesJson.rules.find(
    (r) => r.action_type === action_type && r.enabled !== false
  );

  if (!rule) {
    return {
      points: 0,
      reasons: [`No active rule found for action: ${action_type}`],
      rank_affecting_allowed: true,
    };
  }

  let points = rule.base_points;
  const reasons: string[] = [`Base points for ${action_type}: ${rule.base_points}`];

  if (rule.multipliers && rule.multipliers.length > 0) {
    for (const multiplier of rule.multipliers) {
      if (evaluateCondition(multiplier, metadata)) {
        const bonus = Math.floor(rule.base_points * (multiplier.multiplier - 1));
        points += bonus;
        reasons.push(
          `Multiplier ${multiplier.multiplier}x applied (${multiplier.field} ${multiplier.operator} ${multiplier.value}): +${bonus}`
        );
      }
    }
  }

  if (rule.max_points !== undefined && points > rule.max_points) {
    reasons.push(`Points capped at max: ${rule.max_points}`);
    points = rule.max_points;
  }

  let rank_affecting_allowed = true;

  if (rule.requires_committee_for_rank) {
    const isCommitteeMember = metadata.committee_member === true;
    if (!isCommitteeMember) {
      rank_affecting_allowed = false;
      reasons.push(
        'Rank change blocked: rule requires committee membership, but committee_member is false'
      );
    }
  }

  return {
    points,
    reasons,
    rank_affecting_allowed,
  };
}

function evaluateCondition(
  condition: MultiplierCondition,
  metadata: Record<string, unknown>
): boolean {
  const fieldValue = metadata[condition.field];

  switch (condition.operator) {
    case 'exists':
      return fieldValue !== undefined && fieldValue !== null;
    case 'eq':
      return fieldValue === condition.value;
    case 'gt':
      return typeof fieldValue === 'number' && fieldValue > (condition.value as number);
    case 'gte':
      return typeof fieldValue === 'number' && fieldValue >= (condition.value as number);
    case 'lt':
      return typeof fieldValue === 'number' && fieldValue < (condition.value as number);
    case 'lte':
      return typeof fieldValue === 'number' && fieldValue <= (condition.value as number);
    default:
      return false;
  }
}

function calculateRank(
  points: number
): 'unranked' | 'bronze' | 'silver' | 'gold' {
  if (points >= 75) return 'gold';
  if (points >= 50) return 'silver';
  if (points >= 25) return 'bronze';
  return 'unranked';
}

function validatePayload(
  payload: ActionPayload
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.action_type) errors.push('action_type is required');
  if (!payload.user_id) errors.push('user_id is required');

  switch (payload.action_type) {
    case 'committee_setup':
      if (payload.metadata.committee_member === undefined) {
        errors.push('metadata.committee_member is required for committee_setup action');
      }
      break;
    case 'attendance':
    case 'early_checkin':
    case 'rsvp':
    case 'feedback':
      if (!payload.event_id && !payload.metadata.event_id) {
        errors.push(`event_id is required for ${payload.action_type} action`);
      }
      break;
  }

  return { valid: errors.length === 0, errors };
}

// ==========================================
// PART 2: Main Handler (index.ts)
// ==========================================

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    // ---------------------------------------------------------
    // SECURITY CONFIGURATION
    // ---------------------------------------------------------
    const supabaseUrl = Deno.env.get('SUPABASE_URL');

    // Check for custom Rank_Key first
    const rankKey = Deno.env.get('Rank_Key');
    const defaultKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    // Fallback logic
    const supabaseServiceKey = rankKey || defaultKey;
    const keySource = rankKey ? 'Rank_Key' : 'Default_Key';

    // DEBUG: Return config error with source info
    if (!supabaseUrl || !supabaseServiceKey) {
      return errorResponse('Missing Supabase configuration', 'CONFIGURATION_ERROR', { keySource });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Safely parse body
    let body: RequestBody;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body', 'INVALID_REQUEST');
    }

    const { actionType, eventId, metadata = {} } = body;

    let userId = body.userId;

    // Auth Token Logic
    if (!userId) {
      const authHeader = req.headers.get('Authorization');
      if (authHeader) {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user }, error: authError } = await supabase.auth.getUser(token);

        if (authError || !user) {
          return errorResponse('Invalid or missing authentication', 'UNAUTHORIZED', { keySource, authError: authError?.message });
        }
        userId = user.id;
      }
    }

    if (!userId) {
      return errorResponse('userId is required', 'UNAUTHORIZED', { keySource });
    }

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

    // Idempotency check
    if (eventId) {
      const { data: existing } = await supabase
        .from('points')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .eq('reason', actionType)
        .single();

      if (existing) {
        return errorResponse('Points already awarded for this action', 'ALREADY_REWARDED');
      }
    }

    // Event check
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

    // Photo check
    if (actionType === 'photo_upload' && eventId) {
      const { data: checkin } = await supabase
        .from('event_attendance')
        .select('id')
        .eq('user_id', userId)
        .eq('event_id', eventId)
        .single();

      if (!checkin) {
        return errorResponse('User has not checked in to this event', 'PRECONDITION_FAILED');
      }
    }

    // Rule Engine
    const { data: rulesData, error: rulesError } = await supabase
      .from('rank_rules')
      .select('rules')
      .eq('active', true)
      .single();

    if (rulesError || !rulesData) {
      return errorResponse('No active rule set found', 'RULES_NOT_FOUND');
    }

    const rulesJson = rulesData.rules as RulesJson;
    const computeResult = computePoints(rulesJson, payload);

    if (computeResult.points === 0) {
      return errorResponse(computeResult.reasons.join('; '), 'INVALID_ACTION_TYPE');
    }

    // User Profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('rank_points, rank')
      .eq('id', userId)
      .single();

    if (profileError) {
      return errorResponse('User profile not found', 'UNAUTHORIZED', { userId, keySource });
    }

    const previousPoints = profile.rank_points ?? 0;
    const previousRank = profile.rank ?? 'unranked';
    const newPoints = Math.min(previousPoints + computeResult.points, 100);

    let newRank = previousRank;
    if (computeResult.rank_affecting_allowed) {
      newRank = calculateRank(newPoints);
    }

    // DB Updates
    const { data: pointsRecord, error: pointsError } = await supabase
      .from('points')
      .insert({
        user_id: userId,
        event_id: eventId || null,
        amount: computeResult.points,
        reason: actionType,
        metadata: { ...metadata, reasons: computeResult.reasons },
      })
      .select('id, created_at')
      .single();

    if (pointsError) {
      return errorResponse('Failed to record points', 'DATABASE_ERROR');
    }

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
          committee_member_from_metadata: metadata.committee_member,
        },
      });

    if (auditError) {
      console.error('Audit insert failed:', auditError);
    }

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
    // Explicitly safe stringify debug info
    return errorResponse('An unexpected error occurred', 'SERVER_ERROR', { error: String(error) });
  }
});

/**
 * Helper to return formatted errors.
 * DEBUG: Forces 200 OK status to ensure client can read the body.
 */
function errorResponse(message: string, code: string, debug?: any): Response {
  const body: ErrorResponse & { debug?: any } = {
    success: false,
    error: message,
    code,
    debug
  };

  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
