import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  StyleSheet,
  useColorScheme,
  Platform,
  Keyboard,
} from 'react-native';
import { MotiView } from 'moti';
import { Ionicons } from '@expo/vector-icons';

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

/**
 * Fuzzy filter function - matches partial queries against options
 * Example: "comp sci" matches "Computer Science"
 */
function fuzzyFilter(options: readonly string[], query: string): string[] {
  if (!query.trim()) {
    return [...options];
  }

  const lowerQuery = query.toLowerCase().trim();
  const queryWords = lowerQuery.split(/\s+/);

  return options.filter((option) => {
    const lowerOption = option.toLowerCase();

    // Check if all query words appear in the option
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
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const searchInputRef = useRef<TextInput>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-focus search input when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [visible]);

  // Fuzzy-filtered options
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

  // Dynamic colors
  const colors = {
    background: isDark ? '#0F172A' : '#FFFFFF',
    overlay: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.5)',
    surface: isDark ? '#1E293B' : '#FFFFFF',
    text: isDark ? '#FFFFFF' : '#111827',
    textSecondary: isDark ? '#94A3B8' : '#6B7280',
    border: isDark ? '#334155' : '#E5E7EB',
    primary: '#2563EB',
    primaryLight: isDark ? '#3B82F6' : '#60A5FA',
    selectedBg: isDark ? '#1E3A8A' : '#EFF6FF',
    selectedText: isDark ? '#93C5FD' : '#1D4ED8',
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        {/* Header with close button */}
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
        <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
          <View style={[styles.searchInputWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
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
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Options List */}
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
                from={{ opacity: 0, translateY: 20 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{
                  type: 'timing',
                  duration: 200,
                  delay: index * 20, // Stagger animation
                }}
              >
                <TouchableOpacity
                  onPress={() => handleSelect(item)}
                  style={[
                    styles.optionItem,
                    isSelected && { backgroundColor: colors.selectedBg },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: isSelected ? colors.selectedText : colors.text },
                    ]}
                  >
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
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 40 : 60,
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 2,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 20,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 12,
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
