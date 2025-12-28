import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { format, isSameDay, isSameMonth, isAfter, isBefore, startOfDay } from 'date-fns';
import { Event } from '../../data/mockEvents';
import { EventCard } from './EventCard';
import { useRouter } from 'expo-router';

interface EventsSheetProps {
  events: Event[];
  selectedDate: Date;
}

export const EventsSheet: React.FC<EventsSheetProps> = ({
  events,
  selectedDate,
}) => {
  const router = useRouter();
  const now = new Date();

  // Filter events for selected date (only upcoming)
  const selectedDateEvents = useMemo(() => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTimeISO);
      const eventStartDay = startOfDay(eventStart);
      const selectedDay = startOfDay(selectedDate);

      // Must be same day and not in the past
      return (
        isSameDay(eventStartDay, selectedDay) &&
        (isAfter(eventStart, now) || isSameDay(eventStart, now))
      );
    }).sort((a, b) => {
      return new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime();
    });
  }, [events, selectedDate, now]);

  // Filter events for the same month (upcoming only, sorted chronologically)
  const monthEvents = useMemo(() => {
    return events.filter((event) => {
      const eventStart = new Date(event.startTimeISO);

      // Must be in same month and upcoming
      return (
        isSameMonth(eventStart, selectedDate) &&
        (isAfter(eventStart, now) || isSameDay(startOfDay(eventStart), startOfDay(now)))
      );
    }).sort((a, b) => {
      return new Date(a.startTimeISO).getTime() - new Date(b.startTimeISO).getTime();
    });
  }, [events, selectedDate, now]);

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  const renderSectionHeader = (title: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionHeaderText}>{title}</Text>
    </View>
  );

  const renderEvent = (event: Event) => (
    <EventCard
      key={event.id}
      id={event.id}
      title={event.title}
      startTime={new Date(event.startTimeISO)}
      location={event.locationName}
      onPress={() => handleEventPress(event.id)}
    />
  );

  // Show empty state if no events for selected date
  if (selectedDateEvents.length === 0) {
    const formattedDate = format(selectedDate, 'MMMM d, yyyy');

    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyIcon}>📅</Text>
          <Text style={styles.emptyTitle}>No events for {formattedDate}</Text>
          <Text style={styles.emptySubtext}>
            Check back later or select another date
          </Text>
        </View>

        {/* Still show upcoming month events even if selected date has none */}
        {monthEvents.length > 0 && (
          <>
            {renderSectionHeader(`Upcoming this ${format(selectedDate, 'MMMM')}`)}
            {monthEvents.map(renderEvent)}
          </>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={selectedDateEvents}
        renderItem={({ item }) => renderEvent(item)}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={() =>
          renderSectionHeader(`Events on ${format(selectedDate, 'MMMM d')}`)
        }
        ListFooterComponent={
          monthEvents.length > selectedDateEvents.length ? (
            <>
              {renderSectionHeader(`More events this ${format(selectedDate, 'MMMM')}`)}
              {monthEvents
                .filter(e => !selectedDateEvents.find(se => se.id === e.id))
                .map(renderEvent)}
            </>
          ) : null
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionHeader: {
    marginBottom: 12,
    marginTop: 8,
  },
  sectionHeaderText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
