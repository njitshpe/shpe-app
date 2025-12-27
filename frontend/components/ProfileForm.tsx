import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { UserProfile } from '../types/userProfile';
import { validators } from '../types/errors';

const SHPE_COLORS = {
  darkBlue: '#002855',
  textGray: '#666666',
  border: '#E0E0E0',
  error: '#D32F2F'
};

interface ProfileFormProps {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: any) => void;
}

export function ProfileForm({ profile, onChange }: ProfileFormProps) {

  const formatPhoneNumber = (value: string) => {
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
  };

  const renderInput = (
    label: string,
    field: keyof UserProfile | 'major' | 'expected_graduation_year' | 'graduation_year' | 'current_company' | 'current_position' | 'affiliation' | 'school_name' | 'reason_for_joining' | 'ucid',
    placeholder: string,
    maxLength?: number,
    keyboardType: 'default' | 'email-address' | 'numeric' | 'phone-pad' = 'default',
    multiline: boolean = false
  ) => {
    // Safe access to value
    const value = (profile as any)[field] ? String((profile as any)[field]) : '';

    const handleChangeText = (text: string) => {
      if (field === 'phone_number') {
        // Always strip to raw digits and re-format
        // This ensures the user can't "edit the space" or break the format
        const raw = text.replace(/\D/g, '');
        const formatted = formatPhoneNumber(raw);
        onChange(field as any, formatted);
      } else {
        onChange(field as any, text);
      }
    };

    return (
      <View style={styles.inputContainer}>
        <View style={styles.rowLabel}>
          <Text style={styles.label}>{label}</Text>
          {maxLength && <Text style={styles.limit}>{value.length}/{maxLength}</Text>}
        </View>
        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          maxLength={maxLength}
          keyboardType={keyboardType}
          multiline={multiline}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* COMMON FIELDS */}
      {renderInput('First Name', 'first_name', 'Enter first name', 15)}
      {renderInput('Last Name', 'last_name', 'Enter last name', 15)}
      {renderInput('Bio', 'bio', 'Tell us about yourself...', 150, 'default', true)}
      {renderInput('Phone Number', 'phone_number', 'e.g. (555) 123-4567', 15, 'phone-pad')}
      {renderInput('LinkedIn URL', 'linkedin_url', 'https://linkedin.com/in/...')}

      {/* STUDENT SPECIFIC */}
      {profile.user_type === 'student' && (
        <>
          {renderInput('Major', 'major', 'e.g. Computer Science')}
          {renderInput('Graduation Year', 'expected_graduation_year', 'e.g. 2025', 4, 'numeric')}
          {renderInput('UCID', 'ucid', 'e.g. yrc')}
        </>
      )}

      {/* ALUMNI SPECIFIC */}
      {profile.user_type === 'alumni' && (
        <>
          {renderInput('Major', 'major', 'e.g. Computer Science')}
          {renderInput('Graduation Year', 'graduation_year', 'e.g. 2020', 4, 'numeric')}
          {renderInput('Current Company', 'current_company', 'e.g. Google')}
          {renderInput('Current Position', 'current_position', 'e.g. Software Engineer')}
        </>
      )}

      {/* OTHER SPECIFIC */}
      {profile.user_type === 'other' && (
        <>
          {renderInput('Affiliation', 'affiliation', 'e.g. Faculty, Recruiter')}
          {renderInput('School / Organization', 'school_name', 'e.g. NJIT')}
          {renderInput('Reason for Joining', 'reason_for_joining', 'Why do you want to join SHPE?')}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  inputContainer: {
    marginBottom: 15,
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontSize: 14,
    color: SHPE_COLORS.textGray,
    fontWeight: '500',
  },
  limit: {
    fontSize: 12,
    color: '#999',
  },
  input: {
    borderBottomWidth: 1,
    borderBottomColor: SHPE_COLORS.border,
    fontSize: 16,
    color: SHPE_COLORS.darkBlue,
    paddingVertical: 8,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: SHPE_COLORS.border,
    borderRadius: 4,
    padding: 8,
    borderBottomWidth: 1, // Reset override
  }
});