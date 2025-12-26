import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MiniMonthCalendar } from './MiniMonthCalendar';
import { UpcomingPastToggle } from './UpcomingPastToggle';

interface SidebarProps {
  onDateSelect: (date: Date) => void;
  timeFilter: 'upcoming' | 'past';
  onTimeFilterChange: (filter: 'upcoming' | 'past') => void;
}

export function Sidebar({ onDateSelect, timeFilter, onTimeFilterChange }: SidebarProps) {
  return (
    <View style={styles.container}>
      {/* Mini Month Calendar */}
      <MiniMonthCalendar onDateSelect={onDateSelect} />

      {/* Upcoming/Past Toggle */}
      <View style={styles.section}>
        <UpcomingPastToggle selected={timeFilter} onSelect={onTimeFilterChange} />
      </View>

      {/* Map Preview Placeholder */}
      <View style={styles.section}>
        <View style={styles.mapCard}>
          <Text style={styles.mapTitle}>Map Preview</Text>
          <View style={styles.mapPlaceholder}>
            <Text style={styles.mapPlaceholderText}>📍</Text>
          </View>
          <Text style={styles.mapSubtext}>Event locations will appear here</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  section: {
    // Just spacing between sections
  },
  mapCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  mapTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  mapPlaceholder: {
    backgroundColor: '#111827',
    borderRadius: 8,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  mapPlaceholderText: {
    fontSize: 32,
  },
  mapSubtext: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
