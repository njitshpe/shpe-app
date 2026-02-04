import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import type { InboxNotification } from '@/types/notifications';

export interface UseInboxResult {
  notifications: InboxNotification[];
  loading: boolean;
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook to manage the notifications inbox.
 *
 * - Fetches rows from `public.notifications` ordered by created_at DESC.
 * - Subscribes to real-time inserts so new alerts appear instantly.
 * - Provides optimistic `markAsRead` / `markAllAsRead` mutations.
 */
export function useInbox(): UseInboxResult {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<InboxNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  // ── Fetch ────────────────────────────────────────────────────────────
  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch notifications:', error.message);
      return;
    }

    setNotifications(data ?? []);
  }, [user?.id]);

  // Initial load
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await fetchNotifications();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchNotifications]);

  // ── Real-time subscription ───────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('inbox-realtime')
      .on<InboxNotification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new, ...prev]);
        },
      )
      .on<InboxNotification>(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) =>
            prev.map((n) => (n.id === payload.new.id ? payload.new : n)),
          );
        },
      )
      .on<InboxNotification>(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id));
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id]);

  // ── Mutations ────────────────────────────────────────────────────────

  const markAsRead = useCallback(
    async (id: string) => {
      // Optimistic update
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      );

      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', id);

      if (error) {
        console.error('Failed to mark notification as read:', error.message);
        // Roll back – re-fetch the true state
        await fetchNotifications();
      }
    },
    [fetchNotifications],
  );

  const markAllAsRead = useCallback(async () => {
    if (!user?.id) return;

    // Optimistic update
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));

    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to mark all as read:', error.message);
      await fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  const deleteNotification = useCallback(
    async (id: string) => {
      // Snapshot for rollback
      const snapshot = notifications;

      // Optimistic remove
      setNotifications((prev) => prev.filter((n) => n.id !== id));

      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Failed to delete notification:', error.message);
        setNotifications(snapshot);
      }
    },
    [notifications],
  );

  // ── Derived state ────────────────────────────────────────────────────
  const unreadCount = useMemo(
    () => notifications.filter((n) => !n.is_read).length,
    [notifications],
  );

  const refresh = useCallback(async () => {
    await fetchNotifications();
  }, [fetchNotifications]);

  return { notifications, loading, unreadCount, markAsRead, markAllAsRead, deleteNotification, refresh };
}
