import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format, isBefore, startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { Event } from '@/types/events';
import { EventCard } from './EventCard';

interface PastEventsListProps {
  events: Event[];
}

export const PastEventsList: React.FC<PastEventsListProps> = ({ events }) => {
  const router = useRouter();
  const today = startOfDay(new Date());

  const pastEvents = useMemo(() => {
    return events
      .filter((event) => {
        const eventDay = startOfDay(new Date(event.startTimeISO));
        return isBefore(eventDay, today);
      })
      .sort((a, b) => {
        return new Date(b.startTimeISO).getTime() - new Date(a.startTimeISO).getTime();
      });
  }, [events, today]);

  if (pastEvents.length === 0) {
    return null;
  }

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Past Events</Text>
        <Text style={styles.sectionCount}>{pastEvents.length}</Text>
      </View>
      {pastEvents.map((event) => {
        const startTime = new Date(event.startTimeISO);
        const timeLabel = format(startTime, 'MMM d · h:mm a');

        return (
          <EventCard
            key={event.id}
            id={event.id}
            title={event.title}
            startTime={startTime}
            timeLabel={timeLabel}
            location={event.locationName}
            onPress={() => handleEventPress(event.id)}
          />
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sectionCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
});
