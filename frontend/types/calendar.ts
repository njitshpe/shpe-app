export interface CalendarDate {
  date: Date;
  dayOfWeek: string;  // "Mon", "Tue", etc.
  dayNumber: number;  // 1-31
  isToday: boolean;
  isSelected: boolean;
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
