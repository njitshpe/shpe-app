/**
 * Points Listener Service
 * 
 * Subscribes to the EventBus and automatically evaluates
 * whether points should be awarded based on Edge Function rules.
 * 
 * This is the ONLY place that calls rankService.awardForAction().
 * Components never need to know about points - they just emit events.
 */

import * as Crypto from 'expo-crypto';
import { eventBus, ActionEvent, ActionType } from './eventBus.service';
import { rankService, RankActionType } from './rank.service';

/**
 * Maps EventBus action types to point_rules action types.
 * null = this event doesn't trigger point evaluation
 */
const ACTION_TYPE_MAP: Record<ActionType, RankActionType | null> = {
  'user.checked_in': 'event_check_in',
  'user.rsvp': 'rsvp',
  'user.photo_uploaded': 'photo_upload',
  'user.feedback_submitted': 'feedback',
  'user.profile_updated': null, // Not all events award points
  'user.profile_completed': 'profile_completed',
  'user.early_checkin': 'early_checkin',
};

class PointsListener {
  private unsubscribe: (() => void) | null = null;
  private isStarted = false;

  /**
   * Start listening for events and awarding points.
   * Call this once at app startup (e.g., in _layout.tsx).
   */
  start(): void {
    if (this.isStarted) {
      console.log('[PointsListener] Already started');
      return;
    }

    this.unsubscribe = eventBus.subscribe(async (event: ActionEvent) => {
      await this.handleEvent(event);
    });

    this.isStarted = true;
    console.log('[PointsListener] Started - listening for events');
  }

  /**
   * Stop listening for events.
   * Call this for cleanup if needed.
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
      this.isStarted = false;
      console.log('[PointsListener] Stopped');
    }
  }

  /**
   * Handle an incoming event and evaluate points rules.
   */
  private async handleEvent(event: ActionEvent): Promise<void> {
    const actionType = ACTION_TYPE_MAP[event.type];

    // Not all events trigger point evaluation
    if (!actionType) {
      console.log(`[PointsListener] Ignoring ${event.type} - no points action mapped`);
      return;
    }

    try {
      console.log(`[PointsListener] Evaluating ${event.type} -> ${actionType}`);

      // Build metadata, generating feedback_id if needed for general feedback
      const metadata: Record<string, unknown> = {
        userId: event.userId,
        ...event.metadata,
      };

      // For feedback without event_id or feedback_id, generate a unique ID
      // This ensures each general feedback submission has a unique idempotency key
      //
      // NOTE: Callers should generate feedback_id at submission time and include it
      // in the event metadata to ensure retries use the same idempotency key.
      // This fallback is a safety net but may cause duplicate awards on retry.
      if (
        actionType === 'feedback' &&
        !metadata.event_id &&
        !metadata.feedback_id
      ) {
        console.warn(
          '[PointsListener] feedback_id not provided - generating one. ' +
            'Caller should provide feedback_id for retry safety.'
        );
        metadata.feedback_id = Crypto.randomUUID();
      }

      // Calls RPC award_points which:
      // 1. Looks up action_type in point_rules table
      // 2. Uses idempotency_key to prevent duplicate awards
      // 3. Inserts into points_transactions and updates points_balances
      const result = await rankService.awardForAction(actionType, metadata);

      if (result.success && result.data) {
        console.log(
          `[PointsListener] ✅ Points awarded for ${actionType}` +
          ` | Total: ${result.data.newBalance} | Tier: ${result.data.tier}`
        );
      } else {
        // Not necessarily an error - Edge Function may reject for valid reasons:
        // - Duplicate action (already awarded for this event)
        // - Precondition not met (not a committee member)
        // - Rule doesn't exist for this action type
        console.log(`[PointsListener] ⏭️ No points awarded: ${result.error?.message || 'Unknown reason'}`);
      }
    } catch (error) {
      // Network errors, etc. - don't crash the app
      console.error(`[PointsListener] ❌ Error processing ${event.type}:`, error);
    }
  }
}

export const pointsListener = new PointsListener();
