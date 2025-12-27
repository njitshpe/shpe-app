import { CalendarTheme } from '../types/calendar.types';

// Day Mode: High-contrast white/grey for productivity
export const dayModeTheme: CalendarTheme = {
  background: '#F5F5F5',
  selectedDateBackground: '#1A1A1A',
  selectedDateText: '#FFFFFF',
  unselectedDateText: '#9CA3AF',
  headerText: '#000000',
  accentColor: '#E5E7EB',
  dividerColor: '#E5E7EB',
};

// Studio Mode: Warmer, earthy tones for creative/evening hours
export const studioModeTheme: CalendarTheme = {
  background: '#FAF8F4', // Warm off-white
  selectedDateBackground: '#2C2416', // Warm dark brown
  selectedDateText: '#FAF8F4',
  unselectedDateText: '#A8957E', // Warm muted brown
  headerText: '#1F1810', // Warm black
  accentColor: '#E8E3D9', // Warm gray
  dividerColor: '#E8E3D9',
};

// Neon accent colors for event indicators
export const neonColors = {
  green: '#10B981', // Primary neon green
  blue: '#3B82F6',
  purple: '#8B5CF6',
  orange: '#F59E0B',
  red: '#EF4444', // For "Red Light" success states
};

// Sizing constants
export const DATE_ITEM_WIDTH = 70;
export const DATE_ITEM_HEIGHT = 80;
export const DATE_ITEM_SPACING = 12;
export const HEADER_HEIGHT = 100;
export const DATE_SELECTOR_HEIGHT = 100;

// Helper function to determine theme based on time
export const getThemeForTime = (date: Date = new Date()): CalendarTheme => {
  const hour = date.getHours();
  // Switch to Studio Mode after 6:00 PM (18:00) or before 6:00 AM
  if (hour >= 18 || hour < 6) {
    return studioModeTheme;
  }
  return dayModeTheme;
};
