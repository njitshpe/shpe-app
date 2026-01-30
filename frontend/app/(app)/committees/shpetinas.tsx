import React from 'react';
import { View, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader, CommitteeEventsFeed, ViewMembersButton, JoinCommitteePrompt } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';
import { useCommitteeMembership } from '@/hooks/committees';

const COMMITTEE_SLUG = 'shpetinas';

export default function SHPEtinasScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo(COMMITTEE_SLUG);
    const { isApproved, isLoading, status, requestToJoin, cancelRequest } = useCommitteeMembership(COMMITTEE_SLUG);

    if (isLoading) {
        return (
            <View style={[styles.container, styles.centered, { backgroundColor: theme.background }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <ActivityIndicator size="large" color={committee.color} />
            </View>
        );
    }

    if (!isApproved) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                <StatusBar style={isDark ? 'light' : 'dark'} />
                <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false} bounces={true}>
                    <CommitteeHeroHeader committee={committee} />
                    <JoinCommitteePrompt
                        committee={committee}
                        status={status}
                        onRequestJoin={requestToJoin}
                        onCancelRequest={cancelRequest}
                    />
                </ScrollView>
            </View>
        );
    }

    const headerContent = (
        <>
            <CommitteeHeroHeader committee={committee} />
            <ViewMembersButton committeeSlug={COMMITTEE_SLUG} committeeTitle={committee.title} />
        </>
    );

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <CommitteeEventsFeed committeeSlug={COMMITTEE_SLUG} ListHeaderComponent={headerContent} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    centered: { justifyContent: 'center', alignItems: 'center' },
    scrollView: { flex: 1 },
});
