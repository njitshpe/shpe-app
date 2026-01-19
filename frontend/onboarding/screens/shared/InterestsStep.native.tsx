import { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import * as Notifications from 'expo-notifications';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  interpolateColor,
  Easing,
  cancelAnimation,
  useDerivedValue,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SPACING, RADIUS, TYPOGRAPHY } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Data: Split into 3 distinct rows for the "Stream" effect
const ROW_1 = [
  { id: 'professional-dev', label: 'Professional Dev' },
  { id: 'academic-support', label: 'Academic Support' },
  { id: 'mental-health', label: 'Mental Health' },
  { id: 'social-events', label: 'Social Events' },
];

const ROW_2 = [
  { id: 'tech-workshops', label: 'Tech Workshops' },
  { id: 'community-service', label: 'Community Service' },
  { id: 'networking', label: 'Networking' },
  { id: 'career-fairs', label: 'Career Fairs' },
];

const ROW_3 = [
  { id: 'leadership', label: 'Leadership' },
  { id: 'hackathons', label: 'Hackathons' },
  { id: 'research', label: 'Research' },
  { id: 'entrepreneurship', label: 'Startup / Biz' },
];

const interestsSchema = z.object({
  interests: z.array(z.string()).min(1, 'Select at least 1 interest'),
  phoneNumber: z.string().trim().regex(/^\d{10}$/).optional().or(z.literal('')),
});

export interface FormData {
  interests: string[];
  phoneNumber: string;
}

interface InterestsStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Snappy Bubble (No Bounce, Just Fade)
// ─────────────────────────────────────────────────────────────────────────────
function InterestBubble({ label, isSelected, onPress }: { label: string, isSelected: boolean, onPress: () => void }) {
  // Use derived value for extremely responsive updates (no waiting for spring to settle)
  const progress = useDerivedValue(() => {
    return withTiming(isSelected ? 1 : 0, { duration: 150, easing: Easing.out(Easing.quad) });
  });

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: interpolateColor(
        progress.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.05)', '#FFFFFF']
      ),
      borderColor: interpolateColor(
        progress.value,
        [0, 1],
        ['rgba(255, 255, 255, 0.1)', '#FFFFFF']
      ),
      transform: [{ scale: withTiming(isSelected ? 1.05 : 1, { duration: 150 }) }]
    };
  });

  const textStyle = useAnimatedStyle(() => ({
    color: interpolateColor(
      progress.value,
      [0, 1],
      ['#94A3B8', '#000000']
    ),
  }));

  return (
    <Animated.View style={[bubbleStyles.wrapper, animatedStyle]}>
      <Pressable 
        onPress={() => {
          Haptics.selectionAsync();
          onPress();
        }}
        style={bubbleStyles.pressable}
      >
        <Animated.Text style={[bubbleStyles.label, textStyle]}>
          {label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const bubbleStyles = StyleSheet.create({
  wrapper: {
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginHorizontal: 6, // Spacing between bubbles in the stream
    overflow: 'hidden',
  },
  pressable: {
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT: Marquee Row (Infinite Scroll)
// ─────────────────────────────────────────────────────────────────────────────
function MarqueeRow({ items, selectedIds, onToggle, speed = 20000, direction = 'left' }: any) {
  const translateX = useSharedValue(0);
  
  // Create a looped list (A + A) to fake infinity
  const list = [...items, ...items, ...items]; 

  useEffect(() => {
    const toValue = direction === 'left' ? -1000 : 1000; // Arbitrary large distance
    
    translateX.value = withRepeat(
      withTiming(toValue, { duration: speed, easing: Easing.linear }),
      -1, // Infinite
      false // No reverse
    );
    
    return () => cancelAnimation(translateX);
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <View style={marqueeStyles.rowContainer}>
      <Animated.View style={[marqueeStyles.row, animatedStyle]}>
        {list.map((item: any, index: number) => (
          <InterestBubble
            key={`${item.id}-${index}`}
            label={item.label}
            isSelected={selectedIds.includes(item.id)}
            onPress={() => onToggle(item.id)}
          />
        ))}
      </Animated.View>
    </View>
  );
}

const marqueeStyles = StyleSheet.create({
  rowContainer: {
    height: 60, // Fixed height for row
    width: '100%',
    overflow: 'hidden', // Clip the overflow
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'absolute', // Allows free movement
    left: 0, 
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function InterestsStep({ data, update, onNext }: InterestsStepProps) {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [focusedInput, setFocusedInput] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const selectedIds = data.interests ?? [];
  const selectedCount = selectedIds.length;

  const handleToggleInterest = useCallback((interestId: string) => {
    const isSelected = selectedIds.includes(interestId);
    const updated = isSelected
      ? selectedIds.filter((id) => id !== interestId)
      : [...selectedIds, interestId];
    
    update({ interests: updated });
    setError(null);
  }, [selectedIds, update]);

  const handleNext = async () => {
    if (isNavigating) return;

    if (selectedIds.length === 0) {
      setError('Please select at least 1 interest.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsNavigating(true);
    setError(null);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  const isNextDisabled = selectedCount === 0;

  return (
    <View style={styles.outerContainer}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          
          {/* Header */}
          <MotiView 
            from={{ opacity: 0, translateY: 10 }}
            animate={{ opacity: 1, translateY: 0 }}
            style={styles.header}
          >
            <Text style={styles.title}>YOUR INTERESTS</Text>
            <Text style={styles.subtitle}>Select what matters to you.</Text>
          </MotiView>

          {error && <Text style={styles.errorText}>{error}</Text>}

          {/* MARQUEE STREAM ZONE */}
          <MotiView 
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 100 }}
            style={styles.streamZone}
          >
            {/* Row 1: Slow Left */}
            <MarqueeRow 
              items={ROW_1} 
              selectedIds={selectedIds} 
              onToggle={handleToggleInterest} 
              speed={24000} 
              direction="left" 
            />
            
            {/* Row 2: Medium Left (Offset speed makes it look organic) */}
            <MarqueeRow 
              items={ROW_2} 
              selectedIds={selectedIds} 
              onToggle={handleToggleInterest} 
              speed={29000} 
              direction="left" 
            />

            {/* Row 3: Slow Left */}
            <MarqueeRow 
              items={ROW_3} 
              selectedIds={selectedIds} 
              onToggle={handleToggleInterest} 
              speed={27000} 
              direction="left" 
            />
          </MotiView>

          {/* Divider */}
          <View style={styles.divider} />

          {/* Phone Input */}
          <View style={styles.phoneSection}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>PHONE NUMBER</Text>
              <View style={styles.badge}><Text style={styles.badgeText}>OPTIONAL</Text></View>
            </View>
            
            <View style={[styles.phoneInputContainer, focusedInput && { borderColor: '#FFFFFF', backgroundColor: 'rgba(30, 41, 59, 0.8)' }]}>
              <Text style={[styles.prefix, focusedInput && { color: '#FFFFFF' }]}>+1</Text>
              <View style={styles.vertDivider} />
              <TextInput
                value={data.phoneNumber}
                onChangeText={(t) => update({ phoneNumber: t.replace(/\D/g, '') })}
                onFocus={() => setFocusedInput(true)}
                onBlur={() => setFocusedInput(false)}
                placeholder="(123) 456-7890"
                placeholderTextColor="rgba(255,255,255,0.3)"
                keyboardType="phone-pad"
                style={styles.input}
              />
            </View>
            <Text style={styles.helperText}>Used only for important SHPE updates.</Text>
          </View>

        </ScrollView>

        {/* Footer */}
        <MotiView 
          from={{ translateY: 50, opacity: 0 }} 
          animate={{ translateY: 0, opacity: 1 }}
          style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
        >
          <TouchableOpacity onPress={handleNext} disabled={isNextDisabled || isNavigating} style={[styles.button, (isNextDisabled || isNavigating) && styles.buttonDisabled]}>
            <LinearGradient
              colors={isNextDisabled ? ['#333333', '#1A1A1A'] : ['#FFFFFF', '#E2E8F0']}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            >
              <Text style={[styles.buttonText, isNextDisabled && { color: '#666666' }]}>Next Step</Text>
              <Ionicons name="arrow-forward" size={20} color={isNextDisabled ? '#666666' : '#000000'} />
            </LinearGradient>
          </TouchableOpacity>
        </MotiView>

      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  scrollContent: { paddingBottom: 120 },
  
  header: { paddingHorizontal: SPACING.lg, marginTop: SPACING.md, marginBottom: SPACING.md },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  errorText: { color: '#FF6B6B', textAlign: 'center', marginBottom: 10, fontSize: 13, fontWeight: '600' },

  streamZone: { marginVertical: SPACING.sm }, // The Marquee Area
  counterContainer: { alignItems: 'center', marginTop: SPACING.sm },
  counterText: { color: '#94A3B8', fontSize: 12, fontWeight: '600', letterSpacing: 1 },

  divider: { height: 1, backgroundColor: 'rgba(255,255,255,0.1)', marginVertical: SPACING.md, marginHorizontal: SPACING.lg },

  phoneSection: { paddingHorizontal: SPACING.lg },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 11, fontWeight: '700', color: '#64748B', letterSpacing: 1 },
  badge: { backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 9, fontWeight: '700', color: '#94A3B8' },

  phoneInputContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.lg, height: 56, overflow: 'hidden'
  },
  prefix: { paddingHorizontal: 16, fontSize: 16, fontWeight: '600', color: '#94A3B8' },
  vertDivider: { width: 1, height: 20, backgroundColor: 'rgba(255,255,255,0.1)', marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#FFF', height: '100%' },
  helperText: { fontSize: 12, color: '#64748B', marginTop: 8 },

  footer: { paddingHorizontal: SPACING.lg },
  button: { borderRadius: RADIUS.full, shadowColor: '#FFFFFF', shadowOpacity: 0.15, shadowRadius: 10, elevation: 4 },
  buttonDisabled: { shadowOpacity: 0, elevation: 0 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderRadius: RADIUS.full },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.5 },
});