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
    modalOverlay: { backgroundColor: isDark ? 'rgba(0,0,0,0.85)' : 'rgba(0,0,0,0.5)' },
    modalContent: { backgroundColor: theme.card },
    title: { color: theme.error },
    text: { color: theme.text },
    bulletText: { color: theme.text },
    warningBox: { backgroundColor: isDark ? '#3F1F1F' : '#FEF2F2', borderColor: theme.error },
    warningText: { color: theme.error },
    input: {
      backgroundColor: isDark ? '#1F1F1F' : '#F9FAFB',
      borderColor: isConfirmationValid ? theme.success : theme.border,
      color: theme.text,
    },
    cancelButton: { backgroundColor: isDark ? '#333' : '#E5E7EB' },
    cancelButtonText: { color: theme.text },
    deleteButton: {
      backgroundColor: isConfirmationValid && !isDeleting ? theme.error : theme.border,
    },
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
                <Ionicons name="warning" size={32} color={theme.error} />
              </View>
              <Text style={[styles.title, dynamicStyles.title]}>Delete Account</Text>
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
              <Text style={[styles.label, dynamicStyles.text]}>
                Type <Text style={{ fontWeight: 'bold' }}>DELETE</Text> to confirm:
              </Text>
              <TextInput
                style={[styles.input, dynamicStyles.input]}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="DELETE"
                placeholderTextColor={theme.subtext}
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
                style={[styles.button, styles.cancelButton, dynamicStyles.cancelButton]}
                onPress={handleCancel}
                disabled={isDeleting}
              >
                <Text style={[styles.buttonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.deleteButton, dynamicStyles.deleteButton]}
                onPress={handleDelete}
                disabled={!isConfirmationValid || isDeleting}
              >
                {isDeleting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.deleteButtonText}>Delete My Account</Text>
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
    <Text style={[styles.bullet, { color: theme.error }]}>•</Text>
    <Text style={[styles.bulletText, { color: theme.text }]}>{text}</Text>
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
    borderRadius: 16,
    padding: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  bodyText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bulletList: {
    gap: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  bullet: {
    fontSize: 20,
    lineHeight: 20,
  },
  bulletText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 2,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    fontWeight: 'bold',
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
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  cancelButton: {
    borderWidth: 1,
  },
  deleteButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButtonText: {},
  deleteButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
