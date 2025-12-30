import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, ActivityIndicator, Image } from 'react-native';
import { SHPE_COLORS } from '../../constants/colors';
import { ProfileForm } from '../ProfileForm';
import { ResumeUploader } from '../ResumeUploader';
import { InterestPicker } from '../InterestPicker';
import { useResume } from '../../hooks/profile/useResume';
import { useEditProfile } from '../../hooks/profile/useEditProfile';
import { useProfilePhoto } from '../../hooks/media/useProfilePhoto';
import type { UserProfile } from '../../types/userProfile';

interface EditProfileScreenProps {
  onClose: () => void;
  initialData: UserProfile;
  onSave: (data: UserProfile) => void;
}

export function EditProfileScreen({ onClose, initialData, onSave }: EditProfileScreenProps) {
  const { pickResume } = useResume();
  const { formData, loading, updateField, toggleInterest, updateResume, saveProfile } = useEditProfile(initialData);
  const { pickPhoto } = useProfilePhoto();

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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose} disabled={loading}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#FF5F05" />
          ) : (
            <Text style={styles.saveText}>Save</Text>
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
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarInitials}>
                  {formData.first_name?.[0]}{formData.last_name?.[0]}
                </Text>
              </View>
            )}
            <View style={styles.editIconBadge}>
              <Text style={styles.editIconText}>📷</Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleImagePick}>
            <Text style={styles.changePhotoText}>Change Profile Photo</Text>
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
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  title: { fontSize: 18, fontWeight: 'bold', color: SHPE_COLORS.darkBlue },
  cancelText: { color: SHPE_COLORS.darkGray, fontSize: 16 },
  saveText: { color: SHPE_COLORS.orange, fontSize: 16, fontWeight: 'bold' },
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
    backgroundColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    color: SHPE_COLORS.darkGray,
    fontWeight: 'bold',
  },
  editIconBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: SHPE_COLORS.darkBlue,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: SHPE_COLORS.white,
  },
  editIconText: {
    fontSize: 16,
  },
  changePhotoText: {
    marginTop: 8,
    color: SHPE_COLORS.orange,
    fontSize: 14,
    fontWeight: '600',
  },
});
