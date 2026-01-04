import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { format, isAfter, isBefore } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types/events';
import { useTheme } from '@/contexts/ThemeContext';

interface CompactEventCardProps {
    event: Event;
    onPress: () => void;
    isPast?: boolean;
}

const CARD_HEIGHT = 200;

export const CompactEventCard: React.FC<CompactEventCardProps> = ({
    event,
    onPress,
    isPast,
}) => {
    const [scaleAnim] = useState(new Animated.Value(1));
    const { theme, isDark } = useTheme();
    const startTime = new Date(event.startTimeISO);
    const endTime = new Date(event.endTimeISO);
    const now = new Date();

    // Determine event status
    const isLive = isAfter(now, startTime) && isBefore(now, endTime);
    const isPastByTime = isAfter(now, endTime);
    const showPastOverlay = isPast ?? isPastByTime;

    // Format date badge - show month and day number (e.g., "JAN 24")
    const monthDay = format(startTime, 'MMM d').toUpperCase();

    // Format time prominently
    const timeString = format(startTime, 'h:mm a');

    const handlePressIn = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Animated.spring(scaleAnim, {
            toValue: 0.98,
            useNativeDriver: true,
        }).start();
    };

    const handlePressOut = () => {
        Animated.spring(scaleAnim, {
            toValue: 1,
            friction: 3,
            tension: 40,
            useNativeDriver: true,
        }).start();
    };

    // Default fallback image if no cover image provided
    const imageSource = event.coverImageUrl
        ? { uri: event.coverImageUrl }
        : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop' };

    const dynamicStyles = {
        card: {
            borderColor: isDark ? theme.border : 'transparent',
            backgroundColor: theme.card,
        },
    };

    return (
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                style={[styles.card, dynamicStyles.card]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Background Image */}
                <ImageBackground
                    source={imageSource}
                    style={styles.imageBackground}
                    imageStyle={styles.image}
                >
                    {/* Dark gradient overlay for text readability */}
                    <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.9)']}
                        style={styles.gradient}
                    >
                        {/* Top row: Date badge and Live indicator */}
                        <View style={styles.topRow}>
                            <View style={[styles.dateBadge, { backgroundColor: theme.primary }]}>
                                <Text style={styles.dateText}>{monthDay}</Text>
                            </View>

                            {/* Live indicator */}
                            {isLive && (
                                <View style={[styles.liveIndicator, { backgroundColor: theme.ongoingBadge }]}>
                                    <View style={styles.pulseDot} />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            )}
                        </View>

                        {/* Event info at bottom */}
                        <View style={styles.contentContainer}>
                            {/* Time - more prominent */}
                            <Text style={styles.timeText}>{timeString}</Text>

                            {/* Title - larger and clearer */}
                            <Text style={styles.titleText} numberOfLines={2}>
                                {event.title}
                            </Text>

                            {/* Location */}
                            {event.locationName && (
                                <View style={styles.locationRow}>
                                    <Ionicons name="location" size={14} color="#FFFFFF" />
                                    <Text style={styles.locationText} numberOfLines={1}>
                                        {event.locationName}
                                    </Text>
                                </View>
                            )}
                        </View>
                    </LinearGradient>
                    {showPastOverlay && <View style={styles.pastOverlay} pointerEvents="none" />}
                </ImageBackground>
            </Pressable>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 16,
    },
    card: {
        width: '100%',
        height: CARD_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        // Subtle shadow for depth
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    imageBackground: {
        width: '100%',
        height: '100%',
    },
    image: {
        resizeMode: 'cover',
    },
    gradient: {
        flex: 1,
        justifyContent: 'space-between',
        padding: 16,
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
    },
    dateBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    dateText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 10,
        gap: 5,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 1,
        shadowRadius: 4,
    },
    liveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    contentContainer: {
        gap: 6,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#FFFFFF',
        letterSpacing: 0.3,
    },
    titleText: {
        fontSize: 22,
        fontWeight: '700',
        color: '#FFFFFF',
        lineHeight: 28,
        letterSpacing: -0.3,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        fontSize: 13,
        fontWeight: '500',
        color: '#FFFFFF',
        opacity: 0.95,
        flex: 1,
    },
    pastOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(156, 163, 175, 0.4)',
    },
});
