import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useEvents } from '@/contexts/EventsContext';
import { reportService, adminService, type Report, type ReportStatus } from '@/services';

export default function ModerationScreen() {
    const router = useRouter();
    const { theme, isDark } = useTheme();
    const { isCurrentUserAdmin } = useEvents();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [filter, setFilter] = useState<ReportStatus | 'all'>('all');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    // Check if user is super admin
    useEffect(() => {
        const checkSuperAdmin = async () => {
            const result = await adminService.isCurrentUserSuperAdmin();
            setIsSuperAdmin(result.data || false);
        };
        checkSuperAdmin();
    }, []);

    // Redirect if not super admin
    useEffect(() => {
        if (!loading && !isSuperAdmin) {
            Alert.alert(
                'Access Denied',
                'Only super admins can access the moderation console',
                [{ text: 'OK', onPress: () => router.back() }]
            );
        }
    }, [isSuperAdmin, loading]);

    // Load reports
    const loadReports = async () => {
        const response = await reportService.fetchReports(
            filter === 'all' ? undefined : filter
        );

        if (response.success) {
            setReports(response.data);
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to load reports');
        }
        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        if (isSuperAdmin) {
            loadReports();
        }
    }, [isSuperAdmin, filter]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadReports();
    };

    const handleUpdateStatus = async (reportId: string, status: ReportStatus) => {
        const response = await reportService.updateReportStatus(reportId, status);

        if (response.success) {
            Alert.alert('Success', `Report marked as ${status}`);
            loadReports(); // Reload to get fresh data
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to update status');
        }
    };

    const handleHidePost = async (reportId: string, postId: string) => {
        Alert.alert(
            'Confirm',
            'Are you sure you want to hide this post? This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Hide Post',
                    style: 'destructive',
                    onPress: async () => {
                        const hideResponse = await reportService.hideReportedPost(postId);

                        if (hideResponse.success) {
                            // Also mark report as actioned
                            await reportService.updateReportStatus(reportId, 'actioned');
                            Alert.alert('Success', 'Post has been hidden');
                            loadReports();
                        } else {
                            Alert.alert('Error', hideResponse.error?.message || 'Failed to hide post');
                        }
                    },
                },
            ]
        );
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
                            <View key={report.id} style={[styles.reportCard, dynamicStyles.card]}>
                                {/* Header Row */}
                                <View style={styles.reportHeader}>
                                    <View style={[styles.statusBadge, getStatusBadgeStyle(report.status)]}>
                                        <Text style={[styles.statusText, getStatusTextStyle(report.status)]}>
                                            {report.status.toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.targetBadge}>
                                        <Ionicons
                                            name={report.target_type === 'post' ? 'document-text' : 'person'}
                                            size={14}
                                            color={theme.subtext}
                                        />
                                        <Text style={[styles.targetText, dynamicStyles.subtext]}>
                                            {report.target_type}
                                        </Text>
                                    </View>
                                </View>

                                {/* Report Details */}
                                <View style={styles.reportContent}>
                                    <Text style={[styles.reasonText, dynamicStyles.text]}>
                                        Reason: {report.reason}
                                    </Text>
                                    {report.details && (
                                        <Text style={[styles.detailsText, dynamicStyles.subtext]}>
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

                                {/* Actions */}
                                <View style={styles.actionsContainer}>
                                    {report.status === 'open' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: '#FFA500' }]}
                                            onPress={() => handleUpdateStatus(report.id, 'reviewing')}
                                        >
                                            <Ionicons name="eye-outline" size={16} color="#fff" />
                                            <Text style={styles.actionButtonText}>Mark Reviewing</Text>
                                        </TouchableOpacity>
                                    )}

                                    {(report.status === 'open' || report.status === 'reviewing') && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: theme.subtext }]}
                                            onPress={() => handleUpdateStatus(report.id, 'closed')}
                                        >
                                            <Ionicons name="close-circle-outline" size={16} color="#fff" />
                                            <Text style={styles.actionButtonText}>Mark Closed</Text>
                                        </TouchableOpacity>
                                    )}

                                    {report.target_type === 'post' && report.status !== 'actioned' && (
                                        <TouchableOpacity
                                            style={[styles.actionButton, { backgroundColor: theme.error }]}
                                            onPress={() => handleHidePost(report.id, report.target_id)}
                                        >
                                            <Ionicons name="eye-off-outline" size={16} color="#fff" />
                                            <Text style={styles.actionButtonText}>Hide Post</Text>
                                        </TouchableOpacity>
                                    )}
                                </View>
                            </View>
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
    actionsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '600',
    },
});
