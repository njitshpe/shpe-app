import React, { useCallback, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    RefreshControl,
    SectionList,
    SectionListData,
} from 'react-native';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { useRouter } from 'expo-router';
import { Event } from '@/types/events';
import { useOngoingEvents } from '@/hooks/events';
import { CompactEventCard } from './CompactEventCard';
import { useTheme } from '@/contexts/ThemeContext';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

interface EventsFeedProps {
    events: Event[];
    isRefreshing?: boolean;
    onRefresh?: () => void;
    ListHeaderComponent?: React.ReactElement;
    selectedDate?: Date | null;
    currentMonth?: Date;
    onSelectEvent?: (event: Event) => void;
    contentContainerStyle?: any;
    onScroll?: any;
    bounces?: boolean;
}

interface EventSection {
    key: string;
    title: string;
    mainTitle?: string;
    subTitle?: string;
    data: Event[];
}

export type EventsFeedHandle = {
    scrollToTop: () => void;
};

export const EventsFeed = React.forwardRef<EventsFeedHandle, EventsFeedProps>(({
    events,
    isRefreshing = false,
    onRefresh,
    ListHeaderComponent,
    selectedDate,
    currentMonth,
    onSelectEvent,
    contentContainerStyle,
    onScroll,
    bounces = true,
}, ref) => {
    const router = useRouter();
    const { theme } = useTheme();
    const listRef = React.useRef<any>(null);

    React.useImperativeHandle(ref, () => ({
        scrollToTop: () => {
            listRef.current?.scrollToLocation({ sectionIndex: 0, itemIndex: 0, animated: true });
        },
    }));

    const { pastEvents } = useOngoingEvents(events);

    const filteredSections = useMemo(() => {
        if (!selectedDate) {
            let scopedEvents = events;

            if (currentMonth) {
                const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
                const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59);

                scopedEvents = events.filter(e => {
                    const eDate = new Date(e.startTimeISO);
                    return eDate >= startOfMonth && eDate <= endOfMonth;
                });
            }

            scopedEvents.sort((a, b) => new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime());

            const grouped: { [key: string]: Event[] } = {};

            scopedEvents.forEach(event => {
                const dateKey = format(new Date(event.startTimeISO), 'yyyy-MM-dd');
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(event);
            });

            const finalSections: EventSection[] = Object.keys(grouped).map(dateKey => {
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
                    title: mainTitle,
                    mainTitle,
                    subTitle,
                    data: grouped[dateKey],
                };
            });


            // Split into Upcoming (incl. Today) and Past
            const todayStr = format(new Date(), 'yyyy-MM-dd');
            const upcoming = finalSections.filter(section => section.key >= todayStr);
            const past = finalSections.filter(section => section.key < todayStr);

            // Put all past events into a single section
            if (past.length > 0) {
                const allPastEvents = past.flatMap(section => section.data);
                const pastSection: EventSection = {
                    key: 'past-events',
                    title: 'Past Events',
                    mainTitle: 'Past Events',
                    subTitle: '',
                    data: allPastEvents,
                };
                return [...upcoming, pastSection];
            }

            return upcoming;

        } else {
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
                <Text style={[styles.dateHeaderTitle, { color: theme.text }]}>
                    {section.mainTitle || section.title}
                    {section.subTitle && (
                        <Text style={{ color: theme.subtext, fontWeight: '400' }}>
                            {` / ${section.subTitle}`}
                        </Text>
                    )}
                </Text>
            </View>
        </View>
    );

    const renderEvent = ({ item, index }: { item: Event; index: number }) => {
        const isPast = pastEvents.includes(item);
        return (
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                    type: 'timing',
                    duration: 350,
                    delay: index * 50,
                }}
            >
                <CompactEventCard
                    event={item}
                    onPress={() => handleEventPress(item)}
                    isPast={isPast}
                />
            </MotiView>
        );
    };

    const renderEmptyComponent = () => {
        if (selectedDate) {
            return (
                <View style={styles.emptyContainer}>
                    <Ionicons name="calendar-clear-outline" size={64} color={theme.subtext} style={{ marginBottom: 16, opacity: 0.5 }} />
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
                <Ionicons name="calendar-outline" size={64} color={theme.subtext} style={{ marginBottom: 16, opacity: 0.5 }} />
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
            ref={listRef}
            sections={filteredSections}
            renderItem={renderEvent as any}
            renderSectionHeader={renderSectionHeader as any}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={[styles.listContent, contentContainerStyle]}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            ListHeaderComponent={ListHeaderComponent}
            ListEmptyComponent={renderEmptyComponent}
            onScroll={onScroll}
            scrollEventThrottle={16}
            bounces={bounces}
            refreshControl={
                onRefresh ? (
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={onRefresh}
                        tintColor={theme.primary}
                        progressViewOffset={60}
                    />
                ) : undefined
            }
        />
    );
});

const styles = StyleSheet.create({
    listContent: {
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: 100,
    },
    sectionHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingTop: 0,
        paddingBottom: 12,
    },
    sectionTitleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    dateHeaderTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginTop: 8,
        letterSpacing: -0.5,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 80,
        paddingHorizontal: 40,
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
