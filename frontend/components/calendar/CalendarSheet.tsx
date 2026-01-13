import React, { useState, useRef } from 'react';
import {
    View,
    StyleSheet,
    ScrollView,
    Text,
    Modal,
    Pressable,
    LayoutChangeEvent,
} from 'react-native';
import { Event } from '@/types/events';
import { useAdaptiveTheme } from '@/hooks/calendar';
import { CalendarHeader } from './CalendarHeader';
import { WeekStrip } from './WeekStrip';
import { MonthPicker } from './MonthPicker';
import { EventsList } from './EventsList';
import { useTheme } from '@/contexts/ThemeContext';

interface CalendarSheetProps {
    visible: boolean;
    onClose: () => void;
    events: Event[];
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
}

export const CalendarSheet: React.FC<CalendarSheetProps> = ({
    visible,
    onClose,
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
                openPickerAt(Math.max(y + height, headerHeight));
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
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {/* Close button header */}
                <View style={[styles.modalHeader, { borderBottomColor: appTheme.border }]}>
                    <Text style={[styles.modalTitle, { color: appTheme.text }]}>Calendar View</Text>
                    <Pressable onPress={onClose} style={styles.closeButton}>
                        <Text style={[styles.closeButtonText, { color: appTheme.info }]}>Done</Text>
                    </Pressable>
                </View>

                {/* Month Picker */}
                <MonthPicker
                    selectedDate={selectedDate}
                    events={events}
                    onDateSelect={handleDateSelect}
                    onClose={handleMonthPickerClose}
                    visible={isMonthPickerOpen}
                    topOffset={pickerTopOffset}
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
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 12,
        borderBottomWidth: 1,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
    },
    closeButton: {
        paddingHorizontal: 12,
        paddingVertical: 6,
    },
    closeButtonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 40,
    },
});
