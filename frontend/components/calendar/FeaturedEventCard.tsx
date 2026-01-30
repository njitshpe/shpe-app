import React from 'react';
import { View, Text, StyleSheet, Pressable, Image, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Event } from '@/types/events';

interface FeaturedEventCardProps {
  event: Event;
  onPress: () => void;
  onLongPress?: () => void;
}

export const FeaturedEventCard: React.FC<FeaturedEventCardProps> = ({
  event,
  onPress,
  onLongPress,
}) => {
  const startTime = new Date(event.startTimeISO);
  const timeString = format(startTime, 'h:mm a');
  const dateString = format(startTime, 'EEEE, MMMM d');

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onLongPress?.();
  };

  return (
    <View style={styles.container}>
      <View style={styles.badge}>
        <Ionicons name="star" size={12} color="#FFFFFF" />
        <Text style={styles.badgeText}>Must-Attend</Text>
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.card,
          pressed && styles.cardPressed,
        ]}
        onPress={onPress}
        onLongPress={handleLongPress}
      >
        <ImageBackground
          source={
            event.coverImageUrl
              ? { uri: event.coverImageUrl }
              : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop' } // Default gradient background
          }
          style={styles.imageBackground}
          imageStyle={styles.image}
        >
          {/* Gradient overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          >
            <View style={styles.content}>
              <View style={styles.header}>
                <View style={styles.timeContainer}>
                  <Ionicons name="time-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.timeText}>{timeString}</Text>
                </View>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {event.locationName}
                  </Text>
                </View>
              </View>

              <Text style={styles.title} numberOfLines={2}>
                {event.title}
              </Text>
              <Text style={styles.date}>{dateString}</Text>
            </View>
          </LinearGradient>
        </ImageBackground>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 20,
    marginVertical: 12,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.95)', // Red badge
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
  },
  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  imageBackground: {
    width: '100%',
    height: 280,
  },
  image: {
    resizeMode: 'cover',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 16,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  locationText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  date: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.8,
  },
});
