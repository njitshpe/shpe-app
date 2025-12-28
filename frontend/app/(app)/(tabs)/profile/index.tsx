import React, { useState, Suspense, lazy } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../../contexts/AuthContext';
import { EditProfileScreen } from '../../../../components/profile/EditProfileScreen';
import { SHPE_COLORS } from '../../../../constants/colors';

// Lazy load NotificationSettingsScreen
const NotificationSettingsScreen = lazy(() =>
    import('../../../../components/profile/NotificationSettingsScreen').then(module => ({ default: module.NotificationSettingsScreen }))
);

export default function ProfileScreen() {
    const router = useRouter();
    const { user, profile, loadProfile } = useAuth();

    // Load profile on mount if missing
    React.useEffect(() => {
        if (user?.id && !profile) {
            loadProfile(user.id);
        }
    }, [user, profile]);

    // Modal controls
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    // Helper to get display name
    const getDisplayName = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name} ${profile.last_name}`;
        }
        return user?.email?.split('@')[0] || 'User';
    };

    // Helper to get initials
    const getInitials = () => {
        if (profile?.first_name && profile?.last_name) {
            return `${profile.first_name[0]}${profile.last_name[0]}`.toUpperCase();
        }
        return (user?.email?.slice(0, 2) || 'US').toUpperCase();
    };

    // Helper to get major/position
    const getSubtitle = () => {
        if (!profile) return "Complete your profile to get started";

        if (profile.user_type === 'student') {
            return profile.major || "Student";
        } else if (profile.user_type === 'alumni') {
            return profile.current_position
                ? `${profile.current_position} at ${profile.current_company || 'Unknown'}`
                : "Alumni";
        } else {
            return profile.affiliation || "Member";
        }
    };

    const handleProfileUpdate = async (updatedProfile: any) => {
        if (user?.id) {
            await loadProfile(user.id);
        }
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                {/* Header Section */}
                <View style={styles.headerContainer}>
                    <View style={styles.avatarContainer}>
                        {profile?.profile_picture_url ? (
                            <Image source={{ uri: profile.profile_picture_url }} style={styles.avatar} />
                        ) : (
                            <View style={styles.avatarPlaceholder}>
                                <Text style={styles.avatarInitials}>
                                    {getInitials()}
                                </Text>
                            </View>
                        )}
                    </View>

                    <View style={styles.nameDataContainer}>
                        <Text style={styles.nameText}>
                            {getDisplayName()}
                        </Text>
                        <Text style={styles.emailText}>{user?.email}</Text>
                    </View>

                    <Text style={styles.majorText}>
                        {getSubtitle()}
                    </Text>

                    {profile?.bio && (
                        <Text style={styles.bioText} numberOfLines={3}>
                            {profile.bio}
                        </Text>
                    )}

                    <View style={styles.linksContainer}>
                        {profile?.linkedin_url && (
                            <TouchableOpacity
                                style={styles.linkedinButton}
                                onPress={() => {
                                    let url = profile.linkedin_url!;
                                    if (!url.startsWith('http')) {
                                        url = 'https://' + url;
                                    }
                                    Linking.openURL(url).catch(err => Alert.alert('Error', 'Could not open LinkedIn'));
                                }}
                            >
                                <Text style={styles.linkedinText}>LinkedIn</Text>
                            </TouchableOpacity>
                        )}

                        {profile?.resume_name && (
                            <View style={styles.resumeTag}>
                                <Text style={styles.resumeText}>Resume</Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actionSection}>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => setShowEditProfile(true)}
                    >
                        <Text style={styles.primaryButtonText}>Edit Profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.outlineButton}
                        onPress={() => setShowNotifications(true)}
                    >
                        <Text style={styles.outlineButtonText}>Notification Settings</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>

            {/* Modals */}
            <Modal visible={showEditProfile} animationType="slide" presentationStyle="pageSheet">
                {profile ? (
                    <EditProfileScreen
                        initialData={profile}
                        onClose={() => setShowEditProfile(false)}
                        onSave={handleProfileUpdate}
                    />
                ) : (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
                        <Text style={{ marginTop: 10, color: SHPE_COLORS.textGray }}>Loading profile...</Text>
                        <TouchableOpacity onPress={() => setShowEditProfile(false)} style={{ marginTop: 20 }}>
                            <Text style={{ color: SHPE_COLORS.lightBlue }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Modal>

            <Modal visible={showNotifications} animationType="slide" presentationStyle="pageSheet">
                <Suspense fallback={
                    <View style={styles.loadingFallback}>
                        <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
                        <Text style={styles.loadingText}>Loading Notification Settings...</Text>
                    </View>
                }>
                    <NotificationSettingsScreen
                        onClose={() => setShowNotifications(false)}
                    />
                </Suspense>
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    scrollView: {
        flex: 1,
    },
    headerContainer: {
        backgroundColor: SHPE_COLORS.darkBlue,
        paddingTop: 30,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
    },
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
        color: SHPE_COLORS.white,
    },
    nameDataContainer: {
        alignItems: 'center',
        marginBottom: 8,
    },
    nameText: {
        fontSize: 24,
        fontWeight: 'bold',
        color: SHPE_COLORS.white,
        textAlign: 'center',
    },
    emailText: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.8)',
        textAlign: 'center',
        marginTop: 4,
    },
    majorText: {
        fontSize: 14,
        color: 'rgba(255,255,255,0.9)',
        fontWeight: '500',
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
        flexWrap: 'wrap',
    },
    linkedinButton: {
        backgroundColor: '#0077B5',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    linkedinText: {
        color: '#FFFFFF',
        fontWeight: '600',
        fontSize: 13,
    },
    resumeTag: {
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 15,
    },
    resumeText: {
        color: SHPE_COLORS.white,
        fontWeight: '600',
        fontSize: 13,
    },
    actionSection: {
        padding: 20,
        gap: 12,
    },
    primaryButton: {
        backgroundColor: SHPE_COLORS.orange,
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    primaryButtonText: {
        color: SHPE_COLORS.white,
        fontSize: 16,
        fontWeight: '600',
    },
    outlineButton: {
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        paddingVertical: 16,
        borderRadius: 8,
        alignItems: 'center',
    },
    outlineButtonText: {
        color: '#666',
        fontSize: 16,
        fontWeight: '600',
    },
    loadingFallback: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: SHPE_COLORS.white,
    },
    loadingText: {
        marginTop: 16,
        fontSize: 16,
        color: SHPE_COLORS.darkBlue,
        fontWeight: '600',
    },
});
