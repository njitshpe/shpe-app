import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

type NavTab = 'today' | 'explore' | 'studio';

interface FloatingNavigationProps {
  activeTab?: NavTab;
  onTabChange?: (tab: NavTab) => void;
  onTodayPress?: () => void;
  onExplorePress?: () => void;
  onStudioPress?: () => void;
}

export const FloatingNavigation: React.FC<FloatingNavigationProps> = ({
  activeTab = 'today',
  onTabChange,
  onTodayPress,
  onExplorePress,
  onStudioPress,
}) => {
  const [selected, setSelected] = useState<NavTab>(activeTab);

  const handleTabPress = (tab: NavTab) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelected(tab);
    onTabChange?.(tab);

    // Call individual handlers
    switch (tab) {
      case 'today':
        onTodayPress?.();
        break;
      case 'explore':
        onExplorePress?.();
        break;
      case 'studio':
        onStudioPress?.();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <BlurView intensity={80} tint="light" style={styles.blurContainer}>
        <View style={styles.pillContainer}>
          {/* Today Tab */}
          <Pressable
            style={[styles.tab, selected === 'today' && styles.tabActive]}
            onPress={() => handleTabPress('today')}
          >
            <Ionicons
              name={selected === 'today' ? 'today' : 'today-outline'}
              size={20}
              color={selected === 'today' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.tabText, selected === 'today' && styles.tabTextActive]}>
              Today
            </Text>
          </Pressable>

          {/* Explore Tab */}
          <Pressable
            style={[styles.tab, selected === 'explore' && styles.tabActive]}
            onPress={() => handleTabPress('explore')}
          >
            <Ionicons
              name={selected === 'explore' ? 'compass' : 'compass-outline'}
              size={20}
              color={selected === 'explore' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.tabText, selected === 'explore' && styles.tabTextActive]}>
              Explore
            </Text>
          </Pressable>

          {/* Studio Tab */}
          <Pressable
            style={[styles.tab, selected === 'studio' && styles.tabActive]}
            onPress={() => handleTabPress('studio')}
          >
            <Ionicons
              name={selected === 'studio' ? 'grid' : 'grid-outline'}
              size={20}
              color={selected === 'studio' ? '#FFFFFF' : '#6B7280'}
            />
            <Text style={[styles.tabText, selected === 'studio' && styles.tabTextActive]}>
              Studio
            </Text>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 40 : 24,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 100,
  },
  blurContainer: {
    borderRadius: 32,
    overflow: 'hidden',
    // Glassmorphism shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  pillContainer: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)', // Glassmorphism tint
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    gap: 8,
    minWidth: 100,
  },
  tabActive: {
    backgroundColor: '#111827',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
