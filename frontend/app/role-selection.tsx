import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { SHPE_COLORS, RADIUS } from '@/constants/colors';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MotiView } from 'moti';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedGridBackground } from '@/components/auth/AnimatedGridBackground';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Role = 'student' | 'alumni' | 'guest';

interface RoleOptionProps {
  id: Role;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  accentColor: string;
  isSelected: boolean;
  isAnySelected: boolean;
  onSelect: (role: Role) => void;
}

const RoleCard = ({
  id,
  title,
  subtitle,
  icon,
  accentColor,
  isSelected,
  isAnySelected,
  onSelect,
}: RoleOptionProps) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    const targetScale = isSelected ? 1.05 : isAnySelected ? 0.95 : 1;
    const targetOpacity = isAnySelected && !isSelected ? 0.3 : 1;

    return {
      transform: [{ scale: withSpring(scale.value * targetScale) }],
      opacity: withTiming(targetOpacity, { duration: 400 }),
    };
  });

  return (
    <Animated.View
      style={[styles.cardContainer, animatedStyle]}
    >
      <Pressable
        onPressIn={() => !isAnySelected && (scale.value = 0.97)}
        onPressOut={() => (scale.value = 1)}
        onPress={() => !isAnySelected && onSelect(id)}
        style={styles.pressable}
      >
        <View style={[styles.glassBackground, isSelected && { borderColor: accentColor, borderWidth: 1 }]}>
          {isSelected && (
            <View style={StyleSheet.absoluteFill}>
              <LinearGradient
                // FIX: Opacity moved into the color hex/rgba string
                colors={[`${accentColor}33`, 'transparent']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            </View>
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
  const insets = useSafeAreaInsets();
  const { user, updateUserMetadata, signOut, isLoading: authLoading } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Reset state on mount to prevent "glitchy" returns
  useEffect(() => {
    setSelectedRole(null);
    setIsProcessing(false);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const handleBack = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await signOut();
    // AuthGuard will handle the redirect, but we can also help it along
    router.replace('/(auth)/welcome');
  };

  const handleSelect = useCallback(async (role: Role) => {
    if (isProcessing || !user) return;

    setIsProcessing(true);
    setSelectedRole(role);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await updateUserMetadata({ user_type: role });

      setTimeout(() => {
        const routes = {
          student: '/onboarding',
          alumni: '/alumni-onboarding',
          guest: '/guest-onboarding',
        };

        router.replace(routes[role] as any);
      }, 800);
    } catch (error) {
      console.error('Role selection error:', error);
      setSelectedRole(null);
      setIsProcessing(false);
    }
  }, [user, updateUserMetadata, router, isProcessing]);

  if (!isReady || authLoading) {
    return <View style={{ flex: 1, backgroundColor: '#000' }} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Back Button */}
      <Pressable
        onPress={handleBack}
        style={[styles.backButton, { top: insets.top + 10 }]}
      >
        <Ionicons name="arrow-back" size={24} color="rgba(255,255,255,0.6)" />
      </Pressable>

      <View style={styles.backgroundLayer}>
        <AnimatedGridBackground />
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)', '#000']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 1000 }}
        style={styles.contentContainer}
      >
        <View style={styles.header}>
          <Text style={styles.superTitle}>WHO ARE YOU?</Text>
          <Text style={styles.subTitle}>Choose your path to customize your experience.</Text>
        </View>

        <View style={styles.listContainer}>
          <RoleCard
            id="student"
            title="Student"
            subtitle="Undergrad or Graduate at NJIT"
            icon="school-outline"
            accentColor={SHPE_COLORS.sunsetOrange}
            isSelected={selectedRole === 'student'}
            isAnySelected={selectedRole !== null}
            onSelect={handleSelect}
          />
          <RoleCard
            id="alumni"
            title="Alumni"
            subtitle="Working professional or graduate"
            icon="briefcase-outline"
            accentColor="#0D9488"
            isSelected={selectedRole === 'alumni'}
            isAnySelected={selectedRole !== null}
            onSelect={handleSelect}
          />
          <RoleCard
            id="guest"
            title="Guest"
            subtitle="Visiting from another org"
            icon="earth-outline"
            accentColor="#7C3AED"
            isSelected={selectedRole === 'guest'}
            isAnySelected={selectedRole !== null}
            onSelect={handleSelect}
          />
        </View>

        {isProcessing && (
          <MotiView
            from={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={styles.loadingWrapper}
          >
            <Text style={styles.loadingText}>PREPARING YOUR EXPERIENCE...</Text>
          </MotiView>
        )}
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  backgroundLayer: { ...StyleSheet.absoluteFillObject, opacity: 0.6 },
  contentContainer: { flex: 1, paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 40 },
  superTitle: { fontSize: 12, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 2, marginBottom: 8 },
  subTitle: { fontSize: 32, fontWeight: '700', color: '#FFF', lineHeight: 38 },
  listContainer: { gap: 16 },
  cardContainer: { width: '100%' },
  pressable: { borderRadius: 24, overflow: 'hidden' },
  glassBackground: {
    flexDirection: 'row', alignItems: 'center', padding: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.6)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)', borderRadius: 24,
  },
  iconContainer: { width: 52, height: 52, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  textContainer: { flex: 1 },
  cardTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginBottom: 4 },
  cardSubtitle: { fontSize: 14, color: 'rgba(255,255,255,0.5)' },
  actionIcon: { marginLeft: 12 },
  loadingWrapper: { marginTop: 32, alignItems: 'center' },
  loadingText: { color: 'rgba(255,255,255,0.3)', fontSize: 10, fontWeight: '800', letterSpacing: 2 },
  backButton: {
    position: 'absolute',
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 12,
  },
});
