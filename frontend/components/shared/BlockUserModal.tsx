import React from 'react';
import { View, Text, Modal, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface BlockUserModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userName: string;
  isBlocked: boolean;
  isLoading?: boolean;
}

export function BlockUserModal({
  visible,
  onClose,
  onConfirm,
  userName,
  isBlocked,
  isLoading = false,
}: BlockUserModalProps) {
  const { theme, isDark } = useTheme();

  const title = isBlocked ? 'Unblock User' : 'Block User';
  const message = isBlocked
    ? `Unblock @${userName}? You'll be able to see their content again.`
    : `Block @${userName}? You won't see their content.`;
  const confirmText = isBlocked ? 'Unblock' : 'Block';
  const confirmColor = isBlocked ? theme.primary : theme.error;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modal, { backgroundColor: theme.card }]}
          onStartShouldSetResponder={() => true}
        >
          <View style={styles.iconContainer}>
            <Ionicons
              name={isBlocked ? "eye" : "eye-off"}
              size={40}
              color={confirmColor}
            />
          </View>

          <Text style={[styles.title, { color: theme.text }]}>
            {title}
          </Text>

          <Text style={[styles.message, { color: theme.subtext }]}>
            {message}
          </Text>

          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, { backgroundColor: theme.background }]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, { backgroundColor: confirmColor }]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {confirmText}
                </Text>
              )}
            </TouchableOpacity>
          </View>
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
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
