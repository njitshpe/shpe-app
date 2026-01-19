import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MotiView } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
    useSharedValue,
    useAnimatedProps,
    withTiming,
    withRepeat,
    withSequence,
    Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

const AVATAR_SIZE = 120;
const RING_SIZE = 140;
const RING_STROKE_WIDTH = 4;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface ProfileHeaderProps {
    profilePictureUrl?: string;
    initials: string;
    userTypeBadge: string;
    displayName: string;
    subtitle: string;
    secondarySubtitle: string | null;
    rankColor?: string; // We will use this for the Aura!
    pointsTotal?: number;
    pointsToNextTier?: number;
    isMentor?: boolean;
}

export function ProfileHeader({
    profilePictureUrl,
    initials,
    userTypeBadge,
    displayName,
    subtitle,
    secondarySubtitle,
    rankColor = '#8E8E93', // Default Silver/Grey
    pointsTotal = 0,
    pointsToNextTier = 100,
    isMentor = false,
}: ProfileHeaderProps) {
    const { theme, isDark } = useTheme();

    // Progress Ring Logic
    const totalForTier = pointsTotal + pointsToNextTier;
    const progressPercentage = totalForTier > 0 ? pointsTotal / totalForTier : 0;
    const radius = (RING_SIZE - RING_STROKE_WIDTH) / 2;
    const circumference = 2 * Math.PI * radius;
    const animatedProgress = useSharedValue(0);
    const mentorGlowOpacity = useSharedValue(isDark ? 0.2 : 0.15);

    useEffect(() => {
        animatedProgress.value = withTiming(progressPercentage, {
            duration: 1000,
            easing: Easing.out(Easing.cubic),
        });
    }, [animatedProgress, progressPercentage]);

    useEffect(() => {
        if (isMentor) {
            const baseOpacity = isDark ? 0.2 : 0.15;
            const peakOpacity = isDark ? 0.5 : 0.35;
            mentorGlowOpacity.value = withRepeat(
                withSequence(
                    withTiming(peakOpacity, { duration: 1500, easing: Easing.inOut(Easing.ease) }),
                    withTiming(baseOpacity, { duration: 1500, easing: Easing.inOut(Easing.ease) })
                ),
                -1,
                true
            );
        }
    }, [isMentor, isDark, mentorGlowOpacity]);

    const animatedCircleProps = useAnimatedProps(() => {
        const strokeDashoffset = circumference * (1 - animatedProgress.value);
        return { strokeDashoffset };
    });

    // Theme Colors
    const themedColors = {
        // USE RANK COLOR HERE for the shadow
        haloShadowColor: rankColor, 
        // Increase opacity slightly since rank colors are vibrant
        haloShadowOpacity: isDark ? 0.3 : 0.25,
        mentorHaloShadowOpacity: isDark ? 0.5 : 0.4,
        
        glassBadgeBg: isDark ? 'rgb(45, 45, 45)' : 'rgb(243, 243, 243)',
        glassBadgeBorder: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        ringTrackColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)',
        avatarPlaceholderBg: isDark ? '#333333' : '#E5E7EB',
        avatarBorderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        mentorPulseBorderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.15)',
    };

    return (
        <View style={styles.container}>
            <View style={styles.avatarWrapper}>
                {/* Progress Ring */}
                <View style={styles.progressRingContainer}>
                    <Svg width={RING_SIZE} height={RING_SIZE} style={styles.progressRing}>
                        <Circle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={radius}
                            stroke={themedColors.ringTrackColor}
                            strokeWidth={RING_STROKE_WIDTH}
                            fill="transparent"
                        />
                        <AnimatedCircle
                            cx={RING_SIZE / 2}
                            cy={RING_SIZE / 2}
                            r={radius}
                            stroke={rankColor}
                            strokeWidth={RING_STROKE_WIDTH}
                            fill="transparent"
                            strokeDasharray={circumference}
                            animatedProps={animatedCircleProps}
                            strokeLinecap="round"
                            rotation={-90}
                            origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
                        />
                    </Svg>
                </View>

                {/* The Halo Avatar */}
                <MotiView
                    from={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                    style={styles.avatarHalo}
                >
                    {isMentor && (
                        <MotiView
                            animate={{ opacity: mentorGlowOpacity.value, scale: [1, 1.05, 1] }}
                            transition={{ type: 'timing', duration: 3000, loop: true }}
                            style={[styles.mentorPulseGlow, { borderColor: themedColors.mentorPulseBorderColor }]}
                        />
                    )}

                    {profilePictureUrl ? (
                        <Image source={{ uri: profilePictureUrl }} style={[styles.avatar, { borderColor: themedColors.avatarBorderColor }]} />
                    ) : (
                        <View style={[styles.avatarPlaceholder, { backgroundColor: themedColors.avatarPlaceholderBg, borderColor: themedColors.avatarBorderColor }]}>
                            <Text style={[styles.avatarInitials, { color: theme.text }]}>{initials}</Text>
                        </View>
                    )}

                    {/* Mentor Verification Badge */}
                    {isMentor && (
                        <LinearGradient
                            colors={['#FFD700', '#FFA500', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.verifiedBadge}
                        >
                            <Ionicons name="checkmark" size={14} color="#1a1a1a" />
                        </LinearGradient>
                    )}
                </MotiView>
            </View>

            {/* Rest of the component remains the same... */}
            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 100 }}
                style={styles.badgeContainer}
            >
                <View style={[styles.glassBadge, { backgroundColor: themedColors.glassBadgeBg, borderColor: themedColors.glassBadgeBorder }]}>
                    <Text style={[styles.glassBadgeText, { color: theme.text }]}>{userTypeBadge}</Text>
                </View>
            </MotiView>

            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 150 }}
            >
                <Text style={[styles.nameText, { color: theme.text }]}>{displayName.toUpperCase()}</Text>
            </MotiView>

            <MotiView
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 200 }}
            >
                <Text style={[styles.subtitleText, { color: theme.subtext }]}>{subtitle}</Text>
            </MotiView>

            {secondarySubtitle && (
                <MotiView
                    from={{ opacity: 0, translateY: 10 }}
                    animate={{ opacity: 1, translateY: 0 }}
                    transition={{ type: 'spring', damping: 18, stiffness: 120, delay: 250 }}
                >
                    <Text style={[styles.secondarySubtitleText, { color: theme.subtext }]}>{secondarySubtitle}</Text>
                </MotiView>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center' },
    avatarWrapper: { alignItems: 'center', justifyContent: 'center', marginTop: 60, marginBottom: 8, width: RING_SIZE, height: RING_SIZE },
    progressRingContainer: { position: 'absolute', width: RING_SIZE, height: RING_SIZE },
    progressRing: { transform: [{ rotateZ: '0deg' }] },
    avatarHalo: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.15,
        shadowRadius: 50,
        elevation: 30,
    },
    mentorPulseGlow: { position: 'absolute', width: AVATAR_SIZE + 10, height: AVATAR_SIZE + 10, borderRadius: (AVATAR_SIZE + 10) / 2, backgroundColor: 'transparent', borderWidth: 2 },
    verifiedBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        width: 26,
        height: 26,
        borderRadius: 13,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#1a1a1a',
    },
    avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, borderWidth: 2 },
    avatarPlaceholder: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2, justifyContent: 'center', alignItems: 'center', borderWidth: 2 },
    avatarInitials: { fontSize: 40, fontWeight: 'bold' },
    badgeContainer: { alignItems: 'center', marginTop: -20, marginBottom: 12 },
    glassBadge: { paddingHorizontal: 24, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
    glassBadgeText: { fontSize: 15, fontWeight: '600' },
    nameText: { fontSize: 26, fontWeight: '600', textAlign: 'center', marginBottom: 4, letterSpacing: 1 },
    subtitleText: { fontSize: 16, textAlign: 'center', marginBottom: 8 },
    secondarySubtitleText: { fontSize: 15, textAlign: 'center', marginBottom: 24 },
});