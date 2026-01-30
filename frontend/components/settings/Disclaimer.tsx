import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

import { INDEPENDENCE_DISCLAIMER_POINTS } from '@/constants/legal';

export const Disclaimer = () => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            <Text style={[styles.title, { color: theme.subtext }]}>DISCLAIMER</Text>
            <View style={styles.content}>
                {INDEPENDENCE_DISCLAIMER_POINTS.map((point, index) => (
                    <Text key={index} style={[styles.text, { color: theme.subtext }]}>
                        {point}
                    </Text>
                ))}
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
