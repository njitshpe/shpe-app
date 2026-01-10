import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export const Disclaimer = () => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.subtext }]}>DISCLAIMER</Text>
            <View style={styles.content}>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We are not affiliated with, endorsed by, or sponsored by the Society of Hispanic Professional Engineers (SHPE) or any of its chapters.
                </Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We are not affiliated with any political party or movement.
                </Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We are not affiliated with any other organization.
                </Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    We are an independent entity that fully abides by the values and policies of The New Jersey Institute of Technology (NJIT).
                </Text>
                <Text style={[styles.text, { color: theme.subtext }]}>
                    Use of the term "SHPE" in the app name or branding is for descriptive and community reference purposes and does not imply official connection with the SHPE organization.
                </Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
        marginBottom: 20,
    },
    title: {
        fontSize: 12,
        fontWeight: '600',
        marginBottom: 8,
        textTransform: 'uppercase',
    },
    content: {
        gap: 8,
    },
    text: {
        fontSize: 12,
        lineHeight: 16,
        textAlign: 'justify',
    },
});
