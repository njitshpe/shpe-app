import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export interface LegalSection {
    title: string;
    content: string;
    bullets?: string[];
}

interface LegalTextDisplayProps {
    sections: LegalSection[];
}

export const LegalTextDisplay: React.FC<LegalTextDisplayProps> = ({ sections }) => {
    const { theme } = useTheme();

    return (
        <View style={styles.container}>
            {sections.map((section, index) => (
                <View key={index} style={styles.section}>
                    <Text style={[styles.title, { color: theme.text }]}>
                        {section.title}
                    </Text>
                    <Text style={[styles.content, { color: theme.subtext }]}>
                        {section.content}
                    </Text>
                    {section.bullets && (
                        <View style={styles.bulletList}>
                            {section.bullets.map((bullet, checkIndex) => (
                                <View key={checkIndex} style={styles.bulletItem}>
                                    <Text style={[styles.bulletPoint, { color: theme.subtext }]}>•</Text>
                                    <Text style={[styles.bulletText, { color: theme.subtext }]}>
                                        {bullet}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>
            ))}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        paddingBottom: 20,
    },
    section: {
        marginBottom: 20,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 8,
    },
    content: {
        fontSize: 14,
        lineHeight: 20,
    },
    bulletList: {
        marginTop: 8,
        gap: 8,
    },
    bulletItem: {
        flexDirection: 'row',
        gap: 8,
        paddingLeft: 4,
    },
    bulletPoint: {
        fontSize: 14,
        lineHeight: 20,
    },
    bulletText: {
        flex: 1,
        fontSize: 14,
        lineHeight: 20,
    },
});
