import { useMemo } from 'react';
import { isWithinInterval } from 'date-fns';
import { Event } from '@/types/events';

interface UseOngoingEventsResult {
    ongoingEvents: Event[];
    upcomingEvents: Event[];
    pastEvents: Event[];
}

/**
 * Hook to categorize events into ongoing, upcoming, and past events
 * based on the current time.
 */
export function useOngoingEvents(events: Event[]): UseOngoingEventsResult {
    return useMemo(() => {
        const now = new Date();
        const ongoing: Event[] = [];
        const upcoming: Event[] = [];
        const past: Event[] = [];

        events.forEach((event) => {
            const startTime = new Date(event.startTimeISO);
            const endTime = new Date(event.endTimeISO);

            // Skip invalid dates
            if (isNaN(startTime.getTime()) || isNaN(endTime.getTime())) return;

            // Check if event is currently happening
            if (isWithinInterval(now, { start: startTime, end: endTime })) {
                ongoing.push(event);
            } else if (startTime > now) {
                // Event hasn't started yet
                upcoming.push(event);
            } else {
                // Event has ended
                past.push(event);
            }
        });

        // Sort ongoing by end time (ending soonest first)
        ongoing.sort((a, b) =>
            new Date(a.endTimeISO).getTime() - new Date(b.endTimeISO).getTime()
        );

        // Sort upcoming by start time (starting soonest first)
        upcoming.sort((a, b) =>
            new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime()
        );

        // Sort past by start time (most recent first)
        past.sort((a, b) =>
            new Date(b.startTimeISO).getTime() - new Date(a.startTimeISO).getTime()
        );

        return { ongoingEvents: ongoing, upcomingEvents: upcoming, pastEvents: past };
    }, [events]);
}
