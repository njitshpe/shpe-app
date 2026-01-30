import React, { useState } from 'react';
import { View, StyleSheet, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { Skeleton } from './Skeleton';
import { useTheme } from '@/contexts/ThemeContext';

export function FeedSkeleton() {
    const { isDark } = useTheme();
    const { width: screenWidth } = useWindowDimensions();
    const [cardWidth, setCardWidth] = useState<number | null>(null);
    const resolvedWidth = cardWidth ?? screenWidth;
    const imageHeight = Math.max(resolvedWidth, 1);

    const cardBackground = isDark ? '#000000' : '#FFFFFF';
    const dividerColor = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

    const handleLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        if (width && width !== cardWidth) {
            setCardWidth(width);
        }
    };

    return (
        <View
            style={[styles.container, { backgroundColor: cardBackground, borderBottomColor: dividerColor }]}
            onLayout={handleLayout}
        >
            <View style={[styles.header, styles.sectionPadding]}>
                <Skeleton width={36} height={36} borderRadius={18} />
                <View style={styles.headerText}>
                    <Skeleton width={120} height={12} borderRadius={4} />
                    <Skeleton width={80} height={10} borderRadius={4} style={{ marginTop: 6 }} />
                </View>
                <Skeleton width={24} height={24} borderRadius={12} />
            </View>
            <Skeleton width="100%" height={imageHeight} borderRadius={0} />
            <View style={[styles.actions, styles.sectionPadding]}>
                <Skeleton width={22} height={22} borderRadius={6} />
                <Skeleton width={20} height={20} borderRadius={6} />
            </View>
            <View style={[styles.caption, styles.sectionPadding]}>
                <Skeleton width="90%" height={12} borderRadius={4} style={{ marginBottom: 6 }} />
                <Skeleton width="70%" height={12} borderRadius={4} />
                <Skeleton width="40%" height={10} borderRadius={4} style={{ marginTop: 8 }} />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sectionPadding: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingTop: 12,
        paddingBottom: 8,
    },
    headerText: {
        flex: 1,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingTop: 12,
    },
    caption: {
        paddingTop: 8,
        paddingBottom: 12,
    },
});
