import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileScreen } from '@/components/profile';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';

import { useProfileDisplay } from '@/hooks/profile/useProfileDisplay';
import { useRank } from '@/hooks/profile/useRank';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { fetchUserPosts, deletePost } from '@/lib/feedService';
import { FeedCard } from '@/components/feed';
import type { FeedPostUI } from '@/types/feed';
import { useRouter } from 'expo-router';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';

export default function ProfileScreen() {
    const { user, profile, loadProfile, profileLoading } = useAuth();
    const { theme, isDark } = useTheme();
    const router = useRouter();

    // Fetch points/tier from points_balances
    const { tier, pointsTotal, refreshRank } = useRank();

    // Load profile on mount if missing and not already loading
    React.useEffect(() => {
        if (user?.id && !profile && !profileLoading) {
            loadProfile(user.id);
        }
    }, [user?.id, profile, profileLoading, loadProfile]);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showResumeViewer, setShowResumeViewer] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [posts, setPosts] = useState<FeedPostUI[]>([]);
    const [postsLoading, setPostsLoading] = useState(false);

    const loadPosts = async () => {
        if (!user?.id) return;
        setPostsLoading(true);
        try {
            const result = await fetchUserPosts(user.id, 0, 20);
            if (result.success && result.data) {
                setPosts(result.data);
            }
        } catch (error) {
            console.error('Error loading posts:', error);
        } finally {
            setPostsLoading(false);
        }
    };

    React.useEffect(() => {
        loadPosts();
    }, [user?.id]);

    // --- SECURE RESUME HOOK ---
    // This converts the storage path (e.g. "123/resume.pdf") into a viewable link
    const { signedUrl, loading: resumeLoading } = useSecureResume(profile?.resume_url || null);

    // --- PROFILE DISPLAY HOOK ---
    // Extract all display-related helper functions, passing points data from useRank
    const profileDisplay = useProfileDisplay({ profile, user, pointsTotal, tier });

    const handleOpenResume = () => {
        if (!signedUrl) {
            if (resumeLoading) {
                Alert.alert("Please wait", "Secure link is generating...");
            } else {
                Alert.alert("No Resume", "We couldn't find a link to your resume.");
            }
            return;
        }

        // Open the in-app PDF viewer modal
        setShowResumeViewer(true);
    };

    const handleProfileUpdate = async (updatedProfile: any) => {
        if (user?.id) {
            await loadProfile(user.id);
        }
    };

    const onRefresh = async () => {
        if (user?.id) {
            setRefreshing(true);
            await Promise.all([
                loadProfile(user.id),
                loadPosts(),
                refreshRank()
            ]);
            setRefreshing(false);
        }
    };


    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        card: { backgroundColor: theme.card },
        cardBorder: { borderColor: theme.border },
        primaryButton: { backgroundColor: theme.primary },
    };

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
            {profileLoading ? (
                <View style={[styles.gradient, { backgroundColor: theme.background }]}>
                    <ProfileSkeleton />
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
                                colors={[theme.primary]}
                            />
                        }
                    >

                        {/* Settings Icon - Top Right */}
                        <Link href="/settings" asChild>
                            <TouchableOpacity style={styles.settingsButton}>
                                <Ionicons name="settings-outline" size={28} color={theme.text} />
                            </TouchableOpacity>
                        </Link>

                        {/* Profile Header */}
                        {profile && (
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
                        )}

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

                        {/* Bio - Centered with Background */}
                        {profile?.bio && (
                            <View style={[styles.bioSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
                                <Text style={[styles.bioText, { color: theme.text }]}>{profile.bio}</Text>
                            </View>
                        )}

                        {/* Edit Profile Button */}
                        <TouchableOpacity
                            style={[styles.editProfileButton, { backgroundColor: isDark ? 'rgba(60,60,80,1)' : 'rgba(200,200,220,1)' }]}
                            onPress={() => setShowEditProfile(true)}
                        >
                            <Text style={[styles.editProfileButtonText, { color: theme.text }]}>Edit Profile</Text>
                        </TouchableOpacity>

                        {/* Badges Section */}
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
                                        <Text style={{ color: '#000000ff', fontWeight: 'bold', fontSize: 14 }}>
                                            {profileDisplay.points}
                                        </Text>
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>
                                        {profileDisplay.rank}
                                    </Text>
                                </View>

                                {/* Placeholder badges - replace with real data when available */}
                                <View style={styles.badgeItem}>
                                    <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        <Ionicons name="trophy" size={24} color="#FFD700" />
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>First Event</Text>
                                </View>
                                <View style={styles.badgeItem}>
                                    <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        <Ionicons name="star" size={24} color="#FF9500" />
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>Top Contributor</Text>
                                </View>
                                <View style={styles.badgeItem}>
                                    <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        <Ionicons name="people" size={24} color="#00A3E0" />
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>Networker</Text>
                                </View>
                                <View style={styles.badgeItem}>
                                    <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                        <Ionicons name="ribbon" size={24} color="#AF52DE" />
                                    </View>
                                    <Text style={[styles.badgeLabel, { color: theme.subtext }]}>Early Adopter</Text>
                                </View>
                            </ScrollView>
                        </View>

                        {/* Posts Section */}
                        <View style={styles.postsSection}>
                            <View style={styles.postsSectionHeader}>
                                <Text style={[styles.postsSectionTitle, { color: theme.text }]}>Posts</Text>
                            </View>

                            {/* Post List */}
                            {postsLoading ? (
                                <ActivityIndicator color={theme.primary} style={{ marginTop: 20 }} />
                            ) : posts.length > 0 ? (
                                <View style={styles.postsList}>
                                    {posts.map(post => (
                                        <FeedCard
                                            key={post.id}
                                            post={post}
                                            onEdit={(post) => router.push({ pathname: '/feed/create', params: { id: post.id } })}
                                            onDelete={async (postId) => {
                                                const result = await deletePost(postId);
                                                if (result.success) {
                                                    loadPosts();
                                                } else {
                                                    Alert.alert('Error', result.error?.message || 'Failed to delete post');
                                                }
                                            }}
                                        />
                                    ))}
                                </View>
                            ) : (
                                <Text style={[styles.noPostsText, { color: theme.subtext }]}>You haven't posted anything yet.</Text>
                            )}
                        </View>

                    </ScrollView>
                </View>
            )}

            {/* Edit Profile Modal */}
            <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
                {profile ? (
                    <EditProfileScreen
                        initialData={profile}
                        onClose={() => setShowEditProfile(false)}
                        onSave={handleProfileUpdate}
                    />
                ) : (
                    <View style={[styles.loadingContainer, dynamicStyles.container]}>
                        <ActivityIndicator size="large" color={theme.primary} />
                    </View>
                )}
            </Modal>

            {/* Resume Viewer Modal */}
            {
                signedUrl && (
                    <ResumeViewerModal
                        visible={showResumeViewer}
                        onClose={() => setShowResumeViewer(false)}
                        resumeUrl={signedUrl}
                    />
                )
            }

        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    gradient: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
    settingsButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        padding: 8,
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
    editProfileButton: {
        marginHorizontal: 40,
        paddingVertical: 14,
        borderRadius: 24,
        alignItems: 'center',
        marginBottom: 32,
    },
    editProfileButtonText: {
        fontSize: 16,
        fontWeight: '600',
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
        marginBottom: 40,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

});
