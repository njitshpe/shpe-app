import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export function ProfileSkeleton() {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            {/* Settings Icon Placeholder */}
            <View style={styles.settingsPlaceholder} />

            {/* Header: Avatar + Info */}
            <View style={styles.header}>
                <Skeleton width={120} height={120} borderRadius={60} style={{ alignSelf: 'center', marginBottom: 16 }} />
                <Skeleton width={180} height={24} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Skeleton width={140} height={16} borderRadius={4} style={{ alignSelf: 'center', marginBottom: 8 }} />
                <Skeleton width={100} height={14} borderRadius={4} style={{ alignSelf: 'center' }} />
            </View>

            {/* Social Links */}
            <View style={styles.socials}>
                <Skeleton width={300} height={40} borderRadius={8} style={{ alignSelf: 'center' }} />
            </View>

            {/* Bio */}
            <View style={styles.bio}>
                <Skeleton width="100%" height={80} borderRadius={16} />
            </View>

            {/* Edit Profile Button */}
            <View style={styles.editButton}>
                <Skeleton width="100%" height={50} borderRadius={24} />
            </View>

            {/* Badges */}
            <View style={styles.badges}>
                <Skeleton width={100} height={20} borderRadius={4} style={{ marginBottom: 12 }} />
                <View style={{ flexDirection: 'row', gap: 12 }}>
                    <Skeleton width={60} height={80} borderRadius={8} />
                    <Skeleton width={60} height={80} borderRadius={8} />
                    <Skeleton width={60} height={80} borderRadius={8} />
                    <Skeleton width={60} height={80} borderRadius={8} />
                </View>
            </View>

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 20,
        paddingTop: 40,
    },
    settingsPlaceholder: {
        height: 28,
        marginBottom: 20,
    },
    header: {
        marginBottom: 24,
    },
    socials: {
        marginBottom: 24,
    },
    bio: {
        marginBottom: 32,
    },
    editButton: {
        marginHorizontal: 40,
        marginBottom: 32,
    },
    badges: {
        marginBottom: 24
    }
});
