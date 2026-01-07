import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { format, isAfter, isBefore } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Event } from '@/types/events';
import { useTheme } from '@/contexts/ThemeContext';
import { getEventGradient } from '@/utils/eventUtils';

interface CompactEventCardProps {
    event: Event;
    onPress: () => void;
    isPast?: boolean;
}

const CARD_HEIGHT = 180;
const IMAGE_WIDTH = 130;

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

    // Get event color based on type (extract from gradient or define mapping)
    // We use the middle color of the gradient as the primary accent color
    const gradientColors = getEventGradient(event);
    // Extract the solid color (2nd element in the array usually has the color)
    // Format is ['transparent', 'rgba(r,g,b,0.4)', 'rgba(r,g,b,0.95)']
    // We'll parse the RGB from the last element for the solid color
    const primaryColor = gradientColors[2].replace('0.95)', '1)').replace('0.9)', '1)');

    // Create a tint color (low opacity) for tags and background
    const tintColor = primaryColor.replace('1)', '0.1)');
    const tagTintColor = primaryColor.replace('1)', '0.15)');

    // Format date badge - show month and day number (e.g., "JAN 24")
    const monthDay = format(startTime, 'MMM d').toUpperCase();

    // Format time prominently (Start - End)
    const timeString = `${format(startTime, 'h:mm a')} - ${format(endTime, 'h:mm a')}`;

    // Determine event type label for tag
    const getEventTypeLabel = () => {
        const text = `${event.title} ${event.tags?.join(' ') || ''}`.toLowerCase();
        if (text.match(/social|mixer|fun|party/)) return 'Social';
        if (text.match(/workshop|learn|study|tech/)) return 'Workshop';
        if (text.match(/gbm|general|meeting/)) return 'General';
        if (text.match(/corporate|company|resume/)) return 'Corporate';
        return 'Event';
    };
    const eventTypeLabel = getEventTypeLabel();

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
            backgroundColor: theme.card,
            borderColor: isDark ? theme.border : '#E5E7EB',
            shadowColor: primaryColor, // Colored shadow
        },
        contentContainer: {
            // Tinted background in dark mode, white in light mode
            backgroundColor: isDark ? tintColor : theme.card,
        },
        text: {
            color: theme.text,
        },
        subtext: {
            color: theme.subtext,
        },
        tag: {
            backgroundColor: tagTintColor,
        },
        tagText: {
            color: primaryColor,
        },
        accentBar: {
            backgroundColor: primaryColor,
        }
    };

    return (
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                style={[styles.card, dynamicStyles.card]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                <View style={styles.rowContainer}>
                    {/* Left Side: Poster Image */}
                    <View style={styles.imageContainer}>
                        <Image
                            source={imageSource}
                            style={styles.image}
                        />
                        {showPastOverlay && <View style={styles.pastOverlay} pointerEvents="none" />}
                    </View>

                    {/* Vertical Accent Bar */}
                    <View style={[styles.accentBar, dynamicStyles.accentBar]} />

                    {/* Right Side: Content */}
                    <View style={[styles.contentContainer, dynamicStyles.contentContainer]}>
                        <View style={styles.innerContent}>
                            {/* Top row: Date badge and Live/Type indicator */}
                            <View style={styles.topRow}>
                                <View style={[styles.dateBadge, { backgroundColor: primaryColor }]}>
                                    <Text style={styles.dateText}>{monthDay}</Text>
                                </View>

                                {/* Live indicator OR Type Tag */}
                                {isLive ? (
                                    <View style={[styles.liveIndicator, { backgroundColor: '#22C55E' }]}>
                                        <View style={styles.pulseDot} />
                                        <Text style={styles.liveText}>LIVE</Text>
                                    </View>
                                ) : (
                                    <View style={[styles.typeTag, dynamicStyles.tag]}>
                                        <Text style={[styles.typeText, dynamicStyles.tagText]}>{eventTypeLabel}</Text>
                                    </View>
                                )}
                            </View>

                            {/* Middle: Title & Description */}
                            <View style={styles.middleContainer}>
                                <Text style={[styles.titleText, dynamicStyles.text]} numberOfLines={2}>
                                    {event.title}
                                </Text>
                                {event.description && (
                                    <Text style={[styles.descriptionText, dynamicStyles.subtext]} numberOfLines={2}>
                                        {event.description}
                                    </Text>
                                )}
                            </View>

                            {/* Bottom: Details */}
                            <View style={styles.detailsContainer}>
                                {/* Time */}
                                <View style={styles.detailRow}>
                                    <Ionicons name="time-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                    <Text style={[styles.detailText, dynamicStyles.subtext]}>{timeString}</Text>
                                </View>

                                {/* Location */}
                                {event.locationName && (
                                    <View style={styles.detailRow}>
                                        <Ionicons name="location-outline" size={14} color={isDark ? "#9CA3AF" : "#6B7280"} />
                                        <Text style={[styles.detailText, dynamicStyles.subtext]} numberOfLines={1}>
                                            {event.locationName}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    </View>
                </View>
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
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15, // Increased slightly for colored shadow visibility
        shadowRadius: 12,
        elevation: 5,
    },
    rowContainer: {
        flexDirection: 'row',
        height: '100%',
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        height: '100%',
        backgroundColor: '#E5E7EB',
    },
    image: {
        width: '100%',
        height: '100%',
        resizeMode: 'cover',
    },
    accentBar: {
        width: 4,
        height: '100%',
    },
    contentContainer: {
        flex: 1,
        height: '100%',
    },
    innerContent: {
        flex: 1,
        padding: 12, // Reduced slightly to fit description
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 6,
    },
    dateBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    dateText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        gap: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#FFFFFF',
    },
    liveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#FFFFFF',
    },
    typeTag: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.3,
    },
    middleContainer: {
        flex: 1,
        justifyContent: 'flex-start',
        gap: 4,
    },
    titleText: {
        fontSize: 16,
        fontWeight: '700',
        lineHeight: 20,
        letterSpacing: -0.3,
    },
    descriptionText: {
        fontSize: 12,
        lineHeight: 16,
        opacity: 0.8,
    },
    detailsContainer: {
        gap: 4,
        marginTop: 6,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    detailText: {
        fontSize: 12,
        fontWeight: '500',
        flex: 1,
    },
    pastOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
});
