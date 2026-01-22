import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { reportService, type ReportTargetType, type ReportReason } from '@/services/report.service';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string;
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'Spam', label: 'SPAM', description: 'Repetitive or unwanted' },
  { value: 'Harassment', label: 'HARASSMENT', description: 'Bullying or threatening' },
  { value: 'Inappropriate', label: 'INAPPROPRIATE', description: 'Graphic or offensive' },
  { value: 'Hate', label: 'HATE SPEECH', description: 'Discriminatory content' },
  { value: 'Other', label: 'OTHER', description: 'Something else' },
];

export function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const { theme, isDark } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const handleClose = () => {
    setSelectedReason(null);
    setDetails('');
    setHasReported(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Protocol Error', 'Select a classification to proceed.');
      return;
    }
    if (!targetId) {
      Alert.alert('Submission Failed', 'Missing report target. Please try again.');
      return;
    }

    setIsLoading(true);
    const result = await reportService.submitReport({
      targetType,
      targetId,
      reason: selectedReason,
      details: details.trim() || undefined,
    });
    setIsLoading(false);

    if (result.success) {
      setHasReported(true);
      setTimeout(() => {
        handleClose();
      }, 2500);
    } else {
      if (result.error?.code === 'ALREADY_EXISTS') {
        Alert.alert(
          'Already Logged',
          "We have already received a report for this item. It is currently under review.",
          [{ text: 'Dismiss', onPress: handleClose }]
        );
      } else {
        Alert.alert('Submission Failed', result.error?.message || 'Network protocol error. Please try again.');
      }
    }
  };

  // Dynamic Styles for "Monochrome Luxury"
  const dynamicStyles = {
    overlay: { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)' },
    modal: {
      backgroundColor: isDark ? '#111111' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
    },
    headerText: { color: theme.text },
    subText: { color: theme.subtext },
    optionBase: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
      borderColor: 'transparent',
    },
    optionSelected: {
      backgroundColor: isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)',
      borderColor: theme.error,
    },
    input: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : '#F9FAFB',
      color: theme.text,
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
    },
    cancelButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <TouchableOpacity style={[styles.overlay, dynamicStyles.overlay]} activeOpacity={1} onPress={handleClose}>
          <View
            style={[styles.modal, dynamicStyles.modal]}
            onStartShouldSetResponder={() => true}
          >
            {hasReported ? (
              // --- SUCCESS STATE ---
              <View style={styles.successContainer}>
                <View style={[styles.iconContainer, { backgroundColor: 'rgba(52, 199, 89, 0.1)' }]}>
                  <Ionicons name="shield-checkmark" size={48} color={theme.success} />
                </View>
                <Text style={[styles.successTitle, { color: theme.text }]}>REPORT SUBMITTED</Text>
                <Text style={[styles.successMessage, { color: theme.subtext }]}>
                  Thank you for reporting. Your report will be reviewed within 24-72 hours.
                </Text>
              </View>
            ) : (
              // --- FORM STATE ---
              <>
                {/* Header */}
                <View style={styles.header}>
                  <View style={[styles.iconContainer, { backgroundColor: 'rgba(255, 59, 48, 0.1)' }]}>
                    <Ionicons name="flag" size={28} color={theme.error} />
                  </View>
                  <View>
                    <Text style={[styles.title, dynamicStyles.headerText]}>SUBMIT REPORT</Text>
                    <Text style={[styles.subtitle, dynamicStyles.subText]}>
                      TARGET: {targetType.toUpperCase()} {targetName ? `@${targetName.toUpperCase()}` : ''}
                    </Text>
                  </View>
                </View>

                <ScrollView
                  style={styles.content}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {/* Reason Selection */}
                  <Text style={[styles.sectionLabel, dynamicStyles.subText]}>CLASSIFICATION</Text>
                  
                  <View style={styles.optionsContainer}>
                    {REPORT_REASONS.map((reason) => {
                      const isSelected = selectedReason === reason.value;
                      return (
                        <TouchableOpacity
                          key={reason.value}
                          style={[
                            styles.reasonOption,
                            dynamicStyles.optionBase,
                            isSelected && dynamicStyles.optionSelected,
                          ]}
                          onPress={() => setSelectedReason(reason.value)}
                          disabled={isLoading}
                        >
                          <View>
                            <Text
                              style={[
                                styles.reasonLabel,
                                { color: isSelected ? theme.error : theme.text }
                              ]}
                            >
                              {reason.label}
                            </Text>
                            <Text style={[styles.reasonDescription, { color: theme.subtext, opacity: 0.7 }]}>
                              {reason.description}
                            </Text>
                          </View>
                          {isSelected && (
                            <Ionicons name="alert-circle" size={20} color={theme.error} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  {/* Input */}
                  <Text style={[styles.sectionLabel, dynamicStyles.subText, { marginTop: 24 }]}>
                    ADDITIONAL CONTEXT
                  </Text>
                  <TextInput
                    style={[styles.detailsInput, dynamicStyles.input]}
                    placeholder="Provide details regarding this violation..."
                    placeholderTextColor={theme.subtext}
                    multiline
                    numberOfLines={4}
                    maxLength={500}
                    value={details}
                    onChangeText={setDetails}
                    editable={!isLoading}
                    textAlignVertical="top"
                  />
                  <Text style={[styles.characterCount, { color: theme.subtext }]}>
                    {details.length}/500
                  </Text>
                </ScrollView>

                {/* Footer Buttons */}
                <View style={styles.footer}>
                  <TouchableOpacity
                    style={[styles.button, dynamicStyles.cancelButton]}
                    onPress={handleClose}
                    disabled={isLoading}
                  >
                    <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.button,
                      {
                        backgroundColor: selectedReason ? theme.error : 'rgba(150,150,150,0.1)',
                        opacity: selectedReason ? 1 : 0.5,
                      },
                    ]}
                    onPress={handleSubmit}
                    disabled={isLoading || !selectedReason}
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                        Submit Report
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modal: {
    borderRadius: 24,
    width: '100%',
    maxWidth: 400,
    maxHeight: '85%',
    overflow: 'hidden',
    paddingTop: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    gap: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  content: {
    paddingHorizontal: 24,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  optionsContainer: {
    gap: 8,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  reasonLabel: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 11,
  },
  detailsInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    fontSize: 14,
    minHeight: 100,
    lineHeight: 20,
  },
  characterCount: {
    fontSize: 10,
    textAlign: 'right',
    marginTop: 6,
    marginBottom: 20,
    opacity: 0.7,
  },
  footer: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 8,
    borderTopWidth: 0,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  successContainer: {
    alignItems: 'center',
    padding: 40,
    paddingVertical: 60,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 8,
  },
  successMessage: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 22,
    opacity: 0.8,
  },
});
