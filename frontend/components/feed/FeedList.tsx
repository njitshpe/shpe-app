import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import { FeedCard } from './FeedCard';
import type { FeedPostUI } from '@/types/feed';
import { mapFeedPostDBToUI } from '@/utils/feed';
import { fetchFeedPosts, likePost, unlikePost, deletePost } from '@/lib/feedService';
import { useAuth } from '@/contexts/AuthContext';

interface FeedListProps {
    userId?: string;
    eventId?: string;
    scrollEnabled?: boolean;
    header?: React.ReactElement;
    onScroll?: (event: any) => void;
}

export function FeedList({ userId, eventId, scrollEnabled = true, header, onScroll }: FeedListProps) {
    const { theme } = useTheme();
    const { user } = useAuth();
    const [posts, setPosts] = useState<FeedPostUI[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const loadPosts = async (params: { refresh?: boolean; newPage?: number } = {}) => {
        const isRefresh = params.refresh ?? false;
        const targetPage = params.newPage ?? (isRefresh ? 0 : page);

        if (isRefresh) setLoading(true);

        const { data, error } = await fetchFeedPosts(targetPage, 20, userId, eventId);

        if (!error && data) {
            if (isRefresh) {
                setPosts(data);
                setHasMore(data.length === 20);
            } else {
                setPosts(prev => [...prev, ...data]);
                setHasMore(data.length === 20);
            }
            setPage(targetPage + 1);
        }

        setLoading(false);
        setRefreshing(false);
    };

    useEffect(() => {
        loadPosts({ refresh: true });
    }, [userId, eventId]);

    const handleRefresh = () => {
        setRefreshing(true);
        loadPosts({ refresh: true });
    };

    const handleLoadMore = () => {
        if (!loading && hasMore) {
            loadPosts();
        }
    };

    // Optimistic updates
    const handleLike = async (postId: string) => {
        // Optimistically update UI
        setPosts(prev => prev.map(p => {
            if (p.id === postId) {
                return {
                    ...p,
                    isLikedByCurrentUser: !p.isLikedByCurrentUser,
                    likeCount: p.isLikedByCurrentUser ? p.likeCount - 1 : p.likeCount + 1
                };
            }
            return p;
        }));

        // Actual API call
        const post = posts.find(p => p.id === postId);
        if (post) {
            if (post.isLikedByCurrentUser) {
                await unlikePost(postId);
            } else {
                await likePost(postId);
            }
        }
    };

    const handleDelete = async (postId: string) => {
        const { success } = await deletePost(postId);
        if (success) {
            setPosts(prev => prev.filter(p => p.id !== postId));
        }
    };

    if (loading && page === 0) {
        return (
            <View style={[styles.loadingContainer]}>
                <ActivityIndicator color={theme.primary} />
            </View>
        );
    }

    if (!loading && posts.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Text style={{ color: theme.subtext }}>No posts found.</Text>
            </View>
        );
    }

    return (
        <FlatList
            data={posts}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
                <FeedCard
                    post={item}
                    onLike={() => handleLike(item.id)}
                    onDelete={() => handleDelete(item.id)}
                />
            )}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={scrollEnabled}
            onScroll={onScroll}
            ListHeaderComponent={header}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={theme.primary} />
            }
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            // Optimization properties
            removeClippedSubviews={true}
            initialNumToRender={5}
            maxToRenderPerBatch={5}
            windowSize={5}
        />
    );
}

const styles = StyleSheet.create({
    loadingContainer: {
        padding: 20,
        alignItems: 'center',
    },
    emptyContainer: {
        padding: 40,
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 40,
    },
});
