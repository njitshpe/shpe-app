import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

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
  event: Event;
  onPress: () => void;
  onAction: (action: 'check-in' | 'rsvp') => void;
}

export function HeroEventCard({ event, onPress, onAction }: HeroEventCardProps) {
  const { theme } = useTheme();

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
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.98} onPress={onPress}>
        <ImageBackground
          source={imageSource}
          style={styles.imageBackground}
          resizeMode="cover"
        >
          {/* Deep Void Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.8)', '#000000']}
            locations={[0, 0.4, 0.75, 1]}
            style={styles.gradient}
          >
            <View style={styles.content}>
              
              {/* Metadata */}
              <Text style={styles.metadata}>
                {isHappeningNow ? (
                  <Text style={{color: '#34C759'}}>● HAPPENING NOW</Text>
                ) : (
                  <>UPCOMING • <Text style={{color: '#FFF'}}>{start.toLocaleDateString()}</Text></>
                )}
              </Text>

              {/* Title */}
              <Text style={styles.title} numberOfLines={2}>
                {event.title.toUpperCase()}
              </Text>

              {/* Carousel Dots (Aesthetic) */}
              <View style={styles.carouselDots}>
                <View style={[styles.dot, styles.activeDot]} />
                <View style={styles.dot} />
                <View style={styles.dot} />
              </View>

              {/* CTA Button */}
              <TouchableOpacity
                onPress={() => onAction(isHappeningNow ? 'check-in' : 'rsvp')}
                activeOpacity={0.8}
              >
                <BlurView intensity={40} tint="dark" style={[
                  styles.glassButton,
                  isHappeningNow && { borderColor: '#34C759' } // Green border if live
                ]}>
                  <View style={[
                    styles.buttonContent,
                    isHappeningNow && { backgroundColor: 'rgba(52, 199, 89, 0.2)' }
                  ]}>
                    <Text style={styles.buttonText}>
                      {isHappeningNow ? 'SCAN QR CODE' : event.is_registered ? 'VIEW TICKET' : 'RSVP NOW'}
                    </Text>
                  </View>
                </BlurView>
              </TouchableOpacity>

              {/* Footer */}
              <Text style={styles.footerText}>
                {event.location}
              </Text>

            </View>
          </LinearGradient>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: SCREEN_HEIGHT * 0.75,
    width: '100%',
    backgroundColor: '#000',
  },
  imageBackground: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 50, // Push content up for Quick Actions
    paddingHorizontal: 24,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  metadata: {
    color: '#cdcdcd',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFF',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 36,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
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
    backgroundColor: '#ffffff33',
  },
  activeDot: {
    backgroundColor: '#c2c2c2', // Gold active dot
    width: 24, // Elongated active dot
  },
  glassButton: {
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  buttonContent: {
    paddingHorizontal: 40,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  footerText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});