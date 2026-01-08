import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UserProfile, AlumniProfile } from '@/types/userProfile';
import { AlumniMentorButton } from './AlumniMentorButton';

interface ProfileSocialLinksProps {
    profile: UserProfile;
    displayName: string;
    themeText: string;
    themeSubtext: string;
    isDark: boolean;
    onOpenResume: () => void;
    onMentorshipUpdate: () => Promise<void>;
}

export function ProfileSocialLinks({
    profile,
    displayName,
    themeText,
    themeSubtext,
    isDark,
    onOpenResume,
    onMentorshipUpdate,
}: ProfileSocialLinksProps) {
    const handleLinkedInPress = () => {
        if (profile.linkedin_url) {
            let url = profile.linkedin_url;
            if (!url.startsWith('http')) url = 'https://' + url;
            Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open LinkedIn'));
        } else {
            Alert.alert('No LinkedIn', 'Add your LinkedIn in Edit Profile');
        }
    };

    const handleResumePress = () => {
        if (profile.resume_url) {
            onOpenResume();
        } else {
            Alert.alert('No Resume', 'Add your resume in Edit Profile');
        }
    };

    const handlePortfolioPress = () => {
        const portfolioUrl = (profile as any)?.portfolio_url;
        if (portfolioUrl) {
            let url = portfolioUrl;
            if (!url.startsWith('http')) url = 'https://' + url;
            Linking.openURL(url).catch(() => Alert.alert('Error', 'Could not open Portfolio'));
        } else {
            Alert.alert('No Portfolio', 'Add your portfolio in Edit Profile');
        }
    };

    return (
        <View style={styles.socialLinksContainer}>
            {/* LinkedIn */}
            <TouchableOpacity style={styles.socialLink} onPress={handleLinkedInPress}>
                <Ionicons
                    name="logo-linkedin"
                    size={22}
                    color={profile.linkedin_url ? "#0077B5" : "#8E8E93"}
                />
                <Text style={[styles.socialLinkText, { color: themeText }, !profile.linkedin_url && { color: themeSubtext }]}>
                    LinkedIn
                </Text>
            </TouchableOpacity>

            {/* Mentor Button (for alumni) or Resume (for non-alumni non-guests) */}
            {profile.user_type === 'alumni' ? (
                <AlumniMentorButton
                    profile={profile as AlumniProfile}
                    displayName={displayName}
                    isDark={isDark}
                    themeText={themeText}
                    themeSubtext={themeSubtext}
                    onMentorshipUpdate={onMentorshipUpdate}
                />
            ) : profile.user_type !== 'guest' ? (
                <TouchableOpacity style={styles.socialLink} onPress={handleResumePress}>
                    <Ionicons
                        name="document-text"
                        size={22}
                        color={profile.resume_url ? themeText : themeSubtext}
                    />
                    <Text style={[styles.socialLinkText, { color: themeText }, !profile.resume_url && { color: themeSubtext }]}>
                        Resume
                    </Text>
                </TouchableOpacity>
            ) : null}

            {/* Portfolio - Hidden for guests */}
            {profile.user_type !== 'guest' && (
                <TouchableOpacity style={styles.socialLink} onPress={handlePortfolioPress}>
                    <Ionicons
                        name="link-outline"
                        size={22}
                        color={(profile as any)?.portfolio_url ? themeText : themeSubtext}
                    />
                    <Text style={[styles.socialLinkText, { color: themeText }, !(profile as any)?.portfolio_url && { color: themeSubtext }]}>
                        Portfolio
                    </Text>
                </TouchableOpacity>
            )}
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
});
