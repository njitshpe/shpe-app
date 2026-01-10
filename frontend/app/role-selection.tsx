import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  useColorScheme,
  Pressable,
  Animated,
  Modal,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuth } from '@/contexts/AuthContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS, SHADOWS } from '@/constants/colors';
import { LegalTextDisplay } from '@/components/legal/LegalTextDisplay';
import { TERMS_OF_SERVICE, PRIVACY_POLICY } from '@/constants/legal';

type Role = 'student' | 'alumni' | 'guest' | null;

export default function RoleSelectionScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { user, updateUserMetadata } = useAuth();
  const [selectedRole, setSelectedRole] = useState<Role>(null);
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  // Animated scale values for cards
  const [studentScale] = useState(new Animated.Value(1));
  const [alumniScale] = useState(new Animated.Value(1));
  const [guestScale] = useState(new Animated.Value(1));

  const handleCardPress = (role: 'student' | 'alumni' | 'guest', scaleValue: Animated.Value) => {
    // Trigger haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Animate scale down
    Animated.sequence([
      Animated.timing(scaleValue, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleValue, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Set selection and navigate after animation
    setSelectedRole(role);

    setTimeout(async () => {
      // Update user metadata with selected role
      if (user) {
        await updateUserMetadata({ user_type: role });
      }

      // Navigate to appropriate onboarding flow
      if (role === 'student') {
        router.replace('/onboarding');
      } else if (role === 'alumni') {
        router.replace('/alumni-onboarding');
      } else if (role === 'guest') {
        router.replace('/guest-onboarding');
      }
    }, 200);
  };

  // Dynamic colors
  const colors = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
    cardBackground: isDark ? 'rgba(30, 41, 59, 0.8)' : 'rgba(255, 255, 255, 0.9)',
    cardBorder: isDark ? 'rgba(51, 65, 85, 0.5)' : 'rgba(229, 231, 235, 0.5)',
    studentAccent: SHPE_COLORS.sunsetOrange,
    alumniAccent: isDark ? '#14B8A6' : '#0D9488', // Teal
    guestAccent: isDark ? '#8B5CF6' : '#7C3AED', // Purple
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={styles.container}>
        {/* Header Section - Upper 1/3 */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Welcome to the Familia!
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            To give you the best experience, tell us which path describes you.
          </Text>
        </View>

        {/* Cards Section - Lower 2/3 */}
        <View style={styles.cardsContainer}>
          {/* Student Card */}
          <Animated.View
            style={[
              { transform: [{ scale: studentScale }] },
              selectedRole && selectedRole !== 'student' && styles.dimmedCard,
            ]}
          >
            <Pressable
              onPress={() => handleCardPress('student', studentScale)}
              style={styles.cardWrapper}
              accessibilityLabel="Select Current Student"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={
                  selectedRole === 'student'
                    ? [`${colors.studentAccent}18`, 'transparent']
                    : [`${colors.studentAccent}08`, 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientGlow}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: colors.cardBackground,
                      borderColor: selectedRole === 'student' ? colors.studentAccent : colors.cardBorder,
                      borderWidth: 2,
                    },
                    selectedRole === 'student' && SHADOWS.medium,
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.studentAccent}20` }]}>
                    <Ionicons name="school" size={32} color={colors.studentAccent} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Current Student</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      I am an undergrad or grad student at NJIT.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* Alumni Card */}
          <Animated.View
            style={[
              { transform: [{ scale: alumniScale }] },
              selectedRole && selectedRole !== 'alumni' && styles.dimmedCard,
            ]}
          >
            <Pressable
              onPress={() => handleCardPress('alumni', alumniScale)}
              style={styles.cardWrapper}
              accessibilityLabel="Select Professional or Alumni"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={
                  selectedRole === 'alumni'
                    ? [`${colors.alumniAccent}18`, 'transparent']
                    : [`${colors.alumniAccent}08`, 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientGlow}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      borderColor: selectedRole === 'alumni' ? colors.alumniAccent : 'rgba(148, 163, 184, 0.2)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.alumniAccent}20` }]}>
                    <Ionicons name="briefcase" size={32} color={colors.alumniAccent} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>Professional / Alumni</Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      I am a working professional or SHPE graduate.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>

          {/* External Guest Card */}
          <Animated.View
            style={[
              { transform: [{ scale: guestScale }] },
              selectedRole && selectedRole !== 'guest' && styles.dimmedCard,
            ]}
          >
            <Pressable
              onPress={() => handleCardPress('guest', guestScale)}
              style={styles.cardWrapper}
              accessibilityLabel="Select External Guest or Visiting Student"
              accessibilityRole="button"
            >
              <LinearGradient
                colors={
                  selectedRole === 'guest'
                    ? [`${colors.guestAccent}18`, 'transparent']
                    : [`${colors.guestAccent}08`, 'transparent']
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.gradientGlow}
              >
                <View
                  style={[
                    styles.card,
                    {
                      backgroundColor: 'rgba(30, 41, 59, 0.7)',
                      borderColor: selectedRole === 'guest' ? colors.guestAccent : 'rgba(148, 163, 184, 0.2)',
                      borderWidth: 1,
                    },
                  ]}
                >
                  <View style={[styles.iconContainer, { backgroundColor: `${colors.guestAccent}20` }]}>
                    <Ionicons name="globe-outline" size={32} color={colors.guestAccent} />
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.cardTitle, { color: colors.text }]}>
                      External Guest / Visiting Student
                    </Text>
                    <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>
                      I'm visiting from another university or organization.
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </Pressable>
          </Animated.View>
        </View>

        {/* Legal Text Footer */}
        <View style={styles.footer}>
          <Text style={[styles.legalText, { color: colors.textSecondary }]}>
            By continuing, you accept our{' '}
            <Text style={[styles.linkText, { color: SHPE_COLORS.lightBlue }]} onPress={() => setShowTermsModal(true)}>
              Terms of Service
            </Text>
            {' '}and{' '}
            <Text style={[styles.linkText, { color: SHPE_COLORS.lightBlue }]} onPress={() => setShowPrivacyModal(true)}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* Terms Modal */}
        <Modal
          visible={showTermsModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowTermsModal(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Terms of Service</Text>
              <TouchableOpacity onPress={() => setShowTermsModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <LegalTextDisplay sections={TERMS_OF_SERVICE} />
            </ScrollView>
          </SafeAreaView>
        </Modal>

        {/* Privacy Modal */}
        <Modal
          visible={showPrivacyModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowPrivacyModal(false)}
        >
          <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
            <View style={[styles.modalHeader, { borderBottomColor: colors.cardBorder }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Privacy Policy</Text>
              <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent}>
              <LegalTextDisplay sections={PRIVACY_POLICY} />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  cardsContainer: {
    flex: 2,
    justifyContent: 'center',
    gap: 20,
  },
  cardWrapper: {
    width: '100%',
  },
  gradientGlow: {
    borderRadius: 16,
    padding: 2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 5,
  },
  dimmedCard: {
    opacity: 0.5,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  cardSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  legalText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  linkText: {
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  modalClose: {
    padding: 4,
  },
  modalContent: {
    padding: 20,
    paddingBottom: 40,
  },
});
