import { validators } from '../types/errors';
import type { UserProfile } from '../types/userProfile';

export type ValidationError = {
  field: 'phone_number' | 'linkedin_url';
  title: string;
  message: string;
};

/**
 * Validates profile form data (pure function - no side effects)
 * @param profile - The profile data to validate
 * @returns Array of validation errors (empty if valid)
 */
export function validateProfile(profile: UserProfile): ValidationError[] {
  const errors: ValidationError[] = [];

  if (profile.phone_number && !validators.isValidPhoneNumber(profile.phone_number)) {
    errors.push({
      field: 'phone_number',
      title: 'Invalid Phone Number',
      message: 'Please enter a valid 10-digit phone number',
    });
  }

  if (profile.linkedin_url && !validators.isValidUrl(profile.linkedin_url)) {
    errors.push({
      field: 'linkedin_url',
      title: 'Invalid LinkedIn URL',
      message: 'Please enter a valid LinkedIn profile URL',
    });
  }

  return errors;
}
