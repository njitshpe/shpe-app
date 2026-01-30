import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { MotiView } from 'moti';
import { LinearGradient } from 'expo-linear-gradient';
import { z } from 'zod';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { SPACING, RADIUS } from '@/constants/colors';
import SearchableSelectionModal from '../../components/SearchableSelectionModal';
import { GlassInput } from '../../components/OnboardingComponents';
import { UNIVERSITIES } from '@/constants/universities';

const affiliationSchema = z.object({
  university: z.string().min(2, 'Organization name is required'),
  major: z.string().min(2, 'Role/Title is required'),
});

interface GuestAffiliationStepProps {
  data: {
    university: string;
    major: string;
  };
  update: (fields: Partial<{ university: string; major: string }>) => void;
  onNext: () => void;
}

export default function GuestAffiliationStep({ data, update, onNext }: GuestAffiliationStepProps) {
  const insets = useSafeAreaInsets();
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [isUniversityModalVisible, setIsUniversityModalVisible] = useState(false);

  const handleNext = () => {
    if (isNavigating) return;
    const result = affiliationSchema.safeParse(data);
    if (!result.success) {
      setError(result.error.issues[0].message);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    setIsNavigating(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onNext();
    setTimeout(() => setIsNavigating(false), 2000);
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.content}>
        <MotiView from={{ opacity: 0, translateY: 20 }} animate={{ opacity: 1, translateY: 0 }}>
          <View style={styles.header}>
            <Text style={styles.title}>AFFILIATION</Text>
            <Text style={styles.subtitle}>Where are you visiting from?</Text>
          </View>

          {error && <Text style={styles.errorText}>{error}</Text>}

          <GlassInput
            label="ORGANIZATION / SCHOOL"
            value={data.university}
            placeholder="Select Organization / School"
            icon="business"
            readOnly
            onPress={() => setIsUniversityModalVisible(true)}
          />

          <GlassInput
            label="ROLE / TITLE"
            value={data.major}
            onChangeText={(t: string) => update({ major: t })}
            placeholder="e.g. Recruiter, Student"
            icon="id-card"
          />
        </MotiView>

        <SearchableSelectionModal
          visible={isUniversityModalVisible}
          onClose={() => setIsUniversityModalVisible(false)}
          onSelect={(u) => update({ university: u })}
          options={UNIVERSITIES}
          title="Select Organization / School"
        />
      </View>

      <MotiView from={{ translateY: 50, opacity: 0 }} animate={{ translateY: 0, opacity: 1 }} style={[styles.footer, { paddingBottom: insets.bottom + SPACING.md }]}>
        <TouchableOpacity onPress={handleNext} disabled={isNavigating} style={styles.button}>
          <LinearGradient colors={['#FFFFFF', '#E2E8F0']} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={styles.buttonText}>Next Step</Text>
            <Ionicons name="arrow-forward" size={20} color="#000" />
          </LinearGradient>
        </TouchableOpacity>
      </MotiView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: SPACING.lg, justifyContent: 'center' },
  header: { marginBottom: SPACING.xl },
  title: { fontSize: 24, fontWeight: '800', color: '#FFF', letterSpacing: 1 },
  subtitle: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  errorText: { color: '#FF6B6B', marginBottom: 16, fontSize: 13 },
  footer: { paddingHorizontal: SPACING.lg },
  button: { width: '100%', borderRadius: RADIUS.full, shadowOpacity: 0.3, elevation: 4 },
  gradientButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, gap: 8, borderRadius: RADIUS.full },
  buttonText: { fontSize: 16, fontWeight: '700', color: '#000' },
});