import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING } from '@/constants/colors';

const ACTIONS = [
  // 1. Check In (Green - Access)
  { id: 'check-in', label: 'CHECK IN', icon: 'qr-code', color: '#32D74B' },
  
  // 2. Alerts (Red - Notification) - Moved here
  { id: 'alerts', label: 'ALERTS', icon: 'notifications', color: '#FF453A' },
  
  // 3. Calendar (Blue - Schedule)
  { id: 'calendar', label: 'CALENDAR', icon: 'calendar', color: '#0A84FF' },
  
  // 4. Ranking (Gold - Achievement)
  { id: 'rank', label: 'RANKING', icon: 'trophy', color: '#FFD700' },
  
];

interface QuickActionsProps {
  onPress: (route: string) => void;
}

export function QuickActions({ onPress }: QuickActionsProps) {
  
  const getRoute = (id: string) => {
    switch(id) {
      case 'check-in': return '/check-in';
      case 'calendar': return '/(tabs)/calendar';
      case 'rank': return '/(tabs)/leaderboard';
      case 'alerts': return '/notifications';
      default: return '/';
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>QUICK ACCESS</Text>
      
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
              colors={['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)']}
              style={styles.card}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {/* Icon Halo with dynamic color tint */}
              <View style={[styles.iconHalo, { backgroundColor: `${action.color}20` }]}> 
                <Ionicons name={action.icon as any} size={24} color={action.color} />
              </View>
              <Text style={styles.cardLabel}>{action.label}</Text>
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
    color: 'rgba(255,255,255,0.6)',
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
    borderColor: 'rgba(255,255,255,0.1)',
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
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
});
