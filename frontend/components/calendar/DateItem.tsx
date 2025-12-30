import React, { memo } from 'react';
import { Pressable, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { CalendarDate } from '@/types/calendar';
import {
  CALENDAR_THEME,
  DATE_ITEM_WIDTH,
  DATE_ITEM_HEIGHT,
} from '@/constants';

interface DateItemProps {
  date: CalendarDate;
  isSelected: boolean;
  onPress: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const DateItem = memo(({ date, isSelected, onPress }: DateItemProps) => {
  const scale = useSharedValue(1);

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
          isSelected && styles.selectedContent,
        ]}
      >
        <Text
          style={[
            styles.dayOfWeek,
            isSelected && styles.selectedText,
          ]}
        >
          {date.dayOfWeek}
        </Text>
        <Text
          style={[
            styles.dayNumber,
            isSelected && styles.selectedText,
          ]}
        >
          {date.dayNumber}
        </Text>
        {date.isToday && !isSelected && (
          <Animated.View style={styles.todayIndicator} />
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
  selectedContent: {
    backgroundColor: CALENDAR_THEME.selectedDateBackground,
  },
  dayOfWeek: {
    fontSize: 12,
    fontWeight: '500',
    color: CALENDAR_THEME.unselectedDateText,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 24,
    fontWeight: '600',
    color: CALENDAR_THEME.headerText,
  },
  selectedText: {
    color: CALENDAR_THEME.selectedDateText,
  },
  todayIndicator: {
    position: 'absolute',
    bottom: 8,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: CALENDAR_THEME.headerText,
  },
});
