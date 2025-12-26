import React from 'react';
import { View, Text, StyleSheet, Image, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FloatingIconButton } from '../ui/FloatingIconButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

interface CalendarHeaderProps {
  coverImageUrl?: string;
  logoUrl?: string;
  title: string;
  subtitle: string;
  onSubscribe?: () => void;
  onBack?: () => void;
}

export function CalendarHeader({
  coverImageUrl,
  title,
  subtitle,
  onSubscribe,
  onBack,
}: CalendarHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      {/* Hero Cover Image with Gradient Scrim */}
      <View style={styles.coverContainer}>
        {coverImageUrl ? (
          <Image source={{ uri: coverImageUrl }} style={styles.coverImage} />
        ) : (
          <View style={[styles.coverImage, styles.placeholderCover]} />
        )}

        {/* Dark Gradient Scrim Overlay */}
        <LinearGradient
          colors={['rgba(11, 18, 32, 0)', 'rgba(11, 18, 32, 0.85)']}
          style={styles.gradientScrim}
        />

        {/* Floating Top Controls */}
        <View style={[styles.topControls, { paddingTop: insets.top + 8 }]}>
          <FloatingIconButton
            icon={<Ionicons name="arrow-back" size={20} color="#F9FAFB" />}
            onPress={onBack}
          />

          <View style={styles.topRightControls}>
            <FloatingIconButton
              icon={<Ionicons name="search" size={20} color="#F9FAFB" />}
              onPress={() => console.log('Search')}
            />
            <FloatingIconButton
              icon={<Ionicons name="ellipsis-horizontal" size={20} color="#F9FAFB" />}
              onPress={() => console.log('More')}
            />
          </View>
        </View>

        {/* Organizer Logo Avatar (overlapping) */}
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>SHPE</Text>
          </View>
        </View>
      </View>

      {/* Organizer Info Block */}
      <View style={styles.infoContainer}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>

        {/* Subscribe Button */}
        <Pressable
          style={({ pressed }) => [
            styles.subscribeButton,
            pressed && styles.subscribeButtonPressed,
          ]}
          onPress={onSubscribe}
        >
          <Text style={styles.subscribeText}>Subscribe</Text>
        </Pressable>

        {/* Social Icons Row */}
        <View style={styles.socialIcons}>
          <Pressable style={styles.socialIcon}>
            <Ionicons name="globe-outline" size={18} color="#6B7280" />
          </Pressable>
          <Pressable style={styles.socialIcon}>
            <Ionicons name="logo-instagram" size={18} color="#6B7280" />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  coverContainer: {
    position: 'relative',
    height: 220,
    marginBottom: 44,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  placeholderCover: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gradientScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '70%',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  topRightControls: {
    flexDirection: 'row',
    gap: 10,
  },
  logoContainer: {
    position: 'absolute',
    bottom: -36,
    left: 20,
  },
  logo: {
    width: 72,
    height: 72,
    borderRadius: 14,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#0A0F1C',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  infoContainer: {
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 18,
    lineHeight: 21,
  },
  subscribeButton: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 16,
  },
  subscribeButtonPressed: {
    opacity: 0.65,
  },
  subscribeIcon: {
    marginRight: 6,
  },
  subscribeText: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '600',
  },
  socialIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  socialIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
