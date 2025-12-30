import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { INTEREST_OPTIONS, InterestType } from '@/types/userProfile';
import { SHPE_COLORS } from '@/constants';

interface InterestPickerProps {
  selectedInterests: InterestType[];
  onToggle: (interest: InterestType) => void;
}

export function InterestPicker({ selectedInterests, onToggle }: InterestPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Interests</Text>
      <View style={styles.chipContainer}>
        {INTEREST_OPTIONS.map((option) => {
          const isSelected = selectedInterests.includes(option.value);
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(option.value)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
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
    color: SHPE_COLORS.darkBlue,
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
    backgroundColor: SHPE_COLORS.gray
  },
  chipSelected: {
    backgroundColor: SHPE_COLORS.orange
  },
  chipText: {
    color: SHPE_COLORS.darkBlue
  },
  chipTextSelected: {
    color: SHPE_COLORS.white,
    fontWeight: 'bold'
  },
});