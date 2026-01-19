import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MotiView } from 'moti';
import * as Haptics from 'haptics';
import { RADIUS, SPACING } from '@/constants/colors';

// Internal Glass Input for the Luxury Form
const LuxuryInput = ({ label, value, onChangeText, placeholder, ...props }) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.inputWrapper}>
      <Text style={styles.luxuryLabel}>{label}</Text>
      <View style={[styles.glassContainer, isFocused && styles.glassFocused]}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
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

export function ProfileForm({ profile, onChange }) {
  return (
    <MotiView 
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      style={styles.container}
    >
      <LuxuryInput 
        label="FIRST NAME" 
        value={profile.first_name} 
        onChangeText={(t) => onChange('first_name', t)}
        placeholder="Elena"
      />
      <LuxuryInput 
        label="LAST NAME" 
        value={profile.last_name} 
        onChangeText={(t) => onChange('last_name', t)}
        placeholder="Rodriguez"
      />
      <LuxuryInput 
        label="BIO" 
        value={profile.bio} 
        onChangeText={(t) => onChange('bio', t)}
        placeholder="Tell your story..."
        multiline
        numberOfLines={4}
      />
      
      {profile.user_type === 'alumni' && (
        <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>PROFESSIONAL INFO</Text>
            <LuxuryInput 
              label="COMPANY" 
              value={profile.company} 
              onChangeText={(t) => onChange('company', t)}
              placeholder="e.g. Google"
            />
        </View>
      )}
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
  sectionHeader: { marginTop: 10 },
  sectionTitle: { fontSize: 12, fontWeight: '800', color: '#FFF', marginBottom: 20, letterSpacing: 2 },
});