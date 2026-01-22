import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
    Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { reportService, adminService, type Report } from '@/services';
import { supabase } from '@/lib/supabase';
import { fetchPostById } from '@/lib/feedService';
import type { FeedPostUI } from '@/types/feed';

export default function ReportDetailScreen() {
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { theme, isDark } = useTheme();
    const [report, setReport] = useState<Report | null>(null);
    const [post, setPost] = useState<FeedPostUI | null>(null);
    const [reportedUser, setReportedUser] = useState<{ name: string; email?: string | null; avatarUrl?: string | null } | null>(null);
    const [reportedComment, setReportedComment] = useState<{ author: string; content: string; createdAt: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null);

    // Check if user is super admin
    useEffect(() => {
        const checkSuperAdmin = async () => {
            const result = await adminService.isCurrentUserSuperAdmin();
            setIsSuperAdmin(result.data || false);
        };
        checkSuperAdmin();
    }, []);

    const loadTargetDetails = async (reportData: Report, cancelledRef: { cancelled: boolean }) => {
        if (reportData.target_type === 'post') {
            const { data: postRow } = await supabase
                .from('feed_posts_visible')
                .select('id, user_id, content, image_urls, created_at')
                .eq('id', reportData.target_id)
                .single();

            if (!cancelledRef.cancelled && postRow) {
                const { data: author } = await supabase
                    .from('user_profiles')
                    .select('id, first_name, last_name, profile_picture_url')
                    .eq('id', postRow.user_id)
                    .single();

                const postPreview: FeedPostUI = {
                    id: postRow.id,
                    userId: postRow.user_id,
                    content: postRow.content || '',
                    imageUrls: postRow.image_urls || [],
                    eventId: null,
                    createdAt: postRow.created_at,
                    updatedAt: postRow.created_at,
                    author: {
                        id: postRow.user_id,
                        firstName: author?.first_name || 'Unknown',
                        lastName: author?.last_name || 'User',
                        profilePictureUrl: author?.profile_picture_url || undefined,
                    },
                    likeCount: 0,
                    commentCount: 0,
                    isLikedByCurrentUser: false,
                    taggedUsers: [],
                };

                setPost(postPreview);
            }
        } else if (reportData.target_type === 'user') {
            const { data: userProfile } = await supabase
                .from('user_profiles')
                .select('first_name, last_name, profile_picture_url')
                .eq('id', reportData.target_id)
                .single();

            if (!cancelledRef.cancelled && userProfile) {
                setReportedUser({
                    name: `${userProfile.first_name} ${userProfile.last_name}`.trim() || 'Unknown User',
                    avatarUrl: userProfile.profile_picture_url || null,
                });
            }
        } else if (reportData.target_type === 'comment') {
            const { data: comment } = await supabase
                .from('feed_comments')
                .select('content, created_at, author:user_profiles!user_id(first_name, last_name)')
                .eq('id', reportData.target_id)
                .eq('is_active', true)
                .single();

            if (!cancelledRef.cancelled && comment) {
                const authorName = comment.author
                    ? `${comment.author.first_name} ${comment.author.last_name}`.trim()
                    : 'Unknown Author';
                setReportedComment({
                    author: authorName || 'Unknown Author',
                    content: comment.content || '',
                    createdAt: comment.created_at,
                });
            }
        }
    };

    // Load report and post details with proper access control
    useEffect(() => {
        let cancelled = false;
        const cancelledRef = { cancelled };

        async function init() {
            // Wait for super admin check to complete
            if (isSuperAdmin === null) return;

            // Check for missing ID
            if (!id) {
                if (!cancelled) {
                    setLoading(false);
                    Alert.alert('Error', 'Report ID is missing', [
                        { text: 'OK', onPress: () => router.replace('/(app)/admin/moderation') }
                    ]);
                }
                return;
            }

            // Check for unauthorized access
            if (!isSuperAdmin) {
                if (!cancelled) {
                    setLoading(false);
                    Alert.alert(
                        'Access Denied',
                        'Only super admins can access the moderation console',
                        [{ text: 'OK', onPress: () => router.replace('/(app)/admin') }]
                    );
                }
                return;
            }

            // Fetch report data
            try {
                const reportResponse = await reportService.fetchReportById(id);

                if (cancelled) return;

                if (!reportResponse.success) {
                    setLoading(false);
                    Alert.alert('Error', reportResponse.error?.message || 'Failed to load report', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                    return;
                }

                setReport(reportResponse.data);
                await loadTargetDetails(reportResponse.data, cancelledRef);
            } catch (error) {
                if (!cancelled) {
                    setLoading(false);
                    Alert.alert('Error', 'An unexpected error occurred', [
                        { text: 'OK', onPress: () => router.back() }
                    ]);
                }
                return;
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        init();

        return () => {
            cancelled = true;
            cancelledRef.cancelled = true;
        };
    }, [id, isSuperAdmin]);

    const handleRetryPreview = async () => {
        if (!report) return;
        setActionLoading(true);
        setPost(null);
        setReportedUser(null);
        setReportedComment(null);
        await loadTargetDetails(report, { cancelled: false });
        setActionLoading(false);
    };

    const handleHidePostAndMarkActioned = async () => {
        if (!report || !post) return;

        Alert.alert(
            'Confirm Action',
            'This will hide the post and mark the report as actioned. This action cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Confirm',
                    style: 'destructive',
                    onPress: async () => {
                        setActionLoading(true);

                        // Hide the post
                        const hideResponse = await reportService.hideReportedPost(post.id);
                        if (!hideResponse.success) {
                            Alert.alert('Error', hideResponse.error?.message || 'Failed to hide post');
                            setActionLoading(false);
                            return;
                        }

                        // Mark report as actioned
                        const updateResponse = await reportService.updateReportStatus(report.id, 'actioned');
                        if (!updateResponse.success) {
                            Alert.alert('Error', updateResponse.error?.message || 'Failed to update report');
                            setActionLoading(false);
                            return;
                        }

                        setActionLoading(false);
                        Alert.alert('Success', 'Post hidden and report marked as actioned', [
                            { text: 'OK', onPress: () => router.back() }
                        ]);
                    },
                },
            ]
        );
    };

    const handleUpdateStatus = async (status: 'reviewing' | 'actioned' | 'closed') => {
        if (!report) return;
        setActionLoading(true);
        const updateResponse = await reportService.updateReportStatus(report.id, status);
        setActionLoading(false);
        if (!updateResponse.success) {
            Alert.alert('Error', updateResponse.error?.message || 'Failed to update report');
            return;
        }
        setReport((prev) => (prev ? { ...prev, status } : prev));
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getStatusColor = (status: string) => {
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

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        card: { backgroundColor: theme.card },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        button: { backgroundColor: theme.error },
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
                <View style={styles.centerContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!report) {
        return (
            <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
                <View style={styles.centerContainer}>
                    <Text style={dynamicStyles.text}>Report not found</Text>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.title, dynamicStyles.text]}>Report Details</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView style={styles.content}>
                {/* Report Info Card */}
                <View style={[styles.card, dynamicStyles.card]}>
                    <View style={styles.cardHeader}>
                        <Text style={[styles.cardTitle, dynamicStyles.text]}>Report Information</Text>
                        <View
                            style={[
                                styles.statusBadge,
                                { backgroundColor: getStatusColor(report.status) + '20', borderColor: getStatusColor(report.status) }
                            ]}
                        >
                            <Text style={[styles.statusText, { color: getStatusColor(report.status) }]}>
                                {report.status.toUpperCase()}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons
                            name={report.target_type === 'post' ? 'document-text' : 'person'}
                            size={20}
                            color={theme.subtext}
                        />
                        <Text style={[styles.infoLabel, dynamicStyles.subtext]}>Target Type:</Text>
                        <Text style={[styles.infoValue, dynamicStyles.text]}>{report.target_type}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="alert-circle" size={20} color={theme.subtext} />
                        <Text style={[styles.infoLabel, dynamicStyles.subtext]}>Reason:</Text>
                        <Text style={[styles.infoValue, dynamicStyles.text]}>{report.reason}</Text>
                    </View>

                    {report.details && (
                        <View style={styles.detailsSection}>
                            <Text style={[styles.detailsLabel, dynamicStyles.subtext]}>Details:</Text>
                            <Text style={[styles.detailsText, dynamicStyles.text]}>{report.details}</Text>
                        </View>
                    )}

                    <View style={styles.infoRow}>
                        <Ionicons name="calendar" size={20} color={theme.subtext} />
                        <Text style={[styles.infoLabel, dynamicStyles.subtext]}>Reported:</Text>
                        <Text style={[styles.infoValue, dynamicStyles.text]}>{formatDate(report.created_at)}</Text>
                    </View>

                    <View style={styles.infoRow}>
                        <Ionicons name="code" size={20} color={theme.subtext} />
                        <Text style={[styles.infoLabel, dynamicStyles.subtext]}>Target ID:</Text>
                        <Text style={[styles.idValue, dynamicStyles.text]}>{report.target_id.slice(0, 12)}...</Text>
                    </View>
                </View>

                {/* Preview Card */}
                {report.target_type === 'post' && (
                    <View style={[styles.card, dynamicStyles.card]}>
                        <Text style={[styles.cardTitle, dynamicStyles.text]}>Post Preview</Text>

                        {post ? (
                            <>
                                <View style={styles.postHeader}>
                                    <View style={styles.authorInfo}>
                                        {post.author.profilePictureUrl ? (
                                            <Image
                                                source={{ uri: post.author.profilePictureUrl }}
                                                style={styles.avatar}
                                            />
                                        ) : (
                                            <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '30' }]}>
                                                <Ionicons name="person" size={20} color={theme.primary} />
                                            </View>
                                        )}
                                        <View>
                                            <Text style={[styles.authorName, dynamicStyles.text]}>
                                                {post.author.firstName} {post.author.lastName}
                                            </Text>
                                            <Text style={[styles.postDate, dynamicStyles.subtext]}>
                                                {formatDate(post.createdAt)}
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                                <Text style={[styles.postContent, dynamicStyles.text]}>{post.content}</Text>

                                {post.imageUrls && post.imageUrls.length > 0 && (
                                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesContainer}>
                                        {post.imageUrls.map((url, index) => (
                                            <Image
                                                key={index}
                                                source={{ uri: url }}
                                                style={styles.postImage}
                                                resizeMode="cover"
                                            />
                                        ))}
                                    </ScrollView>
                                )}

                                <View style={styles.postStats}>
                                    <View style={styles.statItem}>
                                        <Ionicons name="heart" size={16} color={theme.subtext} />
                                        <Text style={[styles.statText, dynamicStyles.subtext]}>{post.likeCount}</Text>
                                    </View>
                                    <View style={styles.statItem}>
                                        <Ionicons name="chatbubble" size={16} color={theme.subtext} />
                                        <Text style={[styles.statText, dynamicStyles.subtext]}>{post.commentCount}</Text>
                                    </View>
                                </View>
                            </>
                        ) : (
                            <View style={styles.previewFallback}>
                                <Text style={[styles.previewFallbackText, dynamicStyles.subtext]}>
                                    Unable to load post preview for this report.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { borderColor: theme.primary }]}
                                    onPress={handleRetryPreview}
                                    disabled={actionLoading}
                                >
                                    <Text style={[styles.retryButtonText, { color: theme.primary }]}>Retry Preview</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {report.target_type === 'user' && (
                    <View style={[styles.card, dynamicStyles.card]}>
                        <Text style={[styles.cardTitle, dynamicStyles.text]}>Profile Preview</Text>
                        {reportedUser ? (
                            <View style={styles.postHeader}>
                                <View style={styles.authorInfo}>
                                    {reportedUser.avatarUrl ? (
                                        <Image source={{ uri: reportedUser.avatarUrl }} style={styles.avatar} />
                                    ) : (
                                        <View style={[styles.avatarPlaceholder, { backgroundColor: theme.primary + '30' }]}>
                                            <Ionicons name="person" size={20} color={theme.primary} />
                                        </View>
                                    )}
                                    <View>
                                        <Text style={[styles.authorName, dynamicStyles.text]}>{reportedUser.name}</Text>
                                    </View>
                                </View>
                            </View>
                        ) : (
                            <View style={styles.previewFallback}>
                                <Text style={[styles.previewFallbackText, dynamicStyles.subtext]}>
                                    Unable to load user profile preview for this report.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { borderColor: theme.primary }]}
                                    onPress={handleRetryPreview}
                                    disabled={actionLoading}
                                >
                                    <Text style={[styles.retryButtonText, { color: theme.primary }]}>Retry Preview</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {report.target_type === 'comment' && (
                    <View style={[styles.card, dynamicStyles.card]}>
                        <Text style={[styles.cardTitle, dynamicStyles.text]}>Comment Preview</Text>
                        {reportedComment ? (
                            <>
                                <View style={styles.postHeader}>
                                    <View>
                                        <Text style={[styles.authorName, dynamicStyles.text]}>{reportedComment.author}</Text>
                                        <Text style={[styles.postDate, dynamicStyles.subtext]}>
                                            {formatDate(reportedComment.createdAt)}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={[styles.postContent, dynamicStyles.text]}>{reportedComment.content}</Text>
                            </>
                        ) : (
                            <View style={styles.previewFallback}>
                                <Text style={[styles.previewFallbackText, dynamicStyles.subtext]}>
                                    Unable to load comment preview for this report.
                                </Text>
                                <TouchableOpacity
                                    style={[styles.retryButton, { borderColor: theme.primary }]}
                                    onPress={handleRetryPreview}
                                    disabled={actionLoading}
                                >
                                    <Text style={[styles.retryButtonText, { color: theme.primary }]}>Retry Preview</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>
                )}

                {/* Action Button */}
                {report.target_type === 'post' && post && report.status !== 'actioned' && (
                    <TouchableOpacity
                        style={[styles.actionButton, dynamicStyles.button, actionLoading && styles.buttonDisabled]}
                        onPress={handleHidePostAndMarkActioned}
                        disabled={actionLoading}
                    >
                        {actionLoading ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="eye-off" size={20} color="#fff" />
                                <Text style={styles.actionButtonText}>Hide Post + Mark Actioned</Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}

                {/* Status Actions */}
                <View style={styles.statusActions}>
                    <TouchableOpacity
                        style={[styles.statusButton, { borderColor: theme.primary }]}
                        onPress={() => handleUpdateStatus('reviewing')}
                        disabled={actionLoading || report.status === 'reviewing'}
                    >
                        <Text style={[styles.statusButtonText, { color: theme.primary }]}>Mark Reviewing</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={[styles.statusButton, { borderColor: theme.success }]}
                        onPress={() => handleUpdateStatus('actioned')}
                        disabled={actionLoading || report.status === 'actioned'}
                    >
                        <Text style={[styles.statusButtonText, { color: theme.success }]}>Mark Actioned</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
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
    content: {
        flex: 1,
        padding: 20,
    },
    card: {
        padding: 16,
        borderRadius: 12,
        marginBottom: 16,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '700',
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
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    infoLabel: {
        fontSize: 14,
        fontWeight: '600',
    },
    infoValue: {
        fontSize: 14,
        flex: 1,
    },
    idValue: {
        fontSize: 12,
        fontFamily: 'monospace',
        flex: 1,
    },
    detailsSection: {
        marginBottom: 12,
    },
    detailsLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 6,
    },
    detailsText: {
        fontSize: 14,
        lineHeight: 20,
    },
    postHeader: {
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
    },
    postDate: {
        fontSize: 12,
        marginTop: 2,
    },
    postContent: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 12,
    },
    imagesContainer: {
        marginBottom: 12,
    },
    postImage: {
        width: 200,
        height: 200,
        borderRadius: 8,
        marginRight: 8,
    },
    postStats: {
        flexDirection: 'row',
        gap: 16,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(128, 128, 128, 0.2)',
    },
    previewFallback: {
        gap: 12,
        alignItems: 'flex-start',
    },
    previewFallbackText: {
        fontSize: 14,
        lineHeight: 20,
    },
    retryButton: {
        paddingVertical: 8,
        paddingHorizontal: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    retryButtonText: {
        fontSize: 13,
        fontWeight: '600',
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 14,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    actionButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '700',
    },
    statusActions: {
        gap: 12,
        marginBottom: 20,
    },
    statusButton: {
        paddingVertical: 12,
        borderRadius: 10,
        borderWidth: 1,
        alignItems: 'center',
    },
    statusButtonText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
