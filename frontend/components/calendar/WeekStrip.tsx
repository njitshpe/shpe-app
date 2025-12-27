import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';

interface WeekStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
}

export const WeekStrip: React.FC<WeekStripProps> = ({
  selectedDate,
  onDateSelect,
}) => {
  // Generate 7 days centered around selected date
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 0 }); // Sunday
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {days.map((date, index) => {
          const isSelected = isSameDay(date, selectedDate);
          const dayLabel = format(date, 'EEE'); // Mon, Tue, etc
          const dayNumber = format(date, 'd');

          return (
            <Pressable
              key={index}
              style={[styles.dayItem, isSelected && styles.dayItemSelected]}
              onPress={() => onDateSelect(date)}
            >
              <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
                {dayLabel}
              </Text>
              <View style={[styles.dayNumberContainer, isSelected && styles.dayNumberContainerSelected]}>
                <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
                  {dayNumber}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 12,
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    minWidth: 50,
  },
  dayItemSelected: {
    // No change - selection shown on number container
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    marginBottom: 6,
  },
  dayLabelSelected: {
    color: '#111827',
    fontWeight: '600',
  },
  dayNumberContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  dayNumberContainerSelected: {
    backgroundColor: '#111827',
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
});
