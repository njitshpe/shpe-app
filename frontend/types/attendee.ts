/**
 * Attendee type for event registrations/RSVPs
 */
export interface Attendee {
  id: string;
  name: string;
  avatarUrl?: string;
  major?: string;
  year?: string;
  role?: string; // e.g., "Member", "Officer", "Guest"
}

/**
 * Event attendees response with count and preview data
 */
export interface EventAttendeesData {
  totalCount: number;
  attendees: Attendee[];
  isLoading: boolean;
  error: string | null;
}
