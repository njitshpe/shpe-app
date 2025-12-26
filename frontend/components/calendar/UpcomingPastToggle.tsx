import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';

interface UpcomingPastToggleProps {
  selected: 'upcoming' | 'past';
  onSelect: (value: 'upcoming' | 'past') => void;
}

export function UpcomingPastToggle({ selected, onSelect }: UpcomingPastToggleProps) {
  return (
    <View style={styles.container}>
      <View style={styles.segmentedControl}>
        <Pressable
          style={[
            styles.segment,
            styles.segmentLeft,
            selected === 'upcoming' && styles.segmentSelected,
          ]}
          onPress={() => onSelect('upcoming')}
        >
          <Text
            style={[styles.segmentText, selected === 'upcoming' && styles.segmentTextSelected]}
          >
            Upcoming
          </Text>
        </Pressable>

        <Pressable
          style={[
            styles.segment,
            styles.segmentRight,
            selected === 'past' && styles.segmentSelected,
          ]}
          onPress={() => onSelect('past')}
        >
          <Text style={[styles.segmentText, selected === 'past' && styles.segmentTextSelected]}>
            Past
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 4,
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 6,
  },
  segmentLeft: {
    marginRight: 2,
  },
  segmentRight: {
    marginLeft: 2,
  },
  segmentSelected: {
    backgroundColor: '#374151',
  },
  segmentText: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  segmentTextSelected: {
    color: '#F9FAFB',
    fontWeight: '600',
  },
});
