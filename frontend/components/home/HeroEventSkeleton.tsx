import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Skeleton loader for HeroEventCard.
 * Matches the exact layout of the real card for a seamless transition.
 */
export function HeroEventSkeleton() {
    const { theme, isDark } = useTheme();
    const shimmer = useSharedValue(0);

    useEffect(() => {
        shimmer.value = withRepeat(
            withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
            -1,
            true
        );
    }, []);

    const animatedShimmer = useAnimatedStyle(() => ({
        opacity: 0.3 + shimmer.value * 0.4,
    }));

    // Theme-aware colors
    const gradientColors = isDark
        ? ['#1a1a1a', '#0d0d0d', '#000000'] as const
        : ['#e5e5e5', '#f0f0f0', '#F7FAFF'] as const;

    const skeletonColor = isDark ? '#2a2a2a' : '#d0d0d0';
    const dotColor = isDark ? '#ffffff20' : '#00000020';
    const activeDotColor = isDark ? '#ffffff40' : '#00000040';

    const SkeletonBlock = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
        <Animated.View
            style={[
                styles.skeletonBlock,
                { width, height, backgroundColor: skeletonColor },
                animatedShimmer,
                style,
            ]}
        />
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <LinearGradient
                colors={gradientColors}
                style={styles.gradient}
            >
                <View style={styles.content}>
                    {/* Metadata skeleton */}
                    <SkeletonBlock width={120} height={12} />

                    {/* Title skeleton (2 lines) */}
                    <View style={styles.titleGroup}>
                        <SkeletonBlock width="85%" height={32} />
                        <SkeletonBlock width="60%" height={32} style={{ marginTop: 8 }} />
                    </View>

                    {/* Carousel dots skeleton */}
                    <View style={styles.dotsContainer}>
                        <View style={[styles.dot, styles.activeDot, { backgroundColor: activeDotColor }]} />
                        <View style={[styles.dot, { backgroundColor: dotColor }]} />
                        <View style={[styles.dot, { backgroundColor: dotColor }]} />
                    </View>

                    {/* CTA button skeleton */}
                    <SkeletonBlock width={180} height={52} style={styles.buttonSkeleton} />

                    {/* Footer location skeleton */}
                    <SkeletonBlock width={140} height={12} />
                </View>
            </LinearGradient>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        height: SCREEN_HEIGHT * 0.75,
        width: '100%',
    },
    gradient: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 50,
        paddingHorizontal: 24,
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    skeletonBlock: {
        borderRadius: 8,
    },
    titleGroup: {
        alignItems: 'center',
        width: '100%',
    },
    dotsContainer: {
        flexDirection: 'row',
        gap: 6,
        marginBottom: 8,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    activeDot: {
        width: 24,
    },
    buttonSkeleton: {
        borderRadius: 30,
    },
});
