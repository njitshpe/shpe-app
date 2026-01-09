// types/events.ts

// UI-friendly Event type (mapped from EventRow)
export interface Event {
  id: string; // event_id from database
  title: string; // name from database
  description?: string;
  startTimeISO: string; // start_time from database
  endTimeISO: string; // end_time from database
  checkInOpens?: string; // check_in_opens from database
  checkInCloses?: string; // check_in_closes from database
  locationName: string; // location_name from database
  address?: string; // location from database
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string; // cover_image_url from database
  hostName?: string; // host_name from database
  tags: string[];
  priceLabel?: string; // price_label from database
  capacityLabel?: string;
  status: 'upcoming' | 'past';
}

// 1. Rename 'Event' to 'EventDB' to match your imports and avoid conflicts
export interface EventDB {
  id: string;
  event_id: string;  // The simple ID used in QR codes
  name: string;
  description?: string;
  location?: string;
  start_time: string;
  end_time: string;
  check_in_opens?: string;
  check_in_closes?: string;
  max_attendees?: number;
  created_by?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

// 2. Update this to use EventDB
export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  check_in_method: 'qr_scan' | 'manual';
  latitude?: number;
  longitude?: number;
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