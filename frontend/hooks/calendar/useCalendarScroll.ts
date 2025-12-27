import { useRef, useCallback } from 'react';
import { ScrollView } from 'react-native';
import { CalendarDate } from '../../types/calendar.types';
import { DATE_ITEM_WIDTH, DATE_ITEM_SPACING } from '../../constants/calendarTheme';

interface UseCalendarScrollReturn {
  scrollViewRef: React.RefObject<ScrollView | null>;
  scrollToDate: (date: Date, dates: CalendarDate[]) => void;
}

export const useCalendarScroll = (): UseCalendarScrollReturn => {
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToDate = useCallback((date: Date, dates: CalendarDate[]) => {
    const dateIndex = dates.findIndex(
      (d) => d.date.toDateString() === date.toDateString()
    );

    if (dateIndex !== -1 && scrollViewRef.current) {
      // Calculate x-offset to center the selected date
      const offset = dateIndex * (DATE_ITEM_WIDTH + DATE_ITEM_SPACING);

      scrollViewRef.current.scrollTo({
        x: offset,
        y: 0,
        animated: true,
      });
    }
  }, []);

  return {
    scrollViewRef,
    scrollToDate,
  };
};
