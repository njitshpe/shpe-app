import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TextInputProps } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'expo-haptics'; // Fixed import
import { RADIUS, SPACING } from '@/constants/colors';
import { UserProfile } from '@/types/userProfile';

interface LuxuryInputProps extends TextInputProps {
  label: string;
  value: string;
}

const LuxuryInput = ({ label, value, onChangeText, placeholder, ...props }: LuxuryInputProps) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.luxuryLabel}>{label}</Text>
      <View style={[styles.glassContainer, isFocused && styles.glassFocused]}>
        <TextInput
          value={value}
          onChangeText={(t) => onChangeText?.(t)}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          style={styles.textInput}
          onFocus={() => {
            setIsFocused(true);
            Haptics.selectionAsync();
          }}
          onBlur={() => setIsFocused(false)}
          {...props}
        />
      </View>
    </View>
  );
};

interface ProfileFormProps {
  profile: UserProfile;
  onChange: (field: keyof UserProfile, value: string) => void;
}

export function ProfileForm({ profile, onChange }: ProfileFormProps) {
  return (
    <MotiView 
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.container}
    >
      <LuxuryInput 
        label="FIRST NAME" 
        value={profile.first_name || ''} 
        onChangeText={(t) => onChange('first_name', t)}
        placeholder="Elena"
      />
      <LuxuryInput 
        label="LAST NAME" 
        value={profile.last_name || ''} 
        onChangeText={(t) => onChange('last_name', t)}
        placeholder="Rodriguez"
      />
      <LuxuryInput 
        label="BIO" 
        value={profile.bio || ''} 
        onChangeText={(t) => onChange('bio', t)}
        placeholder="Tell your story..."
        multiline
        numberOfLines={4}
      />
    </MotiView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  inputWrapper: { marginBottom: 20 },
  luxuryLabel: { fontSize: 10, fontWeight: '900', color: 'rgba(255,255,255,0.4)', letterSpacing: 1.5, marginBottom: 8 },
  glassContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: RADIUS.lg,
    paddingHorizontal: 16,
    height: 56,
    justifyContent: 'center',
  },
  glassFocused: { borderColor: '#FFF', backgroundColor: 'rgba(255,255,255,0.1)' },
  textInput: { color: '#FFF', fontSize: 16, fontWeight: '500' },
});