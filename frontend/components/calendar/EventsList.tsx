import React, { useMemo } from 'react';
import { View, Text, StyleSheet, SectionList } from 'react-native';
import {
  isSameDay,
  isAfter,
  isBefore,
  startOfDay,
  startOfWeek,
  endOfWeek,
  isWithinInterval,
} from 'date-fns';
import { useRouter } from 'expo-router';
import { Event } from '@/data/mockEvents';
import { TactileEventCard } from './TactileEventCard';
import { useTheme } from '@/contexts/ThemeContext';

interface EventsListProps {
  events: Event[];
  selectedDate: Date;
}

interface EventSection {
  key: 'selected' | 'upcoming' | 'past';
  title: string;
  data: Event[];
}

export const EventsList: React.FC<EventsListProps> = ({ events, selectedDate }) => {
  const router = useRouter();
  const { theme, isDark } = useTheme();
  const today = startOfDay(new Date());

  // Split events into sections: Today's Events + Upcoming Events
  const sections = useMemo((): EventSection[] => {
    const selectedDay = startOfDay(selectedDate);
    const isSelectedToday = isSameDay(selectedDay, today);
    const weekStart = startOfWeek(selectedDay, { weekStartsOn: 0 });
    const weekEnd = endOfWeek(selectedDay, { weekStartsOn: 0 });

    const weekEvents = events.filter((event) => {
      const eventDay = startOfDay(new Date(event.startTimeISO));
      return isWithinInterval(eventDay, { start: weekStart, end: weekEnd });
    });

    const selectedDateEvents = weekEvents
      .filter((event) => isSameDay(new Date(event.startTimeISO), selectedDay))
      .sort((a, b) => {
        return new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime();
      });

    const upcomingEvents = weekEvents
      .filter((event) => {
        const eventDay = startOfDay(new Date(event.startTimeISO));
        return isAfter(eventDay, today) && !isSameDay(eventDay, selectedDay);
      })
      .sort((a, b) => {
        return new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime();
      });

    const pastEvents = weekEvents
      .filter((event) => {
        const eventDay = startOfDay(new Date(event.startTimeISO));
        return isBefore(eventDay, today) && !isSameDay(eventDay, selectedDay);
      })
      .sort((a, b) => {
        return new Date(b.startTimeISO).getTime() - new Date(a.startTimeISO).getTime();
      });

    return [
      {
        key: 'selected',
        title: isSelectedToday ? "Today's Events" : 'On this day',
        data: selectedDateEvents,
      },
      {
        key: 'upcoming',
        title: 'Upcoming Events',
        data: upcomingEvents,
      },
      {
        key: 'past',
        title: 'Past Events',
        data: pastEvents,
      },
    ];
  }, [events, selectedDate, today]);

  const dynamicStyles = {
    sectionTitle: { color: theme.text },
    sectionCount: { color: theme.subtext, backgroundColor: isDark ? '#333' : '#F3F4F6' },
    emptyText: { color: theme.text },
    emptySubtext: { color: theme.subtext },
  };

  const renderSectionHeader = ({ section }: { section: EventSection }) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, dynamicStyles.sectionTitle]}>{section.title}</Text>
      {section.data.length > 0 && (
        <Text style={[styles.sectionCount, dynamicStyles.sectionCount]}>{section.data.length}</Text>
      )}
    </View>
  );

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const renderEvent = ({ item }: { item: Event }) => {
    const eventDay = startOfDay(new Date(item.startTimeISO));
    const isPastDay = isBefore(eventDay, today);

    return (
      <TactileEventCard
        event={item}
        onPress={() => handleEventPress(item.id)}
        isPast={isPastDay}
      />
    );
  };

  const renderEmptyComponent = (message: string, subtext: string) => (
    <View style={styles.emptyContainer}>
      <Text style={[styles.emptyText, dynamicStyles.emptyText]}>{message}</Text>
      <Text style={[styles.emptySubtext, dynamicStyles.emptySubtext]}>{subtext}</Text>
    </View>
  );

  const renderSectionFooter = ({ section }: { section: EventSection }) => {
    if (section.key === 'selected' && section.data.length === 0) {
      const isSelectedToday = isSameDay(startOfDay(selectedDate), today);
      return renderEmptyComponent(
        isSelectedToday ? 'No events today' : 'No events on this day',
        'Check back later or pick another day'
      );
    }
    if (section.key === 'upcoming' && section.data.length === 0) {
      return renderEmptyComponent(
        'No upcoming events this week',
        'Check back later or explore another day'
      );
    }
    if (section.key === 'past' && section.data.length === 0) {
      return renderEmptyComponent(
        'No past events this week',
        'Try another week to see past events'
      );
    }
    return null;
  };

  return (
    <SectionList
      sections={sections}
      renderItem={renderEvent}
      renderSectionHeader={renderSectionHeader}
      renderSectionFooter={renderSectionFooter}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
      stickySectionHeadersEnabled={false}
      scrollEnabled={false} // Disable internal scroll since we're in a parent ScrollView
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    // color removed
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    // color removed
    // backgroundColor removed
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    // color removed
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    // color removed
    textAlign: 'center',
    lineHeight: 20,
  },
});
