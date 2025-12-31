import React, { memo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CalendarDate } from '@/types/calendar';
import { useTheme } from '@/contexts/ThemeContext';

// Define constants locally since calendar-theme.ts was removed
const DATE_ITEM_WIDTH = 48;
const DATE_ITEM_HEIGHT = 60;

interface DateItemProps {
  date: CalendarDate;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DateItem = memo(({ date, isSelected, onPress }: DateItemProps) => {
  const scale = useSharedValue(1);
  const { theme, isDark } = useTheme();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, {
      damping: 15,
      stiffness: 150,
    });
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const dynamicStyles = {
    selectedContent: { backgroundColor: theme.primary },
    dayOfWeek: { color: theme.subtext },
    dayNumber: { color: theme.text },
    selectedText: { color: '#FFFFFF' },
    todayIndicator: { backgroundColor: theme.primary },
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      style={[animatedStyle, styles.container]}
      accessibilityRole="button"
      accessibilityLabel={`${date.dayOfWeek} ${date.dayNumber}${isSelected ? ', selected' : ''}`}
      accessibilityHint="Tap to view events for this date"
    >
      <Animated.View
        style={[
          styles.content,
          isSelected && dynamicStyles.selectedContent,
        ]}
      >
        <Text
          style={[
            styles.dayOfWeek,
            dynamicStyles.dayOfWeek,
            isSelected && dynamicStyles.selectedText,
          ]}
        >
          {date.dayOfWeek}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            dynamicStyles.dayNumber,
            isSelected && dynamicStyles.selectedText,
          ]}
        >
          {date.dayNumber}
        </Text>
        {date.isToday && !isSelected && (
          <Animated.View style={[styles.todayIndicator, dynamicStyles.todayIndicator]} />
        )}
      </Animated.View>
    </AnimatedPressable>
  );
});

DateItem.displayName = 'DateItem';

const styles = StyleSheet.create({
  container: {
    width: DATE_ITEM_WIDTH,
    height: DATE_ITEM_HEIGHT,
    marginRight: 12,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: 'transparent',
    minWidth: 44,
    minHeight: 44,
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '600',
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
