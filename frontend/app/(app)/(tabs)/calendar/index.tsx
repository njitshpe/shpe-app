import React, { useState, useCallback, useEffect } from 'react';
import { BlurView } from 'expo-blur';
import {
    View,
    StyleSheet,
    Text,
    Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '@/contexts/EventsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EventsFeed } from '@/components/events/EventsFeed';
import { LibraryCalendarWrapper } from '@/components/calendar/LibraryCalendarWrapper';
import { MonthHeroHeader } from '@/components/events/MonthHeroHeader';
import { isSameDay, isSameMonth } from 'date-fns';

const HEADER_TRIGGER_OFFSET = 300;

export default function EventsScreen() {
    const { events, isLoading, refetchEvents } = useEvents();
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const handleQRScanPress = () => {
        router.push('/check-in');
    };

    useEffect(() => {
        refetchEvents();
    }, []);

    // Handlers
    const handleMonthChange = (date: Date) => {
        setCurrentMonth(date);
        setSelectedDate(null);
    };

    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate((prev) => {
            if (prev && isSameDay(date, prev)) {
                return null;
            }
            return date;
        });
        setShowCalendar(false);
    }, []);

    const nextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + 1);
        handleMonthChange(next);
    };

    const prevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(prev.getMonth() - 1);
        handleMonthChange(prev);
    };

    const toggleCalendar = () => {
        setShowCalendar(!showCalendar);
    };

    const monthTitle = `${currentMonth.toLocaleDateString('en-US', { month: 'long' })}`;

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Calendar View (Conditional) */}
            {showCalendar && (
                <View style={[styles.calendarContainer, { paddingTop: insets.top + 60 }]}>
                    <LibraryCalendarWrapper
                        events={events}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelect}
                        currentMonth={currentMonth}
                        onMonthChange={handleMonthChange}
                    />
                </View>
            )}

            {/* Events Feed */}
            {!showCalendar && (
                <EventsFeed
                    events={events}
                    isRefreshing={isLoading}
                    selectedDate={selectedDate}
                    currentMonth={currentMonth}
                    onSelectEvent={(event) => router.push(`/event/${event.id}`)}
                    contentContainerStyle={{ paddingTop: 0 }}
                    ListHeaderComponent={<MonthHeroHeader currentMonth={currentMonth} onScanPress={handleQRScanPress} />}
                />
            )}

            {/* Sticky Navigation Header */}
            <View
                style={[styles.header, { paddingTop: insets.top }]}
                pointerEvents="box-none"
            >
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderBottomColor: theme.border }]}
                />
                <View style={styles.headerContent}>
                    <Pressable onPress={prevMonth} hitSlop={20} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </Pressable>

                    <Pressable onPress={toggleCalendar} style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            {monthTitle}
                        </Text>
                        <View style={{ marginLeft: 4, marginTop: 2 }}>
                            <Ionicons
                                name={showCalendar ? "chevron-up" : "chevron-down"}
                                size={16}
                                color={theme.subtext}
                            />
                        </View>
                    </Pressable>

                    <Pressable onPress={nextMonth} hitSlop={20} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={24} color={theme.text} />
                    </Pressable>
                </View>
            </View>

            {/* Return to Current Month Button */}
            {!isSameMonth(currentMonth, new Date()) && !showCalendar && (
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.floatingButtonContainer, { bottom: 40 }]}
                >
                    <Pressable
                        onPress={() => {
                            const now = new Date();
                            setCurrentMonth(now);
                            setSelectedDate(null);
                        }}
                        style={({ pressed }) => [
                            styles.floatingButton,
                            { borderColor: theme.primary, opacity: pressed ? 0.8 : 1 }
                        ]}
                    >
                        <Text style={[styles.floatingButtonText, { color: theme.primary }]}>
                            Return to Current Month
                        </Text>
                    </Pressable>
                </BlurView>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    calendarContainer: {
        flex: 1,
        paddingHorizontal: 10,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 16,
        paddingTop: 10,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    navButton: {
        padding: 8,
        backgroundColor: 'rgba(125,125,125,0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    floatingButtonContainer: {
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: 20,
        overflow: 'hidden',
        zIndex: 50,
    },
    floatingButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
