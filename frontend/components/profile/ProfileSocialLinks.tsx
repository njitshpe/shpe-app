import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import { RADIUS } from '@/constants/colors';
import { UserProfile } from '@/types/userProfile';

interface ProfileSocialLinksProps {
  profile: UserProfile;
  onOpenResume: () => void;
  displayName?: string;
  themeText?: string;
  themeSubtext?: string;
  isDark?: boolean;
  onMentorshipUpdate?: () => Promise<void>;
  readOnly?: boolean;
}

export function ProfileSocialLinks({ profile, onOpenResume }: ProfileSocialLinksProps) {
    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    return (
        <View style={styles.container}>
            <View style={styles.assetRow}>
                {profile.resume_url && (
                    <TouchableOpacity 
                        style={styles.resumeCard} 
                        onPress={() => {
                            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                            onOpenResume();
                        }}
                    >
                        <BlurView intensity={10} tint="light" style={styles.glassInner}>
                            <Ionicons name="document-text" size={20} color="#FFF" />
                            <Text style={styles.resumeText} numberOfLines={1}>
                                {profile.resume_name || 'Resume.pdf'}
                            </Text>
                        </BlurView>
                    </TouchableOpacity>
                )}
            </View>

            <View style={styles.socialRow}>
                {profile.linkedin_url && (
                    <SocialCircle icon="logo-linkedin" onPress={handlePress} />
                )}
                {profile.portfolio_url && (
                    <SocialCircle icon="globe-outline" onPress={handlePress} />
                )}
            </View>
        </View>
    );
}

const SocialCircle = ({ icon, onPress }: { icon: keyof typeof Ionicons.glyphMap; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} style={styles.circleWrapper}>
        <BlurView intensity={20} tint="dark" style={styles.circleInner}>
            <Ionicons name={icon} size={20} color="#FFF" />
        </BlurView>
    </TouchableOpacity>
);

const styles = StyleSheet.create({
    container: { width: '100%', paddingHorizontal: 20, marginTop: 24 },
    assetRow: { marginBottom: 16, alignItems: 'center' },
    resumeCard: { width: '100%', maxWidth: 300, borderRadius: RADIUS.lg, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
    glassInner: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 10 },
    resumeText: { color: '#FFF', fontSize: 13, fontWeight: '600', flex: 1 },
    socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 16 },
    circleWrapper: { width: 48, height: 48, borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' },
    circleInner: { flex: 1, justifyContent: 'center', alignItems: 'center' },
});