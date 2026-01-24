import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useCommitteeEvents } from '@/hooks/events';
import { EventsFeed } from '@/components/events/EventsFeed';
import { useTheme } from '@/contexts/ThemeContext';
import type { CommitteeId } from '@/utils/committeeUtils';

interface CommitteeEventsFeedProps {
    committeeSlug: CommitteeId;
    ListHeaderComponent?: React.ReactElement;
}

export function CommitteeEventsFeed({
    committeeSlug,
    ListHeaderComponent,
}: CommitteeEventsFeedProps) {
    const { theme } = useTheme();
    const { events, isLoading, isRefreshing, error, refresh } = useCommitteeEvents(committeeSlug);

    if (isLoading) {
        return (
            <View style={styles.centerContainer}>
                {ListHeaderComponent}
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                    <Text style={[styles.loadingText, { color: theme.subtext }]}>
                        Loading events...
                    </Text>
                </View>
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                {ListHeaderComponent}
                <View style={styles.errorContainer}>
                    <Text style={[styles.errorText, { color: theme.text }]}>
                        {error}
                    </Text>
                </View>
            </View>
        );
    }

    return (
        <EventsFeed
            events={events}
            isRefreshing={isRefreshing}
            onRefresh={refresh}
            ListHeaderComponent={ListHeaderComponent}
            contentContainerStyle={styles.feedContent}
            bounces={true}
        />
    );
}

const styles = StyleSheet.create({
    centerContainer: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
    },
    loadingText: {
        marginTop: 12,
        fontSize: 14,
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 60,
        paddingHorizontal: 20,
    },
    errorText: {
        fontSize: 16,
        textAlign: 'center',
    },
    feedContent: {
        paddingTop: 0,
    },
});
