import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

export default function HomeScreen() {
    const router = useRouter();
    const { user, signOut, updateUserMetadata, profile } = useAuth();
    const { theme, isDark } = useTheme();
    const [showScanner, setShowScanner] = useState(false);

    const handleSignOut = () => {
        Alert.alert(
            'Sign Out',
            'Are you sure you want to sign out?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Sign Out', style: 'destructive', onPress: signOut },
            ]
        );
    };

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        card: { backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#000' },
        iconBg: { backgroundColor: isDark ? '#333' : '#F3F4F6' },
        signOut: { backgroundColor: theme.card, borderColor: theme.border },
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            <View style={styles.content}>
                {/* Welcome Card */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.title}>SHPE NJIT</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    <TouchableOpacity
                        style={[styles.actionCard, dynamicStyles.card]}
                        onPress={() => router.push('/calendar')}
                    >
                        <View style={[styles.actionIconContainer, dynamicStyles.iconBg]}>
                            <Ionicons name="calendar" size={32} color={theme.primary} />
                        </View>
                        <Text style={[styles.actionTitle, dynamicStyles.text]}>View Calendar</Text>
                        <Text style={[styles.actionDescription, dynamicStyles.subtext]}>See upcoming events</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, dynamicStyles.card]}
                        onPress={() => router.push('/check-in')}
                    >
                        <View style={[styles.actionIconContainer, dynamicStyles.iconBg]}>
                            <Ionicons name="qr-code" size={32} color={theme.success} />
                        </View>
                        <Text style={[styles.actionTitle, dynamicStyles.text]}>Check In</Text>
                        <Text style={[styles.actionDescription, dynamicStyles.subtext]}>Scan event QR code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionCard, dynamicStyles.card]}
                        onPress={() => router.push('/profile')}
                    >
                        <View style={[styles.actionIconContainer, dynamicStyles.iconBg]}>
                            <Ionicons name="person" size={32} color={theme.info} />
                        </View>
                        <Text style={[styles.actionTitle, dynamicStyles.text]}>My Profile</Text>
                        <Text style={[styles.actionDescription, dynamicStyles.subtext]}>View & edit profile</Text>
                    </TouchableOpacity>
                </View>

                {/* Debug Card - Remove in production */}
                {__DEV__ && (
                    <View style={[styles.debugCard, { backgroundColor: isDark ? '#1C1C1E' : '#f0f0f0', borderColor: theme.border }]}>
                        <Text style={styles.debugTitle}>Debug Tools</Text>
                        <Text style={[styles.debugText, dynamicStyles.subtext]}>User ID: {user?.id}</Text>

                        <View style={styles.debugActions}>
                            <TouchableOpacity
                                style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                onPress={async () => {
                                    try {
                                        await updateUserMetadata({ onboarding_completed: false });
                                        Alert.alert('Success', 'Onboarding reset! Restart the app to see changes.');
                                    } catch (e) {
                                        Alert.alert('Error', 'Failed to reset onboarding');
                                    }
                                }}
                            >
                                <Text style={[styles.debugButtonText, dynamicStyles.text]}>Reset Onboarding</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                onPress={() => {
                                    console.log('User:', JSON.stringify(user, null, 2));
                                    console.log('Profile:', JSON.stringify(profile, null, 2));
                                    Alert.alert('Logged', 'User data logged to console');
                                }}
                            >
                                <Text style={[styles.debugButtonText, dynamicStyles.text]}>Log User Data</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={[styles.signOutButton, dynamicStyles.signOut]} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color={theme.subtext} />
                <Text style={[styles.signOutText, dynamicStyles.subtext]}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed, handled dynamically
    },
    content: {
        flex: 1,
        padding: 20,
    },
    welcomeCard: {
        backgroundColor: '#D35400', // Brand color, keep static
        borderRadius: 16,
        padding: 24,
        alignItems: 'center',
        marginBottom: 24,
    },
    welcomeText: {
        color: 'rgba(255,255,255,0.8)',
        fontSize: 16,
    },
    title: {
        color: '#fff',
        fontSize: 32,
        fontWeight: 'bold',
        marginVertical: 8,
    },
    email: {
        color: 'rgba(255,255,255,0.9)',
        fontSize: 14,
    },
    actionsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 12,
        marginBottom: 24,
    },
    actionCard: {
        // backgroundColor removed
        borderRadius: 12,
        padding: 16,
        width: '48%',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        // backgroundColor removed
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        // color removed
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 12,
        // color removed
    },
    debugCard: {
        // backgroundColor removed
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        // borderColor removed
        borderStyle: 'dashed',
    },
    debugTitle: {
        fontSize: 12,
        fontWeight: '600',
        color: '#999',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    debugText: {
        fontSize: 12,
        // color removed
        fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
        marginBottom: 4,
    },
    debugActions: {
        marginTop: 12,
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
    },
    debugButton: {
        // backgroundColor removed
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        // borderColor removed
    },
    debugButtonText: {
        fontSize: 12,
        // color removed
        fontWeight: '500',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        padding: 16,
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 8,
    },
    signOutText: {
        // color removed
        fontWeight: '600',
        fontSize: 16,
    },
});
