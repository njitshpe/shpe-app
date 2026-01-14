// types/events.ts

// UI-friendly Event type (mapped from EventRow)
export interface Event {
  id: string; // event_id from database
  title: string; // name from database
  description?: string;
  startTimeISO: string; // start_time from database
  endTimeISO: string; // end_time from database
  locationName: string; // location_name from database
  address?: string; // location_address from database
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string; // cover_image_url from database
  tags: string[];
  status: 'upcoming' | 'past';
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