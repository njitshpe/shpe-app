import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Animated,
  Dimensions,
  PanResponder,
  PanResponderGestureState,
} from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  startOfDay,
  addMonths,
} from 'date-fns';
import { Event } from '@/types/events';
import { useTheme } from '@/contexts/ThemeContext';

interface MonthGridProps {
  selectedDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  visible: boolean;
  onMonthChange?: (newDate: Date) => void; // Add callback for month changes
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_CELL_SIZE = (SCREEN_WIDTH - 40) / 7; // 40 = padding

const VERTICAL_SWIPE_THRESHOLD = 50; // 50px vertical swipe to change month

export const MonthGrid: React.FC<MonthGridProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onClose,
  visible,
  onMonthChange,
}) => {
  const { theme, isDark } = useTheme();
  const animatedHeight = React.useRef(new Animated.Value(0)).current;
  const [currentMonth, setCurrentMonth] = React.useState(selectedDate);

  // Create pan responder for month swipe gestures
  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => visible,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only respond if vertical movement is significant
        return Math.abs(gestureState.dy) > 10;
      },

      onPanResponderRelease: (_, gesture: PanResponderGestureState) => {
        const dy = gesture.dy;

        // Swipe down (dy > 0) -> go to previous month
        // Swipe up (dy < 0) -> go to next month
        if (dy < -VERTICAL_SWIPE_THRESHOLD) {
          // Swiped up - next month
          const nextMonth = addMonths(currentMonth, 1);
          setCurrentMonth(nextMonth);
          onMonthChange?.(nextMonth);
          onDateSelect(startOfMonth(nextMonth)); // Select first day of new month
        } else if (dy > VERTICAL_SWIPE_THRESHOLD) {
          // Swiped down - previous month
          const prevMonth = addMonths(currentMonth, -1);
          setCurrentMonth(prevMonth);
          onMonthChange?.(prevMonth);
          onDateSelect(startOfMonth(prevMonth)); // Select first day of new month
        }
      },
    })
  ).current;

  React.useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [visible, animatedHeight]);

  // Calculate which dates have events
  const datesWithEvents = useMemo(() => {
    const datesSet = new Set<string>();

    events.forEach((event) => {
      const eventDate = startOfDay(new Date(event.startTimeISO));
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      datesSet.add(dateKey);
    });

    return datesSet;
  }, [events]);

  // Update current month when selected date changes externally
  React.useEffect(() => {
    setCurrentMonth(selectedDate);
  }, [selectedDate]);

  // Generate calendar grid for the month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentMonth]);

  const hasEventOnDate = (date: Date): boolean => {
    const dateKey = format(date, 'yyyy-MM-dd');
    return datesWithEvents.has(dateKey);
  };

  const handleDayPress = (date: Date) => {
    onDateSelect(date);
    onClose();
  };

  if (!visible) {
    return null;
  }

  const interpolatedHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 400],
  });

  const dynamicStyles = {
    container: {
      backgroundColor: theme.card,
      borderBottomColor: theme.border,
    },
    header: {
      borderBottomColor: theme.border,
    },
    monthTitle: {
      color: theme.text,
    },
    closeButtonText: {
      color: theme.primary,
    },
    weekDaysRow: {
      borderBottomColor: theme.border,
    },
    weekDayText: {
      color: theme.subtext,
    },
    dayText: {
      color: theme.text,
    },
    dayTextFaded: {
      color: theme.subtext,
      opacity: 0.5,
    },
    dayCellSelected: {
      backgroundColor: theme.text, // Invert for selection
    },
    dayTextSelected: {
      color: theme.background, // Invert for selection
    },
    eventDot: {
      backgroundColor: theme.primary,
    },
    eventDotSelected: {
      backgroundColor: theme.background,
    },
  };

  return (
    <Animated.View
      style={[styles.container, dynamicStyles.container, { height: interpolatedHeight }]}
      {...panResponder.panHandlers}
    >
      <View style={[styles.header, dynamicStyles.header]}>
        <Text style={[styles.monthTitle, dynamicStyles.monthTitle]}>{format(currentMonth, 'MMMM yyyy')}</Text>
        <Pressable onPress={onClose} style={styles.closeButton}>
          <Text style={[styles.closeButtonText, dynamicStyles.closeButtonText]}>Done</Text>
        </Pressable>
      </View>

      {/* Day of week headers */}
      <View style={[styles.weekDaysRow, dynamicStyles.weekDaysRow]}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <View key={day} style={styles.weekDayCell}>
            <Text style={[styles.weekDayText, dynamicStyles.weekDayText]}>{day}</Text>
          </View>
        ))}
      </View>

      {/* Calendar grid */}
      <View style={styles.gridContainer}>
        {calendarDays.map((date, index) => {
          const isCurrentMonth = isSameMonth(date, currentMonth);
          const isSelected = isSameDay(date, selectedDate);
          const hasEvent = hasEventOnDate(date);
          const dayNumber = format(date, 'd');

          return (
            <Pressable
              key={index}
              style={[
                styles.dayCell,
                isSelected && dynamicStyles.dayCellSelected,
              ]}
              onPress={() => handleDayPress(date)}
            >
              <View style={styles.dayCellContent}>
                <Text
                  style={[
                    styles.dayText,
                    dynamicStyles.dayText,
                    !isCurrentMonth && dynamicStyles.dayTextFaded,
                    isSelected && dynamicStyles.dayTextSelected,
                  ]}
                >
                  {dayNumber}
                </Text>
                {hasEvent && isCurrentMonth && (
                  <View
                    style={[
                      styles.eventDot,
                      dynamicStyles.eventDot,
                      isSelected && dynamicStyles.eventDotSelected,
                    ]}
                  />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor removed
    borderBottomWidth: 1,
    // borderBottomColor removed
    overflow: 'hidden',
    zIndex: 1000, // Higher z-index to capture gestures
    elevation: 10, // Android elevation
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    // borderBottomColor removed
  },
  monthTitle: {
    fontSize: 18,
    fontWeight: '700',
    // color removed
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    // color removed
  },
  weekDaysRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    // borderBottomColor removed
  },
  weekDayCell: {
    width: DAY_CELL_SIZE,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    // color removed
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    // color removed
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    // backgroundColor removed
    marginTop: 2,
  },
});
