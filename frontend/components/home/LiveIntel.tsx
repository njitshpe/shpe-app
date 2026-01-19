import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SPACING, RADIUS } from '@/constants/colors';

interface LiveIntelProps {
  title: string;
  message: string;
  onPress?: () => void;
}

export function LiveIntel({ title, message, onPress }: LiveIntelProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.sectionHeader}>LIVE INTEL</Text>
      
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        <LinearGradient
          // Subtle Red/Orange tint for "Alert" feel, fading to black
          colors={['rgba(255, 69, 58, 0.15)', 'rgba(255, 69, 58, 0.02)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.card}
        >
          <View style={styles.iconColumn}>
            <View style={styles.iconHalo}>
              <Ionicons name="megaphone" size={20} color="#FF453A" />
            </View>
          </View>

          <View style={styles.textColumn}>
            <Text style={styles.title}>{title.toUpperCase()}</Text>
            <Text style={styles.message} numberOfLines={2}>
              {message}
            </Text>
          </View>

          <Ionicons name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
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
    borderColor: 'rgba(255, 69, 58, 0.3)', // Red border accent
    gap: 16,
  },
  iconColumn: {
    justifyContent: 'center',
  },
  iconHalo: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 69, 58, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textColumn: {
    flex: 1,
    gap: 4,
  },
  title: {
    color: '#FF453A', // System Red
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