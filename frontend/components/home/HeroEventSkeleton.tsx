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

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Skeleton loader for HeroEventCard.
 * Matches the exact layout of the real card for a seamless transition.
 */
export function HeroEventSkeleton() {
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

    const SkeletonBlock = ({ width, height, style }: { width: number | string; height: number; style?: any }) => (
        <Animated.View
            style={[
                styles.skeletonBlock,
                { width, height },
                animatedShimmer,
                style,
            ]}
        />
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={['#1a1a1a', '#0d0d0d', '#000000']}
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
                        <View style={[styles.dot, styles.activeDot]} />
                        <View style={styles.dot} />
                        <View style={styles.dot} />
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
        backgroundColor: '#000',
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
        backgroundColor: '#2a2a2a',
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
        backgroundColor: '#ffffff20',
    },
    activeDot: {
        backgroundColor: '#ffffff40',
        width: 24,
    },
    buttonSkeleton: {
        borderRadius: 30,
    },
});
