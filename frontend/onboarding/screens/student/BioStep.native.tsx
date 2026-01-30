import { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform, 
  Keyboard 
} from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SPACING, RADIUS } from '@/constants/colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const MAX_BIO_LENGTH = 140;

export default function BioStep({ data, update, onNext }: any) {
  const insets = useSafeAreaInsets();
  const [isFocused, setIsFocused] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const characterCount = data.bio?.length ?? 0;
  const remainingChars = MAX_BIO_LENGTH - characterCount;

  const handleNext = () => {
    if (isNavigating) return;

    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.outerContainer}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
    >
      <TouchableOpacity
        style={styles.contentContainer}
        activeOpacity={1}
        onPress={Keyboard.dismiss}
      >
          {/* Main Content - Centered */}
            <MotiView 
              from={{ opacity: 0, scale: 0.95 }} 
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'timing', duration: 500 }}
              style={{ width: '100%', paddingHorizontal: SPACING.lg }}
            >
              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>YOUR PITCH</Text>
                <Text style={styles.subtitle}>Introduce yourself to others.</Text>
              </View>

              {/* Glass Text Area */}
              <View style={[
                styles.glassContainer, 
                isFocused && styles.glassFocused,
                remainingChars < 0 && styles.glassError
              ]}>
                <TextInput
                  value={data.bio}
                  onChangeText={(t) => update({ bio: t })}
                  onFocus={() => setIsFocused(true)}
                  onBlur={() => setIsFocused(false)}
                  placeholder="I am proud to be hispanic and a student at NJIT..."
                  placeholderTextColor="rgba(255,255,255,0.3)"
                  multiline
                  style={styles.input}
                  maxLength={MAX_BIO_LENGTH + 20}
                />
                
                {/* Character Counter */}
                <View style={styles.counterRow}>
                  <Text style={[
                    styles.counterText, 
                    remainingChars < 10 && { color: '#FBBF24' }, // Yellow warning
                    remainingChars < 0 && { color: '#F87171' }   // Red error
                  ]}>
                    {remainingChars}
                  </Text>
                </View>
              </View>

              {/* Inspiration Chips */}
              <View style={styles.chipsContainer}>
                <Text style={styles.chipsLabel}>IDEAS:</Text>
                <View style={styles.chipsRow}>
                  {['🎓 Major & Goals', '🚀 Projects', '🌟 Fun Fact'].map((label, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipText}>{label}</Text>
                    </View>
                  ))}
                </View>
              </View>

            </MotiView>
      </TouchableOpacity>

      {/* Footer - Pushed to bottom via Flexbox, moves with Keyboard */}
      <MotiView
        from={{ translateY: 50, opacity: 0 }}
        animate={{ translateY: 0, opacity: 1 }}
        style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}
      >
        <TouchableOpacity onPress={handleNext} disabled={isNavigating} style={styles.button}>
          <LinearGradient
            colors={remainingChars < 0 ? ['#333333', '#1A1A1A'] : ['#FFFFFF', '#E2E8F0']}
            style={styles.gradientButton}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          >
            <Text style={[styles.buttonText, remainingChars < 0 && { color: '#666666' }]}>
              {data.bio ? 'Next Step' : 'Skip for now'}
            </Text>
            <Ionicons 
              name="arrow-forward" 
              size={20} 
              color={remainingChars < 0 ? '#666666' : '#000000'} 
            />
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outerContainer: { flex: 1 },
  keyboardView: { flex: 1 },
  
  contentContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  header: { marginBottom: SPACING.lg },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },

  glassContainer: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderRadius: RADIUS.xl,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    padding: SPACING.md,
    minHeight: 160,
  },
  glassFocused: { 
    borderColor: '#FFFFFF', 
    backgroundColor: 'rgba(30, 41, 59, 0.7)' 
  },
  glassError: { borderColor: '#F87171' },
  
  input: { flex: 1, fontSize: 18, color: '#FFF', lineHeight: 26, textAlignVertical: 'top' },
  
  counterRow: { alignItems: 'flex-end', marginTop: 8 },
  counterText: { color: '#64748B', fontWeight: '700', fontSize: 12 },

  chipsContainer: { marginTop: SPACING.lg },
  chipsLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  chipsRow: { flexDirection: 'row', gap: 8 },
  chip: { backgroundColor: 'rgba(255,255,255,0.05)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 100 },
  chipText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },

  footer: { 
    width: '100%', 
    paddingHorizontal: SPACING.lg, 
    paddingTop: SPACING.xl,
  },
  button: { width: '100%', borderRadius: RADIUS.full, shadowOpacity: 0.3, elevation: 4 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderRadius: RADIUS.full },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#000000', letterSpacing: 0.5 },
});