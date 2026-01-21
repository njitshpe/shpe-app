import React, { useMemo } from 'react';
import { View, StyleSheet, Text, Pressable } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useEvents } from '@/contexts/EventsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EventsFeed } from '@/components/events/EventsFeed';

export default function MyEventsScreen() {
    const { events, isLoading, refetchEvents } = useEvents();
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    // Filter to only show events the user has registered for
    const myEvents = useMemo(() => {
        return events.filter(event =>
            event.userRegistrationStatus === 'going' ||
            event.userRegistrationStatus === 'confirmed' ||
            event.userRegistrationStatus === 'waitlist'
        );
    }, [events]);

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, { backgroundColor: `${theme.primary}20` }]}>
                <Ionicons name="calendar-outline" size={48} color={theme.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>
                No Events Yet
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                You haven&apos;t registered for any events.{'\n'}
                Browse upcoming events and RSVP to see them here.
            </Text>
            <Pressable
                onPress={() => router.push('/(tabs)/calendar')}
                style={({ pressed }) => [
                    styles.browseButton,
                    { backgroundColor: theme.primary, opacity: pressed ? 0.8 : 1 }
                ]}
            >
                <Text style={styles.browseButtonText}>Browse Events</Text>
            </Pressable>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top }]}>
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.headerContent}>
                    <Pressable
                        onPress={() => router.back()}
                        style={styles.backButton}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </Pressable>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        My Events
                    </Text>
                    <View style={styles.headerSpacer} />
                </View>
            </View>

            {/* Events Feed */}
            {myEvents.length === 0 && !isLoading ? (
                renderEmptyState()
            ) : (
                <EventsFeed
                    events={myEvents}
                    isRefreshing={isLoading}
                    onRefresh={refetchEvents}
                    onSelectEvent={(event) => router.push(`/event/${event.id}`)}
                    contentContainerStyle={{ paddingTop: insets.top + 60 }}
                    bounces={true}
                />
            )}
        </View>
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
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingBottom: 12,
        paddingTop: 8,
    },
    backButton: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    headerSpacer: {
        width: 40,
    },
    emptyContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 40,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 24,
    },
    emptyTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 12,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    browseButton: {
        paddingHorizontal: 24,
        paddingVertical: 14,
        borderRadius: 12,
    },
    browseButtonText: {
        color: '#FFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
