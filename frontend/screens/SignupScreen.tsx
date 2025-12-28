import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '../contexts/AuthContext';
import { AuthInput } from '../components/AuthInput';
import type { UserType } from '../types/userProfile';

interface SignupScreenProps {
  onNavigateToLogin: (email?: string, password?: string) => void;
}

export function SignupScreen({ onNavigateToLogin }: SignupScreenProps) {
  const [userType, setUserType] = useState<UserType | null>(null);
  const [ucid, setUcid] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp, signInWithGoogle } = useAuth();

  const handleSignup = async () => {
    // Validate user type selection
    if (!userType) {
      Alert.alert('Error', 'Please select your user type');
      return;
    }

    // Determine final email based on user type
    let finalEmail = email;
    if (userType === 'student') {
      if (!ucid) {
        Alert.alert('Error', 'Please enter your UCID');
        return;
      }
      finalEmail = `${ucid.toLowerCase().trim()}@njit.edu`;
    } else {
      if (!email) {
        Alert.alert('Error', 'Please enter your email');
        return;
      }
    }

    if (!password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    // Check if user already exists (Will implement in the future)
    // Manual checks against user_profiles fail due to RLS policies (unauthenticated users can't read profiles).

    const result = await signUp(finalEmail, password, {
      user_type: userType,
      onboarding_completed: false,
    });

    if (result.error) {
      Alert.alert('Error', result.error.message);
    } else if (result.needsEmailConfirmation) {
      Alert.alert(
        'Verify Your Email',
        `We've sent a verification link to ${finalEmail}. Please check your email and click the link to verify your account. Once verified, you can sign in.`,
        [{ text: 'OK', onPress: () => onNavigateToLogin(finalEmail, password) }]
      );
    } else {
      // User is automatically signed in (email confirmation disabled)
      Alert.alert(
        'Success',
        'Account created successfully!',
        [{ text: 'OK' }]
      );
    }
    setLoading(false);
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    const { error } = await signInWithGoogle();
    if (error) Alert.alert('Error', error.message);
    setLoading(false);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>SHPE</Text>
          </View>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join the SHPE NJIT community</Text>
        </View>

        <View style={styles.form}>
          <TouchableOpacity
            style={[styles.googleButton, loading && styles.buttonDisabled]}
            onPress={handleGoogleSignup}
            disabled={loading}
          >
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* User Type Selection */}
          <View style={styles.userTypeSection}>
            <Text style={styles.sectionLabel}>I am a:</Text>
            <View style={styles.userTypeButtons}>
              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'student' && styles.userTypeButtonActiveRed,
                ]}
                onPress={() => setUserType('student')}
                disabled={loading}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'student' && styles.userTypeButtonTextActive,
                ]}>
                  NJIT Student
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'alumni' && styles.userTypeButtonActiveOrange,
                ]}
                onPress={() => setUserType('alumni')}
                disabled={loading}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'alumni' && styles.userTypeButtonTextActive,
                ]}>
                  Alumni
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.userTypeButton,
                  userType === 'other' && styles.userTypeButtonActiveOrange,
                ]}
                onPress={() => setUserType('other')}
                disabled={loading}
              >
                <Text style={[
                  styles.userTypeButtonText,
                  userType === 'other' && styles.userTypeButtonTextActive,
                ]}>
                  Other
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Conditional Input: UCID for students, Email for others */}
          {userType === 'student' ? (
            <AuthInput
              label="UCID"
              value={ucid}
              onChangeText={setUcid}
              placeholder="e.g., yrc"
              autoCapitalize="none"
            />
          ) : userType ? (
            <AuthInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@email.com"
              keyboardType="email-address"
            />
          ) : null}

          <AuthInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            secureTextEntry
          />

          <AuthInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm your password"
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Creating account...' : 'Sign Up'}
            </Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => onNavigateToLogin()}>
              <Text style={styles.link}>Sign In</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#D35400',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  logoText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  form: {
    width: '100%',
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    padding: 16,
    borderRadius: 8,
    marginBottom: 20,
  },
  googleButtonText: {
    color: '#333',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd',
  },
  dividerText: {
    marginHorizontal: 16,
    color: '#999',
    fontSize: 14,
  },
  userTypeSection: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  userTypeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  userTypeButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  userTypeButtonActiveRed: {
    backgroundColor: '#CC0000', // NJIT Red
    borderColor: '#CC0000',
    borderWidth: 2,
  },
  userTypeButtonActiveOrange: {
    backgroundColor: '#D35400', // SHPE Orange
    borderColor: '#D35400',
    borderWidth: 2,
  },
  userTypeButtonText: {
    color: '#666',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  userTypeButtonTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: '#D35400',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: '600',
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#666',
    fontSize: 14,
  },
  link: {
    color: '#D35400',
    fontSize: 14,
    fontWeight: '600',
  },
});