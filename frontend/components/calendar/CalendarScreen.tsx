import React, { useMemo, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { CalendarDateHeader } from './CalendarDateHeader';
import { DateSelector } from './DateSelector';
import { EventsSheet } from './EventsSheet';
import { useSelectedDate } from '../../hooks/calendar/useSelectedDate';
import { useCalendarScroll } from '../../hooks/calendar/useCalendarScroll';
import { generateCalendarDates } from '../../utils/dateUtils';
import { CalendarEvent } from '../../types/calendar.types';
import { calendarTheme } from '../../constants/calendarTheme';

interface CalendarScreenProps {
  events?: CalendarEvent[];
}

export const CalendarScreen: React.FC<CalendarScreenProps> = ({
  events = [],
}) => {
  const { selectedDate, setSelectedDate, formattedHeader } = useSelectedDate();
  const { scrollViewRef, scrollToDate } = useCalendarScroll();

  // Generate dates array (±2 weeks from today)
  const dates = useMemo(
    () => generateCalendarDates(new Date(), selectedDate),
    [selectedDate]
  );

  // Filter events for the selected date
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      eventDate.setHours(0, 0, 0, 0);

      const selected = new Date(selectedDate);
      selected.setHours(0, 0, 0, 0);

      return eventDate.toDateString() === selected.toDateString();
    });
  }, [events, selectedDate]);

  // Handle date selection
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    scrollToDate(date, dates);
  };

  // Scroll to selected date on mount
  useEffect(() => {
    scrollToDate(selectedDate, dates);
  }, []);

  return (
    <View style={styles.container}>
      <CalendarDateHeader
        selectedDate={selectedDate}
        formattedHeader={formattedHeader}
      />
      <DateSelector
        dates={dates}
        selectedDate={selectedDate}
        onDateSelect={handleDateSelect}
        scrollViewRef={scrollViewRef}
      />
      <EventsSheet
        events={filteredEvents}
        visible={true}
        selectedDate={selectedDate}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: calendarTheme.background,
  },
});
