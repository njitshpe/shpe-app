import { useTheme } from '@/contexts/ThemeContext';
import { CalendarTheme } from '../../types/calendar';

/**
 * Hook that provides adaptive theming based on the global app theme
 * Replaces the old time-based logic with the user's selected preference
 */
export const useAdaptiveTheme = (): CalendarTheme => {
  const { theme, isDark } = useTheme();

  return {
    background: theme.background,
    selectedDateBackground: theme.primary,
    selectedDateText: '#FFFFFF', // Always white for contrast on primary color
    unselectedDateText: theme.subtext,
    headerText: theme.text,
    accentColor: isDark ? '#2C2C2E' : '#E5E5EA', // Slightly different accent for calendar items
    dividerColor: theme.border,
  };
};
