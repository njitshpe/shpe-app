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
    ListHeaderComponent?: React.ReactElement;
    selectedDate?: Date | null;
    currentMonth?: Date; // New prop to scope the default view
}

interface EventSection {
    key: 'ongoing' | 'upcoming' | 'past' | 'selected';
    title: string;
    data: Event[];
}

export const EventsFeed: React.FC<EventsFeedProps> = ({
    events,
    isRefreshing = false,
    onRefresh,
    ListHeaderComponent,
    selectedDate,
    currentMonth,
}) => {
    const router = useRouter();
    const { theme, isDark } = useTheme();

    // Default grouping logic
    const { ongoingEvents, upcomingEvents, pastEvents } = useOngoingEvents(events);

    // Filtered logic for specific date selection OR current month scope
    const filteredSections = useMemo(() => {
        if (!selectedDate) {
            // No specific day selected -> Show Monthly View (Scoped)

            // 1. Filter events to the current month (if provided)
            let scopedEvents = events;
            let displayTitle = "Upcoming Events";

            if (currentMonth) {
                const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

                scopedEvents = events.filter(e => {
                    const eDate = new Date(e.startTimeISO);
                    return eDate >= startOfMonth && eDate <= endOfMonth;
                });

                displayTitle = `Events in ${startOfMonth.toLocaleDateString(undefined, { month: 'long' })}`;
            }

            // Simple time sorting for the Month View

            const now = new Date();
            const ongoing = scopedEvents.filter(e => {
                const start = new Date(e.startTimeISO);
                const end = new Date(e.endTimeISO);
                return start <= now && end >= now;
            });

            const future = scopedEvents.filter(e => {
                const start = new Date(e.startTimeISO);
                return start > now;
            }).sort((a, b) => new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime());

            const past = scopedEvents.filter(e => {
                const end = new Date(e.endTimeISO);
                return end < now;
            }).sort((a, b) => new Date(b.startTimeISO).getTime() - new Date(a.startTimeISO).getTime()); // Descending for past


            return [
                {
                    key: 'ongoing' as const,
                    title: 'Happening Now',
                    data: ongoing,
                },
                {
                    key: 'upcoming' as const,
                    title: displayTitle, // "Events in January"
                    data: future,
                },
                {
                    key: 'past' as const,
                    title: 'Past Events', // In this month
                    data: past,
                },
            ].filter((section) => section.data.length > 0);

        } else {
            // Specific Date View
            const startOfSelected = new Date(selectedDate);
            startOfSelected.setHours(0, 0, 0, 0);

            const eventsOnDate = events.filter(e => {
                const eDate = new Date(e.startTimeISO);
                return eDate.getDate() === startOfSelected.getDate() &&
                    eDate.getMonth() === startOfSelected.getMonth() &&
                    eDate.getFullYear() === startOfSelected.getFullYear();
            });

            if (eventsOnDate.length === 0) return [];

            return [{
                key: 'selected' as const,
                title: `Events on ${startOfSelected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`,
                data: eventsOnDate
            }];
        }
    }, [events, selectedDate, currentMonth]);

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

    const renderEmptyComponent = () => {
        if (selectedDate) {
            return (
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyIcon}>zzZ</Text>
                    <Text style={[styles.emptyText, { color: theme.text }]}>
                        No events on this day
                    </Text>
                    <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                        Select another date or check the upcoming feed
                    </Text>
                </View>
            );
        }
        return (
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📅</Text>
                <Text style={[styles.emptyText, { color: theme.text }]}>
                    No events scheduled
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                    No events scheduled for this month
                </Text>
                <Text style={[styles.emptySubtext, { color: theme.subtext }]}>
                    Swipe to other months to see more
                </Text>
            </View>
        );
    };

    return (
        <SectionList
            sections={filteredSections}
            renderItem={renderEvent}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            ListHeaderComponent={ListHeaderComponent}
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
