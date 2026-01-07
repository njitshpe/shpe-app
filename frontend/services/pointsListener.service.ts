/**
 * Points Listener Service
 * 
 * Subscribes to the EventBus and automatically evaluates
 * whether points should be awarded based on Edge Function rules.
 * 
 * This is the ONLY place that calls rankService.awardForAction().
 * Components never need to know about points - they just emit events.
 */

import { eventBus, ActionEvent, ActionType } from './eventBus.service';
import { rankService, RankActionType } from './rank.service';

/**
 * Maps EventBus action types to Edge Function action types.
 * null = this event doesn't trigger point evaluation
 */
const ACTION_TYPE_MAP: Record<ActionType, RankActionType | null> = {
  'user.checked_in': 'attendance',
  'user.rsvp': 'rsvp',
  'user.photo_uploaded': 'photo_upload',
  'user.feedback_submitted': 'feedback',
  'user.profile_updated': null, // Not all events award points
  'user.profile_completed': 'verified',
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

      // Edge Function will:
      // 1. Check if action_type exists in rank_rules table
      // 2. Check preconditions (requires_committee, etc.)
      // 3. Check for duplicates (max_per_day, max_per_event)
      // 4. Award points if all rules pass
      const result = await rankService.awardForAction(actionType, {
        userId: event.userId,
        ...event.metadata,
      });

      if (result.success && result.data) {
        console.log(
          `[PointsListener] ✅ Awarded ${result.data.transaction.amount} points for ${actionType}` +
          ` | New total: ${result.data.newBalance} | Rank: ${result.data.rank}`
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
