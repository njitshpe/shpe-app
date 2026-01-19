import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EditProfileScreen } from '@/components/profile';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { MotiView } from 'moti';
import { BlurView } from 'expo-blur';
import { RADIUS } from '@/constants/colors';

import { useProfileDisplay } from '@/hooks/profile/useProfileDisplay';
import { useRank } from '@/hooks/profile/useRank';
import { ProfileHeader } from '@/components/profile/ProfileHeader';
import { ProfileSocialLinks } from '@/components/profile/ProfileSocialLinks';
import { FeedList } from '@/components/feed/FeedList';
import { ProfileSkeleton } from '@/components/profile/ProfileSkeleton';

export default function ProfileScreen() {
    const { user, profile, loadProfile, profileLoading } = useAuth();
    const { theme } = useTheme();

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
        <View style={[styles.container, { backgroundColor: '#000' }]}>
            <StatusBar style="light" />

            {/* 1. BACKGROUND LAYER: Deep Mesh or Grid */}
            <View style={StyleSheet.absoluteFill}>
                <LinearGradient
                    colors={['#1a1a1a', '#000000']}
                    style={StyleSheet.absoluteFill}
                />
            </View>

            {profileLoading ? (
                <ProfileSkeleton />
            ) : (
                <>
                    <ScrollView
                        stickyHeaderIndices={[1]}
                        showsVerticalScrollIndicator={false}
                        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFF" />}
                    >
                        {/* 2. HERO SECTION: Identity & Aura */}
                        <MotiView
                            from={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            style={styles.heroSection}
                        >
                            {profile && (
                                <ProfileHeader
                                    profilePictureUrl={profile.profile_picture_url ?? undefined}
                                    initials={profileDisplay.initials}
                                    userTypeBadge={profileDisplay.userTypeBadge}
                                    displayName={profileDisplay.displayName}
                                    subtitle={profileDisplay.subtitle}
                                    secondarySubtitle={profileDisplay.secondarySubtitle}
                                    isDark={true}
                                    themeText="#FFFFFF"
                                    themeSubtext="rgba(255,255,255,0.6)"
                                />
                            )}

                            {/* SOCIAL CHIPS: Glass Style */}
                            <ProfileSocialLinks
                                profile={profile!}
                                displayName={profileDisplay.displayName}
                                themeText="#FFF"
                                themeSubtext="rgba(255,255,255,0.6)"
                                isDark={true}
                                onOpenResume={handleOpenResume}
                                onMentorshipUpdate={async () => {
                                    if (user?.id) await loadProfile(user.id);
                                }}
                            />
                        </MotiView>

                        {/* 3. IMPACT BELT: Points & Rank (Sticky) */}
                        <BlurView intensity={20} tint="dark" style={styles.impactBelt}>
                            <View style={styles.impactContent}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{profileDisplay.points}</Text>
                                    <Text style={styles.statLabel}>POINTS</Text>
                                </View>
                                <View style={styles.statDivider} />
                                <View style={styles.statItem}>
                                    <Text style={[styles.statValue, { color: profileDisplay.rankColor }]}>
                                        {profileDisplay.rank.toUpperCase()}
                                    </Text>
                                    <Text style={styles.statLabel}>TIER</Text>
                                </View>
                            </View>
                        </BlurView>

                        {/* 4. CONTENT CARDS: Glassmorphism */}
                        <View style={styles.detailsContainer}>
                            {/* Bio Card */}
                            <View style={styles.glassCard}>
                                <Text style={styles.cardHeader}>ABOUT</Text>
                                <Text style={styles.bioBody}>{profile?.bio || "No bio yet."}</Text>
                            </View>

                            {/* Interests Card */}
                            <View style={styles.glassCard}>
                                <Text style={styles.cardHeader}>INTERESTS</Text>
                                <View style={styles.interestGrid}>
                                    {profile?.interests?.map((id) => (
                                        <View key={id} style={styles.interestChip}>
                                            <Text style={styles.interestText}>{id}</Text>
                                        </View>
                                    ))}
                                </View>
                            </View>

                            {/* Badges Carousel */}
                            <View style={styles.glassCard}>
                                <Text style={styles.cardHeader}>ACHIEVEMENTS</Text>
                                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                                    {/* Points / Rank Badge */}
                                    <View style={styles.badgeItem}>
                                        <View style={[styles.badgeIconContainer, { backgroundColor: profileDisplay.rankColor }]}>
                                            <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 14 }}>
                                                {profileDisplay.points}
                                            </Text>
                                        </View>
                                        <Text style={styles.badgeLabel}>{profileDisplay.rank}</Text>
                                    </View>
                                    <View style={styles.badgeItem}>
                                        <View style={[styles.badgeIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <Ionicons name="trophy" size={24} color="#FFD700" />
                                        </View>
                                        <Text style={styles.badgeLabel}>First Event</Text>
                                    </View>
                                    <View style={styles.badgeItem}>
                                        <View style={[styles.badgeIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <Ionicons name="star" size={24} color="#FF9500" />
                                        </View>
                                        <Text style={styles.badgeLabel}>Top Contributor</Text>
                                    </View>
                                    <View style={styles.badgeItem}>
                                        <View style={[styles.badgeIconContainer, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                                            <Ionicons name="people" size={24} color="#00A3E0" />
                                        </View>
                                        <Text style={styles.badgeLabel}>Networker</Text>
                                    </View>
                                </ScrollView>
                            </View>

                            {/* Edit Action */}
                            <TouchableOpacity
                                style={styles.luxuryEditBtn}
                                onPress={() => setShowEditProfile(true)}
                            >
                                <Text style={styles.luxuryEditBtnText}>EDIT PROFILE</Text>
                            </TouchableOpacity>
                        </View>

                        {/* 5. ACTIVITY FEED */}
                        <View style={styles.feedSection}>
                            <Text style={styles.feedTitle}>RECENT ACTIVITY</Text>
                            {user?.id && <FeedList userId={user.id} scrollEnabled={false} />}
                        </View>
                    </ScrollView>

                    {/* Settings Overlay Button */}
                    <Link href="/settings" asChild>
                        <TouchableOpacity style={styles.floatingSettings}>
                            <BlurView intensity={30} tint="light" style={styles.settingsBlur}>
                                <Ionicons name="settings-sharp" size={24} color="#FFF" />
                            </BlurView>
                        </TouchableOpacity>
                    </Link>
                </>
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
    container: { flex: 1 },
    heroSection: {
        alignItems: 'center',
        paddingTop: 40,
        paddingBottom: 20,
    },
    impactBelt: {
        marginHorizontal: 20,
        borderRadius: RADIUS.xl,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        overflow: 'hidden',
        marginTop: -10,
    },
    impactContent: {
        flexDirection: 'row',
        paddingVertical: 15,
        justifyContent: 'space-evenly',
        alignItems: 'center',
    },
    statItem: { alignItems: 'center' },
    statValue: { fontSize: 20, fontWeight: '900', color: '#FFF' },
    statLabel: { fontSize: 10, fontWeight: '700', color: 'rgba(255,255,255,0.4)', letterSpacing: 1 },
    statDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.1)' },

    detailsContainer: { padding: 20, gap: 20 },
    glassCard: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: RADIUS.lg,
        padding: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.08)',
    },
    cardHeader: {
        fontSize: 12,
        fontWeight: '900',
        color: 'rgba(255,255,255,0.4)',
        letterSpacing: 2,
        marginBottom: 12,
    },
    bioBody: { fontSize: 16, color: '#FFF', lineHeight: 24 },

    interestGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    interestChip: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
    },
    interestText: { color: '#FFF', fontSize: 12, fontWeight: '600' },

    badgeItem: {
        alignItems: 'center',
        width: 70,
        marginRight: 12,
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
        color: 'rgba(255,255,255,0.6)',
    },

    luxuryEditBtn: {
        backgroundColor: '#FFF',
        paddingVertical: 18,
        borderRadius: RADIUS.full,
        alignItems: 'center',
        marginTop: 10,
    },
    luxuryEditBtnText: { color: '#000', fontWeight: '900', letterSpacing: 1 },

    floatingSettings: {
        position: 'absolute',
        top: 60,
        right: 20,
        zIndex: 100,
    },
    settingsBlur: {
        padding: 10,
        borderRadius: RADIUS.full,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)',
    },
    feedSection: { paddingHorizontal: 20, paddingBottom: 100 },
    feedTitle: { fontSize: 20, fontWeight: '800', color: '#FFF', marginBottom: 20 },

    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
