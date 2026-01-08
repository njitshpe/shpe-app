import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, useColorScheme } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getAuthInputPalette } from '@/constants/authTheme';

interface AuthInputProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
}

export function AuthInput({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
}: AuthInputProps) {
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const basePalette = getAuthInputPalette(isDark);
  const palette = {
    ...basePalette,
    icon: isDark ? 'rgba(229, 239, 255, 0.7)' : 'rgba(11, 22, 48, 0.6)',
  };

  // Get icon based on label
  const getIcon = () => {
    if (label.toLowerCase().includes('email')) {
      return 'mail-outline';
    }
    if (label.toLowerCase().includes('password')) {
      return 'lock-closed-outline';
    }
    return 'person-outline';
  };

  const isPassword = secureTextEntry;
  const actualSecureEntry = isPassword && !isPasswordVisible;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: palette.label }]}>{label}</Text>
      <View style={[styles.inputWrapper, { backgroundColor: palette.inputBg, borderColor: palette.inputBorder }]}>
        <Ionicons
          name={getIcon() as any}
          size={20}
          color={palette.icon}
          style={styles.icon}
        />
        <TextInput
          style={[styles.input, { color: palette.inputText }]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={palette.placeholder}
          secureTextEntry={actualSecureEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.eyeIcon}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
          <Ionicons
            name={isPasswordVisible ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={palette.icon}
          />
        </TouchableOpacity>
      )}
    </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    height: 52,
    paddingHorizontal: 16,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 4,
  },
});
