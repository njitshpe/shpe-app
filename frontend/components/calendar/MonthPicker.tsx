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
  Animated,
  Modal,
} from 'react-native';
import {
  format,
  startOfMonth,
  endOfMonth,
  getDaysInMonth,
  getDay,
  isSameMonth,
  isSameDay,
  addMonths,
  addDays,
  startOfDay,
} from 'date-fns';
import { Event } from '@/data/mockEvents';

interface MonthPickerProps {
  selectedDate: Date;
  events: Event[];
  onDateSelect: (date: Date) => void;
  onClose: () => void;
  visible: boolean;
  topOffset?: number;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const GRID_HORIZONTAL_PADDING = 20;
// Avoid fractional widths so the 7th column doesn't wrap on iOS.
const DAY_CELL_SIZE = Math.floor((SCREEN_WIDTH - GRID_HORIZONTAL_PADDING * 2) / 7);
const HEADER_HEIGHT = 60;
const WEEKDAY_ROW_HEIGHT = 40;
const SLIDE_OFFSET = 16;

// Windowed month pager: 48 months (±24 months from today)
const MONTHS_RANGE = 48;
const ANCHOR_INDEX = Math.floor(MONTHS_RANGE / 2);

interface DayCell {
  date: Date;
  isCurrentMonth: boolean;
  dayNumber: string;
}

interface MonthData {
  monthStart: Date;
  cells: DayCell[];
  rowCount: number;
  height: number;
}

/**
 * Generates a large array of months centered around today
 * Each month renders only the weeks it occupies (4-6 rows)
 *
 * CRITICAL GRID ALIGNMENT LOGIC:
 * 1. Calculate startDayOfWeek (0 = Sunday, 6 = Saturday) for the 1st of the month
 * 2. Prepend that many empty placeholder cells
 * 3. Add the actual days of the month
 * 4. Fill remaining cells with days from next month to complete the last week
 */
const generateMonthsRange = (anchorDate: Date): MonthData[] => {
  const anchorMonthStart = startOfMonth(anchorDate);
  const months: MonthData[] = [];

  for (let i = -ANCHOR_INDEX; i < MONTHS_RANGE - ANCHOR_INDEX; i++) {
    const monthStart = addMonths(anchorMonthStart, i);
    const daysInMonth = getDaysInMonth(monthStart);
    const startDayOfWeek = getDay(monthStart); // 0 = Sunday, 1 = Monday, etc.

    const cells: DayCell[] = [];

    // Step 1: Add leading days from previous month before month starts
    // If month starts on Wednesday (3), we need 3 empty cells for Sun, Mon, Tue
    for (let j = 0; j < startDayOfWeek; j++) {
      // Calculate the actual date for the previous month's trailing days
      const trailingDate = addDays(monthStart, -(startDayOfWeek - j));
      cells.push({
        date: trailingDate,
        isCurrentMonth: false,
        dayNumber: format(trailingDate, 'd'),
      });
    }

    // Step 2: Add actual days of the current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      cells.push({
        date,
        isCurrentMonth: true,
        dayNumber: day.toString(),
      });
    }

    // Step 3: Fill remaining cells with next month's leading days to complete the last week
    const remainingCells = (7 - (cells.length % 7)) % 7;
    const monthEnd = endOfMonth(monthStart);
    for (let j = 1; j <= remainingCells; j++) {
      const leadingDate = addDays(monthEnd, j);
      cells.push({
        date: leadingDate,
        isCurrentMonth: false,
        dayNumber: format(leadingDate, 'd'),
      });
    }

    const rowCount = Math.ceil(cells.length / 7);
    const height =
      HEADER_HEIGHT + WEEKDAY_ROW_HEIGHT + rowCount * DAY_CELL_SIZE + 16;

    months.push({ monthStart, cells, rowCount, height });
  }

  return months;
};

export const MonthPicker: React.FC<MonthPickerProps> = ({
  selectedDate,
  events,
  onDateSelect,
  onClose,
  visible,
  topOffset = 0,
}) => {
  const flatListRef = useRef<FlatList>(null);
  const animatedHeight = useRef(new Animated.Value(0)).current;
  const [currentMonthIndex, setCurrentMonthIndex] = useState(ANCHOR_INDEX);

  // Generate all months (computed once on mount, centered on today)
  // PERFORMANCE: useMemo prevents regeneration on every render
  const monthsData = useMemo(() => generateMonthsRange(new Date()), []);
  const monthOffsets = useMemo(() => {
    const offsets: number[] = [];
    let currentOffset = 0;
    monthsData.forEach((month) => {
      offsets.push(currentOffset);
      currentOffset += month.height;
    });
    return offsets;
  }, [monthsData]);
  const maxMonthHeight = useMemo(() => {
    return monthsData.reduce((max, month) => Math.max(max, month.height), 0);
  }, [monthsData]);

  // Calculate which dates have events
  // PERFORMANCE: useMemo + Set for O(1) lookup
  const datesWithEvents = useMemo(() => {
    const datesSet = new Set<string>();

    events.forEach((event) => {
      const eventDate = startOfDay(new Date(event.startTimeISO));
      const dateKey = format(eventDate, 'yyyy-MM-dd');
      datesSet.add(dateKey);
    });

    return datesSet;
  }, [events]);

  const hasEventOnDate = useCallback(
    (date: Date): boolean => {
      const dateKey = format(date, 'yyyy-MM-dd');
      return datesWithEvents.has(dateKey);
    },
    [datesWithEvents]
  );

  // Calculate the index for the selected date's month
  const getMonthIndexForDate = useCallback(
    (date: Date): number => {
      const targetMonthStart = startOfMonth(date);
      const index = monthsData.findIndex(
        (month) => month.monthStart.getTime() === targetMonthStart.getTime()
      );
      return index !== -1 ? index : ANCHOR_INDEX;
    },
    [monthsData]
  );

  // Animate expand/collapse
  useEffect(() => {
    Animated.timing(animatedHeight, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();

    if (visible) {
      // Scroll to selected month when opening
      const targetIndex = getMonthIndexForDate(selectedDate);
      setCurrentMonthIndex(targetIndex);
      // Use timeout to ensure FlatList is rendered
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index: targetIndex,
          animated: false,
        });
      }, 50);
    }
  }, [visible, selectedDate, getMonthIndexForDate, animatedHeight]);

  const handleDayPress = (date: Date | null) => {
    if (date) {
      onDateSelect(date);
      onClose();
    }
  };

  const renderMonth = useCallback(
    ({ item }: { item: MonthData }) => {
      const monthTitle = format(item.monthStart, 'MMMM yyyy');

      return (
        <View style={styles.monthContainer}>
          {/* Month title */}
          <View style={styles.monthHeader}>
            <Text style={styles.monthTitle}>{monthTitle}</Text>
          </View>

          {/* Weekday headers */}
          <View style={styles.weekDaysRow}>
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <View key={day} style={styles.weekDayCell}>
                <Text style={styles.weekDayText}>{day}</Text>
              </View>
            ))}
          </View>

          {/* Calendar grid - variable rows based on month */}
          <View style={styles.gridContainer}>
            {item.cells.map((cell, index) => {
              const isSelected = isSameDay(cell.date, selectedDate);
              const hasEvent = hasEventOnDate(cell.date);

              return (
                <Pressable
                  key={`${item.monthStart.getTime()}-${index}`}
                  style={[styles.dayCell, isSelected && styles.dayCellSelected]}
                  onPress={() => handleDayPress(cell.date)}
                >
                  <View style={styles.dayCellContent}>
                    <Text
                      style={[
                        styles.dayText,
                        !cell.isCurrentMonth && styles.dayTextFaded,
                        isSelected && styles.dayTextSelected,
                      ]}
                    >
                      {cell.dayNumber}
                    </Text>
                    {hasEvent && cell.isCurrentMonth && (
                      <View
                        style={[styles.eventDot, isSelected && styles.eventDotSelected]}
                      />
                    )}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      );
    },
    [selectedDate, hasEventOnDate]
  );

  const keyExtractor = useCallback(
    (item: MonthData) => item.monthStart.getTime().toString(),
    []
  );

  const getItemLayout = useCallback(
    (_: any, index: number) => ({
      length: monthsData[index]?.height ?? 0,
      offset: monthOffsets[index] ?? 0,
      index,
    }),
    [monthOffsets, monthsData]
  );

  const interpolatedHeight = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [0, maxMonthHeight],
  });
  const translateY = animatedHeight.interpolate({
    inputRange: [0, 1],
    outputRange: [-SLIDE_OFFSET, 0],
  });

  if (!visible) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={[styles.headerHitArea, { height: topOffset }]}
          onPress={onClose}
        />
        <Pressable
          style={[styles.backdrop, { top: topOffset }]}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.container,
            {
              height: interpolatedHeight,
              transform: [{ translateY }],
              marginTop: topOffset,
            },
          ]}
        >

          {/* Scrollable month list */}
          {/* PERFORMANCE: initialNumToRender=1 prevents rendering all 48 months at once */}
          <FlatList
            ref={flatListRef}
            data={monthsData}
            renderItem={renderMonth}
            keyExtractor={keyExtractor}
            showsVerticalScrollIndicator={true}
            getItemLayout={getItemLayout}
            initialScrollIndex={currentMonthIndex}
            initialNumToRender={1}
            maxToRenderPerBatch={2}
            windowSize={5}
            removeClippedSubviews={true}
          />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  closeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
  monthContainer: {
    paddingBottom: 16,
  },
  monthHeader: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    height: HEADER_HEIGHT,
    justifyContent: 'center',
  },
  monthTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  weekDaysRow: {
    flexDirection: 'row',
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    height: WEEKDAY_ROW_HEIGHT,
    alignItems: 'center',
  },
  weekDayCell: {
    width: DAY_CELL_SIZE,
    alignItems: 'center',
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
  },
  dayCell: {
    width: DAY_CELL_SIZE,
    height: DAY_CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayCellSelected: {
    backgroundColor: '#111827',
    borderRadius: DAY_CELL_SIZE / 2,
  },
  dayCellContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  dayTextFaded: {
    color: '#D1D5DB',
  },
  dayTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  eventDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#10B981',
    marginTop: 2,
  },
  eventDotSelected: {
    backgroundColor: '#FFFFFF',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'flex-start',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  headerHitArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
});
