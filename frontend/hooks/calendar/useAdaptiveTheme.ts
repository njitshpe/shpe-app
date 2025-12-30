import { useState, useEffect } from 'react';
import { CalendarTheme } from '../../types/calendar';
import { getThemeForTime } from '../../constants/calendar-theme';

/**
 * Hook that provides adaptive theming based on time of day
 * Automatically switches between Day Mode and Studio Mode
 */
export const useAdaptiveTheme = () => {
  const [theme, setTheme] = useState<CalendarTheme>(() => getThemeForTime());

  useEffect(() => {
    // Update theme immediately
    setTheme(getThemeForTime());

    // Check every minute for theme changes
    const interval = setInterval(() => {
      setTheme(getThemeForTime());
    }, 60000); // 60 seconds

    return () => clearInterval(interval);
  }, []);

  return theme;
};
