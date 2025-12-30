import React from 'react';
import { View, Text, StyleSheet, Pressable, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfDay } from 'date-fns';
import { useRouter } from 'expo-router';
import { Event } from '@/data/mockEvents';

interface WeeklyEventGridProps {
  events: Event[]; // All events for the week
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_WIDTH_PERCENT = 0.95; // 95% of screen width
const CARD_HEIGHT_PERCENT = 0.45; // 45% of screen height
const CARD_WIDTH = SCREEN_WIDTH * CARD_WIDTH_PERCENT;
const CARD_HEIGHT = SCREEN_HEIGHT * CARD_HEIGHT_PERCENT;
const CARD_SPACING = 20;

export const WeeklyEventGrid: React.FC<WeeklyEventGridProps> = ({ events }) => {
  const router = useRouter();

  const handleEventPress = (eventId: string) => {
    router.push(`/event/${eventId}`);
  };

  if (events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>📅</Text>
        <Text style={styles.emptyText}>No events this week</Text>
        <Text style={styles.emptySubtext}>Check back later or explore other weeks</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {events.map((event, index) => {
        const eventDate = new Date(event.startTimeISO);
        const dayOfWeek = format(eventDate, 'EEE').toUpperCase(); // "FRI", "SAT", etc.
        const timeString = format(eventDate, 'h:mm a');

        return (
          <Pressable
            key={event.id}
            style={({ pressed }) => [
              styles.card,
              pressed && styles.cardPressed,
            ]}
            onPress={() => handleEventPress(event.id)}
          >
            <ImageBackground
              source={
                event.coverImageUrl
                  ? { uri: event.coverImageUrl }
                  : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop' }
              }
              style={styles.imageBackground}
              imageStyle={styles.image}
            >
              {/* Gradient overlay */}
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
                style={styles.gradient}
              >
                {/* Day badge in top-left corner */}
                <View style={styles.dayBadge}>
                  <Text style={styles.dayText}>{dayOfWeek}</Text>
                </View>

                {/* Event info at bottom */}
                <View style={styles.infoContainer}>
                  <Text style={styles.timeText}>{timeString}</Text>
                  <Text style={styles.titleText} numberOfLines={3}>
                    {event.title}
                  </Text>
                  {event.locationName && (
                    <Text style={styles.locationText} numberOfLines={2}>
                      {event.locationName}
                    </Text>
                  )}
                  {event.description && (
                    <Text style={styles.descriptionText} numberOfLines={2}>
                      {event.description}
                    </Text>
                  )}
                </View>
              </LinearGradient>
            </ImageBackground>
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    paddingVertical: CARD_SPACING,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    marginBottom: CARD_SPACING,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  cardPressed: {
    opacity: 0.95,
    transform: [{ scale: 0.98 }],
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  image: {
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
  },
  dayText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: 0.8,
  },
  infoContainer: {
    gap: 6,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    letterSpacing: 0.3,
  },
  titleText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.85,
    lineHeight: 20,
  },
  descriptionText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#FFFFFF',
    opacity: 0.75,
    lineHeight: 18,
    marginTop: 4,
  },
  emptyContainer: {
    flex: 1,
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
