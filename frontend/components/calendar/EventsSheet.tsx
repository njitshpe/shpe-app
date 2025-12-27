import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { CalendarEvent } from '../../types/calendar.types';
import { calendarTheme } from '../../constants/calendarTheme';

interface EventsSheetProps {
  events: CalendarEvent[];
  visible: boolean;
  selectedDate: Date;
}

const { height: screenHeight } = Dimensions.get('window');

export const EventsSheet: React.FC<EventsSheetProps> = ({
  events,
  visible,
  selectedDate,
}) => {
  const translateY = useSharedValue(visible ? 0 : screenHeight);

  useEffect(() => {
    if (visible) {
      // Slide animation: down slightly, then up
      translateY.value = withSequence(
        withTiming(100, { duration: 150 }),
        withTiming(0, {
          duration: 200,
          easing: Easing.out(Easing.cubic),
        })
      );
    } else {
      translateY.value = withTiming(screenHeight, { duration: 200 });
    }
  }, [selectedDate, visible]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const renderEvent = ({ item }: { item: CalendarEvent }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventTimeContainer}>
        <Text style={styles.eventTime}>
          {item.startTime.toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true,
          })}
        </Text>
      </View>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle} numberOfLines={2}>
          {item.title}
        </Text>
        {item.location && (
          <Text style={styles.eventLocation} numberOfLines={1}>
            {item.location}
          </Text>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📅</Text>
      <Text style={styles.emptyText}>No events for this date</Text>
      <Text style={styles.emptySubtext}>
        Check back later or select another date
      </Text>
    </View>
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <FlatList
        data={events}
        renderItem={renderEvent}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={renderEmptyState}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: calendarTheme.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  eventCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    minHeight: 80,
  },
  eventTimeContainer: {
    marginRight: 16,
    justifyContent: 'center',
    minWidth: 60,
  },
  eventTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
  },
  eventDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  eventLocation: {
    fontSize: 14,
    color: '#6B7280',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});
