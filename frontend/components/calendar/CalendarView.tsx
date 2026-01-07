import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    LayoutChangeEvent,
} from 'react-native';
import { Event } from '@/types/events';
import { useAdaptiveTheme } from '@/hooks/calendar';
import { CalendarHeader, WeekStrip, MonthPicker, EventsList } from '@/components/calendar';
import { useTheme } from '@/contexts/ThemeContext';
interface CalendarViewProps {
    events: Event[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
    events,
    selectedDate,
    onDateSelect,
}) => {
    const theme = useAdaptiveTheme();
    const { theme: appTheme } = useTheme();
    const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const [pickerTopOffset, setPickerTopOffset] = useState(0);
    const scrollViewRef = useRef<ScrollView>(null);
    const headerRef = useRef<View>(null);

    const handleHeaderPress = () => {
        if (isMonthPickerOpen) {
            setIsMonthPickerOpen(false);
            return;
        }
        const openPickerAt = (offset: number) => {
            setPickerTopOffset(offset);
            setIsMonthPickerOpen(true);
        };
        if (headerRef.current?.measureInWindow) {
            headerRef.current.measureInWindow((_x, y, _width, height) => {
                // In non-modal view, we might need relative coordinates or sticky header adjustment
                // ensuring offset captures header height correctly
                openPickerAt(Math.max(y + height, 0)); // simplified for standard view
            });
            return;
        }
        openPickerAt(headerHeight);
    };

    const handleDateSelect = (date: Date) => {
        onDateSelect(date);
        setIsMonthPickerOpen(false);
    };

    const handleMonthPickerClose = () => {
        setIsMonthPickerOpen(false);
    };

    const handleTodayPress = () => {
        const today = new Date();
        onDateSelect(today);
        setIsMonthPickerOpen(false);
        scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    };

    const handleHeaderLayout = (event: LayoutChangeEvent) => {
        if (headerHeight === 0) {
            setHeaderHeight(event.nativeEvent.layout.height);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Month Picker */}
            <MonthPicker
                selectedDate={selectedDate}
                events={events}
                onDateSelect={handleDateSelect}
                onClose={handleMonthPickerClose}
                visible={isMonthPickerOpen}
                topOffset={pickerTopOffset} // Check if this needs specific adjustment for non-modal
            />

            <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Header */}
                <View ref={headerRef} onLayout={handleHeaderLayout}>
                    <CalendarHeader
                        selectedDate={selectedDate}
                        onHeaderPress={handleHeaderPress}
                        isMonthPickerOpen={isMonthPickerOpen}
                        onTodayPress={handleTodayPress}
                    />
                </View>

                {/* Week Strip */}
                <WeekStrip
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    events={events}
                    scrollViewRef={scrollViewRef}
                />

                {/* Events List */}
                <EventsList events={events} selectedDate={selectedDate} />
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
});
