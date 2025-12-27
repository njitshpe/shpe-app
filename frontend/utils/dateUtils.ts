import { CalendarDate } from '../types/calendar.types';

/**
 * Generates an array of CalendarDate objects for the given date range
 * @param startDate - The start date
 * @param endDate - The end date
 * @param selectedDate - The currently selected date
 * @returns Array of CalendarDate objects
 */
export const generateDateRange = (
  startDate: Date,
  endDate: Date,
  selectedDate: Date
): CalendarDate[] => {
  const dates: CalendarDate[] = [];
  const current = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  while (current <= endDate) {
    const dateObj = new Date(current);
    dateObj.setHours(0, 0, 0, 0);

    dates.push({
      date: new Date(dateObj),
      dayOfWeek: dateObj.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: dateObj.getDate(),
      isToday: dateObj.toDateString() === today.toDateString(),
      isSelected: dateObj.toDateString() === selectedDate.toDateString(),
    });

    current.setDate(current.getDate() + 1);
  }

  return dates;
};

/**
 * Generates a date range from 2 weeks before to 2 weeks after the given date
 * @param centerDate - The center date (usually today)
 * @param selectedDate - The currently selected date
 * @returns Array of CalendarDate objects
 */
export const generateCalendarDates = (
  centerDate: Date = new Date(),
  selectedDate: Date = new Date()
): CalendarDate[] => {
  const startDate = new Date(centerDate);
  startDate.setDate(startDate.getDate() - 14); // 2 weeks before

  const endDate = new Date(centerDate);
  endDate.setDate(endDate.getDate() + 14); // 2 weeks after

  return generateDateRange(startDate, endDate, selectedDate);
};
