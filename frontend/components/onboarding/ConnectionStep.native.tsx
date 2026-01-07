import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  useColorScheme,
  Alert,
} from 'react-native';
import { MotiView } from 'moti';
import { z } from 'zod';
import * as Notifications from 'expo-notifications';

const connectionSchema = z.object({
  phoneNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
    .optional()
    .or(z.literal('')),
  notifications: z.boolean().default(false),
});

export interface FormData {
  phoneNumber: string;
  notifications: boolean;
}

interface ConnectionStepProps {
  data: FormData;
  update: (fields: Partial<FormData>) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function ConnectionStep({ data, update, onNext, onBack }: ConnectionStepProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [error, setError] = useState<string | null>(null);
  const [showPermissionPrime, setShowPermissionPrime] = useState(false);

  const handleToggleNotifications = async () => {
    if (!data.notifications) {
      // User is enabling notifications - show soft ask first
      setShowPermissionPrime(true);
    } else {
      // User is disabling
      update({ notifications: false });
      setError(null);
    }
  };

  const handleRequestPermission = async () => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status === 'granted') {
        update({ notifications: true });
        setShowPermissionPrime(false);
        setError(null);
      } else {
        Alert.alert(
          'Permission Denied',
          'You can enable notifications later in your device settings.',
          [{ text: 'OK' }]
        );
        setShowPermissionPrime(false);
      }
    } catch (err) {
      console.error('Permission error:', err);
      Alert.alert('Error', 'Failed to request notification permissions.');
      setShowPermissionPrime(false);
    }
  };

  const handleCancelPermission = () => {
    setShowPermissionPrime(false);
  };

  const handlePhoneChange = (value: string) => {
    // Only allow digits
    const cleaned = value.replace(/\D/g, '');
    update({ phoneNumber: cleaned });
    setError(null);
  };

  const handleNext = () => {
    const payload = {
      phoneNumber: data.phoneNumber?.trim() ?? '',
      notifications: data.notifications ?? false,
    };

    // Only validate if phoneNumber has content
    if (payload.phoneNumber) {
      const result = connectionSchema.safeParse(payload);
      if (!result.success) {
        setError(result.error.issues[0]?.message ?? 'Please check your inputs.');
        return;
      }
    }

    setError(null);
    onNext();
  };

  // Format phone number for display (e.g., 1234567890 -> (123) 456-7890)
  const formatPhoneDisplay = (phone: string) => {
    if (!phone) return '';
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 6) return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  };

  // Dynamic colors based on theme
  const colors = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
    border: isDark ? '#334155' : '#E5E7EB',
    error: '#DC2626',
    primary: '#2563EB',
    modalBg: isDark ? '#1E293B' : '#FFFFFF',
    modalOverlay: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.5)',
  };

  return (
    <MotiView
      from={{ translateX: 50, opacity: 0 }}
      animate={{ translateX: 0, opacity: 1 }}
      transition={{ type: 'timing', duration: 300 }}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Stay in the loop.</Text>
          <Text style={styles.subtitle}>Get notified about opportunities.</Text>
        </View>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>⚠️ {error}</Text>
          </View>
        ) : null}

        {/* Phone Input */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Phone Number (Optional)</Text>
          <View style={styles.inputWithIcon}>
            <Text style={styles.inputIcon}>📱</Text>
            <TextInput
              value={formatPhoneDisplay(data.phoneNumber ?? '')}
              onChangeText={handlePhoneChange}
              placeholder="(123) 456-7890"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              maxLength={14}
              style={styles.inputWithPadding}
            />
          </View>
          <Text style={styles.helperText}>We'll only use this for important updates.</Text>
        </View>

        {/* Notification Toggle Card */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Preferences</Text>
          <TouchableOpacity onPress={handleToggleNotifications} style={styles.toggleCard}>
            <View style={styles.toggleCardLeft}>
              <View
                style={[
                  styles.iconCircle,
                  data.notifications ? styles.iconCircleActive : styles.iconCircleInactive,
                ]}
              >
                <Text style={styles.bellIcon}>🔔</Text>
              </View>
              <View style={styles.toggleTextContainer}>
                <Text style={styles.toggleTitle}>Enable Push Notifications</Text>
                <Text style={styles.toggleSubtitle}>For internship deadlines & events.</Text>
              </View>
            </View>

            {/* Custom Toggle Switch */}
            <View
              style={[
                styles.toggleTrack,
                data.notifications ? styles.toggleTrackActive : styles.toggleTrackInactive,
              ]}
            >
              <MotiView
                animate={{
                  translateX: data.notifications ? 22 : 2,
                }}
                transition={{
                  type: 'spring',
                  damping: 15,
                  stiffness: 150,
                }}
                style={styles.toggleThumb}
              />
            </View>
          </TouchableOpacity>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonRow}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNext} style={styles.finishButton}>
            <Text style={styles.finishButtonText}>Complete & Launch 🚀</Text>
          </TouchableOpacity>
        </View>

        {/* Completion Message */}
        <Text style={[styles.completionText, { color: colors.textSecondary }]}>
          You're one step away from unlocking exclusive opportunities.
        </Text>

        {/* Permission Prime Modal */}
        {showPermissionPrime && (
          <View style={[styles.modalOverlay, { backgroundColor: colors.modalOverlay }]}>
            <MotiView
              from={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'timing', duration: 200 }}
              style={[styles.modalContent, { backgroundColor: colors.modalBg, borderColor: colors.border }]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>Stay Updated! 🔔</Text>
              <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
                Get instant alerts for:
              </Text>
              <View style={styles.benefitsList}>
                <Text style={[styles.benefit, { color: colors.textSecondary }]}>• Internship deadlines</Text>
                <Text style={[styles.benefit, { color: colors.textSecondary }]}>• SHPE events & workshops</Text>
                <Text style={[styles.benefit, { color: colors.textSecondary }]}>• Scholarship opportunities</Text>
                <Text style={[styles.benefit, { color: colors.textSecondary }]}>• Professional networking events</Text>
              </View>
              <View style={styles.modalButtons}>
                <TouchableOpacity onPress={handleCancelPermission} style={styles.modalCancelButton}>
                  <Text style={styles.modalCancelText}>Not Now</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleRequestPermission} style={styles.modalAllowButton}>
                  <Text style={styles.modalAllowText}>Enable Notifications</Text>
                </TouchableOpacity>
              </View>
            </MotiView>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 14,
    color: '#991B1B',
  },
  fieldContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 8,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    paddingLeft: 12,
    backgroundColor: '#FFFFFF',
  },
  inputIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  inputWithPadding: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 16,
    fontSize: 16,
    color: '#111827',
  },
  helperText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  toggleCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  iconCircleActive: {
    backgroundColor: '#DBEAFE',
  },
  iconCircleInactive: {
    backgroundColor: '#F3F4F6',
  },
  bellIcon: {
    fontSize: 20,
  },
  toggleTextContainer: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#111827',
    marginBottom: 2,
  },
  toggleSubtitle: {
    fontSize: 12,
    color: '#6B7280',
  },
  toggleTrack: {
    width: 48,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    position: 'relative',
  },
  toggleTrackActive: {
    backgroundColor: '#3B82F6',
  },
  toggleTrackInactive: {
    backgroundColor: '#D1D5DB',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  backButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  finishButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  finishButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  completionText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
  },
  // Modal styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: 12,
  },
  benefitsList: {
    marginBottom: 20,
    paddingLeft: 8,
  },
  benefit: {
    fontSize: 14,
    marginBottom: 6,
    lineHeight: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalAllowButton: {
    flex: 2,
    backgroundColor: '#2563EB',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalAllowText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
