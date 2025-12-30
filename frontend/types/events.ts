// Database schema (snake_case, matches Supabase)
export interface EventDB {
  id: string;
  event_id: string;  // The simple ID associated with events in Supabase, stored in QR codes
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

// UI schema (camelCase, optimized for React Native components)
export interface EventUI {
  id: string;
  title: string;
  description?: string;
  startTimeISO: string;
  endTimeISO: string;
  locationName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  coverImageUrl?: string;
  hostName?: string | null;
  tags: string[];
  priceLabel?: string;
  capacityLabel?: string;
  status: 'upcoming' | 'past';
}

// Temporary backward compatibility alias - prefer EventUI in new code
// TODO: Remove once all imports are migrated to EventUI/EventDB
export type Event = EventUI;

// Attendance record
export interface EventAttendance {
  id: string;
  event_id: string;
  user_id: string;
  checked_in_at: string;
  check_in_method: 'qr_scan' | 'manual';
  latitude?: number;
  longitude?: number;
}

// API response cases
export interface CheckInResponse {
  success: boolean;
  attendance?: EventAttendance;
  event?: EventDB;  // Check-in uses DB schema
  error?: string;
  errorCode?: 'EVENT_NOT_FOUND' | 'ALREADY_CHECKED_IN' | 'CHECK_IN_CLOSED' | 'EVENT_FULL' | 'UNAUTHORIZED';
}

// QR Scan result
export interface QRScanResult {
  type: string;
  data: string;
}
