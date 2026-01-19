import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LEGAL_URLS } from '@/constants/legal';

interface LoginScreenProps {
  onGoogleLogin?: () => void;
  onAppleLogin?: () => void;
  onEmailLogin?: () => void;
  onGuestScan?: () => void;
  onContinueWithPhone?: () => void;
  onContinueWithEmail?: () => void;
  onGuestLogin?: () => void;
}

export function LoginScreen({
  onGoogleLogin,
  onAppleLogin,
  onEmailLogin,
  onGuestScan,
  onContinueWithPhone, // Add this
  onContinueWithEmail, // Add this
}: LoginScreenProps) {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Content pushed to bottom */}
      <View style={styles.content}>
        {/* Subtext */}
        <Text style={styles.subtext}>
          Join our network, RSVP to events, engage with members, and win points!
        </Text>

        {/* Primary Button - Continue with Google */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onGoogleLogin}
          activeOpacity={0.8}
        >
          <Ionicons name="logo-google" size={20} color="#000000" style={styles.googleIcon} />
          <Text style={styles.primaryButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        {/* Social Login Row */}
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={styles.socialButton}
            onPress={onAppleLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="logo-apple" size={20} color="#FFFFFF" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Apple</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.socialButton}
            onPress={onEmailLogin}
            activeOpacity={0.8}
          >
            <Ionicons name="mail-outline" size={20} color="#FFFFFF" style={styles.socialIcon} />
            <Text style={styles.socialButtonText}>Email</Text>
          </TouchableOpacity>
        </View>

        {/* Guest Scan Button */}
        <TouchableOpacity
          style={styles.guestButton}
          onPress={onGuestScan}
          activeOpacity={0.8}
        >
          <Ionicons name="qr-code-outline" size={20} color="#9E9E9E" style={styles.socialIcon} />
          <Text style={styles.guestButtonText}>Scan Check-in QR</Text>
        </TouchableOpacity>

        {/* Footer Legal Text */}
        <Text style={styles.footer}>
          By continuing, you agree to our
          <Text
            style={styles.linkText}
            onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.terms)}
          >
            {' '}Terms of Use
          </Text>
          {' '}and
          <Text
            style={styles.linkText}
            onPress={() => WebBrowser.openBrowserAsync(LEGAL_URLS.privacy)}
          >
            {' '}Privacy Policy
          </Text>
          .
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000000',
    justifyContent: 'flex-end',
    paddingHorizontal: 24,
    zIndex: 0,
  },
  content: {
    alignItems: 'center',
    paddingBottom: 16,
  },
  subtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    width: '100%',
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  googleIcon: {
    marginRight: 8,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000000',
  },
  socialRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 24,
  },
  socialButton: {
    flex: 1,
    height: 56,
    backgroundColor: '#222222',
    borderRadius: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialIcon: {
    marginRight: 8,
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  footer: {
    fontSize: 11,
    color: '#9E9E9E',
    textAlign: 'center',
  },
  linkText: {
    color: '#DFDFDF',
  },
  guestButton: { // Added style
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    padding: 8,
  },
  guestButtonText: {
    color: '#9E9E9E',
    fontSize: 14,
    fontWeight: '600',
  },
});
