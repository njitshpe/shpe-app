import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirmDelete,
}) => {
  const { theme, isDark } = useTheme();
  const [confirmationText, setConfirmationText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const isConfirmationValid = confirmationText === 'DELETE';

  const handleDelete = async () => {
    if (!isConfirmationValid) {
      Alert.alert('Invalid Confirmation', 'Please type DELETE to confirm account deletion.');
      return;
    }

    setIsDeleting(true);
    try {
      await onConfirmDelete();
      // Reset state after successful deletion
      setConfirmationText('');
      onClose();
    } catch (error) {
      // Error handling is done in the parent component
      console.error('Delete account error:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    if (!isDeleting) {
      setConfirmationText('');
      onClose();
    }
  };

  const dynamicStyles = {
    modalOverlay: { backgroundColor: 'rgba(0,0,0,0.9)' },
    modalContent: {
      backgroundColor: isDark ? '#111111' : '#FFFFFF',
      borderColor: 'rgba(255,59,48,0.3)',
    },
    title: { color: theme.error },
    text: { color: theme.text },
    subtext: { color: theme.subtext },
    bulletText: { color: theme.subtext },
    warningBox: { backgroundColor: isDark ? '#3F1F1F' : '#FEF2F2', borderColor: theme.error },
    warningText: { color: theme.error },
    input: {
      backgroundColor: 'rgba(255,59,48,0.05)',
      borderColor: 'rgba(255,59,48,0.2)',
      color: theme.error,
    },
    cancelButton: { backgroundColor: 'rgba(255,255,255,0.05)' },
    cancelButtonText: { color: theme.subtext },
    deleteButton: { backgroundColor: '#FF3B30' },
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.modalOverlay, dynamicStyles.modalOverlay]}
      >
        <View style={[styles.modalContent, dynamicStyles.modalContent]}>
          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <Ionicons name="warning" size={48} color={theme.error} />
              </View>
              <Text style={[styles.title, dynamicStyles.title]}>DELETE ACCOUNT</Text>
            </View>

            {/* Warning Box */}
            <View style={[styles.warningBox, dynamicStyles.warningBox]}>
              <Ionicons name="alert-circle" size={20} color={theme.error} />
              <Text style={[styles.warningText, dynamicStyles.warningText]}>
                This action is permanent and cannot be undone
              </Text>
            </View>

            {/* What will be deleted */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                What will be permanently deleted:
              </Text>
              <View style={styles.bulletList}>
                <BulletPoint text="Your account credentials and login access" theme={theme} />
                <BulletPoint text="Profile information (name, bio, photo, resume)" theme={theme} />
                <BulletPoint text="Points and rank data" theme={theme} />
                <BulletPoint text="Feed posts, comments, and likes" theme={theme} />
                <BulletPoint text="All uploaded files (resume, photos)" theme={theme} />
              </View>
            </View>

            {/* What will be kept */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>
                Event attendance stats (anonymized):
              </Text>
              <Text style={[styles.bodyText, dynamicStyles.text]}>
                Your event check-ins will be preserved for organization records but will no
                longer be linked to your identity.
              </Text>
            </View>

            {/* Confirmation Input */}
            <View style={styles.section}>
              <Text style={[styles.label, dynamicStyles.subtext]}>TYPE &apos;DELETE&apos; TO CONFIRM</Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="DELETE"
                placeholderTextColor="rgba(255,59,48,0.5)"
                autoCapitalize="characters"
                autoCorrect={false}
                editable={!isDeleting}
              />
              {isConfirmationValid && (
                <View style={styles.validIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                  <Text style={[styles.validText, { color: theme.success }]}>
                    Confirmation valid
                  </Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.cancelButton,
                  dynamicStyles.cancelButton,
                  isDeleting && styles.buttonDisabled,
                ]}
                onPress={handleCancel}
                disabled={isDeleting}
              >
                <Text style={[styles.buttonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.button,
                  styles.deleteButton,
                  dynamicStyles.deleteButton,
                  (!isConfirmationValid || isDeleting) && styles.buttonDisabled,
                ]}
                onPress={handleDelete}
                disabled={!isConfirmationValid || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete Account</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

interface BulletPointProps {
  text: string;
  theme: any;
}

const BulletPoint: React.FC<BulletPointProps> = ({ text, theme }) => (
  <View style={styles.bulletItem}>
    <Ionicons name="close-circle" size={14} color={theme.error} />
    <Text style={[styles.bulletText, { color: theme.subtext }]}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 500,
    borderRadius: 24,
    padding: 32,
    maxHeight: '90%',
    borderWidth: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(255,59,48,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 1,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    gap: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 4,
    textAlign: 'center',
  },
  validIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  validText: {
    fontSize: 14,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
  },
  deleteButton: {},
  buttonDisabled: {
    opacity: 0.3,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {},
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});
