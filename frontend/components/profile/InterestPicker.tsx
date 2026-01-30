import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { INTEREST_OPTIONS, InterestType } from '@/types/userProfile';
import { useTheme } from '@/contexts/ThemeContext';

interface InterestPickerProps {
  selectedInterests: InterestType[];
  onToggle: (interest: InterestType) => void;
}

export function InterestPicker({ selectedInterests, onToggle }: InterestPickerProps) {
  const { theme, isDark } = useTheme();

  const dynamicStyles = {
    label: { color: theme.text },
    chip: { backgroundColor: isDark ? '#333' : '#F3F4F6' },
    chipSelected: { backgroundColor: theme.primary },
    chipText: { color: theme.text },
    chipTextSelected: { color: '#FFFFFF' },
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, dynamicStyles.label]}>Interests</Text>
      <View style={styles.chipContainer}>
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selectedInterests.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.chip,
                dynamicStyles.chip,
                isSelected && dynamicStyles.chipSelected
              ]}
              onPress={() => onToggle(option.value)}
            >
              <Text
                style={[
                  styles.chipText,
                  dynamicStyles.chipText,
                  isSelected && dynamicStyles.chipTextSelected
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    // color removed
  },
});