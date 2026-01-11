import { supabase } from '../lib/supabase';
import type { ServiceResponse } from '../types/errors';
import { handleSupabaseError, createError } from '../types/errors';

export type ReportTargetType = 'post' | 'user';
export type ReportReason = 'Spam' | 'Harassment' | 'Inappropriate' | 'Hate' | 'Other';
export type ReportStatus = 'open' | 'reviewing' | 'actioned' | 'closed';

interface SubmitReportParams {
  targetType: ReportTargetType;
  targetId: string;
  reason: ReportReason;
  details?: string;
}

export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: string;
  details: string | null;
  status: ReportStatus;
  created_at: string;
  resolved_at: string | null;
  resolved_by: string | null;
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

  /**
   * Fetch all reports (admin only)
   * @param status Optional status filter
   */
  async fetchReports(status?: ReportStatus): Promise<ServiceResponse<Report[]>> {
    try {
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;

      if (error) {
        return handleSupabaseError(null, error);
      }

      return { success: true, data: data || [] };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to fetch reports',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * Update report status (admin only)
   */
  async updateReportStatus(
    reportId: string,
    status: ReportStatus
  ): Promise<ServiceResponse<void>> {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return {
          success: false,
          error: createError('User not authenticated', 'UNAUTHORIZED'),
        };
      }

      const updateData: any = {
        status,
      };

      // If closing or actioning, set resolved_at and resolved_by
      if (status === 'closed' || status === 'actioned') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user.id;
      }

      const { error } = await supabase
        .from('reports')
        .update(updateData)
        .eq('id', reportId);

      if (error) {
        return handleSupabaseError(null, error);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to update report status',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * Hide a reported post (admin only)
   */
  async hideReportedPost(postId: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase
        .from('feed_posts')
        .update({ is_hidden: true })
        .eq('id', postId);

      if (error) {
        return handleSupabaseError(null, error);
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to hide post',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }
}

export const reportService = new ReportService();
