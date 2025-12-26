import React from 'react';
import { View, Text, StyleSheet, Pressable, FlatList } from 'react-native';

interface TagChipsProps {
  tags: string[];
  selectedTag: string | null;
  onSelectTag: (tag: string | null) => void;
}

export function TagChips({ tags, selectedTag, onSelectTag }: TagChipsProps) {
  const allTags = ['All', ...tags];

  const renderChip = ({ item }: { item: string }) => {
    const isSelected = item === 'All' ? selectedTag === null : selectedTag === item;

    return (
      <Pressable
        style={({ pressed }) => [
          styles.chip,
          isSelected && styles.chipSelected,
          pressed && styles.chipPressed,
        ]}
        onPress={() => onSelectTag(item === 'All' ? null : item)}
      >
        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
          {item}
        </Text>
      </Pressable>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        horizontal
        data={allTags}
        renderItem={renderChip}
        keyExtractor={(item) => item}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  listContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  chipSelected: {
    backgroundColor: 'rgba(255, 255, 255, 0.11)',
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  chipPressed: {
    opacity: 0.65,
  },
  chipText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: 'rgba(255, 255, 255, 0.90)',
    fontWeight: '600',
  },
});
