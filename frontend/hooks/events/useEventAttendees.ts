import { useState, useEffect } from 'react';
import { Attendee, EventAttendeesData } from '@/types/attendee';
// import { supabase } from '../lib/supabase'; // Uncomment when ready to use Supabase

/**
 * Mock attendees data for development
 * TODO: Replace with Supabase query when backend is ready
 */
const MOCK_ATTENDEES: Record<string, Attendee[]> = {
  'evt-001': [
    {
      id: '1',
      name: 'Taylor Rock',
      avatarUrl: 'https://i.pravatar.cc/150?img=1',
      major: 'Computer Science',
      year: 'Senior',
      role: 'Member',
    },
    {
      id: '2',
      name: 'Moitse Moatshe',
      avatarUrl: 'https://i.pravatar.cc/150?img=2',
      major: 'Electrical Engineering',
      year: 'Junior',
      role: 'Member',
    },
    {
      id: '3',
      name: 'Mrudhanee Sharma',
      avatarUrl: 'https://i.pravatar.cc/150?img=3',
      major: 'Mechanical Engineering',
      year: 'Sophomore',
      role: 'Officer',
    },
    {
      id: '4',
      name: 'Ronit',
      avatarUrl: 'https://i.pravatar.cc/150?img=4',
      major: 'Software Engineering',
      year: 'Senior',
      role: 'Member',
    },
    // Generate additional mock attendees
    ...Array.from({ length: 169 }, (_, i) => ({
      id: `${i + 5}`,
      name: `Student ${i + 5}`,
      avatarUrl: i % 3 === 0 ? `https://i.pravatar.cc/150?img=${(i % 70) + 1}` : undefined,
      major: ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering'][i % 4],
      year: ['Freshman', 'Sophomore', 'Junior', 'Senior'][i % 4],
      role: 'Member',
    })),
  ],
  'evt-002': Array.from({ length: 28 }, (_, i) => ({
    id: `${i + 1}`,
    name: `Attendee ${i + 1}`,
    avatarUrl: i % 2 === 0 ? `https://i.pravatar.cc/150?img=${(i % 70) + 1}` : undefined,
    major: 'Engineering',
    year: 'Junior',
    role: 'Member',
  })),
};

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

        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // TODO: Replace with Supabase query
        // const { data: registrations, error } = await supabase
        //   .from('event_registrations')
        //   .select(`
        //     id,
        //     user:profiles (
        //       id,
        //       name,
        //       avatar_url,
        //       major,
        //       year,
        //       role
        //     )
        //   `)
        //   .eq('event_id', eventId);
        //
        // if (error) throw error;
        //
        // const attendees: Attendee[] = registrations.map((reg) => ({
        //   id: reg.user.id,
        //   name: reg.user.name,
        //   avatarUrl: reg.user.avatar_url,
        //   major: reg.user.major,
        //   year: reg.user.year,
        //   role: reg.user.role,
        // }));

        // Use mock data
        const attendees = MOCK_ATTENDEES[eventId] || [];

        if (mounted) {
          setData({
            totalCount: attendees.length,
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
  const fullData = useEventAttendees(eventId);

  return {
    ...fullData,
    attendees: fullData.attendees.slice(0, previewCount),
  };
}
