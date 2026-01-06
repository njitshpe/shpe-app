import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

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
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputWrapper}>
        <Ionicons
          name={getIcon() as any}
          size={20}
          color="rgba(255, 255, 255, 0.7)"
          style={styles.icon}
        />
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255, 255, 255, 0.5)"
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
              color="rgba(255, 255, 255, 0.7)"
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
    color: 'rgba(255, 255, 255, 0.9)',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    color: '#FFFFFF',
    fontWeight: '400',
  },
  eyeIcon: {
    padding: 4,
  },
});
