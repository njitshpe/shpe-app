import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from '@/components/ui/Skeleton';
import { SPACING, RADIUS } from '@/constants/colors';

export const ProfileSkeleton = () => {
    return (
        <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
                {/* Avatar */}
                <View style={styles.avatarContainer}>
                    <Skeleton width={120} height={120} borderRadius={60} />
                </View>

                {/* Name */}
                <Skeleton width={180} height={28} borderRadius={4} style={{ marginBottom: 8 }} />
                {/* Subtitle */}
                <Skeleton width={120} height={16} borderRadius={4} style={{ marginBottom: 8 }} />
                {/* Secondary Subtitle */}
                <Skeleton width={100} height={16} borderRadius={4} />
            </View>

            {/* Social Links Row */}
            <View style={styles.socialRow}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={40} height={40} borderRadius={20} />
                <Skeleton width={40} height={40} borderRadius={20} />
            </View>

            {/* Bio Section */}
            <View style={styles.bioSection}>
                <Skeleton width="100%" height={80} borderRadius={16} />
            </View>

            {/* Badges Section */}
            <View style={styles.section}>
                <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
                <View style={styles.badgesRow}>
                    <Skeleton width={60} height={60} borderRadius={30} />
                    <Skeleton width={60} height={60} borderRadius={30} />
                    <Skeleton width={60} height={60} borderRadius={30} />
                </View>
            </View>

            {/* Posts Section */}
            <View style={styles.section}>
                <Skeleton width={80} height={24} borderRadius={4} style={{ marginBottom: 16 }} />
                <Skeleton width="100%" height={150} borderRadius={12} style={{ marginBottom: 16 }} />
                <Skeleton width="100%" height={150} borderRadius={12} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: SPACING.lg,
        alignItems: 'center',
    },
    header: {
        alignItems: 'center',
        marginBottom: SPACING.xl,
        marginTop: SPACING.xl, // Match typical header offset
    },
    avatarContainer: {
        marginBottom: SPACING.md,
    },
    socialRow: {
        flexDirection: 'row',
        gap: SPACING.md,
        marginBottom: SPACING.xl,
    },
    bioSection: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    section: {
        width: '100%',
        marginBottom: SPACING.xl,
    },
    badgesRow: {
        flexDirection: 'row',
        gap: SPACING.md,
    },
});
