import { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView, AnimatePresence } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import * as DocumentPicker from 'expo-document-picker';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SPACING, RADIUS, SHADOWS } from '@/constants/colors';

export interface FormData {
  resumeFile: DocumentPicker.DocumentPickerAsset | null;
  linkedinUrl: string;
  portfolioUrl: string;
}

interface AssetsStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Profile Strength Bar (Monochrome)
// ─────────────────────────────────────────────────────────────────────────────
function ProfileStrengthBar({ percentage }: { percentage: number }) {
  const animatedWidth = useSharedValue(0);
  animatedWidth.value = withSpring(percentage, { damping: 15, stiffness: 100 });

  const animatedBarStyle = useAnimatedStyle(() => ({ width: `${animatedWidth.value}%` }));

  const getLabel = () => {
    if (percentage === 0) return 'Getting Started';
    if (percentage <= 33) return 'Building Up';
    if (percentage <= 66) return 'Looking Good';
    return 'Complete!';
  };

  const getColor = () => {
    if (percentage <= 33) return ['#333333', '#666666'] as const; // Dark Grey
    if (percentage <= 66) return ['#999999', '#CCCCCC'] as const; // Light Grey
    return ['#FFFFFF', '#E2E8F0'] as const; // Pure White
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: -10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400 }}
      style={styles.strengthContainer}
    >
      <View style={styles.strengthHeader}>
        <Text style={styles.strengthLabel}>Profile Strength</Text>
        <Text style={styles.strengthPercent}>{Math.round(percentage)}%</Text>
      </View>

      <View style={styles.strengthTrack}>
        <Animated.View style={[styles.strengthFillWrapper, animatedBarStyle]}>
          <LinearGradient colors={getColor()} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
      </View>

      <Text style={styles.strengthStatus}>{getLabel()}</Text>
    </MotiView>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Resume Card (Monochrome)
// ─────────────────────────────────────────────────────────────────────────────
function ResumeCard({ data, onPress }: { data: any; onPress: () => void }) {
  const isCompleted = !!data;
  
  return (
    <TouchableOpacity
      onPress={() => { Haptics.selectionAsync(); onPress(); }}
      activeOpacity={0.8}
      style={[
        styles.cardContainer,
        isCompleted && styles.cardCompleted
      ]}
    >
      <View style={[styles.iconBox, isCompleted && styles.iconBoxCompleted]}>
        <Ionicons 
          name={isCompleted ? "document-text" : "cloud-upload-outline"} 
          size={22} 
          color={isCompleted ? '#000000' : '#FFFFFF'} 
        />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.cardTitle}>Resume</Text>
        <Text style={[styles.cardSubtitle, isCompleted && { color: '#FFFFFF' }]}>
          {isCompleted ? data.name : "PDF • Max 5MB"}
        </Text>
      </View>

      <Ionicons 
        name={isCompleted ? "checkmark-circle" : "add-circle"} 
        size={24} 
        color={isCompleted ? '#FFFFFF' : 'rgba(255,255,255,0.2)'} 
      />
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// URL Input Card (Monochrome)
// ─────────────────────────────────────────────────────────────────────────────
function URLCard({ 
  icon, 
  title, 
  value, 
  placeholder, 
  onChange, 
  isExpanded, 
  onToggle,
  onFocusScroll 
}: any) {
  const isCompleted = !!value;
  const inputRef = useRef<TextInput>(null);

  if (isExpanded && inputRef.current) {
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  return (
    <View style={[
      styles.cardContainer, 
      isExpanded && styles.cardFocused,
      isCompleted && !isExpanded && styles.cardCompleted
    ]}>
      {/* Icon floats to the left */}
      <TouchableOpacity onPress={onToggle} style={[styles.iconBox, isCompleted && styles.iconBoxCompleted]}>
        <Ionicons 
          name={icon} 
          size={22} 
          color={isCompleted ? '#000000' : '#FFFFFF'} 
        />
      </TouchableOpacity>

      <View style={{ flex: 1, justifyContent: 'center' }}>
        <AnimatePresence exitBeforeEnter>
          {isExpanded ? (
            // EXPANDED STATE
            <MotiView
              key="input"
              from={{ opacity: 0, translateX: -10 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: -10 }}
              transition={{ type: 'timing', duration: 200 }}
              style={styles.inputWrapper}
            >
              <TextInput
                ref={inputRef}
                value={value}
                onChangeText={onChange}
                placeholder={placeholder}
                placeholderTextColor="rgba(255,255,255,0.3)"
                style={styles.textInput}
                autoCapitalize="none"
                keyboardType="url"
                autoCorrect={false}
                onFocus={onFocusScroll}
              />
              <TouchableOpacity onPress={onToggle} style={styles.closeBtn}>
                <Ionicons name="checkmark" size={18} color="#000" />
              </TouchableOpacity>
            </MotiView>
          ) : (
            // COLLAPSED STATE
            <MotiView
              key="label"
              from={{ opacity: 0, translateX: 10 }}
              animate={{ opacity: 1, translateX: 0 }}
              exit={{ opacity: 0, translateX: 10 }}
              transition={{ type: 'timing', duration: 200 }}
            >
              <TouchableOpacity onPress={onToggle} style={{ width: '100%' }}>
                <Text style={styles.cardTitle}>{title}</Text>
                <Text style={[styles.cardSubtitle, isCompleted && { color: '#FFFFFF' }]}>
                  {isCompleted ? value : "Not Linked"}
                </Text>
              </TouchableOpacity>
            </MotiView>
          )}
        </AnimatePresence>
      </View>

      {!isExpanded && (
        <TouchableOpacity onPress={onToggle}>
          <Ionicons 
            name={isCompleted ? "pencil" : "chevron-forward"} 
            size={20} 
            color="rgba(255,255,255,0.3)" 
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function AssetsStep({ data, update, onNext }: AssetsStepProps) {
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const [activeCard, setActiveCard] = useState<'linkedin' | 'portfolio' | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const calculateStrength = () => {
    let strength = 0;
    if (data.resumeFile) strength += 40;
    if (data.linkedinUrl?.trim()) strength += 30;
    if (data.portfolioUrl?.trim()) strength += 30;
    return strength;
  };

  const handlePickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
      if (!result.canceled && result.assets && result.assets.length > 0) {
        update({ resumeFile: result.assets[0] });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) { Alert.alert('Error', 'Failed to pick document.'); }
  };

  const handleNext = () => {
    if (isNavigating) return;

    const urlSchema = z.string().url().optional().or(z.literal(''));
    if (!urlSchema.safeParse(data.linkedinUrl).success || !urlSchema.safeParse(data.portfolioUrl).success) {
      Alert.alert("Invalid URL", "Please check your links.");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsNavigating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  const toggleCard = (card: 'linkedin' | 'portfolio') => {
    Haptics.selectionAsync();
    if (activeCard === card) {
      setActiveCard(null);
      Keyboard.dismiss();
    } else {
      setActiveCard(card);
    }
  };

  return (
    <View style={styles.outerContainer}>
      <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={() => { setActiveCard(null); Keyboard.dismiss(); }}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
          style={styles.keyboardView}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
        >
          
          <ScrollView 
            ref={scrollViewRef}
            contentContainerStyle={styles.scrollContent} 
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            
            <View style={styles.header}>
              <Text style={styles.title}>ASSETS</Text>
              <Text style={styles.subtitle}>Unlock your full profile strength.</Text>
            </View>

            <ProfileStrengthBar percentage={calculateStrength()} />

            <ResumeCard data={data.resumeFile} onPress={handlePickDocument} />

            <URLCard
              icon="logo-linkedin"
              title="LinkedIn"
              placeholder="https://linkedin.com/in/..."
              value={data.linkedinUrl}
              onChange={(t: string) => update({ linkedinUrl: t })}
              isExpanded={activeCard === 'linkedin'}
              onToggle={() => toggleCard('linkedin')}
              onFocusScroll={() => {}}
            />

            <URLCard
              icon="globe-outline"
              title="Portfolio"
              placeholder="https://yourportfolio.com"
              value={data.portfolioUrl}
              onChange={(t: string) => update({ portfolioUrl: t })}
              isExpanded={activeCard === 'portfolio'}
              onToggle={() => toggleCard('portfolio')}
              onFocusScroll={() => {
                setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
              }}
            />

          </ScrollView>

          {/* Footer */}
          <MotiView 
            from={{ translateY: 50, opacity: 0 }} 
            animate={{ translateY: 0, opacity: 1 }}
            style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
          >
            <TouchableOpacity onPress={handleNext} disabled={isNavigating} style={styles.button}>
              <LinearGradient
                colors={['#FFFFFF', '#E2E8F0']}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              >
                <Text style={styles.buttonText}>Next Step</Text>
                <Ionicons name="arrow-forward" size={20} color="#000" />
              </LinearGradient>
            </TouchableOpacity>
          </MotiView>

        </KeyboardAvoidingView>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { padding: SPACING.lg, paddingBottom: 140 },
  
  header: { marginBottom: SPACING.lg, marginTop: -20 },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  strengthContainer: { marginBottom: SPACING.xl, padding: 16, borderRadius: RADIUS.lg, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  strengthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  strengthLabel: { fontSize: 12, fontWeight: '700', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: 0.5 },
  strengthPercent: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  strengthTrack: { height: 6, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.1)', overflow: 'hidden' },
  strengthFillWrapper: { height: '100%', borderRadius: 10, overflow: 'hidden' },
  strengthStatus: { fontSize: 11, color: '#64748B', marginTop: 6, textAlign: 'right', fontWeight: '500' },

  cardContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.lg, marginBottom: 12,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    height: 72, paddingHorizontal: 16,
  },
  cardFocused: { borderColor: '#FFFFFF', backgroundColor: 'rgba(30, 41, 59, 0.8)' },
  cardCompleted: { borderColor: '#FFFFFF', backgroundColor: 'rgba(255, 255, 255, 0.1)' },
  
  iconBox: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
    marginRight: 16,
  },
  iconBoxCompleted: { backgroundColor: '#FFFFFF' },

  cardTitle: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  cardSubtitle: { fontSize: 13, color: '#94A3B8', marginTop: 2 },

  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  textInput: { flex: 1, color: '#FFF', fontSize: 16, height: '100%' },
  closeBtn: { padding: 8, backgroundColor: '#FFFFFF', borderRadius: 20, marginLeft: 8 },

  footer: { 
    paddingHorizontal: SPACING.lg, 
    position: 'absolute', bottom: 0, width: '100%',
  },
  button: { width: '100%', borderRadius: RADIUS.full, shadowOpacity: 0.3, elevation: 4 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderRadius: RADIUS.full },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.5 },
});
