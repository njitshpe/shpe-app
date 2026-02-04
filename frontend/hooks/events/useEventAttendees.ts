import { useState, useEffect } from 'react';
import { Attendee, EventAttendeesData } from '@/types/attendee';
import { registrationService } from '@/services';

/**
 * Hook to fetch event attendees
 * @param eventId - The event ID
 * @returns EventAttendeesData with attendees list, count, loading state, and error
 */
export function useEventAttendees(eventId: string): EventAttendeesData {
  const [data, setData] = useState<Omit<EventAttendeesData, 'loadMore'>>({
    totalCount: 0,
    attendees: [],
    isLoading: true,
    error: null,
    hasMore: true,
  });

  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  useEffect(() => {
    let mounted = true;

    const fetchInitialData = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }));
        setPage(0);

        // Fetch count and first page in parallel
        const [count, attendeesData] = await Promise.all([
          registrationService.getRegistrationCount(eventId),
          registrationService.getAttendees(eventId, 0, PAGE_SIZE)
        ]);

        if (mounted) {
          const attendees = mapToAttendee(attendeesData);
          setData({
            totalCount: count,
            attendees,
            isLoading: false,
            error: null,
            hasMore: attendees.length < count, // More straightforward logic
          });
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        if (mounted) {
          setData(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load attendees',
          }));
        }
      }
    };

    fetchInitialData();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  const loadMore = async () => {
    if (data.isLoading || !data.hasMore) return;

    // Use current attendees length as offset ensures we don't prefer pages over index
    const currentOffset = data.attendees.length;

    try {
      const moreAttendeesData = await registrationService.getAttendees(eventId, currentOffset, PAGE_SIZE);

      const newAttendees = mapToAttendee(moreAttendeesData);

      setData((prev) => {
        // Prevent duplicates just in case
        const existingIds = new Set(prev.attendees.map(a => a.id));
        const uniqueNew = newAttendees.filter(a => !existingIds.has(a.id));

        const updatedList = [...prev.attendees, ...uniqueNew];

        return {
          ...prev,
          attendees: updatedList,
          hasMore: updatedList.length < prev.totalCount && uniqueNew.length > 0,
        };
      });

    } catch (error) {
      console.error('Error loading more attendees:', error);
    }
  };

  return { ...data, loadMore };
}

// Helper to map DB response to UI type
const mapToAttendee = (data: any[]) => {
  return data.map(a => ({
    id: a.user_id,
    name: a.profile ? `${a.profile.first_name} ${a.profile.last_name}` : 'SHPE Member',
    avatarUrl: a.profile?.profile_picture_url || undefined,
    major: (a.profile as any)?.major || undefined,
    year: (a.profile as any)?.year || undefined,
    role: 'Member'
  }));
};

/**
 * Hook to fetch a preview of event attendees (first N attendees)
 * More efficient than fetching all attendees when only showing a preview
 */
export function useEventAttendeesPreview(eventId: string, previewCount: number = 4): EventAttendeesData {
  // Currently re-uses the main hook, but limits the displayed list. 
  // Optimization: In the future, pass previewCount to the service to limit SQL query.
  const fullData = useEventAttendees(eventId);

  return {
    ...fullData,
    attendees: fullData.attendees.slice(0, previewCount),
  };
}
