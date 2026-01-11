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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { reportService, type ReportTargetType, type ReportReason } from '@/services/report.service';

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportTargetType;
  targetId: string;
  targetName?: string; // Optional display name for the target (user/post author)
}

const REPORT_REASONS: { value: ReportReason; label: string; description: string }[] = [
  { value: 'Spam', label: 'Spam', description: 'Unwanted or repetitive content' },
  { value: 'Harassment', label: 'Harassment', description: 'Bullying or harassment' },
  { value: 'Inappropriate', label: 'Inappropriate', description: 'Inappropriate or offensive content' },
  { value: 'Hate', label: 'Hate Speech', description: 'Hateful or discriminatory content' },
  { value: 'Other', label: 'Other', description: 'Other issue' },
];

export function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const { theme } = useTheme();
  const [selectedReason, setSelectedReason] = useState<ReportReason | null>(null);
  const [details, setDetails] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const handleClose = () => {
    // Reset state when closing
    setSelectedReason(null);
    setDetails('');
    setHasReported(false);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('Required', 'Please select a reason for this report.');
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
      // Show success state briefly, then close
      setTimeout(() => {
        handleClose();
      }, 2000);
    } else {
      // Check if this is a duplicate report
      if (result.error?.code === 'ALREADY_EXISTS') {
        Alert.alert(
          'Already Reported',
          "You already reported this. Thanks — we'll review your previous report.",
          [{ text: 'OK', onPress: handleClose }]
        );
      } else {
        Alert.alert('Error', result.error?.message || 'Failed to submit report. Please try again.');
      }
    }
  };

  const title = targetType === 'post' ? 'Report Post' : 'Report User';
  const subtitle = targetName
    ? `Report ${targetType === 'post' ? 'this post' : `@${targetName}`}`
    : `Report this ${targetType}`;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={handleClose}>
        <View
          style={[styles.modal, { backgroundColor: theme.card }]}
          onStartShouldSetResponder={() => true}
        >
          {hasReported ? (
            // Success state
            <View style={styles.successContainer}>
              <View style={[styles.iconContainer, { backgroundColor: theme.primary + '20' }]}>
                <Ionicons name="checkmark-circle" size={48} color={theme.primary} />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Report Submitted</Text>
              <Text style={[styles.successMessage, { color: theme.subtext }]}>
                Thank you for reporting. Your report will be reviewed within 24-72 hours.
              </Text>
            </View>
          ) : (
            <>
              {/* Header */}
              <View style={styles.header}>
                <View style={[styles.iconContainer, { backgroundColor: theme.error + '20' }]}>
                  <Ionicons name="flag" size={32} color={theme.error} />
                </View>
                <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
                <Text style={[styles.subtitle, { color: theme.subtext }]}>{subtitle}</Text>
              </View>

              {/* Reason Selection */}
              <ScrollView
                style={styles.content}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={[styles.sectionLabel, { color: theme.text }]}>
                  Why are you reporting this?
                </Text>

                {REPORT_REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason.value}
                    style={[
                      styles.reasonOption,
                      {
                        backgroundColor: theme.background,
                        borderColor:
                          selectedReason === reason.value ? theme.primary : theme.border,
                      },
                      selectedReason === reason.value && styles.reasonOptionSelected,
                    ]}
                    onPress={() => setSelectedReason(reason.value)}
                    disabled={isLoading}
                  >
                    <View style={styles.reasonContent}>
                      <Text
                        style={[
                          styles.reasonLabel,
                          {
                            color:
                              selectedReason === reason.value ? theme.primary : theme.text,
                          },
                        ]}
                      >
                        {reason.label}
                      </Text>
                      <Text style={[styles.reasonDescription, { color: theme.subtext }]}>
                        {reason.description}
                      </Text>
                    </View>
                    {selectedReason === reason.value && (
                      <Ionicons name="checkmark-circle" size={24} color={theme.primary} />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Optional Details */}
                <Text style={[styles.sectionLabel, { color: theme.text, marginTop: 16 }]}>
                  Additional details {selectedReason === 'Other' ? '(recommended)' : '(optional)'}
                </Text>
                <TextInput
                  style={[
                    styles.detailsInput,
                    { backgroundColor: theme.background, color: theme.text, borderColor: theme.border },
                  ]}
                  placeholder="Provide more context if needed..."
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

              {/* Action Buttons */}
              <View style={styles.buttons}>
                <TouchableOpacity
                  style={[styles.button, { backgroundColor: theme.background }]}
                  onPress={handleClose}
                  disabled={isLoading}
                >
                  <Text style={[styles.buttonText, { color: theme.text }]}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.button,
                    {
                      backgroundColor: selectedReason ? theme.error : theme.border,
                    },
                  ]}
                  onPress={handleSubmit}
                  disabled={isLoading || !selectedReason}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>Submit Report</Text>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    borderRadius: 16,
    width: '100%',
    maxWidth: 500,
    maxHeight: '80%',
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    maxHeight: 400,
  },
  sectionLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  reasonOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    marginBottom: 8,
  },
  reasonOptionSelected: {
    borderWidth: 2,
  },
  reasonContent: {
    flex: 1,
    marginRight: 12,
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  reasonDescription: {
    fontSize: 13,
  },
  detailsInput: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 15,
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
    marginBottom: 16,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    padding: 24,
    paddingTop: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    padding: 32,
  },
  successMessage: {
    fontSize: 15,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
});
