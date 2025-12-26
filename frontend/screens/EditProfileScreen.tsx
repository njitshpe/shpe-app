import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { ProfileForm } from '../components/ProfileForm';
import { ResumeUploader } from '../components/ResumeUploader';
import { InterestPicker } from '../components/InterestPicker';
import { useResume } from '../lib/useResume';

// Define the shape of our User Data
export interface UserProfileData {
  firstName: string;
  lastName: string;
  major: string;
  profileImage: string | null;
  resumeName: string | null;
  interests: string[];
}

interface EditProfileScreenProps {
  onClose: () => void;
  initialData: UserProfileData;           // <--- DATA COMING IN
  onSave: (data: UserProfileData) => void; // <--- DATA GOING OUT
}

export function EditProfileScreen({ onClose, initialData, onSave }: EditProfileScreenProps) {
  // Local state for the form (so we don't change the main screen until we hit Save)
  const [formData, setFormData] = useState<UserProfileData>(initialData);
  
  // Resume logic
  const { pickResume } = useResume();

  const handleSave = () => {
    onSave(formData); // Send updated data back to parent
    onClose();
  };

  // Helper to update specific fields
  const updateField = (field: keyof UserProfileData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleResumePick = async () => {
    const name = await pickResume();
    if (name) updateField('resumeName', name);
  };

  const toggleInterest = (interest: string) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      updateField('interests', current.filter(i => i !== interest));
    } else {
      updateField('interests', [...current, interest]);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Edit Profile</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 1. Name & Major Form */}
        <ProfileForm 
          firstName={formData.firstName}
          lastName={formData.lastName}
          major={formData.major}
          // We wrap it in a function and tell TS: "Treat 'field' as a valid UserProfileData key"
          onChange={(field, value) => updateField(field as keyof UserProfileData, value)}
        />

        {/* 2. Interest Picker */}
        <InterestPicker 
          selectedInterests={formData.interests}
          onToggle={toggleInterest}
        />

        {/* 3. Resume Uploader */}
        <ResumeUploader 
          resumeName={formData.resumeName}
          onUpload={handleResumePick}
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
  title: { fontSize: 18, fontWeight: 'bold', color: '#002855' },
  cancelText: { color: '#666', fontSize: 16 },
  saveText: { color: '#FF5F05', fontSize: 16, fontWeight: 'bold' },
  content: { padding: 20 },
});