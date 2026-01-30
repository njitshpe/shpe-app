import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

/**
 * Full-page skeleton loader for the Home screen.
 * Mimics the exact layout of the real home screen for a seamless transition
 * after the splash screen fades.
 */
export function HomeScreenSkeleton() {
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
    const skeletonColor = isDark ? '#2a2a2a' : '#d0d0d0';
    const heroGradientColors = isDark
        ? ['#1a1a1a', '#0d0d0d', '#000000'] as const
        : ['#e5e5e5', '#f0f0f0', '#F7FAFF'] as const;
    const cardGradientColors = isDark
        ? ['rgba(255,255,255,0.08)', 'rgba(255,255,255,0.02)'] as const
        : ['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.01)'] as const;
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

    const SkeletonCircle = ({ size, style }: { size: number; style?: any }) => (
        <Animated.View
            style={[
                { width: size, height: size, borderRadius: size / 2, backgroundColor: skeletonColor },
                animatedShimmer,
                style,
            ]}
        />
    );

    return (
        <View style={styles.container}>
            <LinearGradient
                colors={isDark ? ['#1a1a1a', '#000000'] : ['#FFFFFF', '#F5F5F5']}
                style={StyleSheet.absoluteFill}
            />

            <ScrollView
                contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
                showsVerticalScrollIndicator={false}
                scrollEnabled={false}
            >
                {/* 1. Hero Event Skeleton */}
                <View style={styles.heroContainer}>
                    <LinearGradient colors={heroGradientColors} style={styles.heroGradient}>
                        <View style={styles.heroContent}>
                            <SkeletonBlock width={120} height={12} />
                            <View style={styles.heroTitleGroup}>
                                <SkeletonBlock width="85%" height={32} />
                                <SkeletonBlock width="60%" height={32} style={{ marginTop: 8 }} />
                            </View>
                            <View style={styles.dotsContainer}>
                                <View style={[styles.dot, styles.activeDot, { backgroundColor: activeDotColor }]} />
                                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                            </View>
                            <SkeletonBlock width={180} height={52} style={styles.buttonSkeleton} />
                            <SkeletonBlock width={140} height={12} />
                        </View>
                    </LinearGradient>
                </View>

                {/* 2. Quick Actions Skeleton */}
                <View style={styles.quickActionsContainer}>
                    <SkeletonBlock width={100} height={11} style={styles.sectionHeader} />
                    <View style={styles.quickActionsRow}>
                        {[...Array(4)].map((_, i) => (
                            <LinearGradient
                                key={i}
                                colors={cardGradientColors}
                                style={[styles.quickActionCard, { borderColor: theme.border }]}
                            >
                                <SkeletonCircle size={36} />
                                <SkeletonBlock width={60} height={11} />
                            </LinearGradient>
                        ))}
                    </View>
                </View>

                {/* 3. Announcements Skeleton */}
                <View style={styles.announcementsContainer}>
                    <SkeletonBlock width={110} height={11} style={styles.sectionHeader} />
                    <LinearGradient
                        colors={isDark
                            ? ['rgba(212, 175, 55, 0.18)', 'rgba(212, 175, 55, 0.05)']
                            : ['rgba(212, 175, 55, 0.15)', 'rgba(212, 175, 55, 0.03)']}
                        style={[styles.announcementCard, { borderColor: isDark ? 'rgba(212, 175, 55, 0.3)' : 'rgba(212, 175, 55, 0.4)' }]}
                    >
                        <SkeletonCircle size={36} />
                        <View style={styles.announcementText}>
                            <SkeletonBlock width={100} height={12} />
                            <SkeletonBlock width="90%" height={13} style={{ marginTop: 4 }} />
                        </View>
                    </LinearGradient>
                </View>

                {/* 4. Committees Skeleton (first 4 items) */}
                <View style={styles.committeesContainer}>
                    <SkeletonBlock width={90} height={11} style={styles.sectionHeader} />
                    <View style={styles.committeesList}>
                        {[...Array(4)].map((_, i) => (
                            <LinearGradient
                                key={i}
                                colors={cardGradientColors}
                                style={[styles.committeeCard, { borderColor: theme.border }]}
                            >
                                <SkeletonCircle size={36} />
                                <SkeletonBlock width={120} height={14} style={{ flex: 1 }} />
                            </LinearGradient>
                        ))}
                    </View>
                </View>

                {/* 5. Mission Log Skeleton */}
                <View style={styles.missionLogContainer}>
                    <View style={styles.missionLogHeader}>
                        <SkeletonBlock width={90} height={11} />
                        <SkeletonBlock width={50} height={10} />
                    </View>
                    <View style={styles.missionLogRow}>
                        {[...Array(2)].map((_, i) => (
                            <LinearGradient
                                key={i}
                                colors={cardGradientColors}
                                style={[styles.missionCard, { borderColor: theme.border }]}
                            >
                                <View style={styles.missionDateBlock}>
                                    <SkeletonBlock width={24} height={9} />
                                    <SkeletonBlock width={20} height={18} style={{ marginTop: 2 }} />
                                </View>
                                <View style={[styles.missionDivider, { backgroundColor: theme.border }]} />
                                <View style={styles.missionInfo}>
                                    <SkeletonBlock width={100} height={12} />
                                    <SkeletonBlock width={70} height={10} style={{ marginTop: 4 }} />
                                </View>
                            </LinearGradient>
                        ))}
                    </View>
                </View>

                {/* 6. Rank Trajectory Skeleton */}
                <View style={styles.rankContainer}>
                    <SkeletonBlock width={120} height={11} style={styles.sectionHeader} />
                    <LinearGradient
                        colors={cardGradientColors}
                        style={[styles.rankCard, { borderColor: theme.border }]}
                    >
                        <View style={styles.rankTopRow}>
                            <View style={styles.rankInfo}>
                                <SkeletonCircle size={32} />
                                <SkeletonBlock width={100} height={14} />
                            </View>
                            <SkeletonBlock width={70} height={12} />
                        </View>
                        <SkeletonBlock width="100%" height={6} style={styles.progressBar} />
                        <View style={styles.rankFooter}>
                            <SkeletonBlock width={150} height={10} />
                        </View>
                    </LinearGradient>
                </View>
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollContent: {
        // Dynamic padding
    },
    skeletonBlock: {
        borderRadius: 8,
    },

    // Hero Section
    heroContainer: {
        height: SCREEN_HEIGHT * 0.75,
        width: '100%',
    },
    heroGradient: {
        flex: 1,
        justifyContent: 'flex-end',
        paddingBottom: 50,
        paddingHorizontal: 24,
    },
    heroContent: {
        alignItems: 'center',
        gap: 16,
    },
    heroTitleGroup: {
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

    // Quick Actions
    quickActionsContainer: {
        marginTop: -30,
        marginBottom: 30,
    },
    sectionHeader: {
        marginLeft: SPACING.lg,
        marginBottom: SPACING.md,
    },
    quickActionsRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: 12,
    },
    quickActionCard: {
        width: 130,
        height: 90,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        gap: 10,
    },

    // Announcements
    announcementsContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xl,
    },
    announcementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        gap: 16,
    },
    announcementText: {
        flex: 1,
        gap: 4,
    },

    // Committees
    committeesContainer: {
        marginBottom: SPACING.xl,
        paddingHorizontal: SPACING.lg,
    },
    committeesList: {
        gap: 8,
    },
    committeeCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 12,
        borderWidth: 1,
        gap: 12,
    },

    // Mission Log
    missionLogContainer: {
        marginBottom: SPACING.xxl,
    },
    missionLogHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.md,
    },
    missionLogRow: {
        flexDirection: 'row',
        paddingHorizontal: SPACING.lg,
        gap: 12,
    },
    missionCard: {
        width: 220,
        height: 70,
        borderRadius: 16,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        borderWidth: 1,
    },
    missionDateBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
    },
    missionDivider: {
        width: 1,
        height: '50%',
        marginHorizontal: 12,
    },
    missionInfo: {
        flex: 1,
        justifyContent: 'center',
    },

    // Rank Trajectory
    rankContainer: {
        paddingHorizontal: SPACING.lg,
        marginBottom: SPACING.xxl + 20,
    },
    rankCard: {
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        gap: 16,
    },
    rankTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    rankInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    progressBar: {
        borderRadius: 3,
    },
    rankFooter: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
});
