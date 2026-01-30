import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  Platform,
  Keyboard,
  SafeAreaView,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';
import { SHPE_COLORS, SPACING, RADIUS } from '@/constants/colors';

export interface SearchableSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (value: string) => void;
  options: readonly string[];
  selectedValue?: string;
  title: string;
  placeholder?: string;
  emptyMessage?: string;
}

function fuzzyFilter(options: readonly string[], query: string): string[] {
  if (!query.trim()) return [...options];
  const lowerQuery = query.toLowerCase().trim();
  const queryWords = lowerQuery.split(/\s+/);
  return options.filter((option) => {
    const lowerOption = option.toLowerCase();
    return queryWords.every((word) => lowerOption.includes(word));
  });
}

export default function SearchableSelectionModal({
  visible,
  onClose,
  onSelect,
  options,
  selectedValue,
  title,
  placeholder = 'Search...',
  emptyMessage = 'No matches found',
}: SearchableSelectionModalProps) {
  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-focus logic
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [visible]);

  const filteredOptions = useMemo(() => {
    return fuzzyFilter(options, searchQuery);
  }, [options, searchQuery]);

  const handleSelect = (value: string) => {
    onSelect(value);
    setSearchQuery('');
    Keyboard.dismiss();
    onClose();
  };

  const handleClose = () => {
    setSearchQuery('');
    Keyboard.dismiss();
    onClose();
  };

  // MONOCHROME THEME COLORS
  const colors = {
    background: '#000000',
    surface: '#1E293B',
    text: '#FFFFFF',
    textSecondary: '#94A3B8',
    border: 'rgba(255, 255, 255, 0.1)',
    primary: '#FFFFFF', // White Accent
    selectedBg: 'rgba(255, 255, 255, 0.1)',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      presentationStyle="pageSheet" // Nice card effect on iOS
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <SafeAreaView style={{ flex: 1 }}>
          
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <TouchableOpacity
              onPress={handleClose}
              style={styles.closeButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <View style={[styles.searchInputWrapper, { borderColor: colors.border, backgroundColor: 'rgba(30, 41, 59, 0.5)' }]}>
              <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
              <TextInput
                ref={searchInputRef}
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder={placeholder}
                placeholderTextColor={colors.textSecondary}
                style={[styles.searchInput, { color: colors.text }]}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* List */}
          <FlatList
            data={filteredOptions}
            keyExtractor={(item, index) => `${item}-${index}`}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-outline" size={48} color={colors.textSecondary} />
                <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                  {emptyMessage}
                </Text>
              </View>
            )}
            renderItem={({ item, index }) => {
              const isSelected = item === selectedValue;

              return (
                <MotiView
                  from={{ opacity: 0, translateY: 10 }}
                  animate={{ opacity: 1, translateY: 0 }}
                  transition={{ type: 'timing', duration: 200, delay: index * 10 }}
                >
                  <TouchableOpacity
                    onPress={() => handleSelect(item)}
                    style={[
                      styles.optionItem,
                      isSelected && { backgroundColor: colors.selectedBg },
                      { borderBottomColor: colors.border }
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, { color: isSelected ? '#FFFFFF' : '#E2E8F0', fontWeight: isSelected ? '700' : '400' }]}>
                      {item}
                    </Text>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                    )}
                  </TouchableOpacity>
                </MotiView>
              );
            }}
          />
        </SafeAreaView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  closeButton: {
    padding: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 0, // Fix alignment on Android
  },
  listContent: {
    paddingHorizontal: 0,
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1, // Separator lines
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
});