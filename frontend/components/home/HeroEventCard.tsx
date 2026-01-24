import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions, FlatList, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Event {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  location: string;
  flyer?: string | null;
  image_url?: string | null;
  is_registered?: boolean;
}

interface HeroEventCardProps {
  events: Event[];
  onPress: (eventId: string) => void;
  onAction: (eventId: string, action: 'check-in' | 'rsvp') => void;
}

export function HeroEventCard({ events, onPress, onAction }: HeroEventCardProps) {
  const { theme, isDark } = useTheme();
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef<FlatList<Event>>(null);

  // Theme-aware colors
  const gradientColors = isDark
    ? ['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)', '#000000'] as const
    : ['transparent', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0.85)', '#F7FAFF'] as const;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollPosition = event.nativeEvent.contentOffset.x;
    const index = Math.round(scrollPosition / SCREEN_WIDTH);
    setActiveIndex(index);
  };

  const renderEventCard = ({ item: event }: { item: Event }) => {
    const now = new Date();
    const start = new Date(event.start_time);
    const end = new Date(event.end_time);
    const isHappeningNow = now >= start && now <= end;

    const imageSource = event.flyer
      ? { uri: event.flyer }
      : event.image_url
      ? { uri: event.image_url }
      : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?q=80&w=2070&auto=format&fit=crop' };

    return (
      <View style={styles.cardWrapper}>
        <TouchableOpacity activeOpacity={0.98} onPress={() => onPress(event.id)}>
          <ImageBackground
            source={imageSource}
            style={styles.imageBackground}
            resizeMode="cover"
          >
            <LinearGradient
              colors={gradientColors}
              locations={[0, 0.4, 0.65, 1]}
              style={styles.gradient}
            >
              <View style={styles.content}>
                <Text style={[styles.metadata, { color: isDark ? '#cdcdcd' : '#666666' }]}>
                  {isHappeningNow ? (
                    <Text style={{color: theme.success}}>● HAPPENING NOW</Text>
                  ) : (
                    <>UPCOMING • <Text style={{color: theme.text}}>{start.toLocaleDateString()}</Text></>
                  )}
                </Text>

                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                  {event.title.toUpperCase()}
                </Text>

                <TouchableOpacity
                  onPress={() => onAction(event.id, isHappeningNow ? 'check-in' : 'rsvp')}
                  activeOpacity={0.8}
                >
                  <BlurView intensity={40} tint={isDark ? "dark" : "light"} style={[
                    styles.glassButton,
                    { borderColor: isHappeningNow ? theme.success : (isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.3)') }
                  ]}>
                    <View style={[
                      styles.buttonContent,
                      { backgroundColor: isDark ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)' },
                      isHappeningNow && { backgroundColor: isDark ? 'rgba(52, 199, 89, 0.2)' : 'rgba(52, 199, 89, 0.3)' }
                    ]}>
                      <Text style={[styles.buttonText, { color: theme.text }]}>
                        {isHappeningNow ? 'SCAN QR CODE' : event.is_registered ? 'VIEW TICKET' : 'RSVP NOW'}
                      </Text>
                    </View>
                  </BlurView>
                </TouchableOpacity>

                <Text style={[styles.footerText, { color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)' }]}>
                  {event.location}
                </Text>

                <View style={styles.carouselDots}>
                  {events.map((_, index) => (
                    <View
                      key={index}
                      style={[
                        styles.dot,
                        { backgroundColor: isDark ? '#ffffff33' : '#00000033' },
                        index === activeIndex && [styles.activeDot, { backgroundColor: isDark ? '#c2c2c2' : '#555555' }],
                      ]}
                    />
                  ))}
                </View>

              </View>
            </LinearGradient>
          </ImageBackground>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <FlatList
        ref={flatListRef}
        data={events}
        renderItem={renderEventCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.65,
    width: '100%',
  },
  cardWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.70,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 70, // Push content up for Quick Actions
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    gap: 12,
  },
  metadata: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
  },
  carouselDots: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 24,
  },
  glassButton: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
  },
  buttonContent: {
    paddingHorizontal: 32,
    paddingVertical: 14,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});