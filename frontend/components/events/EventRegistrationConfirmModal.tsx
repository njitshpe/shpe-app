
import React, { useEffect, useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    Pressable,
    Animated,
    Dimensions,
    Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { formatDateHeader, formatTime } from '@/utils';
import { Event } from '@/types/events';

interface EventRegistrationConfirmModalProps {
    visible: boolean;
    event: Event;
    onConfirm: () => void;
    onClose: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventRegistrationConfirmModal({
    visible,
    event,
    onConfirm,
    onClose,
}: EventRegistrationConfirmModalProps) {
    const { theme, isDark } = useTheme();
    const slideAnim = React.useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.spring(slideAnim, {
                toValue: 1,
                tension: 50,
                friction: 8,
                useNativeDriver: true,
            }).start();
        } else {
            Animated.timing(slideAnim, {
                toValue: 0,
                duration: 250,
                useNativeDriver: true,
            }).start();
        }
    }, [visible, slideAnim]);

    if (!visible) return null;

    return (
        <Modal
            visible={visible}
            transparent
            animationType="none"
            onRequestClose={onClose}
            statusBarTranslucent
        >
            <BlurView
                intensity={30}
                tint={isDark ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
            >
                <Pressable style={styles.backdrop} onPress={onClose}>
                    <Animated.View
                        style={[
                            styles.modalContainer,
                            {
                                transform: [
                                    {
                                        translateY: slideAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [600, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        {/* The Modal Card */}
                        <Pressable
                            style={[
                                styles.card,
                                { backgroundColor: isDark ? 'rgba(30,30,30,0.2)' : 'rgba(255,255,255,0.25)' }
                            ]}
                            onPress={(e) => e.stopPropagation()}
                        >
                            <BlurView
                                intensity={80}
                                tint={isDark ? "dark" : "light"}
                                style={StyleSheet.absoluteFill}
                            />

                            <View style={styles.cardContent}>
                                {/* Close Button */}
                                <Pressable
                                    style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                                    onPress={onClose}
                                >
                                    <Ionicons name="close" size={20} color={theme.subtext} />
                                </Pressable>

                                {/* Poster Image */}
                                <View style={styles.imageContainer}>
                                    {event.coverImageUrl ? (
                                        <Image source={event.coverImageUrl} style={styles.poster} contentFit="cover" transition={200} />
                                    ) : (
                                        <View style={[styles.placeholderPoster, { backgroundColor: theme.primary }]}>
                                            <Ionicons name="calendar" size={48} color="#fff" />
                                        </View>
                                    )}
                                </View>

                                {/* Event Title */}
                                <Text style={[styles.title, { color: theme.text }]} numberOfLines={2}>
                                    {event.title}
                                </Text>

                                {/* Date/Time */}
                                <Text style={[styles.timeText, { color: theme.subtext }]}>
                                    {formatDateHeader(event.startTimeISO)}, {formatTime(event.startTimeISO)}
                                </Text>

                                {/* Confirm Button */}
                                <Pressable
                                    style={[styles.confirmButton, { backgroundColor: theme.text }]} // Inverted for contrast
                                    onPress={onConfirm}
                                >
                                    <Text style={[styles.confirmButtonText, { color: theme.background }]}>
                                        Confirm Registration
                                    </Text>
                                </Pressable>
                            </View>
                        </Pressable>
                    </Animated.View>
                </Pressable>
            </BlurView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    backdrop: {
        flex: 1,
        justifyContent: 'center', // Center vertically
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.3)',
    },
    modalContainer: {
        width: '100%',
        paddingHorizontal: 20,
        alignItems: 'center',
    },
    card: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 32,
        overflow: 'hidden', // Required for blur to stay inside
    },
    cardContent: {
        width: '100%',
        alignItems: 'center',
        padding: 24,
        zIndex: 1, // Ensure content sits above the absolute filled blur
    },
    closeButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10,
    },
    imageContainer: {
        width: 140,
        height: 140,
        borderRadius: 24,
        marginBottom: 20,
        marginTop: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 12,
        elevation: 6,
    },
    poster: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        resizeMode: 'cover',
    },
    placeholderPoster: {
        width: '100%',
        height: '100%',
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        textAlign: 'center',
        marginBottom: 8,
        lineHeight: 28,
    },
    timeText: {
        fontSize: 16,
        fontWeight: '500',
        marginBottom: 32,
    },
    confirmButton: {
        width: '100%',
        paddingVertical: 18,
        borderRadius: 100, // Full pill shape
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonText: {
        fontSize: 16,
        fontWeight: '700',
        letterSpacing: -0.2,
    },
});
