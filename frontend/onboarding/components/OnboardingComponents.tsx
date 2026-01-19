import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RADIUS, SPACING } from '@/constants/colors';

interface GlassInputProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  placeholder: string;
  icon: keyof typeof Ionicons.glyphMap;
  readOnly?: boolean;
  onPress?: () => void;
}

export const GlassInput: React.FC<GlassInputProps> = ({ 
  label, value, onChangeText, placeholder, icon, readOnly, onPress 
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={styles.fieldContainer}>
      <Text style={styles.label}>{label}</Text>
      <TouchableOpacity 
        activeOpacity={readOnly ? 0.7 : 1} 
        onPress={readOnly ? onPress : undefined}
        style={[styles.glassInput, isFocused && styles.inputFocused]}
      >
        <View style={[styles.iconContainer, isFocused && { backgroundColor: '#FFFFFF' }]}>
          <Ionicons name={icon} size={20} color={isFocused ? '#000000' : '#94A3B8'} />
        </View>
        {readOnly ? (
          <Text style={[styles.inputText, !value && styles.placeholderText]}>
            {value || placeholder}
          </Text>
        ) : (
          <TextInput
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor="rgba(255,255,255,0.3)"
            style={styles.inputText}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          />
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  fieldContainer: { marginBottom: SPACING.lg },
  label: { fontSize: 11, fontWeight: '700', color: '#94A3B8', marginBottom: 8, letterSpacing: 1 },
  glassInput: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: RADIUS.lg, height: 56, overflow: 'hidden',
  },
  inputFocused: { borderColor: '#FFFFFF', backgroundColor: 'rgba(30, 41, 59, 0.8)' },
  iconContainer: { width: 48, height: '100%', alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.05)' },
  inputText: { flex: 1, fontSize: 16, color: '#FFF', paddingHorizontal: 16, fontWeight: '500' },
  placeholderText: { color: 'rgba(255,255,255,0.3)' },
});