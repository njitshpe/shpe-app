import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';
import { Ionicons } from '@expo/vector-icons';

interface WelcomeOverlayProps {
  onContinueWithEmail?: () => void;
}

export function WelcomeOverlay({
  onContinueWithEmail,
}: WelcomeOverlayProps) {
  return (
    <View style={styles.container}>
      {/* Content pushed to bottom */}
      <View style={styles.content}>
        {/* Typography Section */}
        <View style={styles.textSection}>
          <Text style={styles.shpeLabel}>SHPE NJIT</Text>
          <Text style={styles.mainTitle}>Delightful events</Text>
          <MaskedView
            maskElement={
              <Text style={styles.gradientText}>start here</Text>
            }
          >
            <LinearGradient
              colors={['#C644FC', '#5856D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.gradientText, styles.gradientTextHidden]}>
                start here
              </Text>
            </LinearGradient>
          </MaskedView>
        </View>

        {/* Arrow Button */}
        <View style={styles.buttonsSection}>
          <TouchableOpacity
            onPress={onContinueWithEmail}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['#C644FC', '#5856D6']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.arrowButton}
            >
              <Ionicons name="chevron-down" size={28} color="#FFFFFF" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 64,
    alignItems: 'center',
  },
  textSection: {
    marginBottom: 32,
    alignItems: 'center',
  },
  shpeLabel: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  mainTitle: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    marginBottom: 4,
    textAlign: 'center',
  },
  gradientText: {
    fontSize: 36,
    fontWeight: '900',
    textAlign: 'center',
  },
  gradientTextHidden: {
    opacity: 0,
  },
  buttonsSection: {
    alignItems: 'center',
  },
  arrowButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
