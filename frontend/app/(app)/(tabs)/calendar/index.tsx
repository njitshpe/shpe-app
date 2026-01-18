import React, { useState, useCallback } from 'react';
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
    const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

    const handleQRScanPress = () => {
        router.push('/check-in');
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

    const handleMonthChange = useCallback((date: Date) => {
        setCurrentMonth(date);
        // Optional: clear selected date when swiping away? 
        // User behavior: usually expects to see the new month's feed.
        setSelectedDate(null);
    }, []);

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
            <EventsFeed
                events={events}
                isRefreshing={isLoading}
                onRefresh={refetchEvents}
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                ListHeaderComponent={
                    <LibraryCalendarWrapper
                        events={events}
                        selectedDate={selectedDate}
                        currentDate={currentMonth}
                        onDateSelect={handleDateSelect}
                        onMonthChange={handleMonthChange}
                    />
                }
            />

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
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 20,
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
});
