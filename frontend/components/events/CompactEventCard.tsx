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

const CARD_HEIGHT = 150;
const IMAGE_WIDTH = 110;

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

    const isLive = isAfter(now, startTime) && isBefore(now, endTime);
    const isPastByTime = isAfter(now, endTime);
    const showPastOverlay = isPast ?? isPastByTime;

    // Use gradient for accent but keep it subtle
    const gradientColors = getEventGradient(event);
    const primaryColor = gradientColors[2].replace('0.95)', '1)').replace('0.9)', '1)');

    // Time String
    const timeString = `${format(startTime, 'h:mm a')}`;

    // Event Type / Tag
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

    const imageSource = event.coverImageUrl
        ? { uri: event.coverImageUrl }
        : { uri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&h=400&fit=crop' };

    return (
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }]}>
            <Pressable
                style={[
                    styles.card,
                    { backgroundColor: theme.card, borderColor: theme.border }
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Image Section */}
                <View style={styles.imageContainer}>
                    <Image source={imageSource} style={styles.image} />
                    {showPastOverlay && <View style={styles.pastOverlay} />}
                </View>

                {/* Content Section */}
                <View style={styles.contentContainer}>

                    {/* Top row: Live/Type indicator only */}
                    <View style={styles.headerRow}>
                        {/* Live indicator OR Type Tag */}
                        {isLive ? (
                            <View style={[styles.liveIndicator, { backgroundColor: '#22C55E' }]}>
                                <View style={styles.pulseDot} />
                                <Text style={styles.liveText}>LIVE</Text>
                            </View>
                        ) : (
                            <View style={[styles.typePill, { backgroundColor: isDark ? `rgba(${primaryColor.replace('rgba(', '').replace('rgb(', '').replace(')', '').split(',').slice(0, 3).join(',')}, 0.15)` : `rgba(${primaryColor.replace('rgba(', '').replace('rgb(', '').replace(')', '').split(',').slice(0, 3).join(',')}, 0.1)` }]}>
                                <Text style={[styles.typeText, { color: primaryColor }]}>{eventTypeLabel}</Text>
                            </View>
                        )}
                    </View>

                    {/* Main: Title */}
                    <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                        {event.title}
                    </Text>

                    {/* Description */}
                    {event.description && (
                        <Text style={[styles.description, { color: theme.subtext }]} numberOfLines={2}>
                            {event.description}
                        </Text>
                    )}

                    {/* Footer: Details */}
                    <View style={styles.detailsContainer}>
                        {/* Time Row */}
                        <View style={styles.detailRow}>
                            <Ionicons name="time-outline" size={16} color={theme.subtext} style={styles.icon} />
                            <Text style={[styles.detailText, { color: theme.subtext }]}>
                                {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
                            </Text>
                        </View>

                        {/* Location Row */}
                        {event.locationName && (
                            <View style={[styles.detailRow, { marginTop: 4 }]}>
                                <Ionicons name="location-outline" size={16} color={theme.subtext} style={styles.icon} />
                                <Text style={[styles.detailText, { color: theme.subtext }]} numberOfLines={1}>
                                    {event.locationName}
                                </Text>
                            </View>
                        )}
                    </View>
                </View>

                {/* Right Accent Stripe (Optional, minimal personality) */}
                <View style={[styles.accentStripe, { backgroundColor: primaryColor }]} />
            </Pressable >
        </Animated.View >
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 12,
        paddingHorizontal: 0, // Should be handled by list container
    },
    card: {
        flexDirection: 'row',
        height: CARD_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
        // Minimal shadow
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
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
    contentContainer: {
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 4,
    },
    typePill: {
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    typeText: {
        fontSize: 10,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    liveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#22C55E',
    },
    liveText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#22C55E',
    },
    title: {
        fontSize: 17,
        fontWeight: '700',
        lineHeight: 22,
        marginBottom: 2,
        letterSpacing: -0.4,
    },
    description: {
        fontSize: 13,
        lineHeight: 18,
        flex: 1, // Allow it to fill available space
        marginBottom: 4,
        opacity: 0.8,
    },
    detailsContainer: {
        marginTop: 'auto', // Push to bottom
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    icon: {
        marginRight: 4,
        marginTop: 1,
    },
    detailText: {
        fontSize: 13,
        fontWeight: '500',
    },
    accentStripe: {
        width: 4,
        height: '100%',
    },
    pastOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
});

