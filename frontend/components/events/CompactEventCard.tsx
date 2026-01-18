import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated, Image } from 'react-native';
import { format, isAfter, isBefore } from 'date-fns';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
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
    const [pulseAnim] = useState(new Animated.Value(1)); // Start fully visible
    const { theme, isDark } = useTheme();
    const startTime = new Date(event.startTimeISO);
    const endTime = new Date(event.endTimeISO);
    const now = new Date();

    const isLive = isAfter(now, startTime) && isBefore(now, endTime);

    useEffect(() => {
        if (isLive) {
            Animated.loop(
                Animated.sequence([
                    Animated.timing(pulseAnim, {
                        toValue: 0, // Fade out completely
                        duration: 900,
                        useNativeDriver: true,
                    }),
                    Animated.timing(pulseAnim, {
                        toValue: 1, // Fade in
                        duration: 900,
                        useNativeDriver: true,
                    }),
                ])
            ).start();
        }
    }, [isLive]);
    const isPastByTime = isAfter(now, endTime);
    const showPastOverlay = isPast ?? isPastByTime;

    // Use gradient for accent extract the solid color for glow
    const gradientColors = getEventGradient(event);
    const accentColor = gradientColors[2]; // e.g., 'rgba(255, 95, 5, 0.95)'
    // Extract RGB values for shadow color
    const rgbMatch = accentColor.match(/\d+/g);
    const shadowColor = rgbMatch ? `rgb(${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]})` : '#FF5F05';

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

    // Helper for Status Pill
    const getStatusConfig = () => {
        const status = event.userRegistrationStatus;
        if (!status) return null;

        switch (status) {
            case 'going':
                return { label: 'GOING', color: '#22C55E', icon: 'checkmark-circle' };
            case 'waitlist':
                return { label: 'WAITLIST', color: '#EAB308', icon: 'time' };
            case 'confirmed':
                return { label: 'CONFIRMED', color: '#3B82F6', icon: 'scan-circle' };
            default:
                return null;
        }
    };
    const statusConfig = getStatusConfig();

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
                    {
                        backgroundColor: isDark ? 'rgba(18, 18, 20, 1)' : theme.card, // Darker in dark mode
                        borderColor: isDark ? `rgba(${rgbMatch?.[0] || 255}, ${rgbMatch?.[1] || 95}, ${rgbMatch?.[2] || 5}, 0.4)` : theme.border,
                        shadowColor: shadowColor,
                    }
                ]}
                onPress={onPress}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
            >
                {/* Image Section */}
                <View style={styles.imageContainer}>
                    <Image source={imageSource} style={styles.image} />
                    {showPastOverlay && <View style={styles.pastOverlay} />}

                    {/* Status Pill Overlay */}
                    {statusConfig && (
                        <View style={styles.statusPillContainer}>
                            <BlurView
                                intensity={40}
                                tint="dark"
                                style={[styles.statusPill, { borderColor: statusConfig.color }]}
                            >
                                <Ionicons name={statusConfig.icon as any} size={12} color={statusConfig.color} />
                                <Text style={[styles.statusPillText, { color: statusConfig.color }]}>
                                    {statusConfig.label}
                                </Text>
                            </BlurView>
                        </View>
                    )}
                </View>

                {/* Content Section */}
                <View style={styles.contentContainer}>

                    {/* Top row: Type Tag + Live indicator */}
                    <View style={styles.headerRow}>
                        {/* Type Tag (always visible) */}
                        <View style={[styles.typePill, { backgroundColor: isDark ? `rgba(${rgbMatch?.[0] || 255}, ${rgbMatch?.[1] || 95}, ${rgbMatch?.[2] || 5}, 0.15)` : `rgba(${rgbMatch?.[0] || 255}, ${rgbMatch?.[1] || 95}, ${rgbMatch?.[2] || 5}, 0.1)` }]}>
                            <Text style={[styles.typeText, { color: shadowColor }]}>{eventTypeLabel}</Text>
                        </View>

                        {/* Live indicator (right side, only when live) */}
                        {isLive && (
                            <View style={[styles.liveIndicator]}>
                                <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                                <Text style={styles.liveText}>LIVE</Text>
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
            </Pressable>
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
        // Colored glow shadow
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.6,
        shadowRadius: 12,
        elevation: 4,
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        height: CARD_HEIGHT - 16, // Account for margin
        margin: 8,
        borderRadius: 12,
        overflow: 'hidden',
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
    pastOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.4)',
    },
    statusPillContainer: {
        position: 'absolute',
        bottom: 8,
        left: 0,
        right: 0,
        alignItems: 'center', // Center text horizontally
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
        borderWidth: 1, // Subtle colored border
        overflow: 'hidden', // Needed for BlurView
    },
    statusPillText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        letterSpacing: 0.5,
    },
});

