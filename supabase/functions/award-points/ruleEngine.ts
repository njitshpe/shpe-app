/**
 * Rule Engine for Points & Rank Calculations
 *
 * Pure computation module - no side effects, no database calls.
 * Interprets JSONB rules and calculates points based on action payload.
 *
 * Rules are stored in rank_rules.rules JSONB and versioned.
 * Swapping the active rule set changes behavior without code edits.
 */

/** Action types supported by the rule engine (aligned with award-points README) */
export type ActionType =
  | 'attendance'
  | 'feedback'
  | 'photo_upload'
  | 'rsvp'
  | 'early_checkin'
  | 'committee_setup'
  | 'verified'
  | 'college_year';

/** Photo types for multipliers */
export type PhotoType = 'alumni' | 'professional' | 'member_of_month';

/** Single rule definition from JSONB */
export interface RuleDefinition {
  /** Action type this rule applies to */
  action_type: ActionType;
  /** Base points awarded for this action */
  base_points: number;
  /** Optional multiplier conditions */
  multipliers?: MultiplierCondition[];
  /** Whether this rule requires committee membership to affect rank */
  requires_committee_for_rank?: boolean;
  /** Maximum points that can be awarded from this rule (optional cap) */
  max_points?: number;
  /** Whether this rule is enabled */
  enabled?: boolean;
}

/** Multiplier condition for bonus points */
export interface MultiplierCondition {
  /** Field in metadata to check */
  field: string;
  /** Comparison operator */
  operator: 'eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'exists';
  /** Value to compare against (not needed for 'exists') */
  value?: unknown;
  /** Multiplier to apply if condition matches */
  multiplier: number;
}

/** Complete rules JSON structure */
export interface RulesJson {
  version: string;
  rules: RuleDefinition[];
}

/** Payload for point calculation */
export interface ActionPayload {
  action_type: ActionType;
  user_id: string;
  event_id?: string;
  metadata: Record<string, unknown>;
}

/** Result from computePoints */
export interface ComputeResult {
  /** Total points to award */
  points: number;
  /** Human-readable reasons for the points */
  reasons: string[];
  /** Whether rank changes are allowed (false if committee required but not member) */
  rank_affecting_allowed: boolean;
}

/**
 * Compute points for an action based on rules
 *
 * @param rulesJson - The active rule set from rank_rules.rules
 * @param payload - Action type and metadata
 * @returns Points to award, reasons, and whether rank can change
 */
export function computePoints(
  rulesJson: RulesJson,
  payload: ActionPayload
): ComputeResult {
  const { action_type, metadata } = payload;

  // Find matching rule for this action
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

  // Calculate base points
  let points = rule.base_points;
  const reasons: string[] = [`Base points for ${action_type}: ${rule.base_points}`];

  // Apply multipliers if any conditions match
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

  // Apply max cap if defined
  if (rule.max_points !== undefined && points > rule.max_points) {
    reasons.push(`Points capped at max: ${rule.max_points}`);
    points = rule.max_points;
  }

  // Determine if rank changes are allowed
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

/**
 * Evaluate a single multiplier condition against metadata
 */
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

/**
 * Calculate rank from total points
 * Thresholds: unranked (0-24), bronze (25-49), silver (50-74), gold (75+)
 */
export function calculateRank(
  points: number
): 'unranked' | 'bronze' | 'silver' | 'gold' {
  if (points >= 75) return 'gold';
  if (points >= 50) return 'silver';
  if (points >= 25) return 'bronze';
  return 'unranked';
}

/**
 * Validate that required metadata fields are present for an action
 */
export function validatePayload(
  payload: ActionPayload
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!payload.action_type) {
    errors.push('action_type is required');
  }

  if (!payload.user_id) {
    errors.push('user_id is required');
  }

  // Action-specific validation
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

  return {
    valid: errors.length === 0,
    errors,
  };
}
