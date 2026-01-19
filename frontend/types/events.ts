// types/events.ts

// UI-friendly Event type (mapped from EventRow)
export const EVENT_TAGS = {
  TYPE: ['GBM', 'Workshop', 'Social', 'Corporate', 'Conference'],
  FOCUS: ['Technical', 'Professional', 'Academic', 'Volunteering'],
  PERKS: ['Food Provided']
} as const;

export type EventTag =
  | typeof EVENT_TAGS.TYPE[number]
  | typeof EVENT_TAGS.FOCUS[number]
  | typeof EVENT_TAGS.PERKS[number];

export interface Event {
  id: string; // event_id from database
  uuid: string; // Internal UUID from database
  title: string; // name from database
  description?: string;
  startTimeISO: string; // start_time from database
  endTimeISO: string; // end_time from database
  locationName: string; // location_name from database
  address?: string; // location_address from database
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string; // cover_image_url from database
  tags: EventTag[];
  status: 'upcoming' | 'past';
  registration_questions?: any[];
  points: number;
  requiresRsvp: boolean;
  eventLimit?: number;
  userRegistrationStatus?: 'going' | 'waitlist' | 'not_going' | 'confirmed' | string; // Status from event_attendance
}

// 1. Rename 'Event' to 'EventDB' to match your imports and avoid conflicts
export interface EventDB {
  id: string;
  event_id: string;  // The simple ID used in QR codes
  name: string;
  description?: string;
  location_name: string;
  location_address?: string;
  start_time: string;
  end_time: string;
  latitude?: number;
  longitude?: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  registration_questions?: any[]; // JSONB
  deleted_at?: string;
  points: number;
  requires_rsvp: boolean;
  event_limit?: number;
}

// 2. Update this to use EventDB
export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  rsvp_at?: string;
  checked_in_at?: string;
  checked_out_at?: string;
  status?: string; // e.g. 'confirmed', 'pending'
  is_volunteer?: boolean;
  duration_minutes?: number;
  registration_answers?: any; // JSONB
}

export interface CheckInResponse {
  success: boolean;
  attendance?: EventAttendance;
  event?: EventDB; // Updated reference here too
  error?: string;
  errorCode?: 'EVENT_NOT_FOUND' | 'ALREADY_CHECKED_IN' | 'CHECK_IN_CLOSED' | 'EVENT_FULL' | 'UNAUTHORIZED';
}

export interface QRScanResult {
  type: string;
  data: string;
}