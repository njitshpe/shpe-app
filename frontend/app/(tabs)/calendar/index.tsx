import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Text,
  ActivityIndicator,
  LayoutChangeEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEvents } from '../../../context/EventsContext';
import { useAdaptiveTheme } from '../../../hooks/calendar/useAdaptiveTheme';
import { CalendarHeaderNew } from '../../../components/calendar/CalendarHeaderNew';
import { WeekStripEnhanced } from '../../../components/calendar/WeekStripEnhanced';
import { MonthPicker } from '../../../components/calendar/MonthPicker';
import { EventsList } from '../../../components/calendar/EventsList';

export default function CalendarScreen() {
  const { events, isLoading, error } = useEvents();
  const theme = useAdaptiveTheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(0);
  const [pickerTopOffset, setPickerTopOffset] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const headerRef = useRef<View>(null);

  const handleHeaderPress = () => {
    if (isMonthPickerOpen) {
      setIsMonthPickerOpen(false);
      return;
    }
    const openPickerAt = (offset: number) => {
      setPickerTopOffset(offset);
      setIsMonthPickerOpen(true);
    };
    if (headerRef.current?.measureInWindow) {
      headerRef.current.measureInWindow((_x, y, _width, height) => {
        openPickerAt(Math.max(y + height, headerHeight));
      });
      return;
    }
    openPickerAt(headerHeight);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setIsMonthPickerOpen(false);
  };

  const handleMonthPickerClose = () => {
    setIsMonthPickerOpen(false);
  };

  const handleTodayPress = () => {
    const today = new Date();
    setSelectedDate(today);
    setIsMonthPickerOpen(false);
    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
  };
  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    if (headerHeight === 0) {
      setHeaderHeight(event.nativeEvent.layout.height);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.content}>
        {/* Month Picker */}
        <MonthPicker
          selectedDate={selectedDate}
          events={events}
          onDateSelect={handleDateSelect}
          onClose={handleMonthPickerClose}
          visible={isMonthPickerOpen}
          topOffset={pickerTopOffset}
        />

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View ref={headerRef} onLayout={handleHeaderLayout}>
            <CalendarHeaderNew
              selectedDate={selectedDate}
              onHeaderPress={handleHeaderPress}
              isMonthPickerOpen={isMonthPickerOpen}
              onTodayPress={handleTodayPress}
            />
          </View>

          {/* Week Strip */}
          <WeekStripEnhanced
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
            events={events}
            scrollViewRef={scrollViewRef}
          />

          {/* Events List with Loading/Error States */}
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#10B981" />
              <Text style={styles.loadingText}>Loading events...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
              <Text style={styles.errorText}>Failed to load events</Text>
              <Text style={styles.errorSubtext}>{error}</Text>
            </View>
          ) : (
            <EventsList events={events} selectedDate={selectedDate} />
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#EF4444',
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 20,
  },
});
  const handleHeaderLayout = (event: LayoutChangeEvent) => {
    setHeaderHeight(event.nativeEvent.layout.height);
  };
