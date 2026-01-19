import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { UserProfile, AlumniProfile, getProfileValue } from '@/types/userProfile';
import MentorshipInterstitial from '@/onboarding/components/MentorshipInterstitial.native';
import { profileService } from '@/services/profile.service';

interface ProfileSocialLinksProps {
    profile: UserProfile;
    displayName: string;
    themeText: string;
    themeSubtext: string;
    isDark: boolean;
    onOpenResume: () => void;
    onMentorshipUpdate: () => Promise<void>;
    readOnly?: boolean;
}

export function ProfileSocialLinks({
    profile,
    displayName,
    themeText,
    themeSubtext,
    isDark,
    onOpenResume,
    onMentorshipUpdate,
    readOnly = false,
}: ProfileSocialLinksProps) {
    const [showMentorshipModal, setShowMentorshipModal] = useState(false);

    const handleLinkedInPress = () => {
        if (profile.linkedin_url) {
            let url = profile.linkedin_url;
            if (!url.startsWith('http')) url = 'https://' + url;
            Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open LinkedIn'));
        } else {
            if (!readOnly) Alert.alert('No LinkedIn', 'Add your LinkedIn in Edit Profile');
        }
    };

    const handleResumePress = () => {
        if (profile.resume_url) {
            onOpenResume();
        } else {
            if (!readOnly) Alert.alert('No Resume', 'Add your resume in Edit Profile');
        }
    };

    const handlePortfolioPress = () => {
        const portfolioUrl = getProfileValue(profile, 'portfolio_url');
        if (portfolioUrl) {
            let url = portfolioUrl;
            if (!url.startsWith('http')) url = 'https://' + url;
            Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Portfolio'));
        } else {
            if (!readOnly) Alert.alert('No Portfolio', 'Add your portfolio in Edit Profile');
        }
    };

    // Determine states
    const isAlumni = profile.user_type === 'alumni';
    const isMentor = (profile as AlumniProfile).mentorship_available;

    // Resume is hidden for Alumni (replaced by Mentorship)
    const showResume = !isAlumni && profile.user_type !== 'guest';
    const showPortfolio = profile.user_type !== 'guest';

    const handleMentorshipClick = () => {
        setShowMentorshipModal(true);
    };

    const handleMentorshipAccept = async (selectedWays: string[]) => {
        // If no ways selected, disable mentorship
        const isMentorshipEnabled = selectedWays.length > 0;
        await profileService.updateProfile(profile.id, {
            mentorship_available: isMentorshipEnabled,
            mentorship_ways: selectedWays,
        });
        setShowMentorshipModal(false);
        await onMentorshipUpdate();
    };

    const handleMentorshipDecline = () => {
        // On profile page, Cancel just dismisses without changes
        // User must explicitly use "Remove Mentor Status" button to disable mentorship
        setShowMentorshipModal(false);
    };

    return (
        <View style={styles.socialLinksContainer}>
            {/* 1. LinkedIn */}
            <TouchableOpacity 
                style={styles.socialLink} 
                onPress={handleLinkedInPress}
                disabled={!profile.linkedin_url && readOnly}
            >
                <Ionicons
                    name="logo-linkedin"
                    size={22}
                    color={profile.linkedin_url ? (isDark ? '#E5E5E5' : '#0077B5') : themeSubtext}
                />
                <Text style={[
                    styles.socialLinkText, 
                    { color: themeText }, 
                    !profile.linkedin_url && { color: themeSubtext }
                ]}>
                    LinkedIn
                </Text>
            </TouchableOpacity>

            {/* 2. Middle Slot: Mentorship (Alumni) OR Resume (Students) */}
            {isAlumni ? (
                isMentor ? (
                    <TouchableOpacity
                        onPress={handleMentorshipClick}
                        disabled={readOnly}
                        activeOpacity={0.8}
                    >
                        <LinearGradient
                            colors={['#FFD700', '#FFA500', '#FFD700']}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.mentorGradientButton}
                        >
                            <Ionicons
                                name="people-circle"
                                size={16}
                                color="#1a1a1a"
                            />
                            <Text style={styles.mentorButtonText}>
                                Mentor
                            </Text>
                        </LinearGradient>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        style={styles.socialLink}
                        onPress={handleMentorshipClick}
                        disabled={readOnly}
                    >
                        <Ionicons
                            name="people-circle-outline"
                            size={16}
                            color={themeSubtext}
                        />
                        <Text style={[
                            styles.socialLinkText,
                            { color: themeSubtext }
                        ]}>
                            Mentorship
                        </Text>
                    </TouchableOpacity>
                )
            ) : showResume ? (
                <TouchableOpacity 
                    style={styles.socialLink} 
                    onPress={handleResumePress}
                    disabled={!profile.resume_url && readOnly}
                >
                    <Ionicons
                        name="document-text"
                        size={22}
                        color={profile.resume_url ? themeText : themeSubtext}
                    />
                    <Text style={[
                        styles.socialLinkText, 
                        { color: themeText }, 
                        !profile.resume_url && { color: themeSubtext }
                    ]}>
                        Resume
                    </Text>
                </TouchableOpacity>
            ) : null}

            {/* 3. Portfolio */}
            {showPortfolio && (
                <TouchableOpacity
                    style={styles.socialLink}
                    onPress={handlePortfolioPress}
                    disabled={!getProfileValue(profile, 'portfolio_url') && readOnly}
                >
                    <Ionicons
                        name="link-outline"
                        size={22}
                        color={getProfileValue(profile, 'portfolio_url') ? themeText : themeSubtext}
                    />
                    <Text style={[
                        styles.socialLinkText,
                        { color: themeText },
                        !getProfileValue(profile, 'portfolio_url') && { color: themeSubtext }
                    ]}>
                        Portfolio
                    </Text>
                </TouchableOpacity>
            )}

            {/* Mentorship Interstitial */}
            <MentorshipInterstitial
                visible={showMentorshipModal}
                onAccept={handleMentorshipAccept}
                onDecline={handleMentorshipDecline}
                onDismiss={() => setShowMentorshipModal(false)}
                initialSelected={getProfileValue(profile, 'mentorship_ways') ?? []}
                isEditing={!!isMentor}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    socialLinksContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 28,
        marginBottom: 28,
        paddingHorizontal: 20,
        flexWrap: 'wrap',
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
    mentorGradientButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
    },
    mentorButtonText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1a1a1a',
    },
});