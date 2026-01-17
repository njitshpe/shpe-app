import { useState, useEffect } from 'react';
import { Attendee, EventAttendeesData } from '@/types/attendee';
import { registrationService } from '@/services';

/**
 * Hook to fetch event attendees
 * @param eventId - The event ID
 * @returns EventAttendeesData with attendees list, count, loading state, and error
 */
export function useEventAttendees(eventId: string): EventAttendeesData {
  const [data, setData] = useState<EventAttendeesData>({
    totalCount: 0,
    attendees: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    let mounted = true;

    const fetchAttendees = async () => {
      try {
        setData((prev) => ({ ...prev, isLoading: true, error: null }));

        // Fetch count and list in parallel
        const [count, attendeesData] = await Promise.all([
          registrationService.getRegistrationCount(eventId),
          registrationService.getAttendees(eventId, 20) // Fetch top 20 for preview/list
        ]);

        if (mounted) {
          // Map service data to UI format
          const attendees: Attendee[] = attendeesData.map(a => ({
            id: a.user_id,
            name: a.profile ? `${a.profile.first_name} ${a.profile.last_name}` : 'SHPE Member',
            avatarUrl: a.profile?.profile_picture_url || undefined,
            // Fallback for missing profile fields if they aren't in the generic Profile type
            major: (a.profile as any)?.major || undefined,
            year: (a.profile as any)?.year || undefined,
            role: 'Member' // Default role for now
          }));

          setData({
            totalCount: count,
            attendees,
            isLoading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('Error fetching attendees:', error);
        if (mounted) {
          setData({
            totalCount: 0,
            attendees: [],
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load attendees',
          });
        }
      }
    };

    fetchAttendees();

    return () => {
      mounted = false;
    };
  }, [eventId]);

  return data;
}

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
