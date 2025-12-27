export interface CalendarDate {
  date: Date;
  dayOfWeek: string;  // "Mon", "Tue", etc.
  dayNumber: number;  // 1-31
  isToday: boolean;
  isSelected: boolean;
}

export interface CalendarEvent {
  id: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  description?: string;
}

export interface CalendarTheme {
  background: string;
  selectedDateBackground: string;
  selectedDateText: string;
  unselectedDateText: string;
  headerText: string;
  accentColor: string;
  dividerColor: string;
}
