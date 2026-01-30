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
  Switch,
  LayoutAnimation,
  UIManager,
  ActivityIndicator,
  Animated,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';

type AuthMode = 'signIn' | 'signUp' | 'forgotPassword';

interface EmailSignInSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: {
    email: string;
    password: string;
    confirmPassword: string;
    mode: AuthMode;
  }) => void;
  isLoading?: boolean;
  error?: string | null;
}

const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

export function EmailSignInSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  error = null,
}: EmailSignInSheetProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [localError, setLocalError] = useState<string | null>(null);
  const translateX = useRef(new Animated.Value(0)).current;
  const previousError = useRef<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const trimmedEmail = email.trim();
  const isEmailValid = validateEmail(trimmedEmail);
  const isForgotPassword = mode === 'forgotPassword';
  const isSignUp = mode === 'signUp';
  const canSubmit = isEmailValid && !isLoading;

  // Use prop error or local error
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
      setMode('signIn');
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

  const handleSubmit = () => {
    if (!canSubmit) {
      return;
    }
    onSubmit({
      email: trimmedEmail,
      password,
      confirmPassword,
      mode,
    });
  };

  const clearError = () => {
    setLocalError(null);
  };

  const handleEmailChange = (value: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setEmail(value);
    clearError();
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearError();
  };

  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    clearError();
  };

  const handleToggleSignUp = (value: boolean) => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode(value ? 'signUp' : 'signIn');
    clearError();
  };

  const handleForgotPassword = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode('forgotPassword');
    clearError();
  };

  const handleBackToSignIn = () => {
    Haptics.selectionAsync();
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setMode('signIn');
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
                <Ionicons name={isForgotPassword ? 'key' : 'mail'} size={26} color="#FFFFFF" />
              </View>

              <Text style={styles.title}>
                {isForgotPassword ? 'Reset Password' : 'Continue with Email'}
              </Text>
              <Text style={styles.subtitle}>
                {isForgotPassword
                  ? 'Enter your email to receive reset instructions.'
                  : 'Sign in or sign up with your email.'}
              </Text>

              <Animated.View style={[styles.inputGroup, { transform: [{ translateX }] }]}>
                <TextInput
                  style={styles.input}
                  placeholder="Email Address"
                  placeholderTextColor="#666666"
                  value={email}
                  onChangeText={handleEmailChange}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                  autoCorrect={false}
                  returnKeyType={isForgotPassword ? 'done' : 'next'}
                  onSubmitEditing={() => {
                    if (isForgotPassword) {
                      handleSubmit();
                    } else {
                      passwordRef.current?.focus();
                    }
                  }}
                  editable={!isLoading}
                />

                {isEmailValid && !isForgotPassword && (
                  <TextInput
                    ref={passwordRef}
                    style={styles.input}
                    placeholder="Password"
                    placeholderTextColor="#666666"
                    value={password}
                    onChangeText={handlePasswordChange}
                    secureTextEntry
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType={isSignUp ? 'next' : 'done'}
                    onSubmitEditing={() => {
                      if (isSignUp) {
                        confirmPasswordRef.current?.focus();
                      } else {
                        handleSubmit();
                      }
                    }}
                    editable={!isLoading}
                  />
                )}

                {isEmailValid && isSignUp && !isForgotPassword && (
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
                )}

                {isForgotPassword ? (
                  <View style={styles.backToSignInRow}>
                    <TouchableOpacity
                      onPress={handleBackToSignIn}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.backToSignInText}>Back to Sign In</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={styles.newUserRow}
                      onPress={() => handleToggleSignUp(!isSignUp)}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.newUserText}>New User?</Text>
                      <Switch
                        value={isSignUp}
                        onValueChange={handleToggleSignUp}
                        trackColor={{ false: '#3e3e3e', true: '#a63718' }}
                        thumbColor="#FFFFFF"
                        ios_backgroundColor="#3e3e3e"
                      />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.forgotPassword}
                      onPress={handleForgotPassword}
                      activeOpacity={0.8}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
                    </TouchableOpacity>
                  </View>
                )}
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
                    {isForgotPassword
                      ? 'Send Reset Link'
                      : !isEmailValid
                        ? 'Sign In'
                        : isSignUp
                          ? 'Create Account'
                          : 'Sign In'}
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
  optionsRow: {
    width: '100%',
    marginTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  newUserRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  newUserText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
    marginRight: 8,
  },
  forgotPassword: {
    alignSelf: 'center',
  },
  forgotPasswordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
  },
  backToSignInRow: {
    width: '100%',
    marginTop: 12,
    alignItems: 'center',
  },
  backToSignInText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888888',
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
