import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileScreen } from '@/components/profile';
import { SHPE_COLORS } from '@/constants';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useSecureResume } from '@/hooks/profile/useSecureResume';
import ResumeViewerModal from '@/components/shared/ResumeViewerModal';

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
        if (profile.user_type === 'student') return profile.major || "Student";
        if (profile.user_type === 'alumni') {
            return profile.current_position
                ? `${profile.current_position} at ${profile.current_company || 'Unknown'}`
                : "Alumni";
        }
        return profile.affiliation || "Member";
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

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        card: { backgroundColor: theme.card },
        cardBorder: { borderColor: theme.border },
        primaryButton: { backgroundColor: theme.primary },
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                
                {/* Header Section */}
                <View style={[styles.headerContainer, { backgroundColor: SHPE_COLORS.darkBlue }]}>
                    <Link href="/settings" asChild>
                        <TouchableOpacity style={styles.settingsButton}>
                            <Ionicons name="settings-outline" size={24} color={SHPE_COLORS.white} />
                        </TouchableOpacity>
                    </Link>

                    <View style={styles.avatarContainer}>
                        {profile?.profile_picture_url ? (
                            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>{getInitials()}</Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.nameDataContainer}>
                        <Text style={styles.nameText}>{getDisplayName()}</Text>
                        <Text style={styles.emailText}>{user?.email}</Text>
                    </View>

                    <Text style={styles.majorText}>{getSubtitle()}</Text>

                    {profile?.bio && (
                        <Text style={styles.bioText} numberOfLines={3}>{profile.bio}</Text>
                    )}

                    <View style={styles.linksContainer}>
                        {profile?.linkedin_url && (
                            <TouchableOpacity
                                style={styles.linkedinButton}
                                onPress={() => {
                                    let url = profile.linkedin_url!;
                                    if (!url.startsWith('http')) url = 'https://' + url;
                                    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open LinkedIn'));
                                }}
                            >
                                <Ionicons name="logo-linkedin" size={16} color="white" style={{marginRight: 6}}/>
                                <Text style={styles.linkedinText}>LinkedIn</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                </View>

                {/* Main Content Area */}
                <View style={styles.contentSection}>
                    
                    {/* Edit Profile Button */}
                    <TouchableOpacity
                        style={[styles.primaryButton, dynamicStyles.primaryButton]}
                        onPress={() => setShowEditProfile(true)}
                    >
                        <Text style={styles.primaryButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    {/* --- RESUME PREVIEW SECTION --- */}
                    {profile?.resume_url && (
                        <View style={styles.resumeSection}>
                            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Resume</Text>
                            
                            <TouchableOpacity 
                                style={[styles.resumeCard, { backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7' }]}
                                onPress={handleOpenResume}
                                activeOpacity={0.7}
                            >
                                {/* Preview Area */}
                                <View style={styles.resumePreviewArea}>
                                    {resumeLoading ? (
                                        <ActivityIndicator color={SHPE_COLORS.orange} />
                                    ) : isResumeImage && signedUrl ? (
                                        // We use signedUrl here so the private image actually loads
                                        <Image 
                                            source={{ uri: signedUrl }} 
                                            style={styles.resumeImagePreview}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        // Generic PDF/Doc Placeholder
                                        <View style={styles.resumeIconPlaceholder}>
                                            <Ionicons name="document-text" size={48} color={SHPE_COLORS.gray} />
                                            <View style={styles.pdfBadge}>
                                                <Text style={styles.pdfBadgeText}>PDF</Text>
                                            </View>
                                        </View>
                                    )}
                                </View>

                                {/* Footer Area */}
                                <View style={[styles.resumeFooter, { borderTopColor: isDark ? '#3A3A3C' : '#E5E5EA' }]}>
                                    <View style={{flex: 1}}>
                                        <Text style={[styles.resumeName, dynamicStyles.text]} numberOfLines={1}>
                                            {profile.resume_name || 'My Resume.pdf'}
                                        </Text>
                                        <Text style={styles.resumeActionText}>
                                            {resumeLoading ? 'Generating secure link...' : 'Tap to view'}
                                        </Text>
                                    </View>
                                    <Ionicons name="open-outline" size={20} color={SHPE_COLORS.blue} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    )}
                    {/* ------------------------------- */}

                </View>
            </ScrollView>

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
    container: { flex: 1 },
    scrollView: { flex: 1 },
    headerContainer: {
        paddingTop: 30,
        paddingBottom: 40,
        paddingHorizontal: 20,
        alignItems: 'center',
        borderBottomLeftRadius: 24,
        borderBottomRightRadius: 24,
    },
    settingsButton: { position: 'absolute', top: 20, right: 20, zIndex: 10, padding: 5 },
    avatarContainer: {
        marginBottom: 15,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: SHPE_COLORS.white,
    },
    avatarPlaceholder: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: SHPE_COLORS.orange,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 4,
        borderColor: SHPE_COLORS.white,
    },
    avatarInitials: { 
        fontSize: 36, 
        fontWeight: 'bold', 
        color: SHPE_COLORS.white 
    },
    nameDataContainer: { 
        alignItems: 'center', 
        marginBottom: 8 
    },
    nameText: { 
        fontSize: 24, 
        fontWeight: 'bold', 
        color: SHPE_COLORS.white, 
        textAlign: 'center' 
    },
    emailText: { 
        fontSize: 13, 
        color: 'rgba(255,255,255,0.8)', 
        textAlign: 'center', 
        marginTop: 4 
    },
    majorText: { 
        fontSize: 14, 
        color: 'rgba(255,255,255,0.9)', 
        fontWeight: '500' 
    },
    bioText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        textAlign: 'center',
        marginTop: 12,
        paddingHorizontal: 20,
        fontStyle: 'italic',
    },
    linksContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10,
        marginTop: 15,
    },
    linkedinButton: {
        backgroundColor: '#0077B5',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    linkedinText: { color: '#FFFFFF', fontWeight: '600', fontSize: 13 },
    
    // Content Section (Below Header)
    contentSection: {
        padding: 20,
        gap: 24, 
    },
    primaryButton: {
        paddingVertical: 16,
        borderRadius: 12,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: { color: SHPE_COLORS.white, fontSize: 16, fontWeight: '600' },

    // RESUME STYLES
    resumeSection: {
        gap: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 4,
    },
    resumeCard: {
        borderRadius: 12,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(0,0,0,0.05)',
        height: 200, 
    },
    resumePreviewArea: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.02)',
    },
    resumeImagePreview: {
        width: '100%',
        height: '100%',
        opacity: 0.9,
    },
    resumeIconPlaceholder: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    pdfBadge: {
        marginTop: 5,
        backgroundColor: '#FF3B30', // PDF Red
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    pdfBadgeText: {
        color: 'white',
        fontSize: 10,
        fontWeight: 'bold',
    },
    resumeFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: 12,
        borderTopWidth: 1,
        backgroundColor: 'transparent',
    },
    resumeName: {
        fontSize: 14,
        fontWeight: '600',
    },
    resumeActionText: {
        fontSize: 12,
        color: SHPE_COLORS.gray,
        marginTop: 2,
    },
    loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }
});