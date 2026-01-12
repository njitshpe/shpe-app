import React, { useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS, TYPOGRAPHY } from '@/constants/colors';
import type { LeaderboardContext } from '@/types/leaderboard';

interface LeaderboardHeaderProps {
  context: LeaderboardContext;
  onContextChange: (context: LeaderboardContext) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedMajor?: string;
  selectedClassYear?: number;
  onMajorPress: () => void;
  onClassYearPress: () => void;
  onClearMajor: () => void;
  onClearClassYear: () => void;
  onShowRules: () => void;
}

const CONTEXT_OPTIONS: Array<{ value: LeaderboardContext; label: string }> = [
  { value: 'month', label: 'This Month' },
  { value: 'semester', label: 'This Semester' },
  { value: 'allTime', label: 'All-Time' },
];

export const LeaderboardHeader: React.FC<LeaderboardHeaderProps> = ({
  context,
  onContextChange,
  searchQuery,
  onSearchChange,
  selectedMajor,
  selectedClassYear,
  onMajorPress,
  onClassYearPress,
  onClearMajor,
  onClearClassYear,
  onShowRules,
}) => {
  const { theme, isDark } = useTheme();
  const searchInputRef = useRef<TextInput>(null);

  return (
    <View style={styles.headerOverlay}>
      <LinearGradient
        colors={isDark
          ? ['#000000', '#000000']
          : [theme.background, `${theme.background}00`]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Leaderboard</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onShowRules}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={20} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Row 1: Time Scope Pills */}
        <View style={styles.timeScopeRow}>
          {CONTEXT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeScopePill,
                context === option.value && [
                  styles.timeScopePillActive,
                  { backgroundColor: theme.primary }
                ],
              ]}
              onPress={() => onContextChange(option.value)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.timeScopeText,
                  context === option.value
                    ? styles.timeScopeTextActive
                    : { color: theme.subtext },
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Row 2: Filters + Search */}
        <View style={styles.filtersRow}>
          {/* Major Filter */}
          <TouchableOpacity
            style={[
              styles.filterPillSubtle,
              selectedMajor ? styles.filterPillSubtleActive : undefined,
              selectedMajor ? { backgroundColor: theme.primary + '20', borderColor: theme.primary } : undefined,
            ]}
            onPress={onMajorPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="school-outline"
              size={14}
              color={selectedMajor ? theme.primary : theme.subtext}
              style={{ opacity: selectedMajor ? 1 : 0.5 }}
            />
            <Text
              style={[
                styles.filterTextSubtle,
                selectedMajor ? { color: theme.primary } : { color: theme.subtext, opacity: 0.6 },
              ]}
            >
              {selectedMajor || 'Major'}
            </Text>
            {selectedMajor && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onClearMajor();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={14} color={theme.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Class Year Filter */}
          <TouchableOpacity
            style={[
              styles.filterPillSubtle,
              selectedClassYear ? styles.filterPillSubtleActive : undefined,
              selectedClassYear ? { backgroundColor: theme.primary + '20', borderColor: theme.primary } : undefined,
            ]}
            onPress={onClassYearPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={selectedClassYear ? theme.primary : theme.subtext}
              style={{ opacity: selectedClassYear ? 1 : 0.5 }}
            />
            <Text
              style={[
                styles.filterTextSubtle,
                selectedClassYear ? { color: theme.primary } : { color: theme.subtext, opacity: 0.6 },
              ]}
            >
              {selectedClassYear ? `'${String(selectedClassYear).slice(-2)}` : 'Year'}
            </Text>
            {selectedClassYear && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onClearClassYear();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={14} color={theme.primary} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Search Input */}
          <View style={[styles.searchContainerInline, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }]}>
            <Ionicons name="search-outline" size={16} color={theme.subtext} style={{ opacity: 0.5 }} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInputInline, { color: theme.text }]}
              placeholder="Search..."
              placeholderTextColor={theme.subtext}
              value={searchQuery}
              onChangeText={onSearchChange}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => onSearchChange('')} activeOpacity={0.7}>
                <Ionicons name="close-circle" size={16} color={theme.subtext} style={{ opacity: 0.5 }} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  headerOverlay: {
    position: 'relative',
    zIndex: 10,
  },
  headerGradient: {
    paddingBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    fontWeight: '700',
  },
  iconButton: {
    padding: SPACING.xs,
  },
  timeScopeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.xs,
    gap: SPACING.sm,
    justifyContent: 'center',
  },
  timeScopePill: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.full,
    minWidth: 90,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  timeScopePillActive: {
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  timeScopeText: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
    fontSize: 13,
    opacity: 0.5,
  },
  timeScopeTextActive: {
    color: '#FFF',
    fontWeight: '700',
    opacity: 1,
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    gap: SPACING.xs,
    alignItems: 'center',
  },
  filterPillSubtle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  filterPillSubtleActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  filterTextSubtle: {
    ...TYPOGRAPHY.small,
    fontSize: 12,
    fontWeight: '500',
  },
  searchContainerInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: SPACING.xs,
  },
  searchInputInline: {
    flex: 1,
    ...TYPOGRAPHY.small,
    fontSize: 12,
    paddingVertical: 0,
  },
});
