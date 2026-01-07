import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/contexts/ThemeContext';

interface ForgotPasswordModalProps {
  visible: boolean;
  onClose: () => void;
}

export function ForgotPasswordModal({ visible, onClose }: ForgotPasswordModalProps) {
  const { theme, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSendReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'shpe-app://reset-password',
    });
    setLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setSent(true);
      setTimeout(() => {
        setSent(false);
        setEmail('');
        onClose();
      }, 3000);
    }
  };

  const handleClose = () => {
    setEmail('');
    setSent(false);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[
          styles.overlay,
          { backgroundColor: isDark ? 'rgba(0, 5, 18, 0.6)' : 'rgba(11, 22, 48, 0.25)' },
        ]}
      >
        <View style={styles.modalContainer}>
          <View style={[
            styles.modal,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
              shadowColor: theme.shadow,
            },
          ]}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Reset Password</Text>
              <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={theme.text} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            {sent ? (
              <View style={styles.successContainer}>
                <Ionicons name="checkmark-circle" size={64} color={theme.info} />
                <Text style={[styles.successTitle, { color: theme.text }]}>Email Sent!</Text>
                <Text style={[styles.successText, { color: theme.subtext }]}>
                  Check your email for a password reset link.
                </Text>
              </View>
            ) : (
              <>
                <Text style={[styles.description, { color: theme.subtext }]}>
                  Enter your email address and we'll send you a link to reset your password.
                </Text>

                <TextInput
                  style={[
                    styles.input,
                    {
                      borderColor: theme.border,
                      color: theme.text,
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
                    },
                  ]}
                  placeholder="Email address"
                  placeholderTextColor={theme.subtext}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />

                <TouchableOpacity
                  style={[styles.button, loading && styles.buttonDisabled]}
                  onPress={handleSendReset}
                  disabled={loading}
                >
                  <LinearGradient
                    colors={isDark ? ['#7FB3FF', '#5C8DFF', '#3B6BFF'] : ['#5C8DFF', '#3B6BFF', '#2B4FD6']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    <Text style={styles.buttonText}>
                      {loading ? 'Sending...' : 'Send Reset Link'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modal: {
    borderRadius: 16,
    padding: 24,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    borderRadius: 8,
    alignItems: 'center',
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  successContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
