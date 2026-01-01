import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  Animated,
  Dimensions,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface RegistrationSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function RegistrationSuccessModal({
  visible,
  onClose,
}: RegistrationSuccessModalProps) {
  const { theme, isDark } = useTheme();
  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const opacityAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const dynamicStyles = {
    content: { backgroundColor: theme.card },
    closeButton: { backgroundColor: theme.background },
    title: { color: theme.text },
    subtitle: { color: theme.subtext },
    iconColor: theme.text,
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <BlurView intensity={20} tint={isDark ? "dark" : "light"} style={styles.blurContainer}>
        <Animated.View
          style={[
            styles.overlay,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <Pressable style={styles.backdrop} onPress={onClose} />

          <Animated.View
            style={[
              styles.content,
              dynamicStyles.content,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            {/* Close Button */}
            <Pressable style={[styles.closeButton, dynamicStyles.closeButton]} onPress={onClose}>
              <Ionicons name="close" size={24} color={dynamicStyles.iconColor} />
            </Pressable>

            {/* Success Icon - Big Green Check Circle */}
            <View style={styles.iconContainer}>
              <View style={styles.checkCircle}>
                <Ionicons name="checkmark" size={64} color="#FFFFFF" />
              </View>
            </View>

            {/* Title */}
            <Text style={[styles.title, dynamicStyles.title]}>You're In</Text>

            {/* Subtitle */}
            <Text style={[styles.subtitle, dynamicStyles.subtitle]}>
              Thank you. We look forward to seeing you!
            </Text>
          </Animated.View>
        </Animated.View>
      </BlurView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  content: {
    borderRadius: 32,
    padding: 40,
    alignItems: 'center',
    width: SCREEN_WIDTH - 80,
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.3,
    shadowRadius: 30,
    elevation: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  iconContainer: {
    marginBottom: 24,
    marginTop: 20,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981', // Green
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
});
