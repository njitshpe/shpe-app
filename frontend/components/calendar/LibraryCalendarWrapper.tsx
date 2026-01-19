import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { Calendar, DateData, LocaleConfig } from 'react-native-calendars';
import { useTheme } from '@/contexts/ThemeContext';
import { Event } from '@/types/events';
import { format, isSameDay } from 'date-fns';
import { BlurView } from 'expo-blur';
import { getEventGradient } from '@/utils/eventUtils';

// Configure Locale for custom options
/*
LocaleConfig.locales['en'] = {
  monthNames: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
  monthNamesShort: ['Jan.', 'Feb.', 'Mar.', 'Apr.', 'May', 'Jun.', 'Jul.', 'Aug.', 'Sep.', 'Oct.', 'Nov.', 'Dec.'],
  dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  dayNamesShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  today: 'Today'
};
LocaleConfig.defaultLocale = 'en';
*/

interface LibraryCalendarWrapperProps {
    currentMonth: Date; // The visible month, shared state
    selectedDate: Date | null;
    events: Event[];
    onDateSelect: (date: Date) => void;
    onMonthChange: (date: Date) => void;
}

export const LibraryCalendarWrapper: React.FC<LibraryCalendarWrapperProps> = ({
    currentMonth,
    selectedDate,
    events,
    onDateSelect,
    onMonthChange,
}) => {
    const { theme, isDark } = useTheme();



    // Transform events into markedDates for react-native-calendars
    const markedDates = useMemo(() => {
        const marks: { [key: string]: any } = {};
        const todayStr = format(new Date(), 'yyyy-MM-dd');

        events.forEach(event => {
            const dateStr = format(new Date(event.startTimeISO), 'yyyy-MM-dd');
            // Get color based on event type
            const gradient = getEventGradient(event);
            const color = gradient[2] || theme.primary;

            if (!marks[dateStr]) {
                marks[dateStr] = { marked: true, dotColor: color };
            } else {
                marks[dateStr].marked = true;
            }

            // If event is today, tint the number color
            if (dateStr === todayStr) {
                marks[dateStr].textColor = color;
            }
        });

        // Ensure today (if no event) uses primary color
        if (!marks[todayStr]) {
            marks[todayStr] = { marked: false, textColor: theme.primary };
        } else if (!marks[todayStr].textColor) {
            marks[todayStr].textColor = theme.primary;
        }

        // Mark selected date
        if (selectedDate) {
            const selectedStr = format(selectedDate, 'yyyy-MM-dd');

            // Find if there's an event on this day to use its color
            const eventOnDay = events.find(e => {
                const eDate = format(new Date(e.startTimeISO), 'yyyy-MM-dd');
                return eDate === selectedStr;
            });

            let selectionColor = theme.primary;
            if (eventOnDay) {
                const gradient = getEventGradient(eventOnDay);
                selectionColor = gradient[2] || theme.primary;
            }

            marks[selectedStr] = {
                ...(marks[selectedStr] || {}), // Keep existing dots
                selected: true,
                selectedColor: selectionColor,
                selectedTextColor: '#ffffff',
            };
        }

        return marks;
    }, [events, selectedDate, theme]);

    const currentStr = format(currentMonth, 'yyyy-MM-dd');

    return (
        <BlurView
            intensity={80}
            tint={isDark ? 'dark' : 'light'}
            style={[styles.container, { borderBottomColor: theme.border }]}
        >
            <Calendar
                // forces re-render if theme OR month changes (fixes sync issue)
                key={`${isDark ? 'dark' : 'light'}-${currentStr}`}

                current={currentStr}
                onDayPress={(day: DateData) => {
                    // day.timestamp is UTC midnight
                    // Create date from dateString to avoid timezone shifts if using timestamp
                    const [y, m, d] = day.dateString.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    onDateSelect(date);
                }}
                onMonthChange={(month: DateData) => {
                    // Prevent auto-internal navigation if we are controlling it externally
                    const [y, m, d] = month.dateString.split('-').map(Number);
                    const date = new Date(y, m - 1, d);
                    onMonthChange(date);
                }}

                // Behavior
                enableSwipeMonths={true}
                hideExtraDays={true}

                // Styling
                theme={{
                    calendarBackground: 'transparent', // Important for Glass
                    textSectionTitleColor: theme.subtext, // Mon, Tue...
                    selectedDayTextColor: '#ffffff',
                    todayTextColor: theme.primary,
                    dayTextColor: theme.text,
                    textDisabledColor: theme.subtext, // Faded days
                    dotColor: theme.primary,
                    selectedDotColor: '#ffffff',
                    arrowColor: theme.primary,
                    monthTextColor: theme.text,
                    textDayFontWeight: '500',
                    textMonthFontWeight: '700',
                    textDayHeaderFontWeight: '500',
                    textDayFontSize: 16,
                    textMonthFontSize: 18,
                    textDayHeaderFontSize: 12,
                }}

                markedDates={markedDates}
            />
        </BlurView>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 20,
        overflow: 'hidden',
        marginBottom: 10,
    },
});
