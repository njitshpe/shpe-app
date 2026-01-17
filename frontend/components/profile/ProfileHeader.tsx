import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { SHPE_COLORS } from '@/constants';

interface ProfileHeaderProps {
    profilePictureUrl?: string;
    initials: string;
    userTypeBadge: string;
    displayName: string;
    subtitle: string;
    secondarySubtitle: string | null;
    isDark: boolean;
    themeText: string;
    themeSubtext: string;
}

export function ProfileHeader({
    profilePictureUrl,
    initials,
    userTypeBadge,
    displayName,
    subtitle,
    secondarySubtitle,
    isDark,
    themeText,
    themeSubtext,
}: ProfileHeaderProps) {
    return (
        <>
            {/* Profile Photo - Centered */}
            <View style={styles.avatarContainer}>
                {profilePictureUrl ? (
                    <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
                ) : (
                    <View style={[styles.avatarPlaceholder, { backgroundColor: isDark ? '#444' : '#C0C0C0' }]}>
                        <Text style={[styles.avatarInitials, { color: isDark ? SHPE_COLORS.white : '#000' }]}>
                            {initials}
                        </Text>
                    </View>
                )}
            </View>

            {/* User Type Badge - Red Pill */}
            <View style={styles.badgeContainer}>
                <View style={styles.userTypeBadge}>
                    <Text style={styles.userTypeBadgeText}>{userTypeBadge}</Text>
                </View>
            </View>

            {/* Name - Centered */}
            <Text style={[styles.nameText, { color: themeText }]}>{displayName}</Text>

            {/* Subtitle - Major | Class of YYYY */}
            <Text style={[styles.subtitleText, { color: themeSubtext }]}>{subtitle}</Text>

            {/* Secondary Subtitle - Job Title at Company (Alumni) / University (Guest) */}
            {secondarySubtitle && (
                <Text style={[styles.secondarySubtitleText, { color: themeSubtext }]}>{secondarySubtitle}</Text>
            )}
        </>
    );
}

const styles = StyleSheet.create({
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
        marginBottom: 8,
    },
    secondarySubtitleText: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 24,
    },
});
