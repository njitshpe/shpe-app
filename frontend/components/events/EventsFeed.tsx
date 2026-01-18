import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    SectionList,
    RefreshControl,
    Pressable,
    SectionListData,
} from 'react-native';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
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
    onSelectEvent?: (event: Event) => void;
}

interface EventSection {
    key: string; // 'ongoing' or date string 'yyyy-MM-dd'
    title: string;
    mainTitle?: string;
    subTitle?: string;
    data: Event[];
}

export const EventsFeed: React.FC<EventsFeedProps> = ({
    events,
    isRefreshing = false,
    onRefresh,
    ListHeaderComponent,
    selectedDate,
    currentMonth,
    onSelectEvent,
}) => {
    const router = useRouter();
    const { theme, isDark } = useTheme();

    // Default grouping logic
    const { ongoingEvents, upcomingEvents, pastEvents } = useOngoingEvents(events);

    // Filtered logic for specific date selection OR current month scope
    const filteredSections = useMemo(() => {
        if (!selectedDate) {
            // No specific day selected -> Show Monthly View (Scoped) using DATE HEADERS

            // 1. Filter events to the current month (if provided)
            let scopedEvents = events;

            if (currentMonth) {
                const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

                scopedEvents = events.filter(e => {
                    const eDate = new Date(e.startTimeISO);
                    return eDate >= startOfMonth && eDate <= endOfMonth;
                });
            }

            // 2. Separate "Happening Now"
            const now = new Date();
            const ongoing = scopedEvents.filter(e => {
                const start = new Date(e.startTimeISO);
                const end = new Date(e.endTimeISO);
                return start <= now && end >= now;
            });

            // 3. Group Remaining (Upcoming & Past in this month) by DATE
            const remaining = scopedEvents.filter(e => !ongoing.includes(e));

            // Sort by time
            remaining.sort((a, b) => new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime());

            // Grouping Map
            const grouped: { [key: string]: Event[] } = {};

            remaining.forEach(event => {
                const dateKey = format(new Date(event.startTimeISO), 'yyyy-MM-dd');
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(event);
            });

            // Convert to Sections
            const dateSections: EventSection[] = Object.keys(grouped).map(dateKey => {
                const dateObj = parseISO(dateKey);
                let mainTitle = '';
                let subTitle = '';

                if (isToday(dateObj)) {
                    mainTitle = 'Today';
                    subTitle = format(dateObj, 'EEEE');
                } else if (isTomorrow(dateObj)) {
                    mainTitle = 'Tomorrow';
                    subTitle = format(dateObj, 'EEEE');
                } else {
                    mainTitle = format(dateObj, 'MMMM d');
                    subTitle = format(dateObj, 'EEEE');
                }

                return {
                    key: dateKey,
                    title: mainTitle, // Keeping title for compat if needed, but we'll use parts
                    mainTitle,
                    subTitle,
                    data: grouped[dateKey],
                };
            });

            // Construct Final List
            const finalSections: EventSection[] = [];

            if (ongoing.length > 0) {
                finalSections.push({
                    key: 'ongoing',
                    title: 'Happening Now',
                    data: ongoing,
                });
            }

            return [...finalSections, ...dateSections];

        } else {
            // Specific Date View (Unchanged)
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
                key: 'selected',
                title: `Events on ${startOfSelected.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}`,
                data: eventsOnDate
            }];
        }
    }, [events, selectedDate, currentMonth]);

    const handleEventPress = useCallback(
        (event: Event) => {
            if (onSelectEvent) {
                onSelectEvent(event);
            } else {
                router.push(`/event/${event.id}`);
            }
        },
        [onSelectEvent, router]
    );

    const renderSectionHeader = ({ section }: { section: EventSection }) => (
        <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
                {section.key === 'ongoing' ? (
                    <>
                        <View style={[styles.ongoingBadge, { backgroundColor: theme.ongoingBadge }]}>
                            <View style={styles.pulseDot} />
                        </View>
                        <Text style={[styles.sectionTitle, { color: theme.text }]}>
                            {section.title}
                        </Text>
                    </>
                ) : (
                    <Text style={[styles.dateHeaderTitle, { color: theme.text }]}>
                        {section.mainTitle || section.title}
                        {section.subTitle && (
                            <Text style={{ color: theme.subtext, fontWeight: '400' }}>
                                {` / ${section.subTitle}`}
                            </Text>
                        )}
                    </Text>
                )}
            </View>
        </View>
    );

    const renderEvent = ({ item }: { item: Event }) => {
        const isPast = pastEvents.includes(item);
        return (
            <CompactEventCard
                event={item}
                onPress={() => handleEventPress(item)}
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
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.5,
    },
    dateHeaderTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 8,
        letterSpacing: 0, // Reduced letterSpacing
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
