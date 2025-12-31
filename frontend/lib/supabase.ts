import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';

// Try to get from environment variables first, fallback to app.json extra config
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || Constants.expoConfig?.extra?.supabaseUrl || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || Constants.expoConfig?.extra?.supabaseAnonKey || '';

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
