import React, { useState, useCallback, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { BlurView } from 'expo-blur';
import {
    View,
    StyleSheet,
    Text,
    Pressable,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '@/contexts/EventsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EventsFeed } from '@/components/events/EventsFeed';
import { LibraryCalendarWrapper } from '@/components/calendar/LibraryCalendarWrapper';
import { MonthHeroHeader } from '@/components/events/MonthHeroHeader';
import { isSameDay, isSameMonth } from 'date-fns';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    interpolate,
    Extrapolation,
} from 'react-native-reanimated';

const HEADER_TRIGGER_OFFSET = 300;

export default function EventsScreen() {
    const { events, isLoading, refetchEvents } = useEvents();
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [showCalendar, setShowCalendar] = useState(false);

    const scrollY = useSharedValue(0);
    const feedRef = useRef<any>(null);

    const handleQRScanPress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push('/check-in');
    };

    const handleScrollEvent = (event: any) => {
        scrollY.value = event.nativeEvent.contentOffset.y;
    };

    useEffect(() => {
        refetchEvents();
    }, []);

    // Handlers
    const handleMonthChange = (date: Date) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setCurrentMonth(date);
        setSelectedDate(null);
    };

    const handleDateSelect = useCallback((date: Date) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedDate((prev) => {
            if (prev && isSameDay(date, prev)) {
                return null;
            }
            return date;
        });
    }, []);

    const nextMonth = () => {
        const next = new Date(currentMonth);
        next.setMonth(next.getMonth() + 1);
        handleMonthChange(next);
    };

    const prevMonth = () => {
        const prev = new Date(currentMonth);
        prev.setMonth(prev.getMonth() - 1);
        handleMonthChange(prev);
    };

    const toggleCalendar = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setShowCalendar(!showCalendar);
    };

    const monthTitle = `${currentMonth.toLocaleDateString('en-US', { month: 'long' })}`;

    const stickyHeaderStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(scrollY.value, [250, 300], [0, 1], Extrapolation.CLAMP),
            transform: [
                { translateY: interpolate(scrollY.value, [250, 300], [-10, 0], Extrapolation.CLAMP) }
            ],
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* Events Feed */}
            <EventsFeed
                ref={feedRef}
                events={events}
                isRefreshing={isLoading}
                onRefresh={refetchEvents}
                selectedDate={selectedDate}
                currentMonth={currentMonth}
                onSelectEvent={(event) => router.push(`/event/${event.id}`)}
                contentContainerStyle={{ paddingTop: 0 }}
                ListHeaderComponent={
                    <>
                        <MonthHeroHeader
                            currentMonth={currentMonth}
                            onScanPress={handleQRScanPress}
                            onCalendarPress={toggleCalendar}
                            showCalendar={showCalendar}
                        />

                        {/* Inline Calendar (Expandable) */}
                        {showCalendar && (
                            <Animated.View style={[
                                styles.calendarSection,
                                { backgroundColor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.03)' }
                            ]}>
                                <LibraryCalendarWrapper
                                    events={events}
                                    selectedDate={selectedDate}
                                    onDateSelect={handleDateSelect}
                                    currentMonth={currentMonth}
                                    onMonthChange={handleMonthChange}
                                />
                            </Animated.View>
                        )}
                    </>
                }
                onScroll={handleScrollEvent}
            />

            {/* Sticky Navigation Header (Shows on Scroll) */}
            <Animated.View
                style={[styles.header, { paddingTop: insets.top }, stickyHeaderStyle]}
                pointerEvents="box-none"
            >
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderBottomColor: theme.border, borderBottomWidth: 0.5 }]}
                />
                <View style={styles.headerContent}>
                    <Text style={[styles.headerTitle, { color: theme.text }]}>
                        {monthTitle}
                    </Text>
                    <View style={styles.headerButtons}>
                        <Pressable onPress={toggleCalendar} style={styles.headerButton}>
                            <Ionicons
                                name="calendar-outline"
                                size={22}
                                color={showCalendar ? theme.primary : theme.text}
                            />
                        </Pressable>
                        <Pressable onPress={handleQRScanPress} style={styles.headerButton}>
                            <Ionicons name="qr-code-outline" size={22} color={theme.text} />
                        </Pressable>
                    </View>
                </View>
            </Animated.View>

            {/* Return to Current Month Button */}
            {!isSameMonth(currentMonth, new Date()) && (
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.floatingButtonContainer, { bottom: 40 }]}
                >
                    <Pressable
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            const now = new Date();
                            setCurrentMonth(now);
                            setSelectedDate(null);
                        }}
                        style={({ pressed }) => [
                            styles.floatingButton,
                            { borderColor: theme.primary, opacity: pressed ? 0.8 : 1 }
                        ]}
                    >
                        <Text style={[styles.floatingButtonText, { color: theme.primary }]}>
                            Return to Current Month
                        </Text>
                    </Pressable>
                </BlurView>
            )}

        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    calendarSection: {
        paddingHorizontal: 10,
        paddingTop: 20,
        paddingBottom: 10,
        marginBottom: 10,
        borderRadius: 16,
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
    },
    headerContent: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingBottom: 12,
        paddingTop: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
        letterSpacing: -0.3,
    },
    headerButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    headerButton: {
        padding: 6,
    },
    floatingButtonContainer: {
        position: 'absolute',
        alignSelf: 'center',
        borderRadius: 20,
        overflow: 'hidden',
        zIndex: 50,
    },
    floatingButton: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderWidth: 1,
        borderRadius: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    floatingButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
