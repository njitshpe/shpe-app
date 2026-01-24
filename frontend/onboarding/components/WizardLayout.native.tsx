import React, { ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS } from '@/constants/colors';
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
  progressType = 'segmented',
}: WizardLayoutProps) {
  const { theme } = useTheme();

  // 1. THE NEW AESTHETIC: Deep NJIT Red fade to Pitch Black
  // Starts with a very dark red at the top, fades to black by 30% down the screen
  const backgroundGradient = ['#250505', '#000000', '#000000']; 

  // 2. THE NEW ACCENT: Modern White/Grey
  const progressColor = '#FFFFFF'; 
  const inactiveColor = 'rgba(255, 255, 255, 0.15)';

  return (
    <LinearGradient
      colors={backgroundGradient as any}
      style={styles.gradient}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 0.35 }} // Gradient ends quickly to leave mostly black
    >
      <SafeAreaView style={styles.safeArea}>
        {/* Force Light Content for Status Bar (White text time/battery) */}
        <StatusBar style="light" />
        
        <View style={styles.container}>
          
          {/* Progress Indicator */}
          <View style={styles.progressContainer}>
            {progressType === 'segmented' ? (
              <View style={styles.segmentedProgress}>
                {Array.from({ length: Math.max(0, totalSteps) }).map((_, index) => (
                  <MotiView
                    key={index}
                    animate={{
                      backgroundColor: index <= currentStep ? progressColor : inactiveColor,
                      opacity: index <= currentStep ? 1 : 0.5,
                    }}
                    transition={{ type: 'timing', duration: 400 }}
                    style={styles.progressSegment}
                  />
                ))}
              </View>
            ) : (
              // Bar Style
              <View style={[styles.progressTrack, { backgroundColor: inactiveColor }]}>
                <MotiView
                  animate={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
                  transition={{ type: 'timing', duration: 300 }}
                  style={[styles.progressFill, { backgroundColor: progressColor }]}
                />
              </View>
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
    overflow: 'hidden', // Clip any stray absolute elements
  },
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    backgroundColor: 'transparent', // Force transparency
  },
  progressContainer: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  segmentedProgress: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: SPACING.xs,
  },
  progressSegment: {
    flex: 1,
    height: 3, // Thinner, more modern
    borderRadius: RADIUS.full,
  },
  progressTrack: {
    height: 4,
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: RADIUS.full,
  },
  headerContainer: {
    width: '100%',
    maxWidth: 448,
    alignSelf: 'center',
    marginTop: 0,
    marginBottom: SPACING.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 20,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: 'transparent', // Ensure no phantom background
  },
});
