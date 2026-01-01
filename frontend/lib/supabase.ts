import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Ensure Supabase credentials are configured
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL or Anon Key not found. Using empty client.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

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
  latitude: number | null;
  longitude: number | null;
  cover_image_url: string | null;
  host_name: string | null;
  price_label: string | null;
  tags: string[];
  is_archived: boolean;
  is_active: boolean;
}
