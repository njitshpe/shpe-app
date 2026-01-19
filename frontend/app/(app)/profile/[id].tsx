import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';


import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBlock } from '@/contexts/BlockContext';
import { profileService } from '@/services/profile.service';
import { fetchUserPosts } from '@/lib/feedService';

// Import components from the main profile tab
// Import components from the main profile tab
// Note: We're importing from the (tabs) group which is a sibling of this directory's parent
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

import type { UserProfile } from '@/types/userProfile';
import type { FeedPostUI } from '@/types/feed';

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user: currentUser } = useAuth(); // Just to check if it's me
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

    // --- SECURE RESUME HOOK ---
    const { signedUrl, loading: resumeLoading } = useSecureResume(profile?.resume_url || null);

    // --- PROFILE DISPLAY HOOK ---
    const profileDisplay = useProfileDisplay({
        profile,
        user: { id: id || '' } as any,
        pointsTotal: rankData.points_total,
        tier: rankData.tier,
    });

    const loadData = async () => {
        if (!id) return;

        try {
            // 1. Fetch Profile
            const profileReq = await profileService.getProfile(id);
            if (profileReq.success && profileReq.data) {
                setProfile(profileReq.data);
            } else {
                Alert.alert('Error', 'User not found');
                router.back();
                return;
            }

            // 2. Fetch Points/Tier (Posts fetched by FeedList)
            const rankReq = await rankService.getUserRank(id);
            if (rankReq.success && rankReq.data) {
                setRankData(rankReq.data);
            }
        } catch (error) {
            console.error('Error loading public profile:', error);
        } finally {
            setLoading(false);
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
                Alert.alert("Please wait", "Secure link is generating...");
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
                // After blocking, go back to previous screen
                Alert.alert(
                    'User Blocked',
                    'You will no longer see their content.',
                    [{ text: 'OK', onPress: () => router.back() }]
                );
            } else {
                Alert.alert('User Unblocked', 'You can now see their content again.');
                // Refresh the data
                await loadData();
            }
        } else {
            Alert.alert('Error', `Failed to ${isBlocked ? 'unblock' : 'block'} user. Please try again.`);
        }
    };

    // Derived state
    const isMe = currentUser?.id === id;
    const isBlocked = id ? isUserBlocked(id) : false;

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            {/* Always render Stack.Screen to prevent header jump/artifact */}
            <Stack.Screen options={{
                headerShown: true,
                title: profileDisplay.displayName || 'Profile',
                headerStyle: { backgroundColor: theme.card },
                headerTintColor: theme.text,
                headerShadowVisible: false,
                headerBackTitle: 'Back',
                headerRight: !isMe ? () => (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                        <TouchableOpacity onPress={() => setShowReportModal(true)}>
                            <Ionicons name="flag-outline" size={24} color={theme.text} />
                        </TouchableOpacity>
                        <TouchableOpacity
                            onPress={handleBlockPress}
                            style={{ marginRight: 8 }}
                        >
                            <Ionicons
                                name={isBlocked ? "eye" : "eye-off"}
                                size={24}
                                color={theme.text}
                            />
                        </TouchableOpacity>
                    </View>
                ) : undefined,
            }} />

            {loading ? (
                <ProfileSkeleton />
            ) : !profile ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                    <Text style={{ color: theme.text }}>User not found.</Text>
                </View>
            ) : (isBlocked && !isMe) ? (
                <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                    <Ionicons name="eye-off" size={64} color={theme.subtext} style={{ marginBottom: 16 }} />
                    <Text style={[styles.unavailableTitle, { color: theme.text }]}>User Unavailable</Text>
                    <Text style={[styles.unavailableMessage, { color: theme.subtext }]}>
                        You have blocked this user.
                    </Text>
                    <TouchableOpacity
                        style={[styles.unblockButton, { backgroundColor: theme.primary }]}
                        onPress={handleBlockPress}
                    >
                        <Text style={styles.unblockButtonText}>Unblock User</Text>
                    </TouchableOpacity>
                    {/* Block User Modal for Unblocking */}
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
                <View style={[styles.gradient, { backgroundColor: theme.background }]}>
                    <ScrollView
                        style={styles.scrollView}
                        showsVerticalScrollIndicator={false}
                        refreshControl={
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={theme.primary}
                            />
                        }
                    >
                        {/* If it's me, give a link to go to my actual profile tab */}
                        {isMe && (
                            <TouchableOpacity
                                style={styles.meBanner}
                                onPress={() => router.push('/(tabs)/profile')}
                            >
                                <Text style={styles.meBannerText}>This is your public profile look.</Text>
                                <Text style={styles.meBannerLink}>Go to Profile Tab →</Text>
                            </TouchableOpacity>
                        )}

                        <ProfileHeader
                            profilePictureUrl={profile.profile_picture_url ?? undefined}
                            initials={profileDisplay.initials}
                            userTypeBadge={profileDisplay.userTypeBadge}
                            displayName={profileDisplay.displayName}
                            subtitle={profileDisplay.subtitle}
                            secondarySubtitle={profileDisplay.secondarySubtitle}
                            isDark={isDark}
                            themeText={theme.text}
                            themeSubtext={theme.subtext}
                        />

                        <ProfileSocialLinks
                            profile={profile}
                            displayName={profileDisplay.displayName}
                            themeText={theme.text}
                            themeSubtext={theme.subtext}
                            isDark={isDark}
                            onOpenResume={handleOpenResume}
                            onMentorshipUpdate={async () => { }} // No-op for public view
                            readOnly={true} // IMPORTANT: Prevents editing
                        />

                        {/* Bio */}
                        {profile.bio && (
                            <View style={[styles.bioSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.bioText, { color: theme.text }]}>{profile.bio}</Text>
                            </View>
                        )}



                        {/* Badges Section - Read Only View */}
                        <View style={styles.badgesSection}>
                            <Text style={[styles.badgesSectionTitle, { color: theme.text }]}>Badges</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                contentContainerStyle={styles.badgesScrollContent}
                            >
                                {/* Points / Rank Badge */}
                                <View style={styles.badgeItem}>
                                    <View style={[styles.badgeIconContainer, { backgroundColor: profileDisplay.rankColor }]}>
                                        <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 14 }}>
                                            {profileDisplay.points}
                                        </Text>
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>
                                        {profileDisplay.rank}
                                    </Text>
                                </View>

                                <View style={styles.badgeItem}>
                                    <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        <Ionicons name="trophy" size={24} color="#FFD700" />
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>First Event</Text>
                                </View>
                                {/* ... more badges ... */}
                            </ScrollView>
                        </View>

                        {/* Posts Section */}
                        <View style={styles.postsSection}>
                            <View style={styles.postsSectionHeader}>
                                <Text style={[styles.postsSectionTitle, { color: theme.text }]}>Posts</Text>
                            </View>

                            {id && <FeedList userId={id} scrollEnabled={false} />}
                        </View>

                        <View style={{ height: 40 }} />
                    </ScrollView>
                </View>
            )}

            {/* Resume Viewer Modal */}
            {signedUrl && (
                <ResumeViewerModal
                    visible={showResumeViewer}
                    onClose={() => setShowResumeViewer(false)}
                    resumeUrl={signedUrl}
                />
            )}

            {/* Block User Modal */}
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

            {/* Report User Modal */}
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gradient: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    meBanner: {
        backgroundColor: 'rgba(52, 199, 89, 0.1)',
        padding: 12,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
    },
    meBannerText: {
        color: '#34C759',
        fontWeight: '500',
    },
    meBannerLink: {
        color: '#34C759',
        fontWeight: '700',
    },
    bioSection: {
        marginHorizontal: 20,
        marginBottom: 24,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    bioText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },
    badgesSection: {
        paddingTop: 8,
        paddingBottom: 12,
    },
    badgesSectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        paddingHorizontal: 20,
    },
    badgesScrollContent: {
        paddingHorizontal: 20,
        gap: 12,
    },
    badgeItem: {
        alignItems: 'center',
        width: 60,
    },
    badgeIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 4,
    },
    badgeLabel: {
        fontSize: 10,
        textAlign: 'center',
        fontWeight: '500',
    },
    postsSection: {
        paddingTop: 24,
        paddingBottom: 40,
        paddingHorizontal: 20,
    },
    postsSectionHeader: {
        marginBottom: 20,
    },
    postsSectionTitle: {
        fontSize: 22,
        fontWeight: '700',
    },
    postsList: {
        gap: 16,
    },
    noPostsText: {
        textAlign: 'center',
        fontStyle: 'italic',
        marginTop: 20,
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
        borderRadius: 8,
        marginTop: 8,
    },
    unblockButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
});
