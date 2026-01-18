import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  TextInput,
  SafeAreaView,
  Platform,
  UIManager,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import type { AppError } from '@/types/errors';

interface UpdatePasswordSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (newPassword: string) => Promise<{ error: AppError | null }>;
  isLoading?: boolean;
  error?: string | null;
}

export function UpdatePasswordSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}: UpdatePasswordSheetProps) {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const previousError = useRef<string | null>(null);

  const confirmPasswordRef = useRef<TextInput>(null);

  const isPasswordValid = password.length >= 6;
  const passwordsMatch = password === confirmPassword;
  const canSubmit = isPasswordValid && passwordsMatch && confirmPassword.length > 0 && !isLoading;

  const displayError = error || localError;

  useEffect(() => {
    if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
      UIManager.setLayoutAnimationEnabledExperimental(true);
    }
  }, []);

  useEffect(() => {
    if (!visible) {
      setPassword('');
      setConfirmPassword('');
      setLocalError(null);
    }
  }, [visible]);

  useEffect(() => {
    if (error && !previousError.current) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
    }
    previousError.current = error ?? null;
  }, [error]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }

    if (!passwordsMatch) {
      setLocalError('Passwords do not match');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      return;
    }

    if (password.length < 6) {
      setLocalError('Password must be at least 6 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      triggerShake();
      return;
    }

    setLocalError(null);
    await onSubmit(password);
  };

  const clearError = () => {
    setLocalError(null);
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearError();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    clearError();
  };

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(translateX, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: -5, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 5, duration: 50, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.keyboardView, styles.fullBackground]}
      >
        <SafeAreaView style={[styles.safeArea, styles.fullBackground]}>
          <View style={styles.container}>
            <View style={styles.topSection}>
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.8}
                  accessibilityLabel="Close"
                >
                  <Ionicons name="close" size={25} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed" size={26} color="#FFFFFF" />
              </View>

              <Text style={styles.title}>Set New Password</Text>
              <Text style={styles.subtitle}>
                Your identity is verified. Please create a new password.
              </Text>

              <Animated.View style={[styles.inputGroup, { transform: [{ translateX }] }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666666"
                  value={password}
                  onChangeText={handlePasswordChange}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                  editable={!isLoading}
                />

                <TextInput
                  ref={confirmPasswordRef}
                  style={styles.input}
                  placeholder="Confirm Password"
                  placeholderTextColor="#666666"
                  value={confirmPassword}
                  onChangeText={handleConfirmPasswordChange}
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                  onSubmitEditing={handleSubmit}
                  editable={!isLoading}
                />
              </Animated.View>
            </View>

            <View style={styles.footer}>
              {displayError && (
                <Text style={styles.errorText}>{displayError}</Text>
              )}
              <TouchableOpacity
                style={[
                  styles.nextButton,
                  canSubmit ? styles.nextButtonActive : styles.nextButtonDisabled,
                ]}
                onPress={handleSubmit}
                disabled={!canSubmit || isLoading}
                activeOpacity={0.9}
              >
                {isLoading ? (
                  <ActivityIndicator
                    color={canSubmit ? '#000000' : '#666666'}
                    size="small"
                  />
                ) : (
                  <Text
                    style={[
                      styles.nextButtonText,
                      canSubmit
                        ? styles.nextButtonTextActive
                        : styles.nextButtonTextDisabled,
                    ]}
                  >
                    Update Password
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  fullBackground: {
    backgroundColor: '#1C1C1E',
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  topSection: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  header: {
    alignItems: 'flex-end',
    alignSelf: 'stretch',
    marginBottom: -25,
  },
  closeButton: {
    width: 48,
    height: 48,
    borderRadius: 26,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#2C2C2E',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    marginBottom: 10,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: '#2C2C2E',
    borderRadius: 36,
    paddingHorizontal: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 8,
  },
  inputGroup: {
    width: '100%',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  nextButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonActive: {
    backgroundColor: '#ffffff',
  },
  nextButtonDisabled: {
    backgroundColor: '#333333',
    opacity: 0.6,
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
  },
  nextButtonTextActive: {
    color: '#000000',
  },
  nextButtonTextDisabled: {
    color: '#666666',
  },
});
