import { useState, useEffect, useCallback } from 'react';
import { fetchFeedPosts } from '../../lib/feedService';
import type { FeedPostUI } from '../../types/feed';

export function useFeed() {
    const [posts, setPosts] = useState<FeedPostUI[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        const response = await fetchFeedPosts(pageNum, 20);

        if (response.success && response.data) {
            const newPosts = response.data;

            if (newPosts.length < 20) {
                setHasMore(false);
            }

            if (append) {
                setPosts((prev) => [...prev, ...newPosts]);
            } else {
                setPosts(newPosts);
            }
        } else if (response.error) {
            setError(response.error.message);
        }

        setIsLoading(false);
    }, [isLoading]);

    const loadMore = useCallback(async () => {
        if (!hasMore || isLoading) return;

        const nextPage = page + 1;
        setPage(nextPage);
        await loadPosts(nextPage, true);
    }, [page, hasMore, isLoading, loadPosts]);

    const refresh = useCallback(async () => {
        setIsRefreshing(true);
        setPage(0);
        setHasMore(true);
        await loadPosts(0, false);
        setIsRefreshing(false);
    }, [loadPosts]);

    useEffect(() => {
        loadPosts(0, false);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        posts,
        isLoading,
        isRefreshing,
        error,
        hasMore,
        loadMore,
        refresh,
    };
}
