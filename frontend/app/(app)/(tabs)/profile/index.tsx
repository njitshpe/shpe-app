import React, { useState, useMemo } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Modal,
    Alert,
    ActivityIndicator,
    ScrollView,
    RefreshControl,
    Platform,
    Pressable,
    ImageBackground,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';

import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EditProfileScreen } from '@/components/profile';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';
import { useProfileDisplay } from '@/hooks/profile/useProfileDisplay';
import { useRank } from '@/hooks/profile/useRank';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { RankProgressCard } from '@/components/profile/RankProgressCard';
import { BadgeGrid, Badge } from '@/components/profile/BadgeGrid';
import { FeedList } from '@/components/feed/FeedList';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { INTEREST_OPTIONS, InterestType } from '@/types/userProfile';

export default function ProfileScreen() {
    const { user, profile, loadProfile, profileLoading } = useAuth();
    const { theme, isDark } = useTheme();
    const insets = useSafeAreaInsets();

    const { tier, pointsTotal, pointsToNextTier, refreshRank } = useRank();

    React.useEffect(() => {
        if (user?.id) {
            if (!profile && !profileLoading) {
                loadProfile(user.id);
            }
            refreshRank();
        }
    }, [user?.id, profile, profileLoading, loadProfile, refreshRank]);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showResumeViewer, setShowResumeViewer] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    const { signedUrl, loading: resumeLoading } = useSecureResume(profile?.resume_url || null);

    const profileDisplay = useProfileDisplay({ profile, user, pointsTotal, tier });

    // Calculate graduation progress for students
    const graduationProgress = useMemo(() => {
        if (profile?.user_type !== 'student' || !profile?.graduation_year) {
            return null;
        }
        const currentYear = new Date().getFullYear();
        const graduationYear = profile.graduation_year;
        const startYear = graduationYear - 4;
        const totalYears = 4;
        const yearsCompleted = currentYear - startYear;
        const progress = Math.min(Math.max(yearsCompleted / totalYears, 0), 1);
        return {
            progress,
            yearsRemaining: Math.max(graduationYear - currentYear, 0),
            graduationYear,
        };
    }, [profile?.user_type, profile?.graduation_year]);

    // Get user interests with labels
    const userInterests = useMemo(() => {
        if (!profile?.interests || !Array.isArray(profile.interests)) {
            return [];
        }
        return profile.interests
            .map((interest: InterestType) => {
                const option = INTEREST_OPTIONS.find((opt) => opt.value === interest);
                return option ? option.label : null;
            })
            .filter(Boolean);
    }, [profile?.interests]);

    // Build badges array
    const badges = useMemo((): Badge[] => {
        const result: Badge[] = [];

        // Rank Badge
        if (tier) {
            result.push({
                id: 'rank',
                icon: 'trophy',
                label: tier,
                color: profileDisplay.rankColor,
            });
        }

        // Member Badge
        result.push({
            id: 'member',
            icon: 'shield-checkmark',
            label: 'Member',
            color: theme.text,
        });

        // Mentor Badge (only if mentorship_available)
        if (profile?.mentorship_available) {
            result.push({
                id: 'mentor',
                icon: 'school',
                label: 'Mentor',
                color: '#FFD700',
            });
        }

        // Alumni Badge (only if user_type is alumni)
        if (profile?.user_type === 'alumni') {
            result.push({
                id: 'alumni',
                icon: 'time',
                label: 'Alumni',
                color: '#C0C0C0',
            });
        }

        return result;
    }, [tier, profileDisplay.rankColor, profile?.mentorship_available, profile?.user_type, theme.text]);

    const handleOpenResume = () => {
        if (!signedUrl) {
            if (resumeLoading) {
                Alert.alert('Please wait', 'Secure link is generating...');
            } else {
                Alert.alert('No Resume', "We couldn't find a link to your resume.");
            }
            return;
        }
        setShowResumeViewer(true);
    };

    const handleProfileUpdate = async () => {
        if (user?.id) {
            await loadProfile(user.id);
        }
    };

    const onRefresh = async () => {
        if (user?.id) {
            setRefreshing(true);
            await Promise.all([loadProfile(user.id), refreshRank()]);
            setRefreshing(false);
        }
    };

    // Theme-based colors
    const gradientColors = isDark
        ? (['#1a1a1a', '#000000'] as const)
        : (['#FFFFFF', '#F5F5F5'] as const);

    const glassCardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const glassCardBorder = 'rgba(255,255,255,0.08)';

    // Floating settings button component (Visuals Only)
    const SettingsButton = () => {
        // Use a lighter glass effect for dark mode instead of solid grey
        const fallbackBg = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(255, 255, 255, 0.8)';

        if (Platform.OS === 'ios') {
            return (
                <Link href="/(app)/(tabs)/profile/settings" asChild>
                    <Pressable style={styles.settingsButtonVisual}>
                        <BlurView
                            intensity={40}
                            tint={isDark ? 'dark' : 'light'}
                            style={styles.settingsBlur}
                        >
                            <Ionicons name="settings-outline" size={22} color={theme.text} />
                        </BlurView>
                    </Pressable>
                </Link>
            );
        }
        return (
            <Link href="/(app)/(tabs)/profile/settings" asChild>
                <Pressable style={styles.settingsButtonVisual}>
                    <View
                        style={[
                            styles.settingsBlur,
                            styles.settingsAndroid,
                            { backgroundColor: fallbackBg },
                        ]}
                    >
                        <Ionicons name="settings-outline" size={22} color={theme.text} />
                    </View>
                </Pressable>
            </Link>
        );
    };

    return (
        <View style={[styles.root, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} translucent />

            {/* 1. Background Layer */}
            {profile?.profile_picture_url ? (
                <ImageBackground
                    source={{ uri: profile.profile_picture_url }}
                    style={StyleSheet.absoluteFill}
                    blurRadius={Platform.OS === 'android' ? 25 : 35}
                >
                    <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(255,255,255,0.7)' }]} />
                    {Platform.OS === 'ios' && (
                        <BlurView intensity={60} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
                    )}
                </ImageBackground>
            ) : (
                <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
            )}

            {/* 2. Content Layer (SafeAreaView for padding only) */}
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                {profileLoading ? (
                    <ProfileSkeleton />
                ) : (
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.primary}
                                colors={[theme.primary]}
                            />
                        }
                    >
                        {/* Index 0: Profile Header */}
                        <View style={styles.headerSection}>
                            {profile && (
                                <ProfileHeader
                                    profilePictureUrl={profile.profile_picture_url ?? undefined}
                                    initials={profileDisplay.initials}
                                    userTypeBadge={profileDisplay.userTypeBadge}
                                    displayName={profileDisplay.displayName}
                                    subtitle={profileDisplay.subtitle}
                                    secondarySubtitle={profileDisplay.secondarySubtitle}
                                    rankColor={profileDisplay.rankColor}
                                    pointsTotal={pointsTotal}
                                    pointsToNextTier={pointsToNextTier}
                                    isMentor={profile.mentorship_available ?? false}
                                />
                            )}
                        </View>

                        {/* Index 1: Sticky Rank Card Container */}
                        <View style={styles.stickyRankContainer}>
                            <View style={styles.rankCardWrapper}>
                                <RankProgressCard
                                    pointsTotal={pointsTotal}
                                    tier={tier}
                                    rankColor={profileDisplay.rankColor}
                                    pointsToNextTier={pointsToNextTier}
                                />
                            </View>

                            {/* Academic Path Progress Bar (Students Only) */}
                            {graduationProgress && (
                                <View style={styles.academicPathContainer}>
                                    <View style={styles.academicPathHeader}>
                                        <Text
                                            style={[styles.academicPathLabel, { color: theme.subtext }]}
                                        >
                                            ACADEMIC PATH
                                        </Text>
                                        <Text
                                            style={[styles.academicPathYear, { color: theme.text }]}
                                        >
                                            Class of {graduationProgress.graduationYear}
                                        </Text>
                                    </View>
                                    <View
                                        style={[
                                            styles.progressBarTrack,
                                            {
                                                backgroundColor: isDark
                                                    ? '#000000'
                                                    : 'rgba(0,0,0,0.08)',
                                            },
                                        ]}
                                    >
                                        <View
                                            style={[
                                                styles.progressBarFill,
                                                {
                                                    width: `${graduationProgress.progress * 100}%`,
                                                    backgroundColor: '#D22630',
                                                },
                                            ]}
                                        />
                                    </View>
                                </View>
                            )}
                        </View>

                        {/* Content Cards (Glass Stack) */}
                        <View style={styles.contentContainer}>
                            {/* Social Links */}
                            {profile && (
                                <ProfileSocialLinks
                                    profile={profile}
                                    displayName={profileDisplay.displayName}
                                    themeText={theme.text}
                                    themeSubtext={theme.subtext}
                                    isDark={isDark}
                                    onOpenResume={handleOpenResume}
                                    onMentorshipUpdate={async () => {
                                        if (user?.id) await loadProfile(user.id);
                                    }}
                                />
                            )}

                            {/* About Card */}
                            <View
                                style={[
                                    styles.glassCard,
                                    {
                                        backgroundColor: glassCardBg,
                                        borderColor: glassCardBorder,
                                    },
                                ]}
                            >
                                <Text style={[styles.cardTitle, { color: theme.text }]}>About</Text>
                                {profile?.bio ? (
                                    <Text style={[styles.bioText, { color: theme.subtext }]}>
                                        {profile.bio}
                                    </Text>
                                ) : (
                                    <Text style={[styles.emptyText, { color: theme.subtext }]}>
                                        Add a bio to tell others about yourself
                                    </Text>
                                )}

                                {/* Edit Profile Button (Luxury Style) */}
                                <TouchableOpacity
                                    style={[
                                        styles.editProfileButton,
                                        {
                                            backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                        },
                                    ]}
                                    onPress={() => setShowEditProfile(true)}
                                >
                                    <Text
                                        style={[
                                            styles.editProfileButtonText,
                                            { color: isDark ? '#000000' : '#FFFFFF' },
                                        ]}
                                    >
                                        Edit Profile
                                    </Text>
                                </TouchableOpacity>
                            </View>

                            {/* Interests Card */}
                            {userInterests.length > 0 && (
                                <View
                                    style={[
                                        styles.glassCard,
                                        {
                                            backgroundColor: glassCardBg,
                                            borderColor: glassCardBorder,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>
                                        Interests
                                    </Text>
                                    <View style={styles.interestsContainer}>
                                        {userInterests.map((interest, index) => (
                                            <View
                                                key={index}
                                                style={[
                                                    styles.interestChip,
                                                    {
                                                        backgroundColor: isDark
                                                            ? 'rgba(255,255,255,0.08)'
                                                            : 'rgba(0,0,0,0.05)',
                                                    },
                                                ]}
                                            >
                                                <Text
                                                    style={[styles.interestText, { color: theme.text }]}
                                                >
                                                    {interest}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            {/* Badges Card (Bento Grid) */}
                            <View
                                style={[
                                    styles.glassCard,
                                    {
                                        backgroundColor: glassCardBg,
                                        borderColor: glassCardBorder,
                                    },
                                ]}
                            >
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Badges</Text>
                                <BadgeGrid badges={badges} />
                            </View>

                            {/* Posts Section */}
                            <View style={styles.postsSection}>
                                <Text style={[styles.postsSectionTitle, { color: theme.text }]}>
                                    Posts
                                </Text>
                                {user?.id && <FeedList userId={user.id} scrollEnabled={false} />}
                            </View>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>

            {/* 3. Floating UI Layer (Settings Button) */}
            {/* Placed here to ensure it sits ON TOP of everything */}
            <View style={[styles.settingsPositioner, { top: insets.top + 10 }]}>
                <SettingsButton />
            </View>

            {/* Edit Profile Modal */}
            <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
                {profile ? (
                    <EditProfileScreen
                        initialData={profile}
                        onClose={() => setShowEditProfile(false)}
                        onSave={handleProfileUpdate}
                    />
                ) : (
                    <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                )}
            </Modal>

            {/* Resume Viewer Modal */}
            {signedUrl && (
                <ResumeViewerModal
                    visible={showResumeViewer}
                    onClose={() => setShowResumeViewer(false)}
                    resumeUrl={signedUrl}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
    },
    safeArea: {
        flex: 1,
        backgroundColor: 'transparent',
    },
    scrollView: {
        flex: 1,
    },
    headerSection: {
        paddingBottom: 24,
    },
    stickyRankContainer: {
        marginTop: -20,
        paddingTop: 20,
        paddingBottom: 16,
        paddingHorizontal: 20,
    },
    rankCardWrapper: {
        marginBottom: 12,
    },
    academicPathContainer: {
        marginTop: 8,
    },
    academicPathHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    academicPathLabel: {
        fontSize: 10,
        fontWeight: '600',
        letterSpacing: 2.5,
    },
    academicPathYear: {
        fontSize: 12,
        fontWeight: '600',
    },
    progressBarTrack: {
        height: 4,
        borderRadius: 2,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: 2,
    },
    contentContainer: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    glassCard: {
        borderRadius: 24,
        borderWidth: 1,
        padding: 24,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        letterSpacing: 0.5,
    },
    bioText: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 20,
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic',
        marginBottom: 20,
    },
    editProfileButton: {
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
    },
    editProfileButtonText: {
        fontSize: 15,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
    interestsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 10,
    },
    interestChip: {
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 16,
    },
    interestText: {
        fontSize: 14,
        fontWeight: '500',
    },
    postsSection: {
        paddingTop: 8,
        paddingBottom: 40,
    },
    postsSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 20,
        letterSpacing: 0.5,
    },
    // Positioner for the absolute settings button
    settingsPositioner: {
        position: 'absolute',
        right: 20,
        zIndex: 999,
    },
    // Visual styling for the button itself (no positioning here)
    settingsButtonVisual: {
        // Just container logic if needed
    },
    settingsBlur: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    settingsAndroid: {
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.1)',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
