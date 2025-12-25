import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface EventCardProps {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  location: string;
  type: 'Career' | 'Social' | 'Workshop' | 'General';
  onPress: () => void;
}

export function EventCard({
  title,
  startTime,
  location,
  type,
  onPress,
}: EventCardProps) {
  // Format date and time for display
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
    return `${dateStr} • ${timeStr}`;
  };

  // Get badge color based on event type
  const getBadgeColor = (eventType: string) => {
    switch (eventType) {
      case 'Career':
        return '#3B82F6'; // Blue
      case 'Social':
        return '#10B981'; // Green
      case 'Workshop':
        return '#F59E0B'; // Amber
      case 'General':
        return '#6B7280'; // Gray
      default:
        return '#6B7280';
    }
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <View style={[styles.badge, { backgroundColor: getBadgeColor(type) }]}>
          <Text style={styles.badgeText}>{type}</Text>
        </View>
      </View>

      <View style={styles.details}>
        <Text style={styles.detailText}>📅 {formatDateTime(startTime)}</Text>
        <Text style={styles.detailText}>📍 {location}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginRight: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  details: {
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
