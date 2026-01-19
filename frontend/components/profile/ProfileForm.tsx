import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import type { UserProfile } from '@/types/userProfile';
import { formatPhoneNumber } from '@/utils';
import { useTheme } from '@/contexts/ThemeContext';

interface ProfileFormProps {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: any) => void;
}

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  const { theme, isDark } = useTheme();

  const dynamicStyles = {
    inputContainer: {
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.08)',
    },
    label: { color: theme.subtext },
    input: { color: theme.text },
    multilineInput: { color: theme.text },
    limit: { color: theme.subtext },
  };

  const renderInput = (
    label: string,
    field: keyof UserProfile | 'major' | 'graduation_year' | 'company' | 'job_title' | 'ucid' | 'phone_number' | 'linkedin_url',
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
      <View style={[styles.inputContainer, dynamicStyles.inputContainer]}>
        <View style={styles.rowLabel}>
          <Text style={[styles.label, dynamicStyles.label]}>{label}</Text>
          {maxLength && <Text style={[styles.limit, dynamicStyles.limit]}>{value.length}/{maxLength}</Text>}
        </View>
        <TextInput
          style={[
            styles.input,
            dynamicStyles.input,
            multiline && styles.multilineInput,
            multiline && dynamicStyles.multilineInput
          ]}
          value={value}
          onChangeText={handleChangeText}
          placeholder={placeholder}
          placeholderTextColor={theme.subtext}
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
          {renderInput('Graduation Year', 'graduation_year', 'e.g. 2025', 4, 'numeric')}
          {renderInput('UCID', 'ucid', 'e.g. yrc')}
        </>
      )}

      {/* ALUMNI SPECIFIC */}
      {profile.user_type === 'alumni' && (
        <>
          {renderInput('Major', 'major', 'e.g. Computer Science')}
          {renderInput('Graduation Year', 'graduation_year', 'e.g. 2020', 4, 'numeric')}
          {renderInput('Current Company', 'company', 'e.g. Google')}
          {renderInput('Current Position', 'job_title', 'e.g. Software Engineer')}
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
    borderRadius: 16,
    padding: 16,
  },
  rowLabel: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  limit: {
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  input: {
    fontSize: 16,
    paddingVertical: 0,
  },
  multilineInput: {
    height: 80,
    textAlignVertical: 'top',
    paddingVertical: 4,
  }
});
