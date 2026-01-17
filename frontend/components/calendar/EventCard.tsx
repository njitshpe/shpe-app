import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme, isDark } = useTheme();
  const timeString = timeLabel ?? format(startTime, 'h:mm a');

  const dynamicStyles = {
    container: {
      backgroundColor: theme.card,
      shadowColor: isDark ? '#000' : '#000',
    },
    timeText: { color: theme.subtext },
    titleText: { color: theme.text },
    locationText: { color: theme.subtext },
  };

  return (
    <Pressable
      style={({ pressed }) => [
        styles.container,
        dynamicStyles.container,
        pressed && styles.containerPressed,
      ]}
      onPress={onPress}
    >
      <View style={styles.timeContainer}>
        <Text style={[styles.timeText, dynamicStyles.timeText]}>{timeString}</Text>
      </View>
      <View style={styles.detailsContainer}>
        <Text style={[styles.titleText, dynamicStyles.titleText]} numberOfLines={2}>
          {title}
        </Text>
        {location && (
          <Text style={[styles.locationText, dynamicStyles.locationText]} numberOfLines={1}>
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
    // backgroundColor removed
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    // color removed
  },
  detailsContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    // color removed
    marginBottom: 4,
    lineHeight: 22,
  },
  locationText: {
    fontSize: 14,
    // color removed
    lineHeight: 20,
  },
});
