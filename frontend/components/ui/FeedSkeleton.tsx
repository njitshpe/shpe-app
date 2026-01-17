import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export function FeedSkeleton() {
    const { theme, isDark } = useTheme();
    const cardBg = isDark ? '#1E1E1E' : '#FFFFFF';
    const borderColor = theme.border;

    return (
        <View style={[styles.container, { backgroundColor: cardBg, borderColor }]}>
            {/* Header: Avatar + Name */}
            <View style={styles.header}>
                <Skeleton width={40} height={40} borderRadius={20} />
                <View style={styles.headerText}>
                    <Skeleton width={120} height={16} borderRadius={4} />
                    <Skeleton width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
                </View>
            </View>

            {/* Content: Title + Image */}
            <View style={styles.content}>
                <Skeleton width="80%" height={20} borderRadius={4} style={{ marginBottom: 12 }} />
                <Skeleton width="100%" height={200} borderRadius={12} />
            </View>

            {/* Footer: Actions */}
            <View style={styles.footer}>
                <Skeleton width={60} height={24} borderRadius={4} />
                <Skeleton width={60} height={24} borderRadius={4} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        padding: 16,
        borderBottomWidth: 1,
        marginBottom: 8,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    headerText: {
        marginLeft: 12,
    },
    content: {
        marginBottom: 12,
    },
    footer: {
        flexDirection: 'row',
        gap: 16,
    },
});
