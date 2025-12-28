// Event model matching database schema
export interface Event {
  id: string;
  event_id: string;  // The simple ID associated with events in supabase, stored in QR codes
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
  event?: Event;
  error?: string;
  errorCode?: 'EVENT_NOT_FOUND' | 'ALREADY_CHECKED_IN' | 'CHECK_IN_CLOSED' | 'EVENT_FULL' | 'UNAUTHORIZED';
}

// QR Scan result
export interface QRScanResult {
  type: string;
  data: string;
}
