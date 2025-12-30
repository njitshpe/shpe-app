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

/**
 * Formats a phone number as user types
 * Formats as (XXX) XXX-XXXX
 * @param value - Raw phone number string
 * @returns Formatted phone number string
 */
export function formatPhoneNumber(value: string): string {
  // Strip all non-numeric characters
  const cleaned = ('' + value).replace(/\D/g, '');

  // Format as (XXX) XXX-XXXX
  const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return '(' + match[1] + ') ' + match[2] + '-' + match[3];
  }

  // Partial formatting as user types
  if (cleaned.length > 6) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
  } else if (cleaned.length > 3) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3)}`;
  } else if (cleaned.length > 0) {
    return `(${cleaned}`;
  }

  return value;
}
