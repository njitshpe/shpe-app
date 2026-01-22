import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export type RankTier = 'unranked' | 'bronze' | 'silver' | 'gold' | string;

interface GradientAvatarBorderProps {
    tier?: RankTier;
    size: number;
    borderWidth?: number;
    children: React.ReactNode;
    style?: ViewStyle;
}

const TIER_GRADIENTS: Record<string, readonly [string, string]> = {
    bronze: ['#CD7F32', '#8B4513'],  // Copper to Deep Brown
    silver: ['#E0E0E0', '#757575'],  // White to Grey
    gold: ['#FFD700', '#B8860B'],    // Bright Gold to Amber
};

export function GradientAvatarBorder({
    tier,
    size,
    borderWidth = 2,
    children,
    style,
}: GradientAvatarBorderProps) {
    const normalizedTier = tier?.toLowerCase();
    const gradientColors = normalizedTier ? TIER_GRADIENTS[normalizedTier] : null;

    // If unranked or no tier, render children without border
    if (!gradientColors) {
        return <View style={style}>{children}</View>;
    }

    const outerSize = size + borderWidth * 2;
    const borderRadius = outerSize / 2;

    return (
        <View style={[styles.container, style]}>
            <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                    styles.gradientBorder,
                    {
                        width: outerSize,
                        height: outerSize,
                        borderRadius,
                        padding: borderWidth,
                    },
                ]}
            >
                <View
                    style={[
                        styles.innerContainer,
                        {
                            width: size,
                            height: size,
                            borderRadius: size / 2,
                        },
                    ]}
                >
                    {children}
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    gradientBorder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    innerContainer: {
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
});
