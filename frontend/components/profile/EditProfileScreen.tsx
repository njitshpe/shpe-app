import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { ProfileForm } from './ProfileForm';
import { InterestPicker } from './InterestPicker';
import { ResumeUploader } from '@/components/media';
import { useResume, useEditProfile } from '@/hooks/profile';
import { useProfilePhoto } from '@/hooks/media';
import type { UserProfile } from '@/types/userProfile';
import { useTheme } from '@/contexts/ThemeContext';

interface EditProfileScreenProps {
  onClose: () => void;
  initialData: UserProfile;
  onSave: (data: UserProfile) => void;
}

export function EditProfileScreen({ onClose, initialData, onSave }: EditProfileScreenProps) {
  const { pickResume } = useResume();
  const { formData, loading, updateField, toggleInterest, updateResume, saveProfile } = useEditProfile(initialData);
  const { pickPhoto } = useProfilePhoto();
  const { theme, isDark } = useTheme();

  const handleSave = async () => {
    const response = await saveProfile();
    if (response.success && response.data) {
      onSave(response.data);
      onClose();
    }
  };

  const handleResumePick = async () => {
    const result = await pickResume();
    if (result) {
      updateResume(result.name, result.uri);
    }
  };

  const handleImagePick = async () => {
    pickPhoto((uri) => {
      updateField('profile_picture_url', uri);
    });
  };

  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    header: { borderBottomColor: theme.border },
    title: { color: theme.text },
    cancelText: { color: theme.subtext },
    saveText: { color: theme.primary },
    avatarPlaceholder: { backgroundColor: isDark ? '#333' : '#E0E0E0' },
    avatarInitials: { color: theme.subtext },
    editIconBadge: { backgroundColor: theme.primary, borderColor: theme.card },
    changePhotoText: { color: theme.primary },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={onClose} disabled={loading}>
          <Text style={[styles.cancelText, dynamicStyles.cancelText]}>Cancel</Text>
        </TouchableOpacity>
        <Text style={[styles.title, dynamicStyles.title]}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={theme.primary} />
          ) : (
            <Text style={[styles.saveText, dynamicStyles.saveText]}>Save</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* 0. Avatar Picker */}
        <View style={styles.avatarContainer}>
          <TouchableOpacity onPress={handleImagePick} style={styles.avatarWrapper}>
            {formData.profile_picture_url ? (
              <Image source={{ uri: formData.profile_picture_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, dynamicStyles.avatarPlaceholder]}>
                <Text style={[styles.avatarInitials, dynamicStyles.avatarInitials]}>
                  {formData.first_name?.[0]}{formData.last_name?.[0]}
                </Text>
              </View>
            )}
            <View style={[styles.editIconBadge, dynamicStyles.editIconBadge]}>
              <Text style={styles.editIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePick}>
            <Text style={[styles.changePhotoText, dynamicStyles.changePhotoText]}>Change Profile Photo</Text>
          </TouchableOpacity>
        </View>

        {/* 1. Profile Form */}
        <ProfileForm
          profile={formData}
          onChange={updateField}
        />

        {/* 2. Interest Picker */}
        <InterestPicker
          selectedInterests={formData.interests}
          onToggle={toggleInterest}
        />

        {/* 3. Resume Uploader */}
        <ResumeUploader
          resumeName={formData.resume_name || null}
          onUpload={handleResumePick}
          onRemove={() => updateResume(null, null)}
        />

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: 'bold' },
  cancelText: { fontSize: 16 },
  saveText: { fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },
  editIconText: {
    fontSize: 16,
  },
  changePhotoText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
  },
});
