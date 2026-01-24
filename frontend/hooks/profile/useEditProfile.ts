import { useState } from 'react';
import { Alert } from 'react-native';
import { profileService } from '../../services/profile.service';
import { validateProfile } from '../../utils/validation';
import type { UserProfile } from '../../types/userProfile';
import type { ServiceResponse } from '../../types/errors';

/**
 * Hook for managing profile editing logic
 * Handles form state, validation, and API calls
 */
export function useEditProfile(initialData: UserProfile) {
  const [formData, setFormData] = useState<UserProfile>(initialData);
  const [loading, setLoading] = useState(false);

  /**
   * Updates a single field in the form
   */
  const updateField = (field: keyof UserProfile, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  /**
   * Toggles an interest in the interests array
   */
  const toggleInterest = (interest: any) => {
    const current = formData.interests;
    if (current.includes(interest)) {
      updateField('interests', current.filter(i => i !== interest));
    } else {
      updateField('interests', [...current, interest]);
    }
  };

  /**
   * Updates resume information
   */
  const updateResume = (name: string | null, url: string | null) => {
    setFormData(prev => ({
      ...prev,
      resume_name: name,
      resume_url: url,
    }));
  };

  /**
   * Saves the profile data
   * @returns ServiceResponse with updated profile data
   */
  const saveProfile = async (): Promise<ServiceResponse<UserProfile>> => {
    const validationErrors = validateProfile(formData);
    if (validationErrors.length > 0) {
      // Show first validation error
      const firstError = validationErrors[0];
      Alert.alert(firstError.title, firstError.message);
      return {
        success: false,
        error: { message: 'Validation failed', code: 'VALIDATION_ERROR' }
      };
    }

    setLoading(true);
    const response = await profileService.updateProfile(formData.id, formData);
    setLoading(false);

    if (response.success && response.data) {
      Alert.alert('Success', 'Profile updated successfully!');
    } else {
      Alert.alert(
        'Error',
        response.error?.details || response.error?.message || 'Failed to update profile'
      );
    }

    return response;
  };

  return {
    formData,
    loading,
    updateField,
    toggleInterest,
    updateResume,
    saveProfile,
  };
}
