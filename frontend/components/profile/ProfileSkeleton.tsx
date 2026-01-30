import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    Easing,
} from 'react-native-reanimated';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/colors';

/**
 * Full-page skeleton loader for the Profile screen.
 * Mimics the exact layout of the real profile for a seamless transition.
 */
export const ProfileSkeleton = () => {
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
    const glassCardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const glassCardBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';
    const rankCardBg = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.9)';

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
            {/* Header Section - Avatar + Name */}
            <View style={styles.headerSection}>
                {/* Avatar Ring */}
                <View style={styles.avatarContainer}>
                    <View style={[styles.avatarRing, { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
                        <SkeletonCircle size={120} />
                    </View>
                </View>

                {/* User Type Badge */}
                <SkeletonBlock width={80} height={20} style={styles.badge} />

                {/* Display Name */}
                <SkeletonBlock width={180} height={28} style={{ marginBottom: 8 }} />

                {/* Subtitle */}
                <SkeletonBlock width={140} height={16} style={{ marginBottom: 6 }} />

                {/* Secondary Subtitle */}
                <SkeletonBlock width={100} height={14} />
            </View>

            {/* Rank Progress Card */}
            <View style={styles.rankCardContainer}>
                {Platform.OS === 'ios' ? (
                    <BlurView intensity={20} tint={isDark ? 'dark' : 'light'} style={[styles.rankCard, { borderColor: glassCardBorder }]}>
                        <View style={styles.rankCardContent}>
                            {/* Points */}
                            <View style={styles.rankColumn}>
                                <SkeletonBlock width={50} height={24} />
                                <SkeletonBlock width={60} height={10} style={{ marginTop: 4 }} />
                            </View>

                            {/* Divider */}
                            <View style={[styles.rankDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

                            {/* Tier */}
                            <View style={styles.rankColumn}>
                                <SkeletonBlock width={70} height={24} />
                                <SkeletonBlock width={40} height={10} style={{ marginTop: 4 }} />
                            </View>
                        </View>
                    </BlurView>
                ) : (
                    <View style={[styles.rankCard, { backgroundColor: rankCardBg, borderColor: glassCardBorder }]}>
                        <View style={styles.rankCardContent}>
                            {/* Points */}
                            <View style={styles.rankColumn}>
                                <SkeletonBlock width={50} height={24} />
                                <SkeletonBlock width={60} height={10} style={{ marginTop: 4 }} />
                            </View>

                            {/* Divider */}
                            <View style={[styles.rankDivider, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} />

                            {/* Tier */}
                            <View style={styles.rankColumn}>
                                <SkeletonBlock width={70} height={24} />
                                <SkeletonBlock width={40} height={10} style={{ marginTop: 4 }} />
                            </View>
                        </View>
                    </View>
                )}

                {/* Academic Path Progress (placeholder) */}
                <View style={styles.academicPathSkeleton}>
                    <View style={styles.academicPathHeader}>
                        <SkeletonBlock width={100} height={10} />
                        <SkeletonBlock width={80} height={12} />
                    </View>
                    <SkeletonBlock width="100%" height={4} style={{ borderRadius: 2 }} />
                </View>
            </View>

            {/* Content Cards */}
            <View style={styles.contentContainer}>
                {/* Social Links Row */}
                <View style={styles.socialLinksRow}>
                    <SkeletonCircle size={40} />
                    <SkeletonCircle size={40} />
                    <SkeletonCircle size={40} />
                </View>

                {/* About Card */}
                <View style={[styles.glassCard, { backgroundColor: glassCardBg, borderColor: glassCardBorder }]}>
                    <SkeletonBlock width={60} height={18} style={{ marginBottom: 16 }} />
                    <SkeletonBlock width="100%" height={16} style={{ marginBottom: 8 }} />
                    <SkeletonBlock width="85%" height={16} style={{ marginBottom: 8 }} />
                    <SkeletonBlock width="70%" height={16} style={{ marginBottom: 20 }} />
                    {/* Edit Profile Button */}
                    <SkeletonBlock width="100%" height={48} style={{ borderRadius: 12 }} />
                </View>

                {/* Interests Card */}
                <View style={[styles.glassCard, { backgroundColor: glassCardBg, borderColor: glassCardBorder }]}>
                    <SkeletonBlock width={80} height={18} style={{ marginBottom: 16 }} />
                    <View style={styles.interestsRow}>
                        <SkeletonBlock width={90} height={32} style={{ borderRadius: 16 }} />
                        <SkeletonBlock width={110} height={32} style={{ borderRadius: 16 }} />
                        <SkeletonBlock width={80} height={32} style={{ borderRadius: 16 }} />
                        <SkeletonBlock width={100} height={32} style={{ borderRadius: 16 }} />
                    </View>
                </View>

                {/* Badges Card */}
                <View style={[styles.glassCard, { backgroundColor: glassCardBg, borderColor: glassCardBorder }]}>
                    <SkeletonBlock width={70} height={18} style={{ marginBottom: 16 }} />
                    <View style={styles.badgesRow}>
                        <View style={styles.badgeItem}>
                            <SkeletonCircle size={64} />
                            <SkeletonBlock width={50} height={11} style={{ marginTop: 8 }} />
                        </View>
                        <View style={styles.badgeItem}>
                            <SkeletonCircle size={64} />
                            <SkeletonBlock width={55} height={11} style={{ marginTop: 8 }} />
                        </View>
                        <View style={styles.badgeItem}>
                            <SkeletonCircle size={64} />
                            <SkeletonBlock width={45} height={11} style={{ marginTop: 8 }} />
                        </View>
                    </View>
                </View>

                {/* Posts Section */}
                <View style={styles.postsSection}>
                    <SkeletonBlock width={50} height={18} style={{ marginBottom: 20 }} />
                    <SkeletonBlock width="100%" height={120} style={{ borderRadius: 16, marginBottom: 16 }} />
                    <SkeletonBlock width="100%" height={120} style={{ borderRadius: 16 }} />
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    skeletonBlock: {
        borderRadius: 8,
    },

    // Header Section
    headerSection: {
        alignItems: 'center',
        paddingTop: SPACING.xl,
        paddingBottom: 24,
    },
    avatarContainer: {
        marginBottom: SPACING.md,
    },
    avatarRing: {
        width: 140,
        height: 140,
        borderRadius: 70,
        borderWidth: 4,
        justifyContent: 'center',
        alignItems: 'center',
    },
    badge: {
        borderRadius: 12,
        marginBottom: 12,
    },

    // Rank Card
    rankCardContainer: {
        marginTop: -20,
        paddingTop: 20,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    rankCard: {
        borderRadius: 20,
        borderWidth: 1,
        overflow: 'hidden',
        marginBottom: 12,
    },
    rankCardContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 16,
        paddingHorizontal: 24,
    },
    rankColumn: {
        alignItems: 'center',
        flex: 1,
    },
    rankDivider: {
        width: 1,
        height: 40,
        marginHorizontal: 16,
    },
    academicPathSkeleton: {
        marginTop: 8,
    },
    academicPathHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },

    // Content Container
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },

    // Social Links
    socialLinksRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 28,
        marginBottom: 28,
    },

    // Glass Cards
    glassCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        marginBottom: 16,
    },

    // Interests
    interestsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },

    // Badges
    badgesRow: {
        flexDirection: 'row',
        gap: 16,
    },
    badgeItem: {
        alignItems: 'center',
    },

    // Posts
    postsSection: {
        paddingTop: 8,
        paddingBottom: 40,
    },
});
