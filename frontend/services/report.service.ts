import { supabase } from '../lib/supabase';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

export type ReportTargetType = 'post' | 'user';
export type ReportReason = 'Spam' | 'Harassment' | 'Inappropriate' | 'Hate' | 'Other';

interface SubmitReportParams {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

/**
 * Service for managing content reports
 */
class ReportService {
  /**
   * Submit a report for a post or user
   * Handles duplicate reports gracefully (unique constraint on reporter_id + target_type + target_id)
   */
  async submitReport(params: SubmitReportParams): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: createError('User not authenticated', 'UNAUTHORIZED'),
        };
      }

      const { targetType, targetId, reason, details } = params;

      // Insert report into database
      const { error } = await supabase
        .from('reports')
        .insert({
          reporter_id: user.id,
          target_type: targetType,
          target_id: targetId,
          reason: reason,
          details: details || null,
          status: 'open',
        });

      if (error) {
        // Handle duplicate report gracefully (unique constraint violation)
        if (error.code === '23505') {
          return {
            success: false,
            error: createError('You already reported this.', 'ALREADY_EXISTS'),
          };
        }
        return handleSupabaseError(null, error);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to submit report',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }
}

export const reportService = new ReportService();
