import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

interface FeedHeaderProps {
  onCreatePost: () => void;
}

export function FeedHeader({ onCreatePost }: FeedHeaderProps) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <BlurView 
        intensity={80} 
        tint={isDark ? 'dark' : 'light'} 
        style={StyleSheet.absoluteFill} 
      />
      
      <View style={styles.content}>
        <Text style={[styles.title, { color: theme.text }]}>COMMUNITY</Text>
        
        <TouchableOpacity 
          onPress={onCreatePost} 
          activeOpacity={0.7}
          style={[styles.createButton, { borderColor: theme.border }]}
        >
          <Ionicons name="add" size={24} color={theme.text} />
        </TouchableOpacity>
      </View>

      {/* Subtle Bottom Border */}
      <View style={[styles.border, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 100,
    overflow: 'hidden',
  },
  content: {
    height: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 2,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  border: {
    height: 1,
    width: '100%',
  },
});