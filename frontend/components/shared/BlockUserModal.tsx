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

  // Configuration based on state
  const config = isBlocked
    ? {
        title: 'RESTORE ACCESS',
        subtitle: 'UNBLOCK USER',
        message: 'You will be able to see their content again. Connection protocol will be reset.',
        actionLabel: 'Unblock',
        color: theme.primary, // Constructive (Gold/Brand)
        icon: 'eye' as const,
      }
    : {
        title: 'RESTRICT ACCESS',
        subtitle: 'BLOCK USER',
        message: 'Their content will be hidden from your feed. They will not be notified.',
        actionLabel: 'Block',
        color: theme.error, // Destructive (Red)
        icon: 'eye-off' as const,
      };

  // Dynamic Styles
  const dynamicStyles = {
    overlay: { backgroundColor: isDark ? 'rgba(0,0,0,0.9)' : 'rgba(0,0,0,0.6)' },
    modal: {
      backgroundColor: isDark ? '#111111' : '#FFFFFF',
      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
      borderWidth: 1,
    },
    title: { color: theme.text },
    message: { color: theme.subtext },
    iconContainer: {
      backgroundColor: isBlocked 
        ? (isDark ? 'rgba(255, 215, 0, 0.1)' : 'rgba(255, 215, 0, 0.1)') // Gold Tint
        : (isDark ? 'rgba(255, 59, 48, 0.15)' : 'rgba(255, 59, 48, 0.1)'), // Red Tint
    },
    cancelButton: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    },
    confirmButton: {
      backgroundColor: config.color,
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, dynamicStyles.overlay]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View
          style={[styles.modal, dynamicStyles.modal]}
          onStartShouldSetResponder={() => true}
        >
          {/* Icon Halo */}
          <View style={[styles.iconContainer, dynamicStyles.iconContainer]}>
            <Ionicons
              name={config.icon}
              size={32}
              color={config.color}
            />
          </View>

          {/* Header */}
          <View style={styles.textContainer}>
             
            <Text style={[styles.subtitle, { color: config.color }]}>
              {config.subtitle}
            </Text>
            <Text style={[styles.title, dynamicStyles.title]}>
              @{userName.toUpperCase()}
            </Text>
          </View>

          {/* Message */}
          <Text style={[styles.message, dynamicStyles.message]}>
            {config.message}
          </Text>

          {/* Buttons */}
          <View style={styles.buttons}>
            <TouchableOpacity
              style={[styles.button, dynamicStyles.cancelButton]}
              onPress={onClose}
              disabled={isLoading}
            >
              <Text style={[styles.buttonText, { color: theme.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, dynamicStyles.confirmButton]}
              onPress={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={[styles.buttonText, { color: '#FFFFFF' }]}>
                  {config.actionLabel}
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
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modal: {
    borderRadius: 24,
    padding: 32,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    overflow: 'hidden',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
    opacity: 0.8,
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
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
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
});