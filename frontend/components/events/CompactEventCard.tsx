import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Image } from 'expo-image';
import { format, isAfter, isBefore, differenceInSeconds } from 'date-fns';
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
    const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
    const { theme, isDark } = useTheme();
    const startTime = new Date(event.startTimeISO);
    const endTime = new Date(event.endTimeISO);
    const now = new Date();

    const isLive = isAfter(now, startTime) && isBefore(now, endTime);

    // Countdown Logic
    useEffect(() => {
        if (isLive) return; // Don't run countdown if already live

        const calculateTimeLeft = () => {
            const now = new Date();
            const secondsLeft = differenceInSeconds(startTime, now);

            if (secondsLeft > 0 && secondsLeft < 86400) { // Less than 24 hours
                const hours = Math.floor(secondsLeft / 3600);
                const minutes = Math.floor((secondsLeft % 3600) / 60);
                const seconds = secondsLeft % 60;

                // Format: HH:MM:SS or just MM:SS if < 1 hour
                const formatted = `${hours > 0 ? `${hours.toString().padStart(2, '0')}:` : ''}${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
                setTimeRemaining(`Starts in ${formatted}`);
            } else {
                setTimeRemaining(null);
            }
        };

        calculateTimeLeft(); // Initial call
        const interval = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(interval);
    }, [isLive, startTime]);

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

    // Use gradient for accent extract the solid color for glow/pill
    const gradientColors = getEventGradient(event);
    const accentColor = gradientColors[2]; // e.g., 'rgba(255, 95, 5, 0.95)'
    // Extract RGB values for tinted backgrounds (using regex to get r,g,b)
    const rgbMatch = accentColor.match(/\d+/g);
    const accentRgb = rgbMatch ? `${rgbMatch[0]}, ${rgbMatch[1]}, ${rgbMatch[2]}` : '255, 95, 5';

    // Time String
    const timeString = `${format(startTime, 'h:mm a')}`;

    // Event Type / Tag
    const getEventTypeLabel = () => {
        const text = `${event.title} ${event.tags?.join(' ') || ''}`.toLowerCase();
        if (text.match(/social|mixer|fun|party/)) return 'Social';
        if (text.match(/workshop|learn|study|tech/)) return 'Workshop';
        if (text.match(/gbm|general|meeting/)) return 'General';
        if (text.match(/corporate|company|resume/)) return 'Corporate';
        if (text.match(/volunteer|service|community/)) return 'Volunteering';
        if (text.match(/shpetinas|valentine/)) return 'SHPEtinas';
        return 'Event';
    };
    const eventTypeLabel = getEventTypeLabel();

    // Helper for Status Pill
    const getStatusConfig = () => {
        const status = event.userRegistrationStatus;
        if (!status) return null;

        switch (status) {
            case 'going':
                return {
                    label: 'Going',
                    textColor: '#4ADE80', // Bright Green
                    backgroundColor: 'rgba(20, 83, 45, 0.95)', // Dark Green
                };
            case 'waitlist':
                return {
                    label: 'Waitlist',
                    textColor: '#FACC15', // Bright Yellow
                    backgroundColor: 'rgba(113, 63, 18, 0.95)', // Dark Yellow/Brown
                };
            case 'confirmed':
                return {
                    label: 'Confirmed',
                    textColor: '#60A5FA', // Bright Blue
                    backgroundColor: 'rgba(30, 58, 138, 0.95)', // Dark Blue
                };
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
        <Animated.View style={[styles.cardWrapper, { transform: [{ scale: scaleAnim }] }, showPastOverlay && { opacity: 0.5 }]}>
            <View style={[styles.shadowContainer]}>
                <Pressable
                    style={[
                        styles.cardContent,
                        {
                            backgroundColor: isDark ? 'rgba(18, 18, 20, 1)' : theme.card, // Darker in dark mode
                        }
                    ]}
                    onPress={onPress}
                    onPressIn={handlePressIn}
                    onPressOut={handlePressOut}
                >
                    {/* Image Section */}
                    <View style={[styles.imageContainer, { backgroundColor: isDark ? '#262626' : '#E5E7EB' }]}>
                        <Image
                            source={imageSource}
                            style={styles.image}
                            contentFit="cover"
                            transition={200}
                        />
                        {showPastOverlay && <View style={styles.pastOverlay} />}

                        {/* Status Pill Overlay */}
                        {statusConfig && (
                            <View style={styles.statusPillContainer}>
                                <View
                                    style={[
                                        styles.statusPill,
                                        {
                                            backgroundColor: statusConfig.backgroundColor,
                                            borderColor: statusConfig.textColor, // Optional: tinted border
                                            borderWidth: 1,
                                        }
                                    ]}
                                >
                                    <Text style={[styles.statusPillText, { color: statusConfig.textColor }]}>
                                        {statusConfig.label}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </View>

                    {/* Content Section */}
                    <View style={styles.textContainer}>

                        {/* Top row: Type Tag + Live indicator */}
                        <View style={styles.headerRow}>
                            {/* Type Tag (always visible) */}
                            <View style={[styles.typePill, { backgroundColor: isDark ? `rgba(${accentRgb}, 0.15)` : `rgba(${accentRgb}, 0.1)` }]}>
                                <Text style={[styles.typeText, { color: accentColor }]}>{eventTypeLabel}</Text>
                            </View>

                            {/* Live indicator OR Countdown (right side) */}
                            {isLive ? (
                                <View style={[styles.liveIndicator]}>
                                    <Animated.View style={[styles.pulseDot, { opacity: pulseAnim }]} />
                                    <Text style={styles.liveText}>LIVE</Text>
                                </View>
                            ) : timeRemaining ? (
                                <View style={[styles.liveIndicator]}>
                                    <Ionicons name="hourglass-outline" size={10} color={accentColor} />
                                    <Text style={[styles.liveText, { color: accentColor, fontWeight: '700' }]}>{timeRemaining}</Text>
                                </View>
                            ) : null}
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
            </View>
        </Animated.View >
    );
};

const styles = StyleSheet.create({
    cardWrapper: {
        marginBottom: 12,
        paddingHorizontal: 0,
    },
    shadowContainer: {
        // Shadow removed as per request
        borderRadius: 16,
        backgroundColor: 'transparent',
    },
    cardContent: {
        flexDirection: 'row',
        height: CARD_HEIGHT,
        borderRadius: 16,
        overflow: 'hidden', // Clips content (image/ripple) to rounded corners
    },
    textContainer: { // Renamed from contentContainer for clarity
        flex: 1,
        padding: 12,
        justifyContent: 'space-between',
    },
    imageContainer: {
        width: IMAGE_WIDTH,
        height: CARD_HEIGHT - 16, // Account for margin
        margin: 8,
        borderRadius: 12,
        overflow: 'hidden',
        backgroundColor: '#262626', // Darker gray for dark mode compatibility (neutral)
    },
    image: {
        width: '100%',
        height: '100%',
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
        bottom: 4,
        left: 0,
        right: 0,
        alignItems: 'center', // Center text horizontally
    },
    statusPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 6,
        paddingVertical: 4,
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

