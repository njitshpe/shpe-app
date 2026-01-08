import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform, Modal, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { profileService } from '@/services/profile.service';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useEvents } from '@/contexts/EventsContext';
import { useOngoingEvents } from '@/hooks/events';
import { CompactEventCard } from '@/components/events/CompactEventCard';
import { rankService, UserRankData, RankActionType } from '@/services/rank.service';

export default function HomeScreen() {
    const router = useRouter();
    const { user, signOut, updateUserMetadata, profile, loadProfile } = useAuth();
    const { theme, isDark } = useTheme();
    const { events, isCurrentUserAdmin } = useEvents();
    const { ongoingEvents, upcomingEvents } = useOngoingEvents(events);
    const [showScanner, setShowScanner] = useState(false);
    const [rankData, setRankData] = useState<UserRankData | null>(null);

    React.useEffect(() => {
        loadRank();
    }, []);

    const loadRank = async () => {
        const response = await rankService.getMyRank();
        if (response.success && response.data) {
            setRankData(response.data);
        }
    };

    // Determine relevant event to show
    const relevantEvent = ongoingEvents.length > 0
        ? ongoingEvents[0]
        : upcomingEvents.length > 0
            ? upcomingEvents[0]
            : null;

    const handleAwardPoints = async (action: RankActionType, overrides?: any) => {
        // Validation for event-based actions
        if ((action === 'attendance' || action === 'rsvp') && !relevantEvent && !overrides?.eventId) {
            Alert.alert('Debug Error', 'No active/upcoming event found to assign this action to.');
            return;
        }

        try {
            const response = await rankService.awardForAction(action, {
                event_id: overrides?.eventId !== undefined ? overrides.eventId : relevantEvent?.id
            });
            if (response.success && response.data) {
                Alert.alert('Success', `Awarded! New Balance: ${response.data.newBalance}`);
                setRankData({
                    rank_points: response.data.newBalance,
                    rank: response.data.rank
                });
            } else {
                console.error(response.error);
                const errorMsg = JSON.stringify(response.error, null, 2);
                Alert.alert('Invoke Failed', errorMsg);
            }
        } catch (e: any) {
            Alert.alert('Exceptions', e.message);
        }
    };

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
            <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
                {/* Welcome Card */}
                <View style={styles.welcomeCard}>
                    <Text style={styles.welcomeText}>Welcome to</Text>
                    <Text style={styles.title}>SHPE NJIT</Text>
                    <Text style={styles.email}>{user?.email}</Text>
                </View>

                {/* Featured Event Card */}
                {relevantEvent && (
                    <View style={styles.eventContainer}>
                        <View style={styles.sectionHeader}>
                            <Text style={[styles.sectionTitle, { color: theme.text }]}>
                                {ongoingEvents.length > 0 ? 'Happening Now' : 'Up Next'}
                            </Text>
                            <TouchableOpacity onPress={() => router.push('/calendar')}>
                                <Text style={[styles.seeAllText, { color: theme.primary }]}>See All</Text>
                            </TouchableOpacity>
                        </View>
                        <CompactEventCard
                            event={relevantEvent}
                            onPress={() => router.push(`/event/${relevantEvent.id}`)}
                        />
                    </View>
                )}

                {/* Announcement Section */}
                <View style={[styles.announcementCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <View style={styles.announcementIconContainer}>
                        <Text style={styles.announcementEmoji}>👤</Text>
                    </View>
                    <View style={styles.announcementContent}>
                        <View style={styles.announcementHeader}>
                            <Text style={[styles.announcementTitle, { color: theme.text }]}>Welcome Back!🎉🎉</Text>
                            <Text style={[styles.announcementTime, { color: theme.subtext }]}>2h ago</Text>
                        </View>
                        <Text style={[styles.announcementText, { color: theme.subtext }]}>
                            Get ready for an amazing semester with SHPE!
                        </Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.actionsGrid}>
                    {/* Debug Card - Left Side */}
                    {__DEV__ && (
                        <View style={[styles.actionCard, { backgroundColor: isDark ? '#1C1C1E' : '#f0f0f0', borderColor: theme.border, borderWidth: 1, borderStyle: 'dashed' }]}>
                            <Text style={styles.debugTitle}>Debug Tools</Text>
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

                            <Text style={[styles.debugTitle, { marginTop: 16 }]}>Points System</Text>
                            <Text style={[styles.debugText, dynamicStyles.text]}>
                                Rank: {rankData?.rank || '...'} ({rankData?.rank_points || 0} pts)
                            </Text>
                            <View style={styles.debugActions}>
                                <TouchableOpacity
                                    style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                    onPress={() => handleAwardPoints('attendance', { eventId: '15b46007-b2e0-4077-a1bb-048073d37d91' })}
                                >
                                    <Text style={[styles.debugButtonText, dynamicStyles.text]}>+ Attend (10)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                    onPress={() => handleAwardPoints('rsvp', { eventId: '15b46007-b2e0-4077-a1bb-048073d37d91' })}
                                >
                                    <Text style={[styles.debugButtonText, dynamicStyles.text]}>+ RSVP (3)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                    onPress={() => handleAwardPoints('verified', { eventId: null })}
                                >
                                    <Text style={[styles.debugButtonText, dynamicStyles.text]}>+ Verify (10)</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                    onPress={async () => {
                                        try {
                                            const { data, error } = await supabase
                                                .from('rank_rules')
                                                .select('*')
                                                .eq('active', true)
                                                .single();

                                            if (error) throw error;
                                            Alert.alert('Config OK', `Found Active Rule Set: ${data.name} (v${data.version})`);
                                        } catch (e: any) {
                                            Alert.alert('Config Missing', 'Table exists but NO ACTIVE RULES found. Run INSERT script.');
                                        }
                                    }}
                                >
                                    <Text style={[styles.debugButtonText, dynamicStyles.text]}>Test DB</Text>
                                </TouchableOpacity>
                                <TouchableOpacity
                                    style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                    onPress={loadRank}
                                >
                                    <Text style={[styles.debugButtonText, dynamicStyles.text]}>Refresh</Text>
                                </TouchableOpacity>
                            </View>

                            <Text style={[styles.debugTitle, { marginTop: 16 }]}>Admin Status</Text>
                            <Text style={[styles.debugText, dynamicStyles.text]}>
                                Is Admin: {isCurrentUserAdmin ? '✅ YES' : '❌ NO'}
                            </Text>
                            <View style={styles.debugActions}>
                                <TouchableOpacity
                                    style={[styles.debugButton, { backgroundColor: isDark ? '#333' : '#e0e0e0', borderColor: theme.border }]}
                                    onPress={async () => {
                                        try {
                                            const { data: { user } } = await supabase.auth.getUser();
                                            if (!user) {
                                                Alert.alert('Error', 'Not logged in');
                                                return;
                                            }

                                            const { data: adminRole, error } = await supabase
                                                .from('admin_roles')
                                                .select('*')
                                                .eq('user_id', user.id)
                                                .is('revoked_at', null)
                                                .maybeSingle();

                                            if (error) {
                                                Alert.alert('Database Error', error.message);
                                                return;
                                            }

                                            if (adminRole) {
                                                Alert.alert(
                                                    'Admin Status: YES ✅',
                                                    `User ID: ${user.id}\nRole: ${adminRole.role_type}\nGranted: ${new Date(adminRole.granted_at).toLocaleDateString()}`
                                                );
                                            } else {
                                                Alert.alert(
                                                    'Admin Status: NO ❌',
                                                    `User ID: ${user.id}\n\nTo grant admin access, run:\n\nINSERT INTO admin_roles (user_id, role_type) VALUES ('${user.id}', 'event_manager');`
                                                );
                                            }
                                        } catch (e: any) {
                                            Alert.alert('Error', e.message);
                                        }
                                    }}
                                >
                                    <Text style={[styles.debugButtonText, dynamicStyles.text]}>Check Admin</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}

                    {/* Admin Dashboard - Only for admins */}
                    {isCurrentUserAdmin && (
                        <TouchableOpacity
                            style={[styles.actionCard, dynamicStyles.card]}
                            onPress={() => router.push('/admin')}
                        >
                            <View style={[styles.actionIconContainer, dynamicStyles.iconBg]}>
                                <Ionicons name="shield-checkmark" size={32} color={theme.primary} />
                            </View>
                            <Text style={[styles.actionTitle, dynamicStyles.text]}>Admin</Text>
                            <Text style={[styles.actionDescription, dynamicStyles.subtext]}>Manage events</Text>
                        </TouchableOpacity>
                    )}

                    {/* Check In - Right Side */}
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
                </View>
            </ScrollView>

            {/* Sign Out Button */}
            <TouchableOpacity style={[styles.signOutButton, dynamicStyles.signOut]} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={18} color={theme.subtext} />
                <Text style={[styles.signOutText, dynamicStyles.subtext]}>Sign Out</Text>
            </TouchableOpacity>
        </SafeAreaView >
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        // backgroundColor removed, handled dynamically
    },
    content: {
        flex: 1,
    },
    scrollContent: {
        padding: 20,
    },
    // ... items ...
    signOutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor removed
        borderWidth: 1,
        // borderColor removed
        padding: 10,
        borderRadius: 8,
        marginHorizontal: 20,
        marginBottom: 10,
        gap: 6,
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
    eventContainer: {
        marginBottom: 8,
    },
    announcementCard: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        marginBottom: 24,
        borderWidth: 1,
        gap: 16,
    },
    announcementIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: 'rgba(255, 165, 0, 0.1)', // Light orange tint
        justifyContent: 'center',
        alignItems: 'center',
    },
    announcementEmoji: {
        fontSize: 24,
    },
    announcementContent: {
        flex: 1,
        gap: 4,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    announcementTitle: {
        fontSize: 16,
        fontWeight: '700',
    },
    announcementTime: {
        fontSize: 12,
    },
    announcementText: {
        fontSize: 14,
        lineHeight: 20,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    seeAllText: {
        fontSize: 14,
        fontWeight: '600',
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
    // signOutButton removed (duplicate)
    signOutText: {
        // color removed
        fontWeight: '600',
        fontSize: 14,
    },
});
