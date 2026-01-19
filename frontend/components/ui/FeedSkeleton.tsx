import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';
import { SPACING, RADIUS } from '@/constants/colors';

// Design System Constants (matching FeedCard)
const DESIGN = {
    cardBackground: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.1)',
    cardBorderRadius: 20,
    lightCardBackground: 'rgba(255,255,255,0.95)',
    lightCardBorder: 'rgba(0,0,0,0.08)',
};

export function FeedSkeleton() {
    const { theme, isDark } = useTheme();

    return (
        <View style={[
            styles.container,
            isDark ? styles.containerDark : styles.containerLight,
        ]}>
            {/* Header: Avatar + Name + Timestamp */}
            <View style={styles.header}>
                <View style={[
                    styles.avatarSkeleton,
                    isDark && styles.avatarSkeletonDark
                ]}>
                    <Skeleton width={44} height={44} borderRadius={22} />
                </View>
                <View style={styles.headerText}>
                    <Skeleton
                        width={140}
                        height={14}
                        borderRadius={4}
                    />
                    <Skeleton
                        width={80}
                        height={10}
                        borderRadius={4}
                        style={{ marginTop: 6 }}
                    />
                </View>
                {/* Options button skeleton */}
                <Skeleton
                    width={32}
                    height={32}
                    borderRadius={16}
                />
            </View>

            {/* Event Tag Skeleton */}
            <Skeleton
                width={120}
                height={28}
                borderRadius={RADIUS.full}
                style={{ marginBottom: SPACING.sm }}
            />

            {/* Content: Text lines */}
            <View style={styles.content}>
                <Skeleton
                    width="100%"
                    height={14}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                />
                <Skeleton
                    width="85%"
                    height={14}
                    borderRadius={4}
                    style={{ marginBottom: 8 }}
                />
                <Skeleton
                    width="60%"
                    height={14}
                    borderRadius={4}
                />
            </View>

            {/* Image placeholder - Hero style */}
            <Skeleton
                width="100%"
                height={280}
                borderRadius={RADIUS.lg}
                style={{ marginBottom: SPACING.sm }}
            />

            {/* Footer: Action buttons */}
            <View style={[
                styles.footer,
                { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }
            ]}>
                <View style={styles.actionSkeleton}>
                    <Skeleton width={22} height={22} borderRadius={4} />
                    <Skeleton width={24} height={14} borderRadius={4} />
                </View>
                <View style={styles.actionSkeleton}>
                    <Skeleton width={20} height={20} borderRadius={4} />
                    <Skeleton width={24} height={14} borderRadius={4} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: DESIGN.cardBorderRadius,
        padding: SPACING.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    containerDark: {
        backgroundColor: DESIGN.cardBackground,
        borderColor: DESIGN.cardBorder,
    },
    containerLight: {
        backgroundColor: DESIGN.lightCardBackground,
        borderColor: DESIGN.lightCardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    avatarSkeleton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        borderWidth: 1.5,
        borderColor: 'rgba(255,255,255,0.2)',
        overflow: 'hidden',
    },
    avatarSkeletonDark: {
        borderColor: 'rgba(255,255,255,0.15)',
    },
    headerText: {
        marginLeft: SPACING.sm,
        flex: 1,
    },
    content: {
        marginBottom: SPACING.sm,
    },
    footer: {
        flexDirection: 'row',
        gap: SPACING.xl,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        marginTop: SPACING.xs,
    },
    actionSkeleton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
});
