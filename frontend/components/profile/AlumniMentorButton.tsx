import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

interface AlumniMentorButtonProps {
    value: boolean;
    onValueChange: (value: boolean) => void;
}

export function AlumniMentorButton({ value, onValueChange }: AlumniMentorButtonProps) {
    const { theme, isDark } = useTheme();

    const glassBackground = isDark
        ? 'rgba(255,255,255,0.05)'
        : 'rgba(0,0,0,0.03)';

    const borderColor = isDark
        ? 'rgba(255,255,255,0.1)'
        : 'rgba(0,0,0,0.08)';

    const handleValueChange = (newValue: boolean) => {
        Haptics.selectionAsync();
        onValueChange(newValue);
    };

    return (
        <View style={[styles.container, { backgroundColor: glassBackground, borderColor }]}>
            <View style={styles.textContainer}>
                <Text style={[styles.title, { color: theme.text }]}>Mentorship</Text>
                <Text style={[styles.subtitle, { color: theme.text }]}>
                    Available for coffee chats
                </Text>
            </View>
            <Switch
                value={value}
                onValueChange={handleValueChange}
                trackColor={{ false: isDark ? '#39393D' : '#E9E9EA', true: '#34C759' }}
                thumbColor="#FFFFFF"
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: 16,
        borderWidth: 1,
        padding: 16,
    },
    textContainer: {
        flex: 1,
        marginRight: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: '700',
    },
    subtitle: {
        fontSize: 14,
        opacity: 0.6,
        marginTop: 2,
    },
});
