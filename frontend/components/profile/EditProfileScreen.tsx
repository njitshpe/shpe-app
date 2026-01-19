import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    Image,
    Alert,
    Platform,
    KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { ProfileForm } from './ProfileForm';
import { InterestPicker } from './InterestPicker';
import { ResumeUploader } from '@/components/media';
import { useResume, useEditProfile } from '@/hooks/profile';
import { useProfilePhoto } from '@/hooks/media';
import { useTheme } from '@/contexts/ThemeContext';
import { storageService } from '@/services/storage.service';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/userProfile';

const AVATAR_SIZE = 120;

interface EditProfileScreenProps {
    onClose: () => void;
    initialData: UserProfile;
    onSave: (data: UserProfile) => void;
}

export function EditProfileScreen({ onClose, initialData, onSave }: EditProfileScreenProps) {
    const { theme, isDark } = useTheme();

    const { pickResume } = useResume();
    const {
        formData,
        loading: formLoading,
        updateField,
        toggleInterest,
        saveProfile,
    } = useEditProfile(initialData);
    const { pickPhoto } = useProfilePhoto();

    const [uploadingResume, setUploadingResume] = useState(false);
    const [uploadingPhoto, setUploadingPhoto] = useState(false);

    const isLoading = formLoading || uploadingResume || uploadingPhoto;

    const handleSave = async () => {
        if (uploadingResume || uploadingPhoto) {
            Alert.alert('Please Wait', 'Files are still uploading...');
            return;
        }

        const response = await saveProfile();
        if (response.success && response.data) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            onSave(response.data);
            onClose();
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Error', response.error?.message || 'Failed to save profile');
        }
    };

    const handleResumePick = async () => {
        try {
            const result = await pickResume();
            if (!result || !result.uri) return;

            setUploadingResume(true);

            const response = await fetch(result.uri);
            const arrayBuffer = await response.arrayBuffer();

            const storagePath = `${initialData.id}/resume.pdf`;

            const { error: uploadError } = await supabase.storage
                .from('resumes')
                .upload(storagePath, arrayBuffer, {
                    contentType: 'application/pdf',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            updateField('resume_url', storagePath);
            updateField('resume_name', result.name);

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert('Success', 'Resume securely uploaded.');
        } catch (error: any) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            Alert.alert('Upload Failed', error.message);
        } finally {
            setUploadingResume(false);
        }
    };

    const handleImagePick = async () => {
        pickPhoto(async (uri) => {
            try {
                setUploadingPhoto(true);

                const result = await storageService.uploadProfilePhoto(initialData.id, {
                    uri,
                } as any);

                if (result.success && result.data) {
                    updateField('profile_picture_url', result.data.url);
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                    Alert.alert(
                        'Upload Failed',
                        result.error?.message || 'Could not upload photo'
                    );
                }
            } catch (error) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                Alert.alert('Error', 'Failed to process photo');
            } finally {
                setUploadingPhoto(false);
            }
        });
    };

    // Theme colors
    const haloShadowColor = '#FFFFFF';
    const haloShadowOpacity = 0.15;
    const avatarPlaceholderBg = isDark ? '#333333' : '#E5E7EB';
    const avatarBorderColor = isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)';

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            <KeyboardAvoidingView
                style={styles.keyboardView}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                {/* Header */}
                <View style={styles.header}>
                    <TouchableOpacity
                        onPress={onClose}
                        disabled={isLoading}
                        style={styles.headerButton}
                    >
                        <Text style={[styles.cancelText, { color: theme.subtext }]}>Cancel</Text>
                    </TouchableOpacity>

                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        EDIT PROFILE
                    </Text>

                    <View style={styles.headerButton} />
                </View>

                <ScrollView
                    style={styles.scrollView}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Photo Picker - Halo Editor */}
                    <View style={styles.avatarSection}>
                        <TouchableOpacity
                            onPress={handleImagePick}
                            disabled={uploadingPhoto}
                            activeOpacity={0.8}
                            style={[
                                styles.avatarHalo,
                                {
                                    shadowColor: haloShadowColor,
                                    shadowOpacity: haloShadowOpacity,
                                },
                            ]}
                        >
                            {formData.profile_picture_url ? (
                                <Image
                                    source={{ uri: formData.profile_picture_url }}
                                    style={[styles.avatar, { borderColor: avatarBorderColor }]}
                                />
                            ) : (
                                <View
                                    style={[
                                        styles.avatarPlaceholder,
                                        {
                                            backgroundColor: avatarPlaceholderBg,
                                            borderColor: avatarBorderColor,
                                        },
                                    ]}
                                >
                                    <Text style={[styles.avatarInitials, { color: theme.text }]}>
                                        {formData.first_name?.[0]}
                                        {formData.last_name?.[0]}
                                    </Text>
                                </View>
                            )}

                            {/* Camera Button */}
                            <View style={styles.avatarCameraButton}>
                                {uploadingPhoto ? (
                                    <ActivityIndicator color="#0B0B0B" size="small" />
                                ) : (
                                    <Ionicons name="camera" size={18} color="#0B0B0B" />
                                )}
                            </View>
                        </TouchableOpacity>

                        <Text style={[styles.avatarHint, { color: theme.subtext }]}>
                            Tap to change photo
                        </Text>
                    </View>

                    {/* Profile Form */}
                    <ProfileForm profile={formData} onChange={updateField} />

                    {/* Interest Picker */}
                    <InterestPicker
                        selectedInterests={formData.interests}
                        onToggle={toggleInterest}
                    />

                    {/* Resume Uploader */}
                    <View style={styles.resumeSection}>
                        {uploadingResume && (
                            <View style={styles.uploadingIndicator}>
                                <ActivityIndicator
                                    size="small"
                                    color={theme.primary}
                                    style={styles.uploadingSpinner}
                                />
                                <Text style={[styles.uploadingText, { color: theme.primary }]}>
                                    Uploading PDF...
                                </Text>
                            </View>
                        )}
                        <ResumeUploader
                            resumeName={formData.resume_name || null}
                            onUpload={handleResumePick}
                            onRemove={() => {
                                updateField('resume_url', '');
                                updateField('resume_name', '');
                            }}
                        />
                    </View>

                    {/* Bottom Spacer for Save Button */}
                    <View style={styles.bottomSpacer} />
                </ScrollView>

                {/* Floating Save Button */}
                <View style={[styles.saveButtonContainer, { backgroundColor: theme.background }]}>
                    <TouchableOpacity
                        style={[
                            styles.saveButton,
                            {
                                backgroundColor: isDark ? '#FFFFFF' : '#000000',
                                opacity: isLoading ? 0.7 : 1,
                            },
                        ]}
                        onPress={handleSave}
                        disabled={isLoading}
                        activeOpacity={0.8}
                    >
                        {isLoading ? (
                            <ActivityIndicator
                                size="small"
                                color={isDark ? '#000000' : '#FFFFFF'}
                            />
                        ) : (
                            <Text
                                style={[
                                    styles.saveButtonText,
                                    { color: isDark ? '#000000' : '#FFFFFF' },
                                ]}
                            >
                                Save Changes
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    keyboardView: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    headerButton: {
        minWidth: 60,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 1,
    },
    cancelText: {
        fontSize: 16,
        fontWeight: '500',
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 8,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
        marginTop: 8,
    },
    avatarHalo: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        shadowRadius: 50,
        shadowOffset: { width: 0, height: 0 },
        elevation: 10,
    },
    avatar: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        borderWidth: 2,
    },
    avatarPlaceholder: {
        width: AVATAR_SIZE,
        height: AVATAR_SIZE,
        borderRadius: AVATAR_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
    },
    avatarInitials: {
        fontSize: 40,
        fontWeight: 'bold',
    },
    avatarCameraButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(255, 255, 255, 0.7)',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.4)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    avatarHint: {
        marginTop: 12,
        fontSize: 14,
        fontWeight: '500',
    },
    resumeSection: {
        marginTop: 8,
    },
    uploadingIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
    },
    uploadingSpinner: {
        marginRight: 8,
    },
    uploadingText: {
        fontSize: 14,
        fontWeight: '500',
    },
    bottomSpacer: {
        height: 100,
    },
    saveButtonContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 20,
        paddingTop: 12,
        paddingBottom: Platform.OS === 'ios' ? 20 : 24,
    },
    saveButton: {
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.15,
                shadowRadius: 12,
            },
            android: {
                elevation: 6,
            },
        }),
    },
    saveButtonText: {
        fontSize: 17,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});
