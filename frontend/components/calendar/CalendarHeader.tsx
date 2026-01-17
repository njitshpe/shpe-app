import React from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { format, isSameDay } from 'date-fns';
import { useTheme } from '@/contexts/ThemeContext';

interface CalendarHeaderProps {
  selectedDate: Date;
  onHeaderPress?: () => void;
  isMonthPickerOpen?: boolean;
  onTodayPress?: () => void; // Magnetic today action
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  selectedDate,
  onHeaderPress,
  isMonthPickerOpen = false,
  onTodayPress,
}) => {
  const headerText = format(selectedDate, 'MMMM do');
  const { theme, isDark } = useTheme();

  const rotateAnim = React.useRef(new Animated.Value(0)).current;

  // Check if selected date is today
  const isToday = isSameDay(selectedDate, new Date());

  React.useEffect(() => {
    Animated.timing(rotateAnim, {
      toValue: isMonthPickerOpen ? 1 : 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [isMonthPickerOpen, rotateAnim]);

  const chevronRotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const dynamicStyles = {
    container: { backgroundColor: theme.card },
    headerText: { color: theme.text },
    chevron: { color: theme.text },
    todayButton: { backgroundColor: isDark ? '#333' : '#F3F4F6' },
    todayIcon: { color: theme.text },
  };

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <View style={styles.headerRow}>
        <Pressable
          style={styles.headerButton}
          onPress={onHeaderPress}
        >
          <Text style={[styles.headerText, dynamicStyles.headerText]}>{headerText}</Text>
          <Animated.View style={{ transform: [{ rotate: chevronRotation }] }}>
            <Ionicons name="chevron-down" size={24} color={theme.text} style={styles.chevron} />
          </Animated.View>
        </Pressable>

        {/* Magnetic Today Button */}
        {onTodayPress && (
          <Pressable
            style={[styles.todayButton, dynamicStyles.todayButton, isToday && styles.todayButtonInactive]}
            onPress={onTodayPress}
          >
            <Ionicons
              name="alarm-outline"
              size={22}
              color={theme.text}
              style={[styles.todayIcon, isToday && styles.todayIconInactive]}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingBottom: 12,
    // backgroundColor removed
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 34,
    fontWeight: '700',
    // color removed
    letterSpacing: -0.5,
  },
  chevron: {
    marginLeft: 8,
    opacity: 0.6,
  },
  todayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    // backgroundColor removed
  },
  todayButtonInactive: {
    backgroundColor: 'transparent',
  },
  todayIcon: {
    opacity: 1,
  },
  todayIconInactive: {
    opacity: 0.5,
  },
});
