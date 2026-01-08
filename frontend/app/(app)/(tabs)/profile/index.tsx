import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Linking, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileScreen } from '@/components/profile';
import { SHPE_COLORS } from '@/constants';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';
import { LinearGradient } from 'expo-linear-gradient';
import { getRankFromPoints } from '@/types/userProfile';

export default function ProfileScreen() {
    const { user, profile, loadProfile } = useAuth();
    const { theme, isDark } = useTheme();

    // Load profile on mount if missing
    React.useEffect(() => {
        if (user?.id && !profile) {
            loadProfile(user.id);
        }
    }, [user, profile]);

    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showResumeViewer, setShowResumeViewer] = useState(false);
    const [refreshing, setRefreshing] = useState(false);

    // --- SECURE RESUME HOOK ---
    // This converts the storage path (e.g. "123/resume.pdf") into a viewable link
    const { signedUrl, loading: resumeLoading } = useSecureResume(profile?.resume_url || null);

    // --- HELPERS ---

    const getDisplayName = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name} ${profile.last_name}`;
        }
        return user?.email?.split('@')[0] || 'User';
    };

    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
        }
        return (user?.email?.slice(0, 2) || 'US').toUpperCase();
    };

    const getSubtitle = () => {
        if (!profile) return "Complete your profile to get started";

        if (profile.user_type === 'student') {
            const major = profile.major || "Major";
            const year = profile.expected_graduation_year || new Date().getFullYear();
            return `${major} | Class of ${year}`;
        }

        if (profile.user_type === 'alumni') {
            const major = profile.major || "Major";
            const year = profile.graduation_year || new Date().getFullYear();
            // Show major and graduation year for alumni
            return `${major} | Class of ${year}`;
        }

        if (profile.user_type === 'guest') {
            if (profile.major) {
                return `${profile.major} | ${profile.university || 'Guest'}`;
            }
            return profile.university || "Guest";
        }

        if (profile.user_type === 'other') {
            return profile.affiliation || "Member";
        }

        return "Member";
    };

    const getUserTypeBadge = () => {
        if (!profile?.user_type) return "Student";

        // Capitalize first letter
        return profile.user_type.charAt(0).toUpperCase() + profile.user_type.slice(1);
    };

    const getRankColor = () => {
        // Calculate rank from points if not provided
        const points = profile?.rank_points || 0;
        const rank = profile?.rank || getRankFromPoints(points);

        switch (rank) {
            case 'gold':
                return '#FFD700';
            case 'silver':
                return '#C0C0C0';
            case 'bronze':
                return '#CD7F32';
            default:
                return '#8E8E93';
        }
    };

    const getPoints = () => {
        return profile?.rank_points || 0;
    };

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

    // Check if resume is an image (for preview rendering)
    const isResumeImage = (profile?.resume_name || '').match(/\.(jpeg|jpg|png)$/i);

    const handleProfileUpdate = async (updatedProfile: any) => {
        if (user?.id) {
            await loadProfile(user.id);
        }
    };

    const onRefresh = async () => {
        if (user?.id) {
            setRefreshing(true);
            await loadProfile(user.id);
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
            <LinearGradient
                colors={isDark ? ['#1A1A1A', '#000000', '#000000'] : ['#F7FAFF', '#E9F0FF', '#DDE8FF']}
                style={styles.gradient}
            >
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

                    {/* Profile Photo - Centered */}
                    <View style={styles.avatarContainer}>
                        {profile?.profile_picture_url ? (
                            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatar} />
                        ) : (
                            <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#444' : '#C0C0C0' }]}>
                                <Text style={[styles.avatarInitials, { color: isDark ? SHPE_COLORS.white : '#000' }]}>{getInitials()}</Text>
                            </View>
                        )}
                    </View>

                    {/* User Type Badge - Red Pill */}
                    <View style={styles.badgeContainer}>
                        <View style={styles.userTypeBadge}>
                            <Text style={styles.userTypeBadgeText}>{getUserTypeBadge()}</Text>
                        </View>
                    </View>

                    {/* Name - Centered */}
                    <Text style={[styles.nameText, { color: theme.text }]}>{getDisplayName()}</Text>

                    {/* Subtitle - Major | Class of YYYY */}
                    <Text style={[styles.subtitleText, { color: theme.subtext }]}>{getSubtitle()}</Text>

                    {/* Social Links Row */}
                    <View style={styles.socialLinksContainer}>
                        {/* LinkedIn */}
                        <TouchableOpacity
                            style={styles.socialLink}
                            onPress={() => {
                                if (profile?.linkedin_url) {
                                    let url = profile.linkedin_url;
                                    if (!url.startsWith('http')) url = 'https://' + url;
                                    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open LinkedIn'));
                                } else {
                                    Alert.alert('No LinkedIn', 'Add your LinkedIn in Edit Profile');
                                }
                            }}
                        >
                            <Ionicons
                                name="logo-linkedin"
                                size={22}
                                color={profile?.linkedin_url ? "#0077B5" : "#8E8E93"}
                            />
                            <Text style={[styles.socialLinkText, { color: theme.text }, !profile?.linkedin_url && { color: theme.subtext }]}>
                                LinkedIn
                            </Text>
                        </TouchableOpacity>

                        {/* Resume */}
                        <TouchableOpacity
                            style={styles.socialLink}
                            onPress={() => {
                                if (profile?.resume_url) {
                                    handleOpenResume();
                                } else {
                                    Alert.alert('No Resume', 'Add your resume in Edit Profile');
                                }
                            }}
                        >
                            <Ionicons
                                name="document-text"
                                size={22}
                                color={profile?.resume_url ? theme.text : theme.subtext}
                            />
                            <Text style={[styles.socialLinkText, { color: theme.text }, !profile?.resume_url && { color: theme.subtext }]}>
                                Resume
                            </Text>
                        </TouchableOpacity>

                        {/* Portfolio */}
                        <TouchableOpacity
                            style={styles.socialLink}
                            onPress={() => {
                                if (profile?.portfolio_url) {
                                    let url = (profile as any).portfolio_url;
                                    if (!url.startsWith('http')) url = 'https://' + url;
                                    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open Portfolio'));
                                } else {
                                    Alert.alert('No Portfolio', 'Add your portfolio in Edit Profile');
                                }
                            }}
                        >
                            <Ionicons
                                name="link-outline"
                                size={22}
                                color={(profile as any)?.portfolio_url ? theme.text : theme.subtext}
                            />
                            <Text style={[styles.socialLinkText, { color: theme.text }, !(profile as any)?.portfolio_url && { color: theme.subtext }]}>
                                Portfolio
                            </Text>
                        </TouchableOpacity>
                    </View>

                    {/* Bio - Centered */}
                    {profile?.bio && (
                        <Text style={[styles.bioText, { color: theme.subtext }]}>{profile.bio}</Text>
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
                            {/* Placeholder badges - replace with real data when available */}
                            <View style={styles.badgeItem}>
                                <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Ionicons name="trophy" size={32} color="#FFD700" />
                                </View>
                                <Text style={[styles.badgeLabel, { color: theme.subtext }]}>First Event</Text>
                            </View>
                            <View style={styles.badgeItem}>
                                <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Ionicons name="star" size={32} color="#FF9500" />
                                </View>
                                <Text style={[styles.badgeLabel, { color: theme.subtext }]}>Top Contributor</Text>
                            </View>
                            <View style={styles.badgeItem}>
                                <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Ionicons name="people" size={32} color="#00A3E0" />
                                </View>
                                <Text style={[styles.badgeLabel, { color: theme.subtext }]}>Networker</Text>
                            </View>
                            <View style={styles.badgeItem}>
                                <View style={[styles.badgeIconContainer, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}>
                                    <Ionicons name="ribbon" size={32} color="#AF52DE" />
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

                        {/* 3-Column Grid of Posts */}
                        <View style={styles.postsGrid}>
                            {/* Placeholder posts - replace with real data when available */}
                            <View style={styles.postItem}>
                                <Image
                                    source={{ uri: 'https://via.placeholder.com/150/667BC6/FFFFFF?text=Post+1' }}
                                    style={styles.postImage}
                                />
                            </View>
                            <View style={styles.postItem}>
                                <Image
                                    source={{ uri: 'https://via.placeholder.com/150/333333/FFFFFF?text=Post+2' }}
                                    style={styles.postImage}
                                />
                            </View>
                            <View style={styles.postItem}>
                                <Image
                                    source={{ uri: 'https://via.placeholder.com/150/FF6B9D/FFFFFF?text=Post+3' }}
                                    style={styles.postImage}
                                />
                            </View>
                        </View>
                    </View>

                </ScrollView>

                {/* Points Pill - Bottom Fixed */}
                <View style={styles.pointsPillContainer}>
                    <View style={[styles.pointsPill, { backgroundColor: getRankColor() }]}>
                        <Text style={styles.pointsPillNumber}>{getPoints()}</Text>
                        <Text style={styles.pointsPillLabel}>Points</Text>
                    </View>
                </View>
            </LinearGradient>

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
            {signedUrl && (
                <ResumeViewerModal
                    visible={showResumeViewer}
                    onClose={() => setShowResumeViewer(false)}
                    resumeUrl={signedUrl}
                />
            )}
        </SafeAreaView>
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
    avatarContainer: {
        alignItems: 'center',
        marginTop: 60,
        marginBottom: 8,
    },
    avatar: {
        width: 120,
        height: 120,
        borderRadius: 60,
        borderWidth: 3,
        borderColor: 'rgba(128,128,128,0.3)',
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: 'rgba(128,128,128,0.3)',
    },
    avatarInitials: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    badgeContainer: {
        alignItems: 'center',
        marginTop: -20,
        marginBottom: 12,
    },
    userTypeBadge: {
        backgroundColor: '#E53E3E',
        paddingHorizontal: 24,
        paddingVertical: 6,
        borderRadius: 20,
    },
    userTypeBadgeText: {
        color: SHPE_COLORS.white,
        fontSize: 15,
        fontWeight: '600',
    },
    nameText: {
        fontSize: 26,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 4,
    },
    subtitleText: {
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 24,
    },
    socialLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 28,
        marginBottom: 28,
        paddingHorizontal: 20,
    },
    socialLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    socialLinkText: {
        fontSize: 14,
        fontWeight: '500',
    },
    socialLinkDisabled: {
        opacity: 0.6,
    },
    bioText: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
        paddingHorizontal: 32,
        marginBottom: 24,
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
        paddingBottom: 24,
    },
    badgesSectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
        paddingHorizontal: 20,
    },
    badgesScrollContent: {
        paddingHorizontal: 20,
        gap: 16,
    },
    badgeItem: {
        alignItems: 'center',
        width: 80,
    },
    badgeIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 8,
    },
    badgeLabel: {
        fontSize: 11,
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
    postsGrid: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 8,
    },
    postItem: {
        flex: 1,
        aspectRatio: 1,
        borderRadius: 12,
        overflow: 'hidden',
    },
    postImage: {
        width: '100%',
        height: '100%',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    pointsPillContainer: {
        position: 'absolute',
        bottom: 20,
        left: 0,
        right: 0,
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    pointsPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
    },
    pointsPillNumber: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#000',
    },
    pointsPillLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#000',
    },
});