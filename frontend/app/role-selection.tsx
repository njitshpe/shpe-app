import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useColorScheme,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { SHPE_COLORS } from '@/constants/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  FadeInDown,
  FadeOut,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur'; // Ensure you have expo-blur installed
import { AnimatedGridBackground } from '@/components/auth/AnimatedGridBackground'; // Import your grid

const { width } = Dimensions.get('window');

type Role = 'student' | 'alumni' | 'guest';

const SELECTION_DELAY = 1000;

interface RoleOptionProps {
  id: Role;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  isSelected: boolean;
  isAnySelected: boolean;
  onSelect: (role: Role) => void;
  index: number;
}

// --- GLASS CARD COMPONENT ---
const RoleCard = ({
  id,
  title,
  subtitle,
  icon,
  accentColor,
  isSelected,
  isAnySelected,
  onSelect,
  index,
}: RoleOptionProps) => {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    // Focus Logic: If selected, grow. If not selected but something else is, shrink & fade.
    const targetScale = isSelected ? 1.05 : isAnySelected ? 0.95 : 1;
    const targetOpacity = isAnySelected && !isSelected ? 0.3 : 1;

    return {
      transform: [{ scale: withSpring(scale.value * targetScale) }],
      opacity: withTiming(targetOpacity, { duration: 400 }),
    };
  });

  const handlePressIn = () => {
    if (isAnySelected) return;
    Haptics.selectionAsync();
    scale.value = 0.97;
  };

  const handlePressOut = () => {
    if (isAnySelected) return;
    scale.value = 1;
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(300 + index * 100).springify()}
      style={[styles.cardContainer, animatedStyle]}
    >
      <Pressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => !isAnySelected && onSelect(id)}
        style={styles.pressable}
      >
        {/* Glass Effect Background */}
        <View style={[styles.glassBackground, isSelected && { borderColor: accentColor, borderWidth: 1 }]}>
          {/* If selected, fill with gradient */}
          {isSelected && (
            <Animated.View entering={FadeInDown} style={StyleSheet.absoluteFill}>
              <LinearGradient
                colors={[accentColor, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
                opacity={0.2}
              />
            </Animated.View>
          )}

          <View style={[styles.iconContainer, { backgroundColor: isSelected ? accentColor : 'rgba(255,255,255,0.08)' }]}>
            <Ionicons 
              name={icon} 
              size={28} 
              color={isSelected ? '#FFF' : accentColor} 
            />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.cardTitle}>{title}</Text>
            <Text style={styles.cardSubtitle}>{subtitle}</Text>
          </View>

          {/* Minimal Arrow or Check */}
          <View style={styles.actionIcon}>
             {isSelected ? (
                <Ionicons name="checkmark-circle" size={24} color={accentColor} />
             ) : (
                <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.2)" />
             )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
};

export default function RoleSelectionScreen() {
  const router = useRouter();
  const { user, updateUserMetadata } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);

  // Modern Dark Theme Palette
  const colors = {
    student: SHPE_COLORS.sunsetOrange, // #FF5733
    alumni: '#0D9488', // Teal
    guest: '#7C3AED',  // Purple
  };

  const handleSelect = useCallback((role: Role) => {
    setSelectedRole(role);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    setTimeout(async () => {
      if (user) await updateUserMetadata({ user_type: role });
      
      if (role === 'student') router.replace('/onboarding');
      else if (role === 'alumni') router.replace('/alumni-onboarding');
      else if (role === 'guest') router.replace('/guest-onboarding');
    }, SELECTION_DELAY);
  }, [user, updateUserMetadata, router]);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* 1. IMMERSIVE BACKGROUND */}
      <View style={styles.backgroundLayer}>
        <AnimatedGridBackground />
        {/* Dark overlay to ensure text legibility */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* 2. CONTENT LAYER */}
      <View style={styles.contentContainer}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Animated.Text 
            entering={FadeInDown.delay(100).springify()}
            style={styles.superTitle}
          >
            WHO ARE YOU?
          </Animated.Text>
          <Animated.Text 
            entering={FadeInDown.delay(200).springify()}
            style={styles.subTitle}
          >
            Choose your path to customize your experience.
          </Animated.Text>
        </View>

        {/* CARDS LIST */}
        <View style={styles.listContainer}>
          <RoleCard
            id="student"
            index={0}
            title="Student"
            subtitle="Undergrad or Graduate at NJIT"
            icon="school-outline"
            accentColor={colors.student}
            isSelected={selectedRole === 'student'}
            isAnySelected={selectedRole !== null}
            onSelect={handleSelect}
          />

          <RoleCard
            id="alumni"
            index={1}
            title="Alumni"
            subtitle="Working professional or graduate"
            icon="briefcase-outline"
            accentColor={colors.alumni}
            isSelected={selectedRole === 'alumni'}
            isAnySelected={selectedRole !== null}
            onSelect={handleSelect}
          />

          <RoleCard
            id="guest"
            index={2}
            title="Guest"
            subtitle="Visiting from another org"
            icon="earth-outline"
            accentColor={colors.guest}
            isSelected={selectedRole === 'guest'}
            isAnySelected={selectedRole !== null}
            onSelect={handleSelect}
          />
        </View>

        {/* SPACER */}
        <View style={{ height: 40 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000', // Deep black base
  },
  backgroundLayer: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.6, // Dim the grid slightly so it doesn't fight the text
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    zIndex: 10,
  },
  header: {
    marginBottom: 40,
    marginTop: 60,
  },
  superTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  subTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FFF',
    letterSpacing: -0.5,
    lineHeight: 38,
  },
  listContainer: {
    gap: 16,
  },
  // CARD STYLES
  cardContainer: {
    width: '100%',
  },
  pressable: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  glassBackground: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.6)', // Glassy dark
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 20, // Squircle
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.5)',
    fontWeight: '500',
  },
  actionIcon: {
    marginLeft: 12,
  },
});