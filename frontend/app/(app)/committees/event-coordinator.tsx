import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '@/contexts/ThemeContext';
import { CommitteeHeroHeader } from '@/components/committees';
import { getCommitteeInfo } from '@/utils/committeeUtils';

export default function EventCoordinatorScreen() {
    const { theme, isDark } = useTheme();
    const committee = getCommitteeInfo('event-coordinator');

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            <StatusBar style={isDark ? 'light' : 'dark'} />
            <ScrollView
                style={styles.scrollView}
                showsVerticalScrollIndicator={false}
                bounces={true}
            >
                <CommitteeHeroHeader committee={committee} />
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        flex: 1,
    },
});
