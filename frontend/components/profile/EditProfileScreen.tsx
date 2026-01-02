import React, { useState } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, TouchableOpacity, 
  SafeAreaView, ActivityIndicator, Image, Alert 
} from 'react-native';
import { SHPE_COLORS } from '@/constants';
import { ProfileForm } from './ProfileForm';
import { InterestPicker } from './InterestPicker';
import { ResumeUploader } from '@/components/media';
import { useResume, useEditProfile } from '@/hooks/profile';
import { useProfilePhoto } from '@/hooks/media';
import type { UserProfile } from '@/types/userProfile';

// --- IMPORTS FOR UPLOAD ---
import { supabase } from '@/lib/supabase';
// Note: We removed 'expo-file-system' and 'base64-arraybuffer' 
// because we are using the modern fetch API now.

// --- THEME IMPORT ---
import { useTheme } from '@/contexts/ThemeContext';

interface EditProfileScreenProps {
  onClose: () => void;
  initialData: UserProfile;
  onSave: (data: UserProfile) => void;
}

export function EditProfileScreen({ onClose, initialData, onSave }: EditProfileScreenProps) {
  // 1. Hook into Theme
  const { theme, isDark } = useTheme();

  const { pickResume } = useResume();
  const { formData, loading: formLoading, updateField, toggleInterest, updateResume, saveProfile } = useEditProfile(initialData);
  const { pickPhoto } = useProfilePhoto();

  // Local state for upload spinner
  const [uploadingResume, setUploadingResume] = useState(false);

  const handleSave = async () => {
    if (uploadingResume) {
        Alert.alert("Please Wait", "Resume is still uploading...");
        return;
    }

    const response = await saveProfile();
    if (response.success && response.data) {
      onSave(response.data);
      onClose();
    }
  };

  const handleResumePick = async () => {
    try {
      const result = await pickResume();
      if (!result || !result.uri) return; // User cancelled, say nothing

      setUploadingResume(true);

      // 1. Fetch file
      const response = await fetch(result.uri);
      const arrayBuffer = await response.arrayBuffer();

      // 2. Define path
      const storagePath = `${initialData.id}/resume.pdf`;

      // 3. Upload
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(storagePath, arrayBuffer, {
          contentType: result.mimeType || 'application/pdf',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 4. Update Database
      updateField('resume_url', storagePath); 
      updateField('resume_name', result.name);

      // 5. ONLY ONE SUCCESS MESSAGE
      Alert.alert("Success", "Resume securely uploaded.");

    } catch (error: any) {
      Alert.alert("Upload Failed", error.message);
    } finally {
      setUploadingResume(false);
    }
  };

  const handleImagePick = async () => {
    pickPhoto((uri) => {
      updateField('profile_picture_url', uri);
    });
  };

  const isLoading = formLoading || uploadingResume;

  // Dynamic Styles
  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: theme.card, borderBottomColor: theme.border },
    title: { color: theme.text },
    text: { color: theme.text },
    subText: { color: theme.subtext },
    avatarPlaceholder: { backgroundColor: isDark ? '#333' : '#E0E0E0' },
  };

  return (
    <SafeAreaView style={[styles.container, dynamicStyles.container]}>
      {/* HEADER */}
      <View style={[styles.header, dynamicStyles.header]}>
        <TouchableOpacity onPress={onClose} disabled={isLoading}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        
        <Text style={[styles.title, dynamicStyles.title]}>Edit Profile</Text>
        
        <TouchableOpacity onPress={handleSave} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size="small" color={SHPE_COLORS.orange} />
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
              <View style={[styles.avatarPlaceholder, dynamicStyles.avatarPlaceholder]}>
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
        <View style={{ marginTop: 20 }}>
            {uploadingResume && (
                <Text style={{ textAlign: 'center', marginBottom: 10, color: SHPE_COLORS.orange }}>
                    Uploading PDF...
                </Text>
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
    borderColor: '#FFF',
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