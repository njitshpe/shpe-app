import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert, ActivityIndicator, Image, ActionSheetIOS, Platform } from 'react-native';
import { SHPE_COLORS } from '../constants/colors';
import { ProfileForm } from '../components/ProfileForm';
import { ResumeUploader } from '../components/ResumeUploader';
import { InterestPicker } from '../components/InterestPicker';
import { useResume } from '../hooks/Profile/useResume';
import type { UserProfile } from '../types/userProfile';
import { profileService } from '../lib/profileService';
import type { ServiceResponse } from '../types/errors';
import { validators } from '../types/errors';
import { PhotoHelper } from '../lib/PhotoService';

interface EditProfileScreenProps {
  onClose: () => void;
  initialData: UserProfile;
  onSave: (data: UserProfile) => void;
}

export function EditProfileScreen({ onClose, initialData, onSave }: EditProfileScreenProps) {
  const [formData, setFormData] = useState<UserProfile>(initialData);
  const [loading, setLoading] = useState(false);
  const { pickResume } = useResume();

  const validate = (): boolean => {
    if (formData.phone_number && !validators.isValidPhoneNumber(formData.phone_number)) {
      Alert.alert('Invalid Phone Number', 'Please enter a valid 10-digit phone number');
      return false;
    }

    if (formData.linkedin_url && !validators.isValidUrl(formData.linkedin_url)) {
      Alert.alert('Invalid LinkedIn URL', 'Please enter a valid LinkedIn profile URL');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);

    // Call the service to update the profile
    const response: ServiceResponse<UserProfile> = await profileService.updateProfile(formData.id, formData);

    setLoading(false);

    if (response.success && response.data) {
      onSave(response.data);
      Alert.alert('Success', 'Profile updated successfully!');
      onClose();
    } else {
      Alert.alert('Error', response.error?.details || response.error?.message || 'Failed to update profile');
    }
  };

  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResumePick = async () => {
    const result = await pickResume();
    if (result) {
      updateField('resume_name', result.name);
      updateField('resume_url', result.uri);
    }
  };

  const toggleInterest = (interest: any) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      updateField('interests', current.filter(i => i !== interest));
    } else {
      updateField('interests', [...current, interest]);
    }
  };

  const handleImagePick = async () => {
    const options = ['Take Photo', 'Choose from Library', 'Choose from Files', 'Cancel'];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          if (buttonIndex === 0) {
            const uri = await PhotoHelper.takePhoto();
            if (uri) updateField('profile_picture_url', uri);
          } else if (buttonIndex === 1) {
            const uri = await PhotoHelper.pickFromLibrary();
            if (uri) updateField('profile_picture_url', uri);
          } else if (buttonIndex === 2) {
            const uri = await PhotoHelper.pickFromFiles();
            if (uri) updateField('profile_picture_url', uri);
          }
        }
      );
    } else {
      // Android / Web fallback
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          {
            text: 'Take Photo', onPress: async () => {
              const uri = await PhotoHelper.takePhoto();
              if (uri) updateField('profile_picture_url', uri);
            }
          },
          {
            text: 'Choose from Library', onPress: async () => {
              const uri = await PhotoHelper.pickFromLibrary();
              if (uri) updateField('profile_picture_url', uri);
            }
          },
          {
            text: 'Choose from Files', onPress: async () => {
              const uri = await PhotoHelper.pickFromFiles();
              if (uri) updateField('profile_picture_url', uri);
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
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
          onRemove={() => {
            updateField('resume_name', null);
            updateField('resume_url', null);
          }}
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