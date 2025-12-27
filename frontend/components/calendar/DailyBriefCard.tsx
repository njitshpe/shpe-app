import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { format } from 'date-fns';
import { Event } from '../../data/mockEvents';

interface DailyBriefCardProps {
  selectedDate: Date;
  weekEvents: Event[]; // All events for the week
  userName?: string;
}

const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
};

export const DailyBriefCard: React.FC<DailyBriefCardProps> = ({
  selectedDate,
  weekEvents,
  userName = 'Friend',
}) => {
  const greeting = getGreeting();

  // Generate summary text for the week
  const eventCount = weekEvents.length;
  let summaryText = '';

  if (eventCount === 0) {
    summaryText = 'Your schedule is clear this week. Time to explore or relax!';
  } else if (eventCount === 1) {
    const event = weekEvents[0];
    const eventDate = format(new Date(event.startTimeISO), 'EEEE');
    const time = format(new Date(event.startTimeISO), 'h:mm a');
    summaryText = `You have ${event.title} on ${eventDate} at ${time}.`;
  } else {
    const firstEvent = weekEvents[0];
    const eventDate = format(new Date(firstEvent.startTimeISO), 'EEEE');
    const time = format(new Date(firstEvent.startTimeISO), 'h:mm a');
    summaryText = `You have ${eventCount} events this week, starting with ${firstEvent.title} on ${eventDate} at ${time}.`;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>
        {greeting}, {userName}
      </Text>
      <Text style={styles.summary}>{summaryText}</Text>
      {eventCount > 0 && (
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{eventCount}</Text>
            <Text style={styles.statLabel}>{eventCount === 1 ? 'Event' : 'Events'} this week</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  greeting: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  summary: {
    fontSize: 16,
    fontWeight: '400',
    color: '#1F2937',
    lineHeight: 24,
  },
  statsRow: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
