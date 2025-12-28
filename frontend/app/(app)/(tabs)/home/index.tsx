import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../../../contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function HomeScreen() {
    const router = useRouter();
    const { user, signOut, updateUserMetadata, profile } = useAuth();
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

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
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
                        style={styles.actionCard}
                        onPress={() => router.push('/calendar')}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="calendar" size={32} color="#D35400" />
                        </View>
                        <Text style={styles.actionTitle}>View Calendar</Text>
                        <Text style={styles.actionDescription}>See upcoming events</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/check-in')}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="qr-code" size={32} color="#10B981" />
                        </View>
                        <Text style={styles.actionTitle}>Check In</Text>
                        <Text style={styles.actionDescription}>Scan event QR code</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/profile')}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="person" size={32} color="#3B82F6" />
                        </View>
                        <Text style={styles.actionTitle}>My Profile</Text>
                        <Text style={styles.actionDescription}>View & edit profile</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionCard}
                        onPress={() => router.push('/notifications')}
                    >
                        <View style={styles.actionIconContainer}>
                            <Ionicons name="notifications" size={32} color="#8B5CF6" />
                        </View>
                        <Text style={styles.actionTitle}>Notifications</Text>
                        <Text style={styles.actionDescription}>Manage alerts</Text>
                    </TouchableOpacity>
                </View>

                {/* Debug Card - Remove in production */}
                <View style={styles.debugCard}>
                    <Text style={styles.debugTitle}>Debug Tools</Text>
                    <Text style={styles.debugText}>User ID: {user?.id}</Text>

                    <View style={styles.debugActions}>
                        <TouchableOpacity
                            style={styles.debugButton}
                            onPress={async () => {
                                try {
                                    await updateUserMetadata({ onboarding_completed: false });
                                    Alert.alert('Success', 'Onboarding reset! Restart the app to see changes.');
                                } catch (e) {
                                    Alert.alert('Error', 'Failed to reset onboarding');
                                }
                            }}
                        >
                            <Text style={styles.debugButtonText}>Reset Onboarding</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.debugButton}
                            onPress={() => {
                                console.log('User:', JSON.stringify(user, null, 2));
                                console.log('Profile:', JSON.stringify(profile, null, 2));
                                Alert.alert('Logged', 'User data logged to console');
                            }}
                        >
                            <Text style={styles.debugButtonText}>Log User Data</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Sign Out Button */}
            <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={20} color="#666" />
                <Text style={styles.signOutText}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5f5f5',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    welcomeCard: {
        backgroundColor: '#D35400',
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
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        width: '48%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
    },
    actionIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    actionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1a1a1a',
        marginBottom: 4,
    },
    actionDescription: {
        fontSize: 12,
        color: '#666',
    },
    debugCard: {
        backgroundColor: '#f0f0f0',
        borderRadius: 12,
        padding: 16,
        borderWidth: 1,
        borderColor: '#e0e0e0',
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
        color: '#666',
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
        backgroundColor: '#e0e0e0',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 4,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    debugButtonText: {
        fontSize: 12,
        color: '#333',
        fontWeight: '500',
    },
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        padding: 16,
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 20,
        gap: 8,
    },
    signOutText: {
        color: '#666',
        fontWeight: '600',
        fontSize: 16,
    },
});
