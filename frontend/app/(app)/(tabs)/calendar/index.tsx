import React, { useState, useCallback, useEffect } from 'react';
import { BlurView } from 'expo-blur';
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
import { isSameDay, isSameMonth } from 'date-fns';

export default function EventsScreen() {
    const { events, isLoading, error, refetchEvents } = useEvents();
    const { theme, isDark } = useTheme();
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

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>

            {/* Absolute Glass Header */}
            <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.header, { borderBottomColor: theme.border }]}
            >
                <SafeAreaView edges={['top']}>
                    <View style={styles.headerContent}>
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
                    </View>
                </SafeAreaView>
            </BlurView>

            {/* Content Container (Padded via contentContainerStyle) */}
            <View style={{ flex: 1 }}>
                <EventsFeed
                    events={events}
                    isRefreshing={isLoading}
                    onRefresh={refetchEvents}
                    selectedDate={selectedDate}
                    currentMonth={currentMonth}
                    onSelectEvent={(event) => {
                        router.push(`/event/${event.id}`);
                    }}
                    contentContainerStyle={{ paddingTop: 90 }} // Header clearance
                    ListHeaderComponent={
                        isCalendarExpanded ? (
                            <View>
                                <LibraryCalendarWrapper
                                    events={events}
                                    selectedDate={selectedDate}
                                    onDateSelect={handleDateSelect}
                                    currentMonth={currentMonth}
                                    onMonthChange={handleMonthChange}
                                />
                            </View>
                        ) : undefined
                    }
                />
            </View>

            {/* QR Scanner FAB */}
            {/* QR Scanner FAB */}
            <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.fabContainer, { borderColor: theme.primary }]}
            >
                <Pressable
                    style={({ pressed }) => [
                        styles.fabContent,
                        { opacity: pressed ? 0.7 : 1 }
                    ]}
                    onPress={handleQRScanPress}
                >
                    <Ionicons name="qr-code-outline" size={28} color={theme.primary} />
                </Pressable>
            </BlurView>

            {/* Floating 'Back to Month' Button */}
            {!isSameMonth(currentMonth, new Date()) && (
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={styles.floatingButtonContainer}
                >
                    <Pressable
                        onPress={() => {
                            const now = new Date();
                            setCurrentMonth(now);
                            setSelectedDate(null);
                        }}
                        style={({ pressed }) => [
                            styles.floatingButton,
                            {
                                borderColor: theme.primary,
                                opacity: pressed ? 0.8 : 1
                            }
                        ]}
                    >
                        <Text style={[styles.floatingButtonText, { color: theme.primary }]}>
                            Return to Current Month
                        </Text>
                    </Pressable>
                </BlurView>
            )}

        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        overflow: 'hidden',
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
    floatingButtonContainer: {
        position: 'absolute',
        bottom: 30,
        alignSelf: 'center',
        borderRadius: 20,
        overflow: 'hidden',
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
    fabContainer: {
        position: 'absolute',
        bottom: 30, // Aligned with other floaters
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1, // Subtle border definition for glass
        elevation: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
    },
    fabContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

});
