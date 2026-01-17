import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, useColorScheme } from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

export type BadgeType = 'student' | 'alumni' | 'guest';

interface Badge {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  points: number;
  color: string;
}

const BADGES: Record<BadgeType, Badge> = {
  student: {
    icon: 'settings',
    title: 'Rookie Gear',
    points: 50,
    color: '#D35400',
  },
  alumni: {
    icon: 'business',
    title: 'Legacy Member',
    points: 50,
    color: '#14B8A6',
  },
  guest: {
    icon: 'globe',
    title: 'Explorer',
    points: 50,
    color: '#8B5CF6',
  },
};

interface BadgeUnlockOverlayProps {
  visible: boolean;
  badgeType: BadgeType;
  onComplete: () => void;
  autoCompleteDelay?: number; // Optional: auto-dismiss after X ms (default: 3000)
}

export default function BadgeUnlockOverlay({
  visible,
  badgeType,
  onComplete,
  autoCompleteDelay = 3000,
}: BadgeUnlockOverlayProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const badge = BADGES[badgeType];

  useEffect(() => {
    if (visible && autoCompleteDelay > 0) {
      const timer = setTimeout(() => {
        onComplete();
      }, autoCompleteDelay);

      return () => clearTimeout(timer);
    }
  }, [visible, autoCompleteDelay, onComplete]);

  if (!visible) return null;

  const colors = {
    background: isDark ? 'rgba(15, 23, 42, 0.98)' : 'rgba(255, 255, 255, 0.98)',
    text: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
  };

  return (
    <Pressable style={styles.overlay} onPress={onComplete}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Confetti Background Effect */}
        <MotiView
          from={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 800, delay: 100 }}
          style={styles.confettiContainer}
        >
          {[...Array(12)].map((_, i) => (
            <MotiView
              key={i}
              from={{
                opacity: 0,
                translateY: 0,
                translateX: 0,
                rotate: '0deg',
              }}
              animate={{
                opacity: [0, 1, 1, 0],
                translateY: [-50, -100 - Math.random() * 100],
                translateX: [(Math.random() - 0.5) * 200],
                rotate: `${Math.random() * 360}deg`,
              }}
              transition={{
                type: 'timing',
                duration: 1500,
                delay: 400 + i * 50,
              }}
              style={[
                styles.confetti,
                {
                  left: `${(i / 12) * 100}%`,
                  backgroundColor: i % 3 === 0 ? badge.color : i % 3 === 1 ? '#FFD700' : '#FF6B9D',
                },
              ]}
            />
          ))}
        </MotiView>

        {/* Badge Icon with Bounce Animation */}
        <MotiView
          from={{ opacity: 0, scale: 0, rotate: '-180deg' }}
          animate={{ opacity: 1, scale: 1, rotate: '0deg' }}
          transition={{
            type: 'spring',
            damping: 8,
            stiffness: 100,
            mass: 0.5,
            delay: 200,
          }}
          style={[styles.badgeContainer, { backgroundColor: `${badge.color}20` }]}
        >
          <View style={[styles.badgeIconWrapper, { backgroundColor: badge.color }]}>
            <Ionicons name={badge.icon} size={64} color="#FFFFFF" />
          </View>
        </MotiView>

        {/* Badge Title */}
        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 600 }}
        >
          <Text style={[styles.title, { color: colors.text }]}>Badge Unlocked!</Text>
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 700 }}
        >
          <Text style={[styles.badgeName, { color: badge.color }]}>{badge.title}</Text>
        </MotiView>

        {/* Points Earned */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 500, delay: 800 }}
          style={[styles.pointsContainer, { borderColor: badge.color }]}
        >
          <Text style={[styles.pointsText, { color: badge.color }]}>
            +{badge.points} Points!
          </Text>
        </MotiView>

        {/* Enter HQ Button */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 400, delay: 1000 }}
        >
          <Pressable
            onPress={onComplete}
            style={[styles.button, { backgroundColor: badge.color }]}
          >
            <Text style={styles.buttonText}>Enter HQ</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </MotiView>

        {/* Tap to continue hint */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ type: 'timing', duration: 400, delay: 1200 }}
        >
          <Text style={[styles.hint, { color: colors.textSecondary }]}>
            Tap anywhere to continue
          </Text>
        </MotiView>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  confettiContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    height: 200,
  },
  confetti: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 2,
  },
  badgeContainer: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  badgeIconWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 10,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  badgeName: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  pointsContainer: {
    borderWidth: 2,
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    marginBottom: 40,
  },
  pointsText: {
    fontSize: 20,
    fontWeight: '700',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 16,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hint: {
    fontSize: 14,
    textAlign: 'center',
  },
});
