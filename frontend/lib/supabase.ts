import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not found in app config. Using empty client.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types for events table
export interface EventRow {
  id: number;
  event_id: string;
  name: string;
  description: string | null;
  start_time: string;
  end_time: string;
  location: string | null;
  location_name: string;
  cover_image_url: string | null;
  host_name: string;
  price_label: string | null;
  tags: string[];
  is_archived: boolean;
  is_active: boolean;
}
