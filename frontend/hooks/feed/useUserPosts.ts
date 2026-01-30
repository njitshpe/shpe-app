import { useState, useEffect, useCallback } from 'react';
import { fetchUserPosts } from '../../lib/feedService';
import type { FeedPostUI } from '../../types/feed';

export function useUserPosts(userId: string) {
    const [posts, setPosts] = useState<FeedPostUI[]>([]);
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadPosts = useCallback(async (pageNum: number, append: boolean = false) => {
        if (isLoading) return;

        setIsLoading(true);
        setError(null);

        const response = await fetchUserPosts(userId, pageNum, 10);

        if (response.success && response.data) {
            const newPosts = response.data;

            if (newPosts.length < 10) {
                setHasMore(false);
            }

            if (append) {
                setPosts((prev) => [...prev, ...newPosts]);
            } else {
                setPosts(newPosts);
            }
        } else {
            setError(response.error?.message || 'Failed to load posts');
        }

        setIsLoading(false);
    }, [userId, isLoading]);

    const loadMore = useCallback(async () => {
        if (!hasMore || isLoading) return;

        const nextPage = page + 1;
        setPage(nextPage);
        await loadPosts(nextPage, true);
    }, [page, hasMore, isLoading, loadPosts]);

    useEffect(() => {
        loadPosts(0, false);
    }, [userId]);

    return {
        posts,
        isLoading,
        error,
        hasMore,
        loadMore,
    };
}
