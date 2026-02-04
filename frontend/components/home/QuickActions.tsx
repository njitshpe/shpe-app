import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '@/constants/colors';
import { useTheme } from '@/contexts/ThemeContext';

const ACTIONS = [
  // 1. Check In (Green - Access)
  { id: 'check-in', label: 'CHECK IN', icon: 'qr-code', color: '#32D74B' },

  // 2. My Events (Blue - Schedule)
  { id: 'my-events', label: 'MY EVENTS', icon: 'calendar', color: '#0A84FF' },

  // 3. Alerts (Red - Notification)
  { id: 'alerts', label: 'ALERTS', icon: 'notifications', color: '#FF453A' },

  // 4. Ranking (Gold - Achievement)
  { id: 'rank', label: 'RANKING', icon: 'trophy', color: '#FFD700' },

];

interface QuickActionsProps {
  onPress: (route: string) => void;
  unreadCount?: number;
}

export function QuickActions({ onPress, unreadCount = 0 }: QuickActionsProps) {
  const { theme, isDark } = useTheme();

  const getRoute = (id: string) => {
    switch(id) {
      case 'check-in': return '/check-in';
      case 'my-events': return '/my-events';
      case 'rank': return '/(tabs)/leaderboard';
      case 'alerts': return '/notifications';
      default: return '/';
    }
  };

  const gradientColors = isDark
    ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as const
    : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.01)'] as const;

  return (
    <View style={styles.container}>
      <Text style={[styles.header, { color: theme.subtext }]}>QUICK ACCESS</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {ACTIONS.map((action) => (
          <TouchableOpacity
            key={action.id}
            activeOpacity={0.8}
            onPress={() => onPress(getRoute(action.id))}
          >
            <LinearGradient
              colors={gradientColors}
              style={[styles.card, { borderColor: theme.border }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Icon Halo with dynamic color tint */}
              <View style={[styles.iconHalo, { backgroundColor: `${action.color}20` }]}>
                <Ionicons name={action.icon as any} size={24} color={action.color} />
                {action.id === 'alerts' && unreadCount > 0 && (
                  <View style={styles.alertsBadge}>
                    <Text style={styles.alertsBadgeText}>
                      {unreadCount > 99 ? '99+' : unreadCount}
                    </Text>
                  </View>
                )}
              </View>
              <Text style={[styles.cardLabel, { color: theme.text }]}>{action.label}</Text>
            </LinearGradient>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -30,
    marginBottom: 30,
  },
  header: {
    fontSize: 11,
    fontWeight: '700',
    marginLeft: SPACING.lg,
    marginBottom: SPACING.md,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    gap: 12,
  },
  card: {
    width: 130,
    height: 90,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    gap: 10,
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  alertsBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  alertsBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
    lineHeight: 12,
  },
});
