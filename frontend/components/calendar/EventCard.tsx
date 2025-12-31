import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format } from 'date-fns';

interface EventCardProps {
  id: string;
  title: string;
  startTime: Date;
  location?: string;
  onPress: () => void;
  timeLabel?: string;
}

export const EventCard: React.FC<EventCardProps> = ({
  title,
  startTime,
  location,
  onPress,
  timeLabel,
}) => {
  const timeString = timeLabel ?? format(startTime, 'h:mm a');

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{timeString}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={styles.titleText} numberOfLines={2}>
          {title}
        </Text>
        {location && (
          <Text style={styles.locationText} numberOfLines={1}>
            {location}
          </Text>
        )}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  containerPressed: {
    opacity: 0.7,
  },
  timeContainer: {
    marginRight: 16,
    paddingTop: 2,
    minWidth: 70,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  detailsContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
    lineHeight: 22,
  },
  locationText: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
});
