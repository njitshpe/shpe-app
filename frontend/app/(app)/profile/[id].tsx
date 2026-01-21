import React, { useEffect, useMemo, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Platform,
    ImageBackground,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBlock } from '@/contexts/BlockContext';
import { profileService } from '@/services/profile.service';

import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { FeedList } from '@/components/feed/FeedList';
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';
import { BlockUserModal } from '@/components/shared/BlockUserModal';
import { ReportModal } from '@/components/shared/ReportModal';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import { useProfileDisplay } from '@/hooks/profile/useProfileDisplay';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';
import { rankService, PointsSummary } from '@/services/rank.service';
import { RankProgressCard } from '@/components/profile/RankProgressCard';
import { BadgeGrid, Badge } from '@/components/profile/BadgeGrid';
import { INTEREST_OPTIONS, InterestType } from '@/types/userProfile';

import type { UserProfile } from '@/types/userProfile';

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { theme, isDark } = useTheme();
    const { user: currentUser } = useAuth();
    const { isUserBlocked, blockUser, unblockUser } = useBlock();

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [showResumeViewer, setShowResumeViewer] = useState(false);
    const [showBlockModal, setShowBlockModal] = useState(false);
    const [blockActionLoading, setBlockActionLoading] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [rankData, setRankData] = useState<PointsSummary>({
        season_id: '',
        points_total: 0,
        tier: '---',
        points_to_next_tier: 0,
    });

    const { signedUrl, loading: resumeLoading } = useSecureResume(profile?.resume_url || null);

    const profileDisplay = useProfileDisplay({
        profile,
        user: null,
        pointsTotal: rankData.points_total,
        tier: rankData.tier,
    });

    const loadData = async () => {
        if (!id) return;

        try {
            const profileReq = await profileService.getProfile(id);
            if (profileReq.success && profileReq.data) {
                setProfile(profileReq.data);
            } else {
                Alert.alert('Error', 'User not found');
                router.back();
                return;
            }

            const rankReq = await rankService.getUserRank(id);
            if (rankReq.success && rankReq.data) {
                setRankData(rankReq.data);
            }
        } catch (error) {
            console.error('Error loading public profile:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const onRefresh = async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    };

    const handleOpenResume = () => {
        if (!signedUrl) {
            if (resumeLoading) {
                Alert.alert('Please wait', 'Secure link is generating...');
            } else {
                Alert.alert("No Resume", "This user hasn't uploaded a resume.");
            }
            return;
        }
        setShowResumeViewer(true);
    };

    const handleBlockPress = () => {
        setShowBlockModal(true);
    };

    const handleBlockConfirm = async () => {
        if (!id) return;

        setBlockActionLoading(true);
        const isBlocked = isUserBlocked(id);
        const success = isBlocked ? await unblockUser(id) : await blockUser(id);

        setBlockActionLoading(false);
        setShowBlockModal(false);

        if (success) {
            if (!isBlocked) {
                Alert.alert('User Blocked', 'You will no longer see their content.', [
                    { text: 'OK', onPress: () => router.back() },
                ]);
            } else {
                Alert.alert('User Unblocked', 'You can now see their content again.');
                await loadData();
            }
        } else {
            Alert.alert(
                'Error',
                `Failed to ${isBlocked ? 'unblock' : 'block'} user. Please try again.`
            );
        }
    };

    const isMe = currentUser?.id === id;
    const isBlocked = id ? isUserBlocked(id) : false;

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

    const badges = useMemo((): Badge[] => {
        const result: Badge[] = [];

        if (rankData.tier) {
            result.push({
                id: 'rank',
                icon: 'trophy',
                label: rankData.tier,
                color: profileDisplay.rankColor,
            });
        }

        result.push({
            id: 'member',
            icon: 'shield-checkmark',
            label: 'Member',
            color: theme.text,
        });

        if (profile?.mentorship_available) {
            result.push({
                id: 'mentor',
                icon: 'school',
                label: 'Mentor',
                color: '#FFD700',
            });
        }

        if (profile?.user_type === 'alumni') {
            result.push({
                id: 'alumni',
                icon: 'time',
                label: 'Alumni',
                color: '#C0C0C0',
            });
        }

        return result;
    }, [rankData.tier, profileDisplay.rankColor, profile?.mentorship_available, profile?.user_type, theme.text]);

    const glassCardBg = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)';
    const glassCardBorder = 'rgba(255,255,255,0.08)';

    const renderBackButton = () => {
        const fallbackBg = 'rgba(255,255,255,0.08)';

        if (Platform.OS === 'ios') {
            return (
                <BlurView intensity={40} tint="dark" style={styles.backButton}>
                    <TouchableOpacity style={styles.backButtonContent} onPress={() => router.back()}>
                        <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
                    </TouchableOpacity>
                </BlurView>
            );
        }

        return (
            <TouchableOpacity
                style={[styles.backButton, { backgroundColor: fallbackBg }]}
                onPress={() => router.back()}
            >
                <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
            </TouchableOpacity>
        );
    };

    const renderActionButton = (icon: React.ComponentProps<typeof Ionicons>['name'], onPress: () => void) => {
        const fallbackBg = 'rgba(255,255,255,0.08)';

        if (Platform.OS === 'ios') {
            return (
                <BlurView intensity={40} tint="dark" style={styles.actionButton}>
                    <TouchableOpacity style={styles.actionButtonContent} onPress={onPress}>
                        <Ionicons name={icon} size={20} color="#FFFFFF" />
                    </TouchableOpacity>
                </BlurView>
            );
        }

        return (
            <View style={[styles.actionButton, { backgroundColor: fallbackBg }]}
            >
                <TouchableOpacity style={styles.actionButtonContent} onPress={onPress}>
                    <Ionicons name={icon} size={20} color="#FFFFFF" />
                </TouchableOpacity>
            </View>
        );
    };

    return (
        <View style={styles.root}>
            <StatusBar style={isDark ? 'light' : 'dark'} translucent />

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
                <LinearGradient colors={isDark ? ['#1a1a1a', '#000000'] : ['#FFFFFF', '#F5F5F5']} style={StyleSheet.absoluteFill} />
            )}

            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <Stack.Screen options={{ headerShown: false }} />

                {loading ? (
                    <ProfileSkeleton />
                ) : !profile ? (
                    <View style={styles.loadingContainer}>
                        <Text style={{ color: theme.text }}>User not found.</Text>
                    </View>
                ) : isBlocked && !isMe ? (
                    <View style={styles.loadingContainer}>
                        <Ionicons name="eye-off" size={64} color={theme.subtext} style={{ marginBottom: 16 }} />
                        <Text style={[styles.unavailableTitle, { color: theme.text }]}>User Unavailable</Text>
                        <Text style={[styles.unavailableMessage, { color: theme.subtext }]}>
                            You have blocked this user.
                        </Text>
                        <TouchableOpacity
                            style={[styles.unblockButton, { backgroundColor: theme.text }]}
                            onPress={handleBlockPress}
                        >
                            <Text style={[styles.unblockButtonText, { color: '#000000' }]}>Unblock User</Text>
                        </TouchableOpacity>
                        <BlockUserModal
                            visible={showBlockModal}
                            onClose={() => setShowBlockModal(false)}
                            onConfirm={handleBlockConfirm}
                            userName={profile.first_name || 'User'}
                            isBlocked={isBlocked}
                            isLoading={blockActionLoading}
                        />
                    </View>
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
                        <View style={styles.headerSection}>
                            <ProfileHeader
                                profilePictureUrl={profile.profile_picture_url ?? undefined}
                                initials={profileDisplay.initials}
                                userTypeBadge={profileDisplay.userTypeBadge}
                                displayName={profileDisplay.displayName}
                                subtitle={profileDisplay.subtitle}
                                secondarySubtitle={profileDisplay.secondarySubtitle}
                                rankColor={profileDisplay.rankColor}
                                pointsTotal={rankData.points_total}
                                pointsToNextTier={rankData.points_to_next_tier}
                                isMentor={profile.mentorship_available ?? false}
                            />
                        </View>

                        <View style={styles.stickyRankContainer}>
                            <View style={styles.rankCardWrapper}>
                                <RankProgressCard
                                    pointsTotal={rankData.points_total}
                                    tier={rankData.tier}
                                    rankColor={profileDisplay.rankColor}
                                    pointsToNextTier={rankData.points_to_next_tier}
                                />
                            </View>
                        </View>

                        <View style={styles.contentContainer}>
                            <ProfileSocialLinks
                                profile={profile}
                                displayName={profileDisplay.displayName}
                                themeText={theme.text}
                                themeSubtext={theme.subtext}
                                isDark={isDark}
                                onOpenResume={handleOpenResume}
                                onMentorshipUpdate={async () => { }}
                                readOnly={true}
                            />

                            <View
                                style={[
                                    styles.glassCard,
                                    { backgroundColor: glassCardBg, borderColor: glassCardBorder },
                                ]}
                            >
                                <Text style={[styles.cardTitle, { color: theme.text }]}>About</Text>
                                {profile.bio ? (
                                    <Text style={[styles.bioText, { color: theme.subtext }]}>
                                        {profile.bio}
                                    </Text>
                                ) : (
                                    <Text style={[styles.emptyText, { color: theme.subtext }]}>No bio yet.</Text>
                                )}
                            </View>

                            {userInterests.length > 0 && (
                                <View
                                    style={[
                                        styles.glassCard,
                                        { backgroundColor: glassCardBg, borderColor: glassCardBorder },
                                    ]}
                                >
                                    <Text style={[styles.cardTitle, { color: theme.text }]}>Interests</Text>
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
                                                <Text style={[styles.interestText, { color: theme.text }]}>
                                                    {interest}
                                                </Text>
                                            </View>
                                        ))}
                                    </View>
                                </View>
                            )}

                            <View
                                style={[
                                    styles.glassCard,
                                    { backgroundColor: glassCardBg, borderColor: glassCardBorder },
                                ]}
                            >
                                <Text style={[styles.cardTitle, { color: theme.text }]}>Badges</Text>
                                <BadgeGrid badges={badges} />
                            </View>

                            <View style={styles.postsSection}>
                                <Text style={[styles.postsSectionTitle, { color: theme.text }]}>Posts</Text>
                                {id && <FeedList userId={id} scrollEnabled={false} />}
                            </View>
                        </View>
                    </ScrollView>
                )}
            </SafeAreaView>

            <View style={[styles.backButtonPositioner, { top: insets.top + 10 }]}> 
                {renderBackButton()}
            </View>

            {!isMe && profile && !isBlocked && (
                <View style={[styles.actionsPositioner, { top: insets.top + 10 }]}> 
                    {renderActionButton('flag-outline', () => setShowReportModal(true))}
                    {renderActionButton(isBlocked ? 'eye' : 'eye-off', handleBlockPress)}
                </View>
            )}

            {signedUrl && (
                <ResumeViewerModal
                    visible={showResumeViewer}
                    onClose={() => setShowResumeViewer(false)}
                    resumeUrl={signedUrl}
                />
            )}

            {!isMe && profile && !isBlocked && (
                <BlockUserModal
                    visible={showBlockModal}
                    onClose={() => setShowBlockModal(false)}
                    onConfirm={handleBlockConfirm}
                    userName={profile.first_name || 'User'}
                    isBlocked={isBlocked}
                    isLoading={blockActionLoading}
                />
            )}

            {!isMe && id && (
                <ReportModal
                    visible={showReportModal}
                    onClose={() => setShowReportModal(false)}
                    targetType="user"
                    targetId={id}
                    targetName={profile?.first_name || undefined}
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    root: {
        flex: 1,
        backgroundColor: '#000000',
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
    },
    emptyText: {
        fontSize: 15,
        lineHeight: 22,
        fontStyle: 'italic',
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
    backButtonPositioner: {
        position: 'absolute',
        left: 20,
        zIndex: 999,
    },
    actionsPositioner: {
        position: 'absolute',
        right: 20,
        flexDirection: 'row',
        gap: 12,
        zIndex: 999,
    },
    backButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    backButtonContent: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        overflow: 'hidden',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionButtonContent: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    unavailableTitle: {
        fontSize: 24,
        fontWeight: '600',
        marginBottom: 8,
        textAlign: 'center',
    },
    unavailableMessage: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    unblockButton: {
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        marginTop: 8,
    },
    unblockButtonText: {
        fontSize: 15,
        fontWeight: '700',
    },
});
