import React from 'react';
import { View, StyleSheet, ViewStyle, DimensionValue } from 'react-native';
import { MotiView } from 'moti';
import { useTheme } from '@/contexts/ThemeContext';

interface SkeletonProps {
    width?: DimensionValue;
    height?: DimensionValue;
    borderRadius?: number;
    style?: ViewStyle;
}

export function Skeleton({ width, height, borderRadius = 8, style }: SkeletonProps) {
    const { isDark } = useTheme();

    // Colors for the skeleton animation
    const fromColor = isDark ? '#2A2A2A' : '#E0E0E0';
    const toColor = isDark ? '#3A3A3A' : '#F5F5F5';

    return (
        <MotiView
            from={{ backgroundColor: fromColor }}
            animate={{ backgroundColor: toColor }}
            transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
            }}
            style={[
                styles.skeleton,
                {
                    width,
                    height,
                    borderRadius,
                },
                style,
            ]}
        />
    );
}

const styles = StyleSheet.create({
    skeleton: {
        overflow: 'hidden',
    },
});
