import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { CalendarDate } from '../../types/calendar.types';
import { DateItem } from './DateItem';
import { DATE_SELECTOR_HEIGHT } from '../../constants/calendarTheme';

interface DateSelectorProps {
  dates: CalendarDate[];
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  scrollViewRef: React.RefObject<ScrollView | null>;
}

export const DateSelector: React.FC<DateSelectorProps> = ({
  dates,
  selectedDate,
  onDateSelect,
  scrollViewRef,
}) => {
  // Scroll to selected date on mount
  useEffect(() => {
    const selectedIndex = dates.findIndex(
      (d) => d.date.toDateString() === selectedDate.toDateString()
    );

    if (selectedIndex !== -1 && scrollViewRef.current) {
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({
          x: selectedIndex * 82, // DATE_ITEM_WIDTH + spacing
          y: 0,
          animated: false,
        });
      }, 100);
    }
  }, []);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={82} // Optional: snap to each date
      >
        {dates.map((date) => {
          const isSelected =
            date.date.toDateString() === selectedDate.toDateString();

          return (
            <DateItem
              key={date.date.toISOString()}
              date={date}
              isSelected={isSelected}
              onPress={() => onDateSelect(date.date)}
            />
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: DATE_SELECTOR_HEIGHT,
    paddingVertical: 10,
  },
  scrollContent: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
});
