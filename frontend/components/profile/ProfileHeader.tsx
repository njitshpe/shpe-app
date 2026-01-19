import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { MotiView } from 'moti';
import { RADIUS, SPACING } from '@/constants/colors';

// ... Props remain the same as your existing ProfileHeader

export function ProfileHeader({ profilePictureUrl, initials, userTypeBadge, displayName, subtitle }) {
    return (
        <View style={styles.container}>
            {/* The Halo Avatar */}
            <MotiView 
                from={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', damping: 15 }}
                style={styles.haloWrapper}
            >
                <View style={styles.avatarGlow} />
                {profilePictureUrl ? (
                    <Image source={{ uri: profilePictureUrl }} style={styles.avatar} />
                ) : (
                    <View style={styles.avatarPlaceholder}>
                        <Text style={styles.initials}>{initials}</Text>
                    </View>
                )}
            </MotiView>

            {/* Identity Text */}
            <View style={styles.textWrapper}>
                <View style={styles.badgeGlass}>
                    <Text style={styles.badgeText}>{userTypeBadge.toUpperCase()}</Text>
                </View>
                <Text style={styles.name}>{displayName}</Text>
                <Text style={styles.subtitle}>{subtitle}</Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { alignItems: 'center', marginTop: 40 },
    haloWrapper: {
        width: 120, height: 120, borderRadius: 60,
        backgroundColor: '#000', justifyContent: 'center', alignItems: 'center',
        // White Halo Glow
        shadowColor: '#FFF', shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3, shadowRadius: 20, elevation: 15,
    },
    avatar: { width: 114, height: 114, borderRadius: 57, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    avatarPlaceholder: { width: 114, height: 114, borderRadius: 57, backgroundColor: '#1A1A1A', justifyContent: 'center', alignItems: 'center' },
    initials: { color: '#FFF', fontSize: 32, fontWeight: '800' },
    textWrapper: { alignItems: 'center', marginTop: 20 },
    badgeGlass: { 
        backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 12, paddingVertical: 4, 
        borderRadius: RADIUS.full, borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', marginBottom: 12 
    },
    badgeText: { color: '#FFF', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
    name: { color: '#FFF', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
    subtitle: { color: 'rgba(255,255,255,0.5)', fontSize: 14, marginTop: 4, fontWeight: '500' },
});