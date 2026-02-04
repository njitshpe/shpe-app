import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { notificationService } from '@/services/notification.service';
import type { InboxNotification } from '@/types/notifications';

interface UseUnreadCountResult {
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

export function useUnreadCount(): UseUnreadCountResult {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;

    const { count, error } = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_read', false);

    if (error) {
      console.error('Failed to fetch unread count:', error.message);
      return;
    }

    setUnreadCount(count ?? 0);
  }, [user?.id]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await fetchUnreadCount();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [fetchUnreadCount]);

  useEffect(() => {
    if (!user?.id) {
      setUnreadCount(0);
      return;
    }

    const channel = supabase
      .channel('unread-count-realtime')
      .on<InboxNotification>(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          fetchUnreadCount();
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
        () => {
          fetchUnreadCount();
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
        () => {
          fetchUnreadCount();
        },
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [user?.id, fetchUnreadCount]);

  useEffect(() => {
    notificationService.setBadgeCount(unreadCount);
  }, [unreadCount]);

  const refresh = useCallback(async () => {
    await fetchUnreadCount();
  }, [fetchUnreadCount]);

  const result = useMemo(
    () => ({ unreadCount, loading, refresh }),
    [unreadCount, loading, refresh],
  );

  return result;
}
