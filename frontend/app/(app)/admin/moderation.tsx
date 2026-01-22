import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useEvents } from '@/contexts/EventsContext';
import { supabase } from '@/lib/supabase';
import { reportService, adminService, type Report, type ReportStatus } from '@/services';

export default function ModerationScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { isCurrentUserAdmin } = useEvents();
    const [reports, setReports] = useState<Report[]>([]);
    const [targetSummaries, setTargetSummaries] = useState<Record<string, { title: string; subtitle?: string }>>({});
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

    // Check if user is super admin
    useEffect(() => {
        const checkSuperAdmin = async () => {
            const result = await adminService.isCurrentUserSuperAdmin();
            setIsSuperAdmin(result.data || false);
        };
        checkSuperAdmin();
    }, []);

    // Redirect if not super admin (immediate redirect)
    useEffect(() => {
        if (isSuperAdmin === false) {
            setLoading(false);
            Alert.alert(
                'Access Denied',
                'Only super admins can access the moderation console',
                [{ text: 'OK', onPress: () => router.replace('/(app)/admin') }]
            );
        }
    }, [isSuperAdmin]);

    // Load reports
    const loadReports = useCallback(async () => {
        if (!isSuperAdmin) return;

        const response = await reportService.fetchReports(
            filter === 'all' ? undefined : filter
        );

        if (response.success) {
            setReports(response.data);
            await loadTargetSummaries(response.data);
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to load reports');
        }
        setLoading(false);
        setRefreshing(false);
    }, [isSuperAdmin, filter, loadTargetSummaries]);

    const loadTargetSummaries = useCallback(async (items: Report[]) => {
        const userIds = items.filter((r) => r.target_type === 'user').map((r) => r.target_id);
        const postIds = items.filter((r) => r.target_type === 'post').map((r) => r.target_id);
        const commentIds = items.filter((r) => r.target_type === 'comment').map((r) => r.target_id);

        const [usersResponse, postsResponse, commentsResponse] = await Promise.all([
            userIds.length > 0
                ? supabase.from('user_profiles').select('id, first_name, last_name, email').in('id', userIds)
                : Promise.resolve({ data: [] }),
            postIds.length > 0
                ? supabase
                      .from('feed_posts')
                      .select('id, content, author:user_profiles!user_id(first_name, last_name)')
                      .in('id', postIds)
                : Promise.resolve({ data: [] }),
            commentIds.length > 0
                ? supabase
                      .from('feed_comments')
                      .select('id, content, author:user_profiles!user_id(first_name, last_name)')
                      .in('id', commentIds)
                : Promise.resolve({ data: [] }),
        ]);

        const summaries: Record<string, { title: string; subtitle?: string }> = {};

        (usersResponse.data || []).forEach((user: any) => {
            const name = [user.first_name, user.last_name].filter(Boolean).join(' ') || user.email || 'Unknown User';
            summaries[`user:${user.id}`] = { title: name, subtitle: user.email || undefined };
        });

        (postsResponse.data || []).forEach((post: any) => {
            const author = post.author ? `${post.author.first_name} ${post.author.last_name}` : 'Unknown Author';
            summaries[`post:${post.id}`] = {
                title: `Post by ${author}`,
                subtitle: post.content ? post.content.slice(0, 120) : 'No content',
            };
        });

        (commentsResponse.data || []).forEach((comment: any) => {
            const author = comment.author ? `${comment.author.first_name} ${comment.author.last_name}` : 'Unknown Author';
            summaries[`comment:${comment.id}`] = {
                title: `Comment by ${author}`,
                subtitle: comment.content ? comment.content.slice(0, 120) : 'No content',
            };
        });

        setTargetSummaries(summaries);
    }, []);

    // Load reports when filter changes
    useEffect(() => {
        if (isSuperAdmin) {
            loadReports();
        }
    }, [isSuperAdmin, filter]);

    // Auto-refresh on focus (after returning from detail view)
    useFocusEffect(
        useCallback(() => {
            if (isSuperAdmin) {
                loadReports();
            }
        }, [isSuperAdmin, loadReports])
    );

    const handleRefresh = () => {
        setRefreshing(true);
        loadReports();
    };


    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        card: { backgroundColor: theme.card },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        button: { backgroundColor: theme.primary },
    };

    if (!isCurrentUserAdmin) {
        return null;
    }

    const getStatusColor = (status: ReportStatus) => {
        switch (status) {
            case 'open':
                return theme.error;
            case 'reviewing':
                return '#FFA500';
            case 'actioned':
                return theme.success;
            case 'closed':
                return theme.subtext;
            default:
                return theme.text;
        }
    };

    const getStatusBadgeStyle = (status: ReportStatus) => ({
        backgroundColor: getStatusColor(status) + '20',
        borderColor: getStatusColor(status),
    });

    const getStatusTextStyle = (status: ReportStatus) => ({
        color: getStatusColor(status),
    });

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, dynamicStyles.text]}>Moderation</Text>
                <View style={{ width: 24 }} />
            </View>

            {/* Filter Tabs */}
            <View style={styles.filterContainer}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {['all', 'open', 'reviewing', 'actioned', 'closed'].map((f) => (
                        <TouchableOpacity
                            key={f}
                            style={[
                                styles.filterTab,
                                filter === f && { backgroundColor: theme.primary },
                            ]}
                            onPress={() => setFilter(f as ReportStatus | 'all')}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    filter === f ? { color: '#fff' } : dynamicStyles.text,
                                ]}
                            >
                                {f.charAt(0).toUpperCase() + f.slice(1)}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Reports List */}
            {loading ? (
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={handleRefresh}
                            tintColor={theme.primary}
                        />
                    }
                >
                    {reports.length === 0 ? (
                        <View style={styles.emptyContainer}>
                            <Ionicons name="checkmark-circle-outline" size={64} color={theme.subtext} />
                            <Text style={[styles.emptyText, dynamicStyles.subtext]}>
                                No reports found
                            </Text>
                        </View>
                    ) : (
                        reports.map((report) => (
                            <TouchableOpacity
                                key={report.id}
                                style={[styles.reportCard, dynamicStyles.card]}
                                onPress={() => router.push(`/admin/report/${report.id}`)}
                                activeOpacity={0.7}
                            >
                                {/* Header Row */}
                                <View style={styles.reportHeader}>
                                    <View style={[styles.statusBadge, getStatusBadgeStyle(report.status)]}>
                                        <Text style={[styles.statusText, getStatusTextStyle(report.status)]}>
                                            {report.status.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.targetBadge}>
                                        <Ionicons
                                            name={
                                                report.target_type === 'post'
                                                    ? 'document-text'
                                                    : report.target_type === 'comment'
                                                        ? 'chatbubble-ellipses'
                                                        : 'person'
                                            }
                                            size={14}
                                            color={theme.subtext}
                                        />
                                        <Text style={[styles.targetText, dynamicStyles.subtext]}>
                                            {report.target_type}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={theme.subtext} style={styles.chevron} />
                                </View>

                                {/* Report Details */}
                                <View style={styles.reportContent}>
                                    <Text style={[styles.reasonText, dynamicStyles.text]}>
                                        Reason: {report.reason}
                                    </Text>
                                    {report.details && (
                                        <Text style={[styles.detailsText, dynamicStyles.subtext]} numberOfLines={2}>
                                            {report.details}
                                        </Text>
                                    )}
                                    <Text style={[styles.idText, dynamicStyles.subtext]}>
                                        Target ID: {report.target_id.slice(0, 8)}...
                                    </Text>
                                    <Text style={[styles.dateText, dynamicStyles.subtext]}>
                                        {formatDate(report.created_at)}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
    },
    filterContainer: {
        paddingHorizontal: 20,
        paddingBottom: 12,
    },
    filterTab: {
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 20,
        marginRight: 8,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
    },
    content: {
        flex: 1,
        padding: 20,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 60,
    },
    emptyText: {
        fontSize: 16,
        marginTop: 16,
    },
    reportCard: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    reportHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
        gap: 8,
    },
    chevron: {
        marginLeft: 'auto',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        borderWidth: 1,
    },
    statusText: {
        fontSize: 11,
        fontWeight: '700',
    },
    targetBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    targetText: {
        fontSize: 12,
        textTransform: 'capitalize',
    },
    reportContent: {
        gap: 6,
        marginBottom: 12,
    },
    targetSummaryTitle: {
        fontSize: 14,
        fontWeight: '600',
        marginTop: 6,
    },
    targetSummaryText: {
        fontSize: 13,
        marginTop: 4,
    },
    reasonText: {
        fontSize: 15,
        fontWeight: '600',
    },
    detailsText: {
        fontSize: 14,
        lineHeight: 20,
    },
    idText: {
        fontSize: 12,
        fontFamily: 'monospace',
    },
    dateText: {
        fontSize: 12,
        marginTop: 4,
    },
});
