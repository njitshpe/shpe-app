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
  topInset?: number;
}

const CONTEXT_OPTIONS: Array<{ value: LeaderboardContext; label: string }> = [
  { value: 'month', label: 'MONTH' },
  { value: 'semester', label: 'SEMESTER' },
  { value: 'allTime', label: 'ALL TIME' },
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
  topInset = 0,
}) => {
  const { theme, isDark } = useTheme();
  const searchInputRef = useRef<TextInput>(null);

  // GLASS STYLES (No more solid Orange)
  const glassBorder = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)';
  const activeGlassBg = isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.08)'; // Frosted White
  const activeGlassBorder = isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.2)'; // Brighter Border

  return (
    <View style={styles.headerOverlay}>
      {/* Local Gradient: Fades out at the bottom to blend with the screen background */}
      <LinearGradient
        colors={isDark
          ? ['rgba(0,0,0,0.8)', 'rgba(0,0,0,0)'] 
          : ['rgba(255,255,255,0.9)', 'rgba(255,255,255,0)']
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[styles.headerGradient, topInset ? { paddingTop: topInset } : null]}
      >
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>LEADERBOARD</Text>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={onShowRules}
            activeOpacity={0.7}
          >
            <Ionicons name="information-circle-outline" size={25} color={theme.subtext} />
          </TouchableOpacity>
        </View>

        {/* Row 1: Time Scope Pills (Glass Style) */}
        <View style={styles.timeScopeRow}>
          {CONTEXT_OPTIONS.map((option) => {
            const isActive = context === option.value;
            return (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.timeScopePill,
                  {
                    borderColor: isActive ? activeGlassBorder : glassBorder,
                    backgroundColor: isActive ? activeGlassBg : 'transparent',
                    borderWidth: 1,
                  }
                ]}
                onPress={() => onContextChange(option.value)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.timeScopeText,
                    isActive
                      ? [styles.timeScopeTextActive, { color: theme.text }]
                      : { color: theme.subtext },
                  ]}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Row 2: Filters + Search */}
        <View style={styles.filtersRow}>
          {/* Major Filter */}
          <TouchableOpacity
            style={[
              styles.filterPillSubtle,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                borderColor: selectedMajor ? activeGlassBorder : 'transparent',
                borderWidth: selectedMajor ? 1 : 0,
              }
            ]}
            onPress={onMajorPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="school-outline"
              size={14}
              color={selectedMajor ? theme.text : theme.subtext}
              style={{ opacity: selectedMajor ? 1 : 0.5 }}
            />
            <Text
              style={[
                styles.filterTextSubtle,
                selectedMajor ? { color: theme.text } : { color: theme.subtext, opacity: 0.6 },
              ]}
            >
              {selectedMajor || 'MAJOR'}
            </Text>
            {selectedMajor && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onClearMajor();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={14} color={theme.text} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Class Year Filter */}
          <TouchableOpacity
            style={[
              styles.filterPillSubtle,
              {
                 backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                 borderColor: selectedClassYear ? activeGlassBorder : 'transparent',
                 borderWidth: selectedClassYear ? 1 : 0,
              }
            ]}
            onPress={onClassYearPress}
            activeOpacity={0.7}
          >
            <Ionicons
              name="calendar-outline"
              size={14}
              color={selectedClassYear ? theme.text : theme.subtext}
              style={{ opacity: selectedClassYear ? 1 : 0.5 }}
            />
            <Text
              style={[
                styles.filterTextSubtle,
                selectedClassYear ? { color: theme.text } : { color: theme.subtext, opacity: 0.6 },
              ]}
            >
              {selectedClassYear ? `'${String(selectedClassYear).slice(-2)}` : 'YEAR'}
            </Text>
            {selectedClassYear && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onClearClassYear();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close-circle" size={14} color={theme.text} />
              </TouchableOpacity>
            )}
          </TouchableOpacity>

          {/* Search Input */}
          <View style={[
              styles.searchContainerInline, 
              { 
                  borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)',
                  backgroundColor: 'transparent'
              }
          ]}>
            <Ionicons name="search-outline" size={16} color={theme.subtext} style={{ opacity: 0.5 }} />
            <TextInput
              ref={searchInputRef}
              style={[styles.searchInputInline, { color: theme.text }]}
              placeholder="SEARCH..."
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
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  headerTitle: {
    ...TYPOGRAPHY.title,
    fontSize: 22,
    letterSpacing: 1,
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
  },
  timeScopeText: {
    ...TYPOGRAPHY.caption,
    fontSize: 11,
    letterSpacing: 1,
    fontWeight: '600',
    opacity: 0.7,
  },
  timeScopeTextActive: {
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
  },
  filterTextSubtle: {
    ...TYPOGRAPHY.small,
    fontSize: 11,
    letterSpacing: 0.5,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  searchContainerInline: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderRadius: 0,
    gap: SPACING.xs,
  },
  searchInputInline: {
    flex: 1,
    ...TYPOGRAPHY.small,
    fontSize: 12,
    paddingVertical: 0,
    letterSpacing: 0.5,
  },
});
