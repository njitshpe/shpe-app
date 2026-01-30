import { useState } from 'react';
import { likePost, unlikePost } from '../../lib/feedService';

export function useLikes(postId: string, initialIsLiked: boolean, initialCount: number) {
    const [isLiked, setIsLiked] = useState(initialIsLiked);
    const [likeCount, setLikeCount] = useState(initialCount);
    const [isLoading, setIsLoading] = useState(false);

    const toggleLike = async () => {
        if (isLoading) return;

        // Optimistic update
        const previousIsLiked = isLiked;
        const previousCount = likeCount;

        setIsLiked(!isLiked);
        setLikeCount((prev) => (isLiked ? prev - 1 : prev + 1));
        setIsLoading(true);

        try {
            const response = isLiked
                ? await unlikePost(postId)
                : await likePost(postId);

            if (!response.success) {
                // Rollback on error
                setIsLiked(previousIsLiked);
                setLikeCount(previousCount);
            }
        } catch (error) {
            // Rollback on error
            setIsLiked(previousIsLiked);
            setLikeCount(previousCount);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLiked,
        likeCount,
        toggleLike,
        isLoading,
    };
}
