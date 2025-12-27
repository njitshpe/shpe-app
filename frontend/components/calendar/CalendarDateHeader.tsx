import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { calendarTheme, HEADER_HEIGHT } from '../../constants/calendarTheme';

interface CalendarDateHeaderProps {
  selectedDate: Date;
  formattedHeader: string;
}

export const CalendarDateHeader: React.FC<CalendarDateHeaderProps> = ({
  formattedHeader,
}) => {
  return (
    <View style={styles.container} accessibilityRole="header">
      <Text style={styles.headerText}>{formattedHeader}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: HEADER_HEIGHT,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingTop: 50, // Account for status bar
    backgroundColor: calendarTheme.background,
  },
  headerText: {
    fontSize: 36,
    fontWeight: '700',
    color: calendarTheme.headerText,
    letterSpacing: -0.5,
  },
});
