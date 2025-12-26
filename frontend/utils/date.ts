import { Event } from '../data/mockEvents';

export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDateHeader(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    weekday: 'long',
  });
}

export function formatDateKey(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
}

export interface EventSection {
  title: string;
  data: Event[];
  dateKey: string;
}

export function groupEventsByDate(events: Event[]): EventSection[] {
  // Sort events by start time
  const sorted = [...events].sort(
    (a, b) => new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime()
  );

  // Group by date
  const grouped = sorted.reduce((acc, event) => {
    const dateKey = formatDateKey(event.startTimeISO);
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, Event[]>);

  // Convert to section format
  return Object.entries(grouped).map(([dateKey, events]) => ({
    title: formatDateHeader(events[0].startTimeISO),
    data: events,
    dateKey,
  }));
}

export function getAllTags(events: Event[]): string[] {
  const tagSet = new Set<string>();
  events.forEach((event) => {
    event.tags.forEach((tag) => tagSet.add(tag));
  });
  return Array.from(tagSet).sort();
}
