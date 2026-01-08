import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, RefreshControl, Alert } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';


import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { fetchUserPosts } from '@/lib/feedService';

// Import components from the main profile tab
// Import components from the main profile tab
// Note: We're importing from the (tabs) group which is a sibling of this directory's parent
import { ProfileHeader } from '../(tabs)/profile/components/ProfileHeader';
import { ProfileSocialLinks } from '../(tabs)/profile/components/ProfileSocialLinks';
import { FeedCard } from '@/components/feed'; // Assuming FeedCard is exported from here
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import { useProfileDisplay } from '../(tabs)/profile/hooks/useProfileDisplay';

import type { UserProfile } from '@/types/userProfile';
import type { FeedPostUI } from '@/types/feed';

export default function PublicProfileScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { user: currentUser } = useAuth(); // Just to check if it's me

    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [posts, setPosts] = useState<FeedPostUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [postsLoading, setPostsLoading] = useState(true);
    const [showResumeViewer, setShowResumeViewer] = useState(false);

    // --- SECURE RESUME HOOK ---
    const { signedUrl, loading: resumeLoading } = useSecureResume(profile?.resume_url || null);

    // --- PROFILE DISPLAY HOOK ---
    const profileDisplay = useProfileDisplay({ profile, user: { id: id || '' } as any });

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

            // 2. Fetch Posts
            setPostsLoading(true);
            const postsReq = await fetchUserPosts(id, 0, 20);
            if (postsReq.success && postsReq.data) {
                setPosts(postsReq.data);
            }
        } catch (error) {
            console.error('Error loading public profile:', error);
        } finally {
            setLoading(false);
            setPostsLoading(false);
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

    // Derived state
    const isMe = currentUser?.id === id;

    if (loading) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <ActivityIndicator size="large" color={theme.primary} />
            </View>
        );
    }

    if (!profile) {
        return (
            <View style={[styles.loadingContainer, { backgroundColor: theme.background }]}>
                <Text style={{ color: theme.text }}>User not found.</Text>
            </View>
        );
    }

    return (
        <View style={{ flex: 1, backgroundColor: theme.background }}>
            <Stack.Screen options={{
                headerShown: true,
                title: profileDisplay.displayName || 'Profile',
                headerStyle: { backgroundColor: theme.card },
                headerTintColor: theme.text,
                headerShadowVisible: false,
                headerBackTitle: 'Back'
            }} />

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
                        profilePictureUrl={profile.profile_picture_url}
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

                        {postsLoading ? (
                            <ActivityIndicator color={theme.primary} />
                        ) : posts.length > 0 ? (
                            <View style={styles.postsList}>
                                {posts.map(post => (
                                    <FeedCard
                                        key={post.id}
                                        post={post}
                                        compact={true}
                                    // No edit/delete handlers passed
                                    />
                                ))}
                            </View>
                        ) : (
                            <Text style={[styles.noPostsText, { color: theme.subtext }]}>No posts yet.</Text>
                        )}
                    </View>

                    <View style={{ height: 40 }} />
                </ScrollView>
            </View>

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
    }
});
