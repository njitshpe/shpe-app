import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Modal, Alert, ActivityIndicator, Linking, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { EditProfileScreen } from '@/components/profile';
import { SHPE_COLORS } from '@/constants';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export default function ProfileScreen() {
    const { user, profile, loadProfile } = useAuth();
    const { theme, isDark } = useTheme();

    // Load profile on mount if missing
    React.useEffect(() => {
        if (user?.id && !profile) {
            loadProfile(user.id);
        }
    }, [user, profile]);

    // Modal controls
    const [showEditProfile, setShowEditProfile] = useState(false);

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

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        header: { backgroundColor: isDark ? '#1C1C1E' : SHPE_COLORS.darkBlue }, // Keep brand color in light mode, dark card in dark mode? Or maybe just brand color always? Let's stick to brand color for header identity, but maybe darken it in dark mode if needed. Actually, SHPE_COLORS.darkBlue is quite dark (#002855), so it might work in dark mode too. Let's keep it for now or use theme.primary if we want it to match the theme. Let's use SHPE_COLORS.darkBlue as it's a profile header.
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        card: { backgroundColor: theme.card },
        primaryButton: { backgroundColor: theme.primary },
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            <ScrollView style={styles.scrollView}>
                {/* Header Section */}
                <View style={[styles.headerContainer, { backgroundColor: SHPE_COLORS.darkBlue }]}>

                    {/* --- NEW GEAR ICON --- */}
                    <Link href="/settings" asChild>
                        <TouchableOpacity style={styles.settingsButton}>
                            <Ionicons name="settings-outline" size={24} color={SHPE_COLORS.white} />
                        </TouchableOpacity>
                    </Link>
                    {/* --------------------- */}

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
                        style={[styles.primaryButton, dynamicStyles.primaryButton]}
                        onPress={() => setShowEditProfile(true)}
                    >
                        <Text style={styles.primaryButtonText}>Edit Profile</Text>
                    </TouchableOpacity>
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
                        <Text style={{ marginTop: 10, color: theme.subtext }}>Loading profile...</Text>
                        <TouchableOpacity onPress={() => setShowEditProfile(false)} style={{ marginTop: 20 }}>
                            <Text style={{ color: theme.info }}>Close</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </Modal>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed
    },
    scrollView: {
        flex: 1,
    },
    headerContainer: {
        // backgroundColor removed (set inline)
        paddingTop: 30,
        paddingBottom: 30,
        paddingHorizontal: 20,
        alignItems: 'center',
        position: 'relative',
    },
    settingsButton: {
        position: 'absolute',
        top: 20,
        right: 20,
        zIndex: 10,
        padding: 5,
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
    },
    primaryButton: {
        // backgroundColor removed
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
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    }
});