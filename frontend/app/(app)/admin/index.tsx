import React, { useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Modal,
    Alert,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useEvents } from '@/contexts/EventsContext';
import { AdminEventForm } from '@/components/admin/AdminEventForm';
import { CreateEventData } from '@/services/adminEvents.service';
import { adminAnnouncementsService } from '@/services/adminAnnouncements.service';
import { adminService } from '@/services';
import { AnnouncementModal } from '@/components/admin/AnnouncementModal';

export default function AdminDashboard() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { events, isCurrentUserAdmin, createEvent } = useEvents();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showAnnouncementModal, setShowAnnouncementModal] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Check if user is super admin for moderation/announcement features
    React.useEffect(() => {
        const checkSuperAdmin = async () => {
            const result = await adminService.isCurrentUserSuperAdmin();
            setIsSuperAdmin(result.data || false);
        };
        checkSuperAdmin();
    }, []);

    // Redirect if not admin
    React.useEffect(() => {
        if (!isCurrentUserAdmin) {
            Alert.alert(
                'Access Denied',
                'You do not have admin privileges',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    }, [isCurrentUserAdmin]);

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        card: { backgroundColor: theme.card, shadowColor: isDark ? '#000' : '#000' },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        button: { backgroundColor: theme.primary },
    };

    const upcomingEvents = events.filter((e) => e.status === 'upcoming');
    const pastEvents = events.filter((e) => e.status === 'past');

    const handleCreateEvent = async (data: CreateEventData) => {
        const success = await createEvent(data);
        if (success) {
            setShowCreateModal(false);
        }
        return success;
    };

    // Handle sending announcement from Modal
    const handleSendAnnouncement = async (title: string, message: string) => {
        const response = await adminAnnouncementsService.sendAnnouncement(title, message);
        if (response.success) {
            Alert.alert('Sent!', 'Your announcement has been pushed to all users.');
            return true;
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to send.');
            return false;
        }
    };

    if (!isCurrentUserAdmin) {
        return null; // Will redirect via useEffect
    }

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <View style={styles.headerCenter}>
                    <Text style={[styles.title, dynamicStyles.text]}>Admin Dashboard</Text>
                    <View style={[styles.roleBadge, { backgroundColor: isSuperAdmin ? theme.primary + '20' : theme.subtext + '20' }]}>
                        <Text style={[styles.roleBadgeText, { color: isSuperAdmin ? theme.primary : theme.subtext }]}>
                            {isSuperAdmin ? 'Super Admin' : 'Event Manager'}
                        </Text>
                    </View>
                </View>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Quick Stats */}
                <View style={styles.statsGrid}>
                    <View style={[styles.statCard, dynamicStyles.card]}>
                        <Ionicons name="calendar-outline" size={32} color={theme.primary} />
                        <Text style={[styles.statNumber, dynamicStyles.text]}>{events.length}</Text>
                        <Text style={[styles.statLabel, dynamicStyles.subtext]}>Total Events</Text>
                    </View>

                    <View style={[styles.statCard, dynamicStyles.card]}>
                        <Ionicons name="time-outline" size={32} color={theme.success} />
                        <Text style={[styles.statNumber, dynamicStyles.text]}>{upcomingEvents.length}</Text>
                        <Text style={[styles.statLabel, dynamicStyles.subtext]}>Upcoming</Text>
                    </View>

                    <View style={[styles.statCard, dynamicStyles.card]}>
                        <Ionicons name="checkmark-circle-outline" size={32} color={theme.subtext} />
                        <Text style={[styles.statNumber, dynamicStyles.text]}>{pastEvents.length}</Text>
                        <Text style={[styles.statLabel, dynamicStyles.subtext]}>Past</Text>
                    </View>
                </View>

                {/* Quick Actions */}
                <View style={styles.section}>
                    <Text style={[styles.sectionTitle, dynamicStyles.text]}>Quick Actions</Text>

                    <TouchableOpacity
                        style={[styles.actionButton, dynamicStyles.button]}
                        onPress={() => setShowCreateModal(true)}
                    >
                        <Ionicons name="add-circle-outline" size={24} color="#fff" />
                        <Text style={styles.actionButtonText}>Create New Event</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.actionButton, dynamicStyles.card]}
                        onPress={() => router.push('/calendar?view=feed')}
                    >
                        <Ionicons name="list-outline" size={24} color={theme.text} />
                        <Text style={[styles.actionButtonText, dynamicStyles.text]}>View All Events</Text>
                    </TouchableOpacity>

                    {isSuperAdmin && (
                        <TouchableOpacity
                            style={[styles.actionButton, dynamicStyles.card]}
                            onPress={() => setShowAnnouncementModal(true)}
                        >
                            <Ionicons name="megaphone-outline" size={24} color={theme.text} />
                            <Text style={[styles.actionButtonText, dynamicStyles.text]}>Send Announcement</Text>
                        </TouchableOpacity>
                    )}

                    {isSuperAdmin && (
                        <TouchableOpacity
                            style={[styles.actionButton, dynamicStyles.card]}
                            onPress={() => router.push('/admin/moderation')}
                        >
                            <Ionicons name="shield-checkmark-outline" size={24} color={theme.text} />
                            <Text style={[styles.actionButtonText, dynamicStyles.text]}>Moderation</Text>
                        </TouchableOpacity>
                    )}
                </View>

                {/* Info Section */}
                <View style={[styles.infoCard, dynamicStyles.card]}>
                    <Ionicons name="information-circle-outline" size={24} color={theme.primary} />
                    <View style={styles.infoContent}>
                        <Text style={[styles.infoTitle, dynamicStyles.text]}>Admin Features</Text>
                        <Text style={[styles.infoText, dynamicStyles.subtext]}>
                            • Create, edit, and delete events{'\n'}
                            • Manage event details and settings{'\n'}
                            • Send announcements{'\n'}
                            • View event analytics (coming soon)
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* Create Event Modal */}
            <Modal
                visible={showCreateModal}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={() => setShowCreateModal(false)}
            >
                <AdminEventForm
                    mode="create"
                    onSubmit={handleCreateEvent}
                    onCancel={() => setShowCreateModal(false)}
                />
            </Modal>

            {/* Announcement Modal */}
            <AnnouncementModal
                visible={showAnnouncementModal}
                onClose={() => setShowAnnouncementModal(false)}
                onSend={handleSendAnnouncement}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerCenter: {
        alignItems: 'center',
        gap: 6,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    roleBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
    },
    roleBadgeText: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    content: {
        flex: 1,
        padding: 20,
    },
    statsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        gap: 8,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    statNumber: {
        fontSize: 24,
        fontWeight: '700',
    },
    statLabel: {
        fontSize: 12,
        textAlign: 'center',
    },
    section: {
        marginBottom: 24,
        gap: 12,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 4,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        padding: 16,
        borderRadius: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    actionButtonText: {
        fontSize: 16,
        fontWeight: '600',
        color: '#fff',
    },
    infoCard: {
        flexDirection: 'row',
        padding: 16,
        borderRadius: 16,
        gap: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    infoContent: {
        flex: 1,
        gap: 8,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: '600',
    },
    infoText: {
        fontSize: 14,
        lineHeight: 20,
    },
    formCard: {
        padding: 16,
        borderRadius: 16,
        gap: 12,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    input: {
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
        fontSize: 16,
    },
    textArea: {
        height: 80,
        textAlignVertical: 'top',
    },
});
