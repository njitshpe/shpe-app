import { isToday, isYesterday, differenceInCalendarDays } from 'date-fns';
import type { InboxNotification } from '@/types/notifications';

export interface NotificationSection {
  key: string;
  title: string;
  data: InboxNotification[];
}

/**
 * Groups notifications into time-based sections: Today, Yesterday, This Week, Earlier.
 * Uses local timezone via date-fns calendar functions (isToday/isYesterday compare
 * against the device's local midnight, not UTC).
 */
export function groupNotificationsByTime(
  notifications: InboxNotification[],
): NotificationSection[] {
  const buckets: Record<string, InboxNotification[]> = {
    today: [],
    yesterday: [],
    this_week: [],
    earlier: [],
  };

  const now = new Date();

  for (const n of notifications) {
    const d = new Date(n.created_at);
    if (isToday(d)) {
      buckets.today.push(n);
    } else if (isYesterday(d)) {
      buckets.yesterday.push(n);
    } else if (differenceInCalendarDays(now, d) <= 7) {
      buckets.this_week.push(n);
    } else {
      buckets.earlier.push(n);
    }
  }

  const labels: Record<string, string> = {
    today: 'Today',
    yesterday: 'Yesterday',
    this_week: 'This Week',
    earlier: 'Earlier',
  };

  return Object.entries(buckets)
    .filter(([, items]) => items.length > 0)
    .map(([key, data]) => ({ key, title: labels[key], data }));
}
