import React, { useState } from 'react';
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
import { CalendarView } from '@/components/calendar';

type ViewMode = 'calendar' | 'feed';

export default function EventsScreen() {
    const { events, isLoading, error, refetchEvents } = useEvents();
    const { theme } = useTheme();
    const router = useRouter();
    const [viewMode, setViewMode] = useState<ViewMode>('calendar');
    const [selectedDate, setSelectedDate] = useState(new Date());

    const handleQRScanPress = () => {
        router.push('/check-in');
    };

    const toggleViewMode = () => {
        setViewMode((prev) => (prev === 'calendar' ? 'feed' : 'calendar'));
    };

    const handleDateSelect = (date: Date) => {
        setSelectedDate(date);
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Events</Text>
                <Pressable
                    onPress={toggleViewMode}
                    style={styles.calendarButton}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                    <Ionicons
                        name={viewMode === 'calendar' ? 'list-outline' : 'calendar-outline'}
                        size={24}
                        color={theme.text}
                    />
                </Pressable>
            </View>

            {/* Content */}
            {isLoading ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.subtext }]}>Loading events...</Text>
                </View>
            ) : error ? (
                <View style={styles.errorContainer}>
                    <Text style={styles.errorIcon}>⚠️</Text>
                    <Text style={[styles.errorText, { color: theme.error }]}>Failed to load events</Text>
                    <Text style={[styles.errorSubtext, { color: theme.subtext }]}>{error}</Text>
                </View>
            ) : (
                <>
                    {viewMode === 'feed' ? (
                        <EventsFeed
                            events={events}
                            isRefreshing={isLoading}
                            onRefresh={refetchEvents}
                        />
                    ) : (
                        <CalendarView
                            events={events}
                            selectedDate={selectedDate}
                            onDateSelect={handleDateSelect}
                        />
                    )}
                </>
            )}

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
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    calendarButton: {
        padding: 8,
    },
    loadingContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
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
        paddingVertical: 60,
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
