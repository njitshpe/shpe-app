import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const SHPE_COLORS = { 
  darkBlue: '#002855', 
  orange: '#FF5F05', 
  white: '#FFFFFF', 
  gray: '#F4F4F4' 
};

// Hardcoded list of interests for now
const AVAILABLE_INTERESTS = [
  'Web Dev', 
  'Data Science', 
  'AI/ML', 
  'Cybersecurity', 
  'Hardware', 
  'UI/UX'
];

interface InterestPickerProps {
  selectedInterests: string[];
  onToggle: (interest: string) => void;
}

export function InterestPicker({ selectedInterests, onToggle }: InterestPickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Interests</Text>
      <View style={styles.chipContainer}>
        {AVAILABLE_INTERESTS.map((interest) => {
          const isSelected = selectedInterests.includes(interest);
          return (
            <TouchableOpacity
              key={interest}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => onToggle(interest)}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {interest}
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