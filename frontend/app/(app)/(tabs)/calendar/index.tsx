import React, { useState, useCallback, useEffect, useRef } from 'react';
import { BlurView } from 'expo-blur';
import {
    View,
    StyleSheet,
    Text,
    Pressable,
    Dimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEvents } from '@/contexts/EventsContext';
import { useTheme } from '@/contexts/ThemeContext';
import { EventsFeed, EventsFeedHandle } from '@/components/events/EventsFeed';
import { LibraryCalendarWrapper } from '@/components/calendar/LibraryCalendarWrapper';
import { MonthHeroHeader } from '@/components/events/MonthHeroHeader';
import { isSameDay, isSameMonth } from 'date-fns';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withSpring,
    interpolate,
    Extrapolation,
    useAnimatedScrollHandler,
    runOnJS,
    useAnimatedReaction,
    withTiming,
    useAnimatedProps,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const CALENDAR_HEIGHT = 380;
const HEADER_TRIGGER_OFFSET = 300; // Offset where header fade-in begins

export default function EventsScreen() {
    const { events, isLoading, refetchEvents } = useEvents();
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();

    const [selectedDate, setSelectedDate] = useState<Date | null>(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Curtain Interaction State
    const [isCalendarOpen, setIsCalendarOpen] = useState(false);
    const curtainY = useSharedValue(0);
    const scrollY = useSharedValue(0);
    const startY = useSharedValue(0);
    const canPeel = useSharedValue(true);
    const [isReady, setIsReady] = useState(false); // Ensures refs are bound before gesture init

    const feedRef = useRef<EventsFeedHandle>(null);

    const handleQRScanPress = () => {
        router.push('/check-in');
    };

    // Initial fetch and setup
    useEffect(() => {
        refetchEvents();
        // Force re-render to ensure refs are bound for gestures
        setIsReady(true);
    }, []);

    // Sync state with animation (optional, mostly for React state consistency if needed)
    useAnimatedReaction(
        () => curtainY.value,
        (currentY, previousY) => {


            const threshold = CALENDAR_HEIGHT / 2;
            if (previousY !== null) {
                if (
                    (previousY < threshold && currentY >= threshold) ||
                    (previousY > threshold && currentY <= threshold)
                ) {
                    runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
                }
            }
        }
    );

    // Scroll Handler for Feed
    const scrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    // Create Native gesture for the feed list
    const listGesture = Gesture.Native();

    // Gesture Handler
    const panGesture = Gesture.Pan()
        .simultaneousWithExternalGesture(listGesture)
        .onStart(() => {
            startY.value = curtainY.value;
            canPeel.value = scrollY.value <= 5;
        })
        .onUpdate((e) => {
            if (startY.value > 0) {
                const newY = startY.value + e.translationY;
                curtainY.value = Math.max(0, Math.min(newY, CALENDAR_HEIGHT + 50));
            } else {
                if (canPeel.value && e.translationY > 0) {
                    curtainY.value = Math.max(0, Math.min(e.translationY, CALENDAR_HEIGHT + 50));
                }
            }
        })
        .onEnd((e) => {
            const currentY = curtainY.value;
            const wasOpen = startY.value > 0;
            let targetY = 0;

            if (wasOpen) {
                const closeThreshold = CALENDAR_HEIGHT * 0.75;
                if (currentY < closeThreshold || e.velocityY < -500) {
                    targetY = 0;
                    runOnJS(setIsCalendarOpen)(false);
                } else {
                    targetY = CALENDAR_HEIGHT;
                    runOnJS(setIsCalendarOpen)(true);
                }
            } else {
                const openThreshold = CALENDAR_HEIGHT * 0.35;
                if (currentY > openThreshold || e.velocityY > 500) {
                    targetY = CALENDAR_HEIGHT;
                    runOnJS(setIsCalendarOpen)(true);
                } else {
                    targetY = 0;
                    runOnJS(setIsCalendarOpen)(false);
                }
            }

            curtainY.value = withSpring(targetY, {
                damping: 20,
                stiffness: 90,
                mass: 1,
                overshootClamping: true
            });
        });

    // Effect to handle manual state changes (e.g. date select)
    useEffect(() => {
        // If state changes via non-gesture (e.g. clicking a date), animate
        curtainY.value = withSpring(isCalendarOpen ? CALENDAR_HEIGHT : 0, {
            damping: 20,
            stiffness: 90,
            overshootClamping: true
        });
    }, [isCalendarOpen]);


    // Handlers
    const handleMonthChange = (date: Date) => {
        setCurrentMonth(date);
        setSelectedDate(null);
    };

    const handleDateSelect = useCallback((date: Date) => {
        setSelectedDate((prev) => {
            if (prev && isSameDay(date, prev)) {
                return null;
            }
            return date;
        });
        // Auto-close curtain when date is selected
        setIsCalendarOpen(false);
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
        setIsCalendarOpen(!isCalendarOpen);
    };

    const monthTitle = `${currentMonth.toLocaleDateString('en-US', { month: 'long' })}`;

    // Animated Styles
    const foregroundStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: curtainY.value }],
            borderRadius: interpolate(curtainY.value, [0, 50], [0, 24], Extrapolation.CLAMP),
            overflow: 'hidden',
        };
    });

    const animatedListProps = useAnimatedProps(() => {
        return {
            scrollEnabled: curtainY.value < 5,
        };
    });

    const headerArrowStyle = useAnimatedStyle(() => {
        return {
            transform: [{ rotate: interpolate(curtainY.value, [0, CALENDAR_HEIGHT], [0, 180]) + 'deg' }]
        };
    });

    const stickyHeaderStyle = useAnimatedStyle(() => {
        return {
            opacity: interpolate(scrollY.value, [HEADER_TRIGGER_OFFSET, HEADER_TRIGGER_OFFSET + 50], [0, 1], Extrapolation.CLAMP),
            transform: [
                { translateY: interpolate(scrollY.value, [HEADER_TRIGGER_OFFSET, HEADER_TRIGGER_OFFSET + 50], [-10, 0], Extrapolation.CLAMP) }
            ],
            // Disable pointer events when hidden? Reanimated doesn't control pointer events easily.
            // We can control zIndex or pointerEvents prop on the View itself if supported.
        };
    });

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>

            {/* --- BACKGROUND LAYER: CALENDAR --- */}
            <View style={[styles.calendarLayer, { paddingTop: insets.top + 20 }]}>
                <LibraryCalendarWrapper
                    events={events}
                    selectedDate={selectedDate}
                    onDateSelect={handleDateSelect}
                    currentMonth={currentMonth}
                    onMonthChange={handleMonthChange}
                />
            </View>

            {/* --- FOREGROUND LAYER: CURTAIN (FEED) --- */}
            {/* Wrap in GestureDetector */}
            <GestureDetector gesture={panGesture}>
                <Animated.View style={[styles.feedLayer, { backgroundColor: theme.background }, foregroundStyle]}>
                    <EventsFeed
                        ref={feedRef}
                        events={events}
                        isRefreshing={isLoading}
                        bounces={false}
                        listGesture={listGesture}
                        animatedProps={animatedListProps}
                        selectedDate={selectedDate}
                        currentMonth={currentMonth}
                        onSelectEvent={(event) => router.push(`/event/${event.id}`)}
                        contentContainerStyle={{ paddingTop: 0 }}
                        ListHeaderComponent={<MonthHeroHeader currentMonth={currentMonth} />}
                        onScroll={scrollHandler}
                    />
                </Animated.View>
            </GestureDetector>

            {/* --- FIXED OVERLAY: NAVIGATION HEADER (Hidden initially) --- */}
            <Animated.View
                style={[styles.header, { paddingTop: insets.top }, stickyHeaderStyle]}
                pointerEvents="box-none"
            >
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[StyleSheet.absoluteFill, { borderBottomColor: theme.border }]}
                />
                <View style={styles.headerContent}>
                    <Pressable onPress={prevMonth} hitSlop={20} style={styles.navButton}>
                        <Ionicons name="chevron-back" size={24} color={theme.text} />
                    </Pressable>

                    <Pressable onPress={toggleCalendar} style={styles.titleContainer}>
                        <Text style={[styles.headerTitle, { color: theme.text }]}>
                            {monthTitle}
                        </Text>
                        <Animated.View style={[{ marginLeft: 4, marginTop: 2 }, headerArrowStyle]}>
                            <Ionicons
                                name="chevron-down"
                                size={16}
                                color={theme.subtext}
                            />
                        </Animated.View>
                    </Pressable>

                    <Pressable onPress={nextMonth} hitSlop={20} style={styles.navButton}>
                        <Ionicons name="chevron-forward" size={24} color={theme.text} />
                    </Pressable>
                </View>
            </Animated.View>

            {/* QR Scanner FAB (Fixed on top) */}
            <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.fabContainer, { borderColor: theme.primary, bottom: 40 }]}
            >
                <Pressable
                    style={({ pressed }) => [styles.fabContent, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={handleQRScanPress}
                >
                    <Ionicons name="qr-code-outline" size={28} color={theme.primary} />
                </Pressable>
            </BlurView>

            {/* Return to Current Month Button (Fixed on top) */}
            {!isSameMonth(currentMonth, new Date()) && !isCalendarOpen && (
                <BlurView
                    intensity={80}
                    tint={isDark ? 'dark' : 'light'}
                    style={[styles.floatingButtonContainer, { bottom: 40 }]}
                >
                    <Pressable
                        onPress={() => {
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
    calendarLayer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: CALENDAR_HEIGHT + 100, // Ensure enough height
        zIndex: 0,
        paddingHorizontal: 10,
    },
    feedLayer: {
        flex: 1,
        zIndex: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
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
        paddingBottom: 16,
        paddingTop: 10,
    },
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 8,
    },
    navButton: {
        padding: 8,
        backgroundColor: 'rgba(125,125,125,0.1)',
        borderRadius: 20,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.5,
    },
    fabContainer: {
        position: 'absolute',
        right: 20,
        width: 56,
        height: 56,
        borderRadius: 28,
        overflow: 'hidden',
        borderWidth: 1,
        zIndex: 50,
        elevation: 6,
    },
    fabContent: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
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
