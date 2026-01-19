import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Text,
    Modal,
    Alert,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeed } from '@/hooks/feed';
import { deletePost } from '@/lib/feedService';
import { FeedCard, CommentList } from '@/components/feed';
import type { FeedPostUI } from '@/types/feed';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';
import { SPACING, RADIUS } from '@/constants/colors';

// Design System Constants
const DESIGN = {
    // Deep Void Background
    darkGradient: ['#1a1a1a', '#0d0d0d', '#000000'] as const,
    lightGradient: ['#FFFFFF', '#F8F8F8', '#F0F0F0'] as const,

    // Glass Effects
    glassBackground: 'rgba(255,255,255,0.03)',
    glassBorder: 'rgba(255,255,255,0.08)',

    // Platinum Accent
    platinum: '#E0E0E0',
    platinumGradient: ['#E0E0E0', '#A0A0A0'] as const,

    // Typography
    headerTracking: 4,
};

export default function FeedScreen() {
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const insets = useSafeAreaInsets();
    const { posts, isLoading, isRefreshing, error, hasMore, loadMore, refresh, removePost } = useFeed();
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    // Listen for refresh events (e.g. from creating a post)
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('feed:refresh', () => {
            refresh();
        });
        return () => {
            subscription.remove();
        };
    }, [refresh]);

    const handleCommentPress = useCallback((postId: string) => {
        setSelectedPostId(postId);
    }, []);

    const handleCloseComments = useCallback(() => {
        setSelectedPostId(null);
    }, []);

    const renderPost = useCallback(({ item, index }: { item: FeedPostUI; index: number }) => (
        <FeedCard
            post={item}
            index={index}
            onCommentPress={handleCommentPress}
            onEdit={(post) => router.push({ pathname: '/feed/create', params: { id: post.id } })}
            onDelete={async (postId) => {
                const result = await deletePost(postId);
                if (result.success) {
                    removePost(postId);
                } else {
                    Alert.alert('Error', result.error?.message || 'Failed to delete post');
                }
            }}
        />
    ), [handleCommentPress, router, removePost]);

    const renderHeader = () => (
        <View style={[styles.header, { paddingTop: insets.top + SPACING.sm }]}>
            {/* Glass background effect */}
            {isDark && (
                <View style={[StyleSheet.absoluteFill, styles.headerGlass]} />
            )}

            {/* Left spacer for balance */}
            <View style={styles.headerSide} />

            {/* Centered Title */}
            <View style={styles.headerCenter}>
                <Text style={[
                    styles.headerTitle,
                    { color: isDark ? '#FFFFFF' : theme.text }
                ]}>
                    COMMUNITY FEED
                </Text>
                <View style={styles.headerUnderline} />
            </View>

            {/* Create Button */}
            <View style={styles.headerSide}>
                <TouchableOpacity
                    style={[
                        styles.createButton,
                        isDark ? styles.createButtonDark : { backgroundColor: theme.primary }
                    ]}
                    onPress={() => router.push('/feed/create')}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="add"
                        size={22}
                        color={isDark ? '#FFFFFF' : '#FFFFFF'}
                    />
                </TouchableOpacity>
            </View>
        </View>
    );

    const renderEmptyState = () => (
        <View style={styles.emptyContainer}>
            <View style={[styles.emptyIconContainer, isDark && styles.emptyIconContainerDark]}>
                <Ionicons
                    name="chatbubbles-outline"
                    size={48}
                    color={isDark ? 'rgba(255,255,255,0.3)' : theme.subtext}
                />
            </View>
            <Text style={[styles.emptyTitle, { color: isDark ? '#FFFFFF' : theme.text }]}>
                No Posts Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: isDark ? 'rgba(255,255,255,0.5)' : theme.subtext }]}>
                Be the first to share something with the community
            </Text>
        </View>
    );

    const renderSkeleton = () => (
        <View style={styles.skeletonContainer}>
            <FeedSkeleton />
            <FeedSkeleton />
            <FeedSkeleton />
        </View>
    );

    if (isLoading && posts.length === 0) {
        return (
            <View style={styles.container}>
                <StatusBar style={isDark ? 'light' : 'dark'} translucent />
                <LinearGradient
                    colors={isDark ? DESIGN.darkGradient : DESIGN.lightGradient}
                    style={StyleSheet.absoluteFill}
                />
                {renderHeader()}
                {renderSkeleton()}
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <StatusBar style={isDark ? 'light' : 'dark'} translucent />

            {/* Deep Void Background Gradient */}
            <LinearGradient
                colors={isDark ? DESIGN.darkGradient : DESIGN.lightGradient}
                style={StyleSheet.absoluteFill}
            />

            {/* Glass Header */}
            {renderHeader()}

            {/* Error Banner */}
            {error ? (
                <View style={[
                    styles.errorBanner,
                    isDark && styles.errorBannerDark
                ]}>
                    <Ionicons name="alert-circle" size={18} color={theme.error} />
                    <Text style={[styles.errorText, { color: theme.error }]}>
                        {error}
                    </Text>
                </View>
            ) : null}

            {/* Feed List */}
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[
                    styles.listContent,
                    { paddingTop: insets.top + 80 },
                    posts.length === 0 && styles.listContentEmpty
                ]}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        tintColor={isDark ? DESIGN.platinum : theme.primary}
                        progressBackgroundColor={isDark ? '#1a1a1a' : '#FFFFFF'}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                ListEmptyComponent={renderEmptyState}
            />

            {/* Floating Action Button */}
            <TouchableOpacity
                style={[styles.fab, { bottom: insets.bottom + 90 }]}
                onPress={() => router.push('/feed/create')}
                activeOpacity={0.85}
            >
                <LinearGradient
                    colors={DESIGN.platinumGradient}
                    style={styles.fabGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                >
                    <Ionicons name="add" size={28} color="#000000" />
                </LinearGradient>
            </TouchableOpacity>

            {/* Comments Modal - Dark Theme */}
            <Modal
                visible={selectedPostId !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCloseComments}
            >
                <View style={[
                    styles.modalContainer,
                    { backgroundColor: isDark ? '#0a0a0a' : theme.background }
                ]}>
                    <SafeAreaView style={styles.modalSafeArea}>
                        {/* Modal Header */}
                        <View style={[
                            styles.modalHeader,
                            { borderBottomColor: isDark ? 'rgba(255,255,255,0.1)' : theme.border }
                        ]}>
                            <View style={styles.modalHeaderLeft}>
                                <Text style={[
                                    styles.modalTitle,
                                    { color: isDark ? '#FFFFFF' : theme.text }
                                ]}>
                                    Comments
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={handleCloseComments}
                                style={[
                                    styles.modalCloseButton,
                                    isDark && styles.modalCloseButtonDark
                                ]}
                            >
                                <Ionicons
                                    name="close"
                                    size={20}
                                    color={isDark ? '#FFFFFF' : theme.text}
                                />
                            </TouchableOpacity>
                        </View>

                        {/* Comment List */}
                        {selectedPostId && (
                            <CommentList
                                postId={selectedPostId}
                                currentUserId={user?.id}
                            />
                        )}
                    </SafeAreaView>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },

    // Header Styles
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingBottom: SPACING.md,
    },
    headerGlass: {
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
    },
    headerSide: {
        width: 44,
        alignItems: 'center',
    },
    headerCenter: {
        flex: 1,
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 13,
        fontWeight: '600',
        letterSpacing: DESIGN.headerTracking,
        textTransform: 'uppercase',
    },
    headerUnderline: {
        width: 40,
        height: 2,
        backgroundColor: DESIGN.platinum,
        marginTop: 6,
        borderRadius: 1,
    },
    createButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
    },
    createButtonDark: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.15)',
    },

    // List Styles
    listContent: {
        paddingHorizontal: SPACING.md,
        paddingBottom: 120,
    },
    listContentEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },
    separator: {
        height: SPACING.lg,
    },

    // Skeleton
    skeletonContainer: {
        paddingHorizontal: SPACING.md,
        paddingTop: 100,
        gap: SPACING.lg,
    },

    // Empty State
    emptyContainer: {
        alignItems: 'center',
        paddingHorizontal: SPACING.xl,
    },
    emptyIconContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: SPACING.lg,
    },
    emptyIconContainerDark: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: SPACING.sm,
    },
    emptySubtitle: {
        fontSize: 15,
        textAlign: 'center',
        lineHeight: 22,
    },

    // Error Banner
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        marginHorizontal: SPACING.md,
        marginTop: 100,
        padding: SPACING.md,
        borderRadius: RADIUS.md,
        backgroundColor: 'rgba(244, 67, 54, 0.1)',
        borderWidth: 1,
        borderColor: 'rgba(244, 67, 54, 0.2)',
    },
    errorBannerDark: {
        backgroundColor: 'rgba(255, 69, 58, 0.1)',
        borderColor: 'rgba(255, 69, 58, 0.2)',
    },
    errorText: {
        fontSize: 14,
        fontWeight: '500',
        flex: 1,
    },

    // FAB
    fab: {
        position: 'absolute',
        right: SPACING.lg,
        zIndex: 50,
    },
    fabGradient: {
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: DESIGN.platinum,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        elevation: 8,
    },

    // Modal Styles
    modalContainer: {
        flex: 1,
    },
    modalSafeArea: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: SPACING.lg,
        paddingVertical: SPACING.md,
        borderBottomWidth: 1,
    },
    modalHeaderLeft: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    modalCloseButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.05)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalCloseButtonDark: {
        backgroundColor: 'rgba(255,255,255,0.1)',
    },
});
