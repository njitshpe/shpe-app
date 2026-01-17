import React from 'react';
import { View, StyleSheet, useColorScheme } from 'react-native';
import { getAuthPalette } from '@/constants/authTheme';

/**
 * AuthLogo Component
 * Reusable logo for authentication screens (login, signup)
 */
export function AuthLogo() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const palette = getAuthPalette(isDark);

  return (
    <View style={styles.logoContainer}>
      <View
        style={[
          styles.logoCircle,
          {
            backgroundColor: palette.logoBg,
            borderColor: palette.logoBorder,
          },
        ]}
      >
        <View
          style={[
            styles.logoInnerCircle,
            {
              backgroundColor: palette.logoInner,
            },
          ]}
        >
          <View
            style={[
              styles.logoDiamond,
              {
                backgroundColor: palette.logoDiamond,
              },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  logoInnerCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoDiamond: {
    width: 16,
    height: 16,
    transform: [{ rotate: '45deg' }],
    borderRadius: 3,
  },
});
