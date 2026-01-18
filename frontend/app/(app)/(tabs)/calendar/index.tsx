import React, { useState, useCallback, useEffect } from 'react';
import {
    View,
    StyleSheet,
    Text,
    ActivityIndicator,
    Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '@/contexts/EventsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EventsFeed } from '@/components/events/EventsFeed';
import { LibraryCalendarWrapper } from '@/components/calendar/LibraryCalendarWrapper';
import { isSameDay } from 'date-fns';

export default function EventsScreen() {
    const { events, isLoading, error, refetchEvents } = useEvents();
    const { theme } = useTheme();
    const router = useRouter();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [isCalendarExpanded, setIsCalendarExpanded] = useState(false);



    const handleQRScanPress = () => {
        router.push('/check-in');
    };

    // Initial fetch
    useEffect(() => {
        refetchEvents();
    }, []);

    // Handlers
    const handleMonthChange = (date: Date) => {
        setCurrentMonth(date);
        setSelectedDate(null); // Reset day selection when month changes
    };

    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate((prev) => {
            // If selecting the same date, deselect it to show full month feed
            if (prev && isSameDay(date, prev)) {
                return null;
            }
            return date;
        });
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
        setIsCalendarExpanded(!isCalendarExpanded);
    };

    const monthTitle = `${currentMonth.toLocaleDateString('en-US', { month: 'long' })} Events`;

    // Clean up loading/error states
    if (isLoading && !events.length) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.subtext }]}>Loading events...</Text>
                </View>
            </SafeAreaView>
        );
    }

    if (error && !events.length) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={[styles.errorText, { color: theme.error }]}>Failed to load events</Text>
                    <Text style={[styles.errorSubtext, { color: theme.subtext }]}>{error}</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header / Month Navigation Bar */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>

                {/* Left: Previous Arrow */}
                <Pressable onPress={prevMonth} hitSlop={20} style={styles.navButton}>
                    <Ionicons name="chevron-back" size={24} color={theme.text} />
                </Pressable>

                {/* Center: Title */}
                <Pressable onPress={toggleCalendar} style={styles.titleContainer}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {monthTitle}
                    </Text>
                    <Ionicons
                        name={isCalendarExpanded ? 'chevron-up' : 'chevron-down'}
                        size={16}
                        color={theme.subtext}
                        style={{ marginLeft: 4, marginTop: 1 }}
                    />
                </Pressable>

                {/* Right: Next Arrow */}
                <Pressable onPress={nextMonth} hitSlop={20} style={styles.navButton}>
                    <Ionicons name="chevron-forward" size={24} color={theme.text} />
                </Pressable>

                {/* Absolute: Calendar Toggle (Optional, or integrated into title) */}
                {/* Removed separate toggle button in favor of clicking title or just arrows, 
                    OR we can keep it if user really wants a specific icon. 
                    User asked for "Jan Events" centered. 
                    I'll keep the arrows for month nav, and maybe make title clickable?
                    Actually, let's just stick to the requested layout: Title centered.
                */}
            </View>

            <View style={{ flex: 1 }}>
                {/* Collapsible Calendar */}
                {isCalendarExpanded && (
                    <View style={{ borderBottomWidth: 1, borderBottomColor: theme.border }}>
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
                <EventsFeed
                    events={events}
                    isRefreshing={isLoading}
                    onRefresh={refetchEvents}
                    selectedDate={selectedDate}
                    currentMonth={currentMonth} // Pass month context
                    onSelectEvent={(event) => {
                        router.push(`/event/${event.id}`);
                    }}
                />
            </View>

            {/* QR Scanner FAB */}
            <Pressable
                style={[styles.fab, { backgroundColor: theme.fabBackground }]}
                onPress={handleQRScanPress}
            >
                <Ionicons name="qr-code-outline" size={28} color={theme.fabIcon} />
            </Pressable>


        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between', // Distribute arrows
        paddingHorizontal: 20,
        paddingTop: 36, // Increased to sit lower
        paddingBottom: 16,
        borderBottomWidth: 1,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    navButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 24, // Larger
        fontWeight: '800', // Bolder
        letterSpacing: -0.5,
    },
    calendarButton: {
        padding: 4,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        fontWeight: '500',
    },
    errorContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    errorIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    errorText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    errorSubtext: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
    },

});
