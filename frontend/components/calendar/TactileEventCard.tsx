import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isAfter, isBefore } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types/events';
import { NEON_COLORS } from '@/constants';

interface TactileEventCardProps {
  event: Event;
  onPress: () => void;
  onRegister?: () => void;
  onNavigate?: () => void;
  onChat?: () => void;
  isPast?: boolean;
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CARD_HEIGHT = SCREEN_HEIGHT * 0.45; // 45% of screen height (~350px on most phones)

export const TactileEventCard: React.FC<TactileEventCardProps> = ({
  event,
  onPress,
  onRegister,
  onNavigate: onCamera,
  onChat,
  isPast,
}) => {
  const [scaleAnim] = useState(new Animated.Value(1));
  const startTime = new Date(event.startTimeISO);
  const endTime = new Date(event.endTimeISO);
  const now = new Date();

  // Determine event status
  const isLive = isAfter(now, startTime) && isBefore(now, endTime);
  const isPastByTime = isAfter(now, endTime);
  const showPastOverlay = isPast ?? isPastByTime;

  const timeString = format(startTime, 'h:mm a');
  const dayOfWeek = format(startTime, 'EEE').toUpperCase(); // "FRI", "SAT", etc.

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const handleActionPress = (action?: () => void) => {
    if (action) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      action();
    }
  };

  // Default fallback image if no cover image provided
  const imageSource = event.coverImageUrl
    ? { uri: event.coverImageUrl }
    : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=600&fit=crop' };

  return (
    <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
      <Pressable
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        {/* Background Image */}
        <ImageBackground
          source={imageSource}
          style={styles.imageBackground}
          imageStyle={styles.image}
        >
          {/* Dark gradient overlay for text readability */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          >
            {/* Day badge in top-left corner */}
            <View style={styles.dayBadge}>
              <Text style={styles.dayText}>{dayOfWeek}</Text>
            </View>

            {/* Live indicator - Red Light success state */}
            {isLive && (
              <View style={styles.liveIndicator}>
                <View style={styles.pulseDot} />
                <Text style={styles.liveText}>LIVE</Text>
              </View>
            )}

            {/* Event info at bottom */}
            <View style={styles.contentContainer}>
              {/* Time */}
              <Text style={styles.timeText}>{timeString}</Text>

              {/* Title */}
              <Text style={styles.titleText} numberOfLines={2}>
                {event.title}
              </Text>

              {/* Location */}
              {event.locationName && (
                <View style={styles.locationRow}>
                  <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.locationText} numberOfLines={1}>
                    {event.locationName}
                  </Text>
                </View>
              )}

              {/* Quick action buttons */}
              <View style={styles.actionFooter}>
                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleActionPress(onRegister)}
                  disabled={!onRegister}
                >
                  <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionText}>Register</Text>
                </Pressable>

                <View style={styles.actionDivider} />

                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleActionPress(onCamera)}
                  disabled={!onCamera}
                >
                  <Ionicons name="camera-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionText}>Check-In</Text>
                </Pressable>

                <View style={styles.actionDivider} />

                <Pressable
                  style={styles.actionButton}
                  onPress={() => handleActionPress(onCamera)}
                  disabled={!onCamera}
                >
                  <Ionicons name="navigate-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.actionText}>Map</Text>
                </Pressable>
              </View>
            </View>
          </LinearGradient>
          {showPastOverlay && <View style={styles.pastOverlay} pointerEvents="none" />}
        </ImageBackground>
      </Pressable>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    marginBottom: 20,
  },
  card: {
    width: '100%',
    height: CARD_HEIGHT,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#000',
    // Strong shadow for depth
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
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
  liveIndicator: {
    position: 'absolute',
    top: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: NEON_COLORS.red,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 6,
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  liveText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  contentContainer: {
    gap: 8,
  },
  timeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.95,
    letterSpacing: 0.3,
  },
  titleText: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 34,
    letterSpacing: -0.5,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  locationText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    opacity: 0.9,
    flex: 1,
  },
  actionFooter: {
    flexDirection: 'row',
    marginTop: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  actionDivider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  pastOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(156, 163, 175, 0.35)',
  },
});
