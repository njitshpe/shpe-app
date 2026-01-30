import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, RADIUS, SHADOWS } from '@/constants/colors';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_GAP = 16;
const CARD_WIDTH = (SCREEN_WIDTH - SPACING.lg * 2 - CARD_GAP) / 2;

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface FormData {
  firstName: string;
  lastName: string;
  university: string;
  major: string;
  graduationYear: string;
  profilePhoto: ImagePicker.ImagePickerAsset | null;
  intent: string;
}

interface GuestIntentStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Intent Options
// ─────────────────────────────────────────────────────────────────────────────
const INTENT_OPTIONS: readonly { id: string; icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
  { id: 'recruiter', icon: 'briefcase', label: 'Recruiter / Industry' },
  { id: 'student_other', icon: 'school', label: 'Visiting Student' },
  { id: 'family', icon: 'heart', label: 'Family & Friends' },
  { id: 'other', icon: 'ellipsis-horizontal', label: 'Just Browsing' },
];

// ─────────────────────────────────────────────────────────────────────────────
// Glass Card Component
// ─────────────────────────────────────────────────────────────────────────────
function IntentCard({
  id,
  icon,
  label,
  isSelected,
  onPress,
  index,
}: {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  isSelected: boolean;
  onPress: () => void;
  index: number;
}) {
  return (
    <MotiView
      from={{ opacity: 0, scale: 0.9, translateY: 20 }}
      animate={{ opacity: 1, scale: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 400, delay: index * 100 }}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.8}
        style={[
          cardStyles.container,
          isSelected && cardStyles.containerSelected,
        ]}
      >
        <View style={cardStyles.iconContainer}>
          <Ionicons
            name={icon}
            size={32}
            color={isSelected ? '#FFFFFF' : '#94A3B8'}
          />
        </View>
        <Text
          style={[cardStyles.label, isSelected && cardStyles.labelSelected]}
          numberOfLines={2}
        >
          {label}
        </Text>
        {isSelected && (
          <MotiView
            from={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'timing', duration: 200 }}
            style={cardStyles.checkBadge}
          >
            <Ionicons name="checkmark" size={14} color="#000" />
          </MotiView>
        )}
      </TouchableOpacity>
    </MotiView>
  );
}

const cardStyles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    height: CARD_WIDTH * 0.9,
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.md,
    ...SHADOWS.medium,
  },
  containerSelected: {
    borderColor: '#FFFFFF',
    borderWidth: 2,
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  labelSelected: {
    color: '#FFFFFF',
  },
  checkBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export default function GuestIntentStep({
  data,
  update,
  onNext,
}: GuestIntentStepProps) {
  const insets = useSafeAreaInsets();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleSelectIntent = useCallback(
    (intentId: string) => {
      Haptics.selectionAsync();
      update({ intent: intentId });
    },
    [update]
  );

  const handleNext = useCallback(() => {
    if (isNavigating) return;
    if (!data.intent) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setIsNavigating(true);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  }, [isNavigating, data.intent, onNext]);

  const isNextDisabled = !data.intent;

  return (
    <View style={styles.outerContainer}>
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: 500 }}
        style={styles.container}
      >
        {/* Header */}
        <MotiView
          from={{ opacity: 0, translateY: 10 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ delay: 100 }}
          style={styles.header}
        >
          <Text style={styles.title}>WELCOME</Text>
          <Text style={styles.subtitle}>Tell us a bit about yourself.</Text>
        </MotiView>

        {/* Selection Grid */}
        <View style={styles.gridContainer}>
          <View style={styles.gridRow}>
            {INTENT_OPTIONS.slice(0, 2).map((option, index) => (
              <IntentCard
                key={option.id}
                id={option.id}
                icon={option.icon}
                label={option.label}
                isSelected={data.intent === option.id}
                onPress={() => handleSelectIntent(option.id)}
                index={index}
              />
            ))}
          </View>
          <View style={styles.gridRow}>
            {INTENT_OPTIONS.slice(2, 4).map((option, index) => (
              <IntentCard
                key={option.id}
                id={option.id}
                icon={option.icon}
                label={option.label}
                isSelected={data.intent === option.id}
                onPress={() => handleSelectIntent(option.id)}
                index={index + 2}
              />
            ))}
          </View>
        </View>
      </MotiView>

      {/* Footer */}
      <MotiView
        from={{ translateY: 50, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        transition={{ delay: 400 }}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        <TouchableOpacity
          onPress={handleNext}
          disabled={isNextDisabled || isNavigating}
          activeOpacity={0.8}
          style={[
            styles.button,
            (isNextDisabled || isNavigating) && styles.buttonDisabled,
          ]}
        >
          <LinearGradient
            colors={isNextDisabled ? ['#333333', '#1A1A1A'] : ['#FFFFFF', '#E2E8F0']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text
              style={[
                styles.buttonText,
                isNextDisabled && { color: '#666666' },
              ]}
            >
              Next Step
            </Text>
            <Ionicons
              name="arrow-forward"
              size={20}
              color={isNextDisabled ? '#666666' : '#000000'}
            />
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    paddingHorizontal: SPACING.lg,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 4,
    fontWeight: '500',
  },
  gridContainer: {
    gap: CARD_GAP,
  },
  gridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  helperText: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: SPACING.xl,
  },
  footer: {
    paddingTop: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  button: {
    borderRadius: RADIUS.full,
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    borderRadius: RADIUS.full,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
    letterSpacing: 0.5,
  },
});
