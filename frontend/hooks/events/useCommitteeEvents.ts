import { useState, useEffect, useCallback } from 'react';
import { eventsService } from '@/services/events.service';
import type { Event, EventDB } from '@/types/events';
import type { CommitteeId } from '@/utils/committeeUtils';

/**
 * Maps EventDB (database format) to Event (UI format)
 */
function mapEventDBToUI(eventDB: EventDB): Event {
    const now = new Date();
    const endTime = new Date(eventDB.end_time);

    return {
        id: eventDB.event_id,
        uuid: eventDB.id,
        title: eventDB.name,
        description: eventDB.description,
        startTimeISO: eventDB.start_time,
        endTimeISO: eventDB.end_time,
        locationName: eventDB.location_name,
        address: eventDB.location_address,
        latitude: eventDB.latitude,
        longitude: eventDB.longitude,
        coverImageUrl: eventDB.cover_image_url ?? undefined,
        tags: [], // Tags would need to be parsed if stored
        status: endTime < now ? 'past' : 'upcoming',
        registration_questions: eventDB.registration_questions,
        points: eventDB.points,
        requiresRsvp: eventDB.requires_rsvp,
        eventLimit: eventDB.event_limit,
    };
}

interface UseCommitteeEventsResult {
    events: Event[];
    isLoading: boolean;
    isRefreshing: boolean;
    error: string | null;
    refresh: () => Promise<void>;
}

/**
 * Hook to fetch and manage events for a specific committee
 * @param committeeSlug - The slug/id of the committee (e.g., 'external-vp', 'marketing')
 */
export function useCommitteeEvents(committeeSlug: CommitteeId): UseCommitteeEventsResult {
    const [events, setEvents] = useState<Event[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchEvents = useCallback(async (isRefresh = false) => {
        if (isRefresh) {
            setIsRefreshing(true);
        } else {
            setIsLoading(true);
        }
        setError(null);

        try {
            const response = await eventsService.getCommitteeEvents(committeeSlug);

            if (response.success) {
                const mappedEvents = response.data.map(mapEventDBToUI);
                setEvents(mappedEvents);
            } else {
                // If committee not found or no events, set empty array (not an error state)
                if (response.error.code === 'NOT_FOUND') {
                    setEvents([]);
                } else {
                    setError(response.error.message);
                }
            }
        } catch (err) {
            setError('Failed to load events');
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [committeeSlug]);

    useEffect(() => {
        fetchEvents();
    }, [fetchEvents]);

    const refresh = useCallback(async () => {
        await fetchEvents(true);
    }, [fetchEvents]);

    return {
        events,
        isLoading,
        isRefreshing,
        error,
        refresh,
    };
}
