import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  FlatList,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
  LayoutChangeEvent,
} from 'react-native';
import { format, startOfWeek, addDays, addWeeks, isSameDay, startOfDay } from 'date-fns';
import { Event } from '@/types/events';
import { NEON_COLORS } from '@/constants';
import { useTheme } from '@/contexts/ThemeContext';

interface WeekStripProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  onWeekChange?: (weekStart: Date) => void;
  events?: Event[];
  scrollViewRef?: React.RefObject<any>;
}

const SCREEN_WIDTH = Dimensions.get('window').width;

// Windowed infinite pager: 10 years of weeks (±5 years from today)
const WEEKS_RANGE = 520; // ±260 weeks = ~10 years total
const ANCHOR_INDEX = Math.floor(WEEKS_RANGE / 2); // 260 = middle index

interface WeekData {
  weekStart: Date;
  days: Date[];
}

/**
 * Generates a large array of weeks centered around today
 * This allows continuous navigation across years without dynamic insertion
 */
const generateWeeksRange = (anchorDate: Date): WeekData[] => {
  const anchorWeekStart = startOfWeek(anchorDate, { weekStartsOn: 0 });
  const weeks: WeekData[] = [];

  for (let i = -ANCHOR_INDEX; i < WEEKS_RANGE - ANCHOR_INDEX; i++) {
    const weekStart = addWeeks(anchorWeekStart, i);
    const days = Array.from({ length: 7 }, (_, dayIndex) => addDays(weekStart, dayIndex));
    weeks.push({ weekStart, days });
  }

  return weeks;
};

export const WeekStrip: React.FC<WeekStripProps> = ({
  selectedDate,
  onDateSelect,
  onWeekChange,
  events = [],
  scrollViewRef,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(ANCHOR_INDEX);
  const isScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { theme, isDark } = useTheme();

  // Generate all weeks (computed once on mount, centered on today)
  const weeksData = useMemo(() => generateWeeksRange(new Date()), []);

  // Helper function to check if a date has events
  const hasEvents = useCallback(
    (date: Date): boolean => {
      return events.some((event) => {
        const eventDate = startOfDay(new Date(event.startTimeISO));
        const checkDate = startOfDay(date);
        return isSameDay(eventDate, checkDate);
      });
    },
    [events]
  );

  // Calculate the index for the selected date's week
  const getWeekIndexForDate = useCallback(
    (date: Date): number => {
      const targetWeekStart = startOfWeek(date, { weekStartsOn: 0 });
      const index = weeksData.findIndex(
        (week) => week.weekStart.getTime() === targetWeekStart.getTime()
      );
      return index !== -1 ? index : ANCHOR_INDEX;
    },
    [weeksData]
  );

  // Sync FlatList scroll position when selectedDate changes externally
  useEffect(() => {
    if (!isScrollingRef.current) {
      const targetIndex = getWeekIndexForDate(selectedDate);
      if (targetIndex !== currentWeekIndex) {
        setCurrentWeekIndex(targetIndex);
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
          viewPosition: 0,
        });
      }
    }
  }, [selectedDate, currentWeekIndex, getWeekIndexForDate]);

  // Handle when the user stops scrolling - update the current week
  const handleMomentumScrollEnd = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const offsetX = event.nativeEvent.contentOffset.x;
      const newIndex = Math.round(offsetX / containerWidth);

      // Clamp to valid range
      const clampedIndex = Math.max(0, Math.min(newIndex, weeksData.length - 1));

      if (clampedIndex !== currentWeekIndex) {
        setCurrentWeekIndex(clampedIndex);
        const newWeek = weeksData[clampedIndex];
        onWeekChange?.(newWeek.weekStart);

        // Update selected date to the same day of week in the new week
        const currentDayOfWeek = selectedDate.getDay();
        const newSelectedDate = newWeek.days[currentDayOfWeek];
        onDateSelect(newSelectedDate);
      }

      isScrollingRef.current = false;

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    },
    [containerWidth, currentWeekIndex, weeksData, selectedDate, onWeekChange, onDateSelect]
  );

  const handleScrollBeginDrag = useCallback(() => {
    isScrollingRef.current = true;

    // Clear any pending timeout
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }
  }, []);

  // Fallback: if momentum scroll doesn't fire, use scroll timeout
  const handleScroll = useCallback(() => {
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      isScrollingRef.current = false;
    }, 150);
  }, []);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  }, []);

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: containerWidth,
      offset: containerWidth * index,
      index,
    }),
    [containerWidth]
  );

  const dynamicStyles = {
    container: { backgroundColor: theme.card, borderBottomColor: theme.border },
    dayLabel: { color: theme.subtext },
    dayLabelSelected: { color: theme.text },
    dayNumberContainerSelected: { backgroundColor: theme.primary },
    dayNumber: { color: theme.text },
    dayNumberSelected: { color: '#FFFFFF' }, // Always white on primary
  };

  const renderWeek = useCallback(
    ({ item }: { item: WeekData }) => {
      return (
        <View style={[styles.weekContainer, { width: containerWidth }]}>
          {item.days.map((date, dayIndex) => {
            const isSelected = isSameDay(date, selectedDate);
            const dayLabel = format(date, 'EEE');
            const dayNumber = format(date, 'd');
            const dateHasEvents = hasEvents(date);

            return (
              <Pressable
                key={`${item.weekStart.getTime()}-${dayIndex}`}
                style={styles.dayItem}
                onPress={() => onDateSelect(date)}
              >
                <Text style={[styles.dayLabel, dynamicStyles.dayLabel, isSelected && dynamicStyles.dayLabelSelected]}>
                  {dayLabel}
                </Text>
                <View
                  style={[
                    styles.dayNumberContainer,
                    isSelected && dynamicStyles.dayNumberContainerSelected,
                  ]}
                >
                  <Text style={[styles.dayNumber, dynamicStyles.dayNumber, isSelected && dynamicStyles.dayNumberSelected]}>
                    {dayNumber}
                  </Text>
                </View>
                {/* Event dot indicator */}
                {dateHasEvents && !isSelected && <View style={styles.neonIndicator} />}
              </Pressable>
            );
          })}
        </View>
      );
    },
    [containerWidth, selectedDate, hasEvents, onDateSelect, theme, isDark]
  );

  const keyExtractor = useCallback((item: WeekData) => item.weekStart.getTime().toString(), []);

  return (
    <View style={[styles.container, dynamicStyles.container]} onLayout={handleLayout}>
      <FlatList
        ref={flatListRef}
        data={weeksData}
        renderItem={renderWeek}
        keyExtractor={keyExtractor}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        onScrollBeginDrag={handleScrollBeginDrag}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={getItemLayout}
        initialScrollIndex={currentWeekIndex}
        windowSize={3}
        maxToRenderPerBatch={3}
        removeClippedSubviews={true}
        initialNumToRender={3}
        bounces={false}
        decelerationRate="fast"
        snapToInterval={containerWidth}
        snapToAlignment="start"
        disableIntervalMomentum={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // backgroundColor removed
    paddingVertical: 12,
    borderBottomWidth: 1,
    // borderBottomColor removed
    width: '100%',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dayItem: {
    alignItems: 'center',
    paddingVertical: 8,
    flex: 1,
    position: 'relative',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '500',
    // color removed
    marginBottom: 6,
  },
  dayLabelSelected: {
    // color removed
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
    // backgroundColor removed
  },
  dayNumber: {
    fontSize: 16,
    fontWeight: '600',
    // color removed
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  neonIndicator: {
    position: 'absolute',
    bottom: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: NEON_COLORS.green,
    shadowColor: NEON_COLORS.green,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 5,
  },
});
