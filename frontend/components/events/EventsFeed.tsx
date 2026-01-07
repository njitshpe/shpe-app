import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    RefreshControl,
    Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Event } from '@/types/events';
import { useOngoingEvents } from '@/hooks/events';
import { CompactEventCard } from './CompactEventCard';
import { useTheme } from '@/contexts/ThemeContext';

interface EventsFeedProps {
    events: Event[];
    isRefreshing?: boolean;
    onRefresh?: () => void;
}

interface EventSection {
    key: 'ongoing' | 'upcoming' | 'past';
    title: string;
    data: Event[];
}

export const EventsFeed: React.FC<EventsFeedProps> = ({
    events,
    isRefreshing = false,
    onRefresh,
}) => {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { ongoingEvents, upcomingEvents, pastEvents } = useOngoingEvents(events);

    const sections: EventSection[] = useMemo(() => [
        {
            key: 'ongoing' as const,
            title: 'Happening Now',
            data: ongoingEvents,
        },
        {
            key: 'upcoming' as const,
            title: 'Upcoming Events',
            data: upcomingEvents,
        },
        {
            key: 'past' as const,
            title: 'Past Events',
            data: pastEvents,
        },
    ].filter((section) => section.data.length > 0), [ongoingEvents, upcomingEvents, pastEvents]);

    const handleEventPress = useCallback(
        (eventId: string) => {
            router.push(`/event/${eventId}`);
        },
        [router]
    );

    const renderSectionHeader = ({ section }: { section: EventSection }) => (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
                {section.key === 'ongoing' && (
                    <View style={[styles.ongoingBadge, { backgroundColor: theme.ongoingBadge }]}>
                        <View style={styles.pulseDot} />
                    </View>
                )}
                <Text style={[styles.sectionTitle, { color: theme.text }]}>
                    {section.title}
                </Text>
            </View>
            <Text style={[styles.sectionCount, {
                color: theme.subtext,
                backgroundColor: isDark ? '#333' : '#F3F4F6'
            }]}>
                {section.data.length}
            </Text>
        </View>
    );

    const renderEvent = ({ item }: { item: Event }) => {
        const isPast = pastEvents.includes(item);
        return (
            <CompactEventCard
                event={item}
                onPress={() => handleEventPress(item.id)}
                isPast={isPast}
            />
        );
    };

    const renderEmptyComponent = () => (
        <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📅</Text>
            <Text style={[styles.emptyText, { color: theme.text }]}>
                No events scheduled
            </Text>
            <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                Check back later for upcoming events
            </Text>
        </View>
    );

    return (
        <SectionList
            sections={sections}
            renderItem={renderEvent}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            ListEmptyComponent={renderEmptyComponent}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                    />
                ) : undefined
            }
        />
    );
};

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 100, // Extra padding for FAB
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 20,
        paddingBottom: 12,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    ongoingBadge: {
        width: 10,
        height: 10,
        borderRadius: 5,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    sectionCount: {
        fontSize: 14,
        fontWeight: '600',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
    },
    emptyIcon: {
        fontSize: 64,
        marginBottom: 16,
    },
    emptyText: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    emptySubtext: {
        fontSize: 14,
        textAlign: 'center',
        lineHeight: 20,
    },
});
