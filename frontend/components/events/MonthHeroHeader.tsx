import React from 'react';
import { View, Text, StyleSheet, Dimensions, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '@/contexts/ThemeContext';
import { MONTH_THEMES } from '@/utils/eventUtils';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');
const HEADER_HEIGHT = height * 0.60; // Percent of screen height

interface MonthHeroHeaderProps {
    currentMonth: Date;
    onScanPress?: () => void;
    onCalendarPress?: () => void;
    showCalendar?: boolean;
}

export const MonthHeroHeader: React.FC<MonthHeroHeaderProps> = ({ currentMonth, onScanPress, onCalendarPress, showCalendar }) => {
    const { theme, isDark } = useTheme();
    const monthIndex = currentMonth.getMonth();
    const themeData = MONTH_THEMES[monthIndex as keyof typeof MONTH_THEMES] || MONTH_THEMES[0];

    return (
        <View style={styles.container}>
            {/* Background Image with Transition */}
            <Image
                source={themeData.image}
                style={styles.image}
                contentFit="cover"
                transition={500}
            />

            {/* Blur Layer for Readability (Gradient Effect via Stacking) */}
            <BlurView
                intensity={isDark ? 2 : 2}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '60%' }]}
            />
            <BlurView
                intensity={isDark ? 5 : 5}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '50%' }]}
            />
            <BlurView
                intensity={isDark ? 10 : 8}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '40%' }]}
            />
            <BlurView
                intensity={isDark ? 15 : 12}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '30%' }]}
            />
            <BlurView
                intensity={isDark ? 20 : 15}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '20%' }]}
            />
            <BlurView
                intensity={isDark ? 30 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={[styles.blurLayer, { height: '10%' }]}
            />

            {/* Gradient Overlay for Text Readability & Blend */}
            <LinearGradient
                colors={[
                    'transparent',
                    'transparent',
                    isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.6)',
                    theme.background
                ]}
                locations={[0, 0.3, 0.65, 1]}
                style={styles.gradient}
            />

            {/* Content Overlay */}
            <View style={styles.contentContainer}>
                <Text style={[styles.eyebrow, { color: isDark ? '#b0b0b0' : '#555555' }]}>
                    What's Happening in
                </Text>

                <Text style={[styles.title, { color: theme.text }]}>
                    {themeData.title}
                </Text>

                <View style={styles.divider} />

                <Text style={[styles.description, { color: isDark ? '#b0b0b0' : '#555555' }]}>
                    {themeData.description}
                </Text>

                {/* Action Buttons */}
                <View style={styles.buttonContainer}>
                    {/* Calendar Pill Button */}
                    {onCalendarPress && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionPill,
                                {
                                    backgroundColor: showCalendar ? theme.primary : (isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.1)'),
                                    opacity: pressed ? 0.7 : 1
                                }
                            ]}
                            onPress={onCalendarPress}
                        >
                            <Ionicons name="calendar-outline" size={16} color={showCalendar ? '#FFFFFF' : theme.text} />
                            <Text style={[styles.actionText, { color: showCalendar ? '#FFFFFF' : theme.text }]}>Calendar</Text>
                        </Pressable>
                    )}

                    {/* Scan Pill Button */}
                    {onScanPress && (
                        <Pressable
                            style={({ pressed }) => [
                                styles.actionPill,
                                {
                                    backgroundColor: theme.primary,
                                    opacity: pressed ? 0.8 : 1
                                }
                            ]}
                            onPress={onScanPress}
                        >
                            <Ionicons name="qr-code-outline" size={16} color="#FFFFFF" />
                            <Text style={styles.actionText}>Scan</Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: HEADER_HEIGHT,
        width: width,
        position: 'relative',
        marginBottom: 20,
        backgroundColor: 'transparent',
        marginLeft: -20, // Break out of EventsFeed padding
    },
    image: {
        ...StyleSheet.absoluteFillObject,
        width: width,
        height: HEADER_HEIGHT,
    },
    blurLayer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '55%', // Cover bottom half
    },
    gradient: {
        ...StyleSheet.absoluteFillObject,
        height: HEADER_HEIGHT,
    },
    contentContainer: {
        position: 'absolute',
        bottom: 0,
        left: 20,
        right: 20,
        zIndex: 10,
    },
    eyebrow: {
        fontSize: 15,
        fontWeight: '500',
        letterSpacing: 1,
        marginBottom: 0.1,
        opacity: 0.9,
    },
    title: {
        fontSize: 52,
        fontWeight: '500',
        letterSpacing: -1.5,
        lineHeight: 60,
        marginBottom: 10,
    },
    divider: {
        height: 0.8,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        opacity: 0.25,
        marginBottom: 10,
    },
    description: {
        fontSize: 15,
        lineHeight: 24,
        fontWeight: '400',
        maxWidth: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        gap: 8,
        marginTop: 12,
    },
    actionPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 14,
        paddingVertical: 8,
        borderRadius: 20,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#FFFFFF',
    },
});
