import { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import { fetchComments, createComment, deleteComment } from '../../lib/feedService';
import { useBlock } from '../../contexts/BlockContext';
import type { FeedCommentUI, CreateCommentRequest } from '../../types/feed';

export function useComments(postId: string) {
    const [comments, setComments] = useState<FeedCommentUI[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { blockedUserIds } = useBlock();

    const loadComments = async () => {
        setIsLoading(true);
        setError(null);

        const response = await fetchComments(postId);

        if (response.success && response.data) {
            setComments(response.data);
        } else {
            setError(response.error?.message || 'Failed to load comments');
        }
        setIsLoading(false);
    };

    const addComment = async (content: string): Promise<boolean> => {
        setIsCreating(true);

        const request: CreateCommentRequest = { postId, content };
        const response = await createComment(request);

        setIsCreating(false);

        if (response.success && response.data) {
            setComments((prev) => [...prev, response.data!]);
            return true;
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to add comment');
            return false;
        }
    };

    const removeComment = async (commentId: string): Promise<boolean> => {
        const response = await deleteComment(commentId);

        if (response.success) {
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            return true;
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to delete comment');
            return false;
        }
    };

    useEffect(() => {
        loadComments();
    }, [postId]);

    // Filter out comments from blocked users
    const filteredComments = useMemo(() => {
        return comments.filter(comment => !blockedUserIds.has(comment.userId));
    }, [comments, blockedUserIds]);

    return {
        comments: filteredComments,
        isLoading,
        isCreating,
        error,
        addComment,
        removeComment,
        refresh: loadComments,
    };
}
