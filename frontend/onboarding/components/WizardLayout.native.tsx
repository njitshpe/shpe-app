import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHPE_COLORS, SPACING, RADIUS } from '@/constants/colors';
import WizardBackButton from './WizardBackButton.native';

export type WizardVariant = 'student' | 'alumni' | 'guest';

interface WizardLayoutProps {
  currentStep: number;
  totalSteps: number;
  onBack: () => void;
  hasFormData?: boolean;
  showConfirmation?: boolean;
  headerRight?: ReactNode;
  children: ReactNode;
  variant?: WizardVariant;
  progressType?: 'segmented' | 'bar';
}

export default function WizardLayout({
  currentStep,
  totalSteps,
  onBack,
  hasFormData = false,
  showConfirmation = false,
  headerRight,
  children,
  variant = 'student',
  progressType = 'segmented',
}: WizardLayoutProps) {
  const { theme, isDark } = useTheme();

  // Variant-specific colors
  const getProgressColor = () => {
    switch (variant) {
      case 'student':
        return SHPE_COLORS.accentBlueBright;
      case 'alumni':
        return '#0D9488'; // Teal
      case 'guest':
        return isDark ? '#8B5CF6' : '#7C3AED'; // Purple
      default:
        return SHPE_COLORS.accentBlueBright;
    }
  };

  const backgroundGradient = isDark ? GRADIENTS.darkBackground : GRADIENTS.lightBackground;
  const progressColor = getProgressColor();
  const progressPercentage = ((currentStep + 1) / totalSteps) * 100;

  return (
    <LinearGradient
      colors={backgroundGradient}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
    >
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style={isDark ? 'light' : 'dark'} />
        <View style={styles.container}>
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {progressType === 'segmented' ? (
              <>
                <View style={styles.segmentedProgress}>
                  {Array.from({ length: totalSteps }).map((_, index) => (
                    <MotiView
                      key={index}
                      animate={{
                        backgroundColor:
                          index <= currentStep
                            ? progressColor
                            : isDark
                              ? 'rgba(255, 255, 255, 0.2)'
                              : theme.border,
                      }}
                      transition={{ type: 'timing', duration: 400 }}
                      style={styles.progressSegment}
                    />
                  ))}
                </View>
                <Text style={[styles.progressText, { color: theme.subtext }]}>
                  Step {currentStep + 1} of {totalSteps}
                </Text>
              </>
            ) : (
              <>
                <View
                  style={[
                    styles.progressTrack,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.16)'
                        : 'rgba(11, 22, 48, 0.12)',
                    },
                  ]}
                >
                  <MotiView
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ type: 'timing', duration: 300 }}
                    style={[styles.progressFill, { backgroundColor: progressColor }]}
                  />
                </View>
                <Text style={[styles.progressText, { color: theme.subtext }]}>
                  Step {currentStep + 1} of {totalSteps}
                </Text>
              </>
            )}
          </View>

          {/* Navigation Row */}
          <View style={styles.headerContainer}>
            <WizardBackButton
              onPress={onBack}
              hasFormData={hasFormData}
              showConfirmation={showConfirmation}
            />
            {headerRight && <View style={styles.headerRight}>{headerRight}</View>}
          </View>

          {/* Content */}
          <View style={styles.contentContainer}>{children}</View>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  progressContainer: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  segmentedProgress: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: RADIUS.full,
  },
  progressTrack: {
    height: 8,
    width: '100%',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
  headerContainer: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerRight: {
    marginLeft: 'auto',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
  },
});
