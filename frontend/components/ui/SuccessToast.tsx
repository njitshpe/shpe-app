import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Modal, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

import * as Haptics from 'expo-haptics';

interface SuccessToastProps {
    visible: boolean;
    message: string;
    onHide: () => void;
    duration?: number;
}

export function SuccessToast({ visible, message, onHide, duration = 2000 }: SuccessToastProps) {
    const { theme, isDark } = useTheme();
    const opacity = new Animated.Value(0);
    const scale = new Animated.Value(0.8);

    useEffect(() => {
        if (visible) {
            // Trigger Haptic Feedback
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

            Animated.parallel([
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }),
                Animated.spring(scale, {
                    toValue: 1,
                    friction: 5,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                hide();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const hide = () => {
        Animated.parallel([
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(scale, {
                toValue: 0.8,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onHide();
        });
    };

    if (!visible) return null;

    return (
        <Modal transparent visible={visible} animationType="none">
            <View style={styles.container}>
                <Animated.View style={[styles.toastContainer, { opacity, transform: [{ scale }] }]}>
                    <BlurView intensity={isDark ? 80 : 95} tint={isDark ? 'dark' : 'light'} style={styles.blur}>
                        <View style={styles.content}>
                            <View style={[styles.iconContainer, { backgroundColor: theme.primary }]}>
                                <Ionicons name="checkmark" size={32} color="#FFFFFF" />
                            </View>
                            <Text style={[styles.message, { color: theme.text }]}>{message}</Text>
                        </View>
                    </BlurView>
                </Animated.View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.2)',
    },
    toastContainer: {
        borderRadius: 20,
        overflow: 'hidden',
        width: 180,
        height: 180,
    },
    blur: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 20,
    },
    content: {
        alignItems: 'center',
        gap: 16,
    },
    iconContainer: {
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    message: {
        fontSize: 16,
        fontWeight: '600',
        textAlign: 'center',
    },
});
