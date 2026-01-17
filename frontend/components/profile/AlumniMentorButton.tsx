import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { AlumniProfile } from '@/types/userProfile';

interface AlumniMentorButtonProps {
    profile: AlumniProfile;
    displayName: string;
    isDark: boolean;
    themeText: string;
    themeSubtext: string;
    onMentorshipUpdate: () => Promise<void>;
    readOnly?: boolean;
}

const MENTORSHIP_WAYS = [
    { id: 'resume-reviews', label: 'Resume Reviews', icon: '📄' },
    { id: 'mock-interviews', label: 'Mock Interviews', icon: '🎤' },
    { id: 'coffee-chats', label: 'Coffee Chats', icon: '☕' },
    { id: 'company-tours', label: 'Company Tours', icon: '🏢' },
];

export function AlumniMentorButton({
    profile,
    displayName,
    isDark,
    themeText,
    themeSubtext,
    onMentorshipUpdate,
    readOnly = false,
}: AlumniMentorButtonProps) {
    const [showModal, setShowModal] = useState(false);
    const [selectedWays, setSelectedWays] = useState<string[]>([]);

    // If read-only and not a mentor, don't show anything
    if (readOnly && !profile.mentorship_available) {
        return null;
    }

    const toggleMentorshipWay = (wayId: string) => {
        setSelectedWays(prev =>
            prev.includes(wayId) ? prev.filter(w => w !== wayId) : [...prev, wayId]
        );
    };

    const handleEnableMentorship = async () => {
        if (selectedWays.length === 0) {
            Alert.alert('Select at least one option', 'Please choose how you\'d like to help students.');
            return;
        }

        try {
            const { profileService } = await import('@/services/profile.service');

            // Get user ID from context - we'll need to pass it as a prop instead
            // For now, we'll use the profile's id
            const result = await profileService.updateProfile(profile.id, {
                mentorship_available: true,
                mentorship_ways: selectedWays,
            });

            if (result.success) {
                await onMentorshipUpdate();
                setShowModal(false);
                setSelectedWays([]);
                Alert.alert('Success', 'Mentorship enabled! Students can now see your availability.');
            } else {
                Alert.alert('Error', 'Failed to enable mentorship. Please try again.');
            }
        } catch (error) {
            console.error('Error enabling mentorship:', error);
            Alert.alert('Error', 'Failed to enable mentorship. Please try again.');
        }
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setSelectedWays([]);
    };

    const getMentorshipWayInfo = (wayId: string) => {
        const wayLabels: Record<string, { label: string; icon: string }> = {
            'resume-reviews': { label: 'Resume Reviews', icon: '📄' },
            'mock-interviews': { label: 'Mock Interviews', icon: '🎤' },
            'coffee-chats': { label: 'Coffee Chats', icon: '☕' },
            'company-tours': { label: 'Company Tours', icon: '🏢' },
        };
        return wayLabels[wayId] || { label: wayId, icon: '✨' };
    };

    return (
        <>
            {/* Mentor Button */}
            <TouchableOpacity
                style={profile.mentorship_available ? styles.mentorButton : styles.mentorButtonInactive}
                onPress={() => setShowModal(true)}
            >
                {profile.mentorship_available ? (
                    <LinearGradient
                        colors={['#667BC6', '#5A67B8']}
                        style={styles.mentorButtonGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="sparkles" size={18} color="#FFFFFF" />
                        <Text style={styles.mentorButtonText}>Mentor</Text>
                    </LinearGradient>
                ) : (
                    <View style={styles.mentorButtonInactiveContent}>
                        <Ionicons name="people-outline" size={22} color={themeSubtext} />
                        <Text style={[styles.socialLinkText, { color: themeSubtext }]}>Mentor</Text>
                    </View>
                )}
            </TouchableOpacity>

            {/* Mentorship Modal */}
            <Modal
                visible={showModal}
                transparent
                animationType="fade"
                onRequestClose={handleCloseModal}
            >
                <TouchableOpacity
                    style={styles.mentorModalOverlay}
                    activeOpacity={1}
                    onPress={handleCloseModal}
                >
                    <TouchableOpacity
                        activeOpacity={1}
                        onPress={(e) => e.stopPropagation()}
                    >
                        <ScrollView
                            contentContainerStyle={styles.mentorModalScrollContent}
                            showsVerticalScrollIndicator={false}
                        >
                            <View style={[styles.mentorModalContent, { backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF' }]}>
                                <View style={styles.mentorModalHeader}>
                                    <Ionicons name="sparkles" size={32} color="#667BC6" />
                                    <Text style={[styles.mentorModalTitle, { color: themeText }]}>
                                        {profile.mentorship_available ? 'Mentorship Available' : 'Become a Mentor'}
                                    </Text>
                                </View>

                                {profile.mentorship_available ? (
                                    // Show mentorship info
                                    <>
                                        <Text style={[styles.mentorModalSubtitle, { color: themeSubtext }]}>
                                            {displayName} is available to help students through:
                                        </Text>

                                        <View style={styles.mentorshipWaysList}>
                                            {profile.mentorship_ways?.map((way) => {
                                                const wayInfo = getMentorshipWayInfo(way);
                                                return (
                                                    <View key={way} style={[styles.mentorshipWayItem, { backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }]}>
                                                        <Text style={styles.mentorshipWayIcon}>{wayInfo.icon}</Text>
                                                        <Text style={[styles.mentorshipWayText, { color: themeText }]}>{wayInfo.label}</Text>
                                                    </View>
                                                );
                                            })}
                                        </View>

                                        <Text style={[styles.mentorModalFooter, { color: themeSubtext }]}>
                                            Connect via LinkedIn or reach out at SHPE events!
                                        </Text>

                                        <TouchableOpacity
                                            style={styles.mentorModalCloseButton}
                                            onPress={() => setShowModal(false)}
                                        >
                                            <LinearGradient
                                                colors={['#667BC6', '#5A67B8']}
                                                style={styles.mentorModalCloseButtonGradient}
                                                start={{ x: 0, y: 0 }}
                                                end={{ x: 1, y: 1 }}
                                            >
                                                <Text style={styles.mentorModalCloseButtonText}>Got it!</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    </>
                                ) : (
                                    // Show enable mentorship UI
                                    <>
                                        <Text style={[styles.mentorModalSubtitle, { color: themeSubtext }]}>
                                            Your experience is invaluable. Help students by becoming a mentor!
                                        </Text>

                                        <Text style={[styles.mentorModalSectionTitle, { color: themeText }]}>
                                            How would you like to help?
                                        </Text>

                                        <View style={styles.mentorshipWaysList}>
                                            {MENTORSHIP_WAYS.map((way) => {
                                                const isSelected = selectedWays.includes(way.id);
                                                return (
                                                    <TouchableOpacity
                                                        key={way.id}
                                                        onPress={() => toggleMentorshipWay(way.id)}
                                                        style={[
                                                            styles.mentorshipWayItem,
                                                            {
                                                                backgroundColor: isSelected
                                                                    ? 'rgba(102, 123, 198, 0.15)'
                                                                    : isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
                                                                borderWidth: isSelected ? 2 : 0,
                                                                borderColor: '#667BC6',
                                                            }
                                                        ]}
                                                    >
                                                        <Text style={styles.mentorshipWayIcon}>{way.icon}</Text>
                                                        <Text style={[styles.mentorshipWayText, { color: themeText }]}>
                                                            {way.label}
                                                        </Text>
                                                        {isSelected && (
                                                            <Ionicons name="checkmark-circle" size={20} color="#667BC6" style={{ marginLeft: 'auto' }} />
                                                        )}
                                                    </TouchableOpacity>
                                                );
                                            })}
                                        </View>

                                        <Text style={[styles.mentorModalFooter, { color: themeSubtext }]}>
                                            Students will be able to see your availability and reach out!
                                        </Text>

                                        <View style={styles.mentorModalButtons}>
                                            <TouchableOpacity
                                                style={styles.mentorModalCloseButton}
                                                onPress={handleEnableMentorship}
                                            >
                                                <LinearGradient
                                                    colors={['#667BC6', '#5A67B8']}
                                                    style={styles.mentorModalCloseButtonGradient}
                                                    start={{ x: 0, y: 0 }}
                                                    end={{ x: 1, y: 1 }}
                                                >
                                                    <Text style={styles.mentorModalCloseButtonText}>Enable Mentorship</Text>
                                                </LinearGradient>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                onPress={handleCloseModal}
                                                style={styles.mentorModalSecondaryButton}
                                            >
                                                <Text style={[styles.mentorModalSecondaryButtonText, { color: themeSubtext }]}>
                                                    Maybe later
                                                </Text>
                                            </TouchableOpacity>
                                        </View>
                                    </>
                                )}
                            </View>
                        </ScrollView>
                    </TouchableOpacity>
                </TouchableOpacity>
            </Modal>
        </>
    );
}

const styles = StyleSheet.create({
    mentorButton: {
        overflow: 'hidden',
        borderRadius: 20,
        shadowColor: '#667BC6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 5,
    },
    mentorButtonGradient: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
    },
    mentorButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '600',
    },
    mentorButtonInactive: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    mentorButtonInactiveContent: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    socialLinkText: {
        fontSize: 14,
        fontWeight: '500',
    },
    mentorModalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    mentorModalScrollContent: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: 20,
    },
    mentorModalContent: {
        borderRadius: 24,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 10,
    },
    mentorModalHeader: {
        alignItems: 'center',
        marginBottom: 16,
    },
    mentorModalTitle: {
        fontSize: 24,
        fontWeight: '700',
        marginTop: 8,
        textAlign: 'center',
    },
    mentorModalSubtitle: {
        fontSize: 15,
        textAlign: 'center',
        marginBottom: 20,
        lineHeight: 22,
    },
    mentorshipWaysList: {
        gap: 12,
        marginBottom: 20,
    },
    mentorshipWayItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 14,
        borderRadius: 12,
        gap: 12,
    },
    mentorshipWayIcon: {
        fontSize: 24,
    },
    mentorshipWayText: {
        fontSize: 16,
        fontWeight: '600',
    },
    mentorModalFooter: {
        fontSize: 13,
        textAlign: 'center',
        marginBottom: 20,
        fontStyle: 'italic',
    },
    mentorModalCloseButton: {
        overflow: 'hidden',
        borderRadius: 16,
    },
    mentorModalCloseButtonGradient: {
        paddingVertical: 14,
        alignItems: 'center',
        borderRadius: 16,
    },
    mentorModalCloseButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    mentorModalSectionTitle: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        marginTop: 8,
    },
    mentorModalButtons: {
        gap: 12,
    },
    mentorModalSecondaryButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    mentorModalSecondaryButtonText: {
        fontSize: 15,
        fontWeight: '500',
    },
});
