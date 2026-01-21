import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS } from '@/constants/colors';

interface AnnouncementsProps {
  title: string;
  message: string;
  onPress?: () => void;
}

export function Announcements({ title, message, onPress }: AnnouncementsProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>ANNOUNCEMENTS</Text>
      
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <LinearGradient
          // Subtle yellow fade tint for "Alert" feel, fading to black
          colors={['rgba(212, 175, 55, 0.18)', 'rgba(212, 175, 55, 0.05)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          <View style={styles.iconColumn}>
            <View style={styles.iconHalo}>
              <Ionicons name="megaphone" size={20} color="#D4AF37" />
            </View>
          </View>

          <View style={styles.textColumn}>
            <Text style={styles.title}>{title.toUpperCase()}</Text>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color="rgba(212,175,55,0.3)" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.lg,
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: SPACING.md,
    textTransform: 'uppercase',
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55,0.3)', // border accent
    gap: 16,
  },
  iconColumn: {
    justifyContent: 'center',
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212, 175, 55, 0.2)', // subtle gold tint
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#D4AF37', 
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  message: {
    color: '#FFF',
    fontSize: 13,
    lineHeight: 18,
    fontWeight: '500',
  },
});