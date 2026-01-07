import { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import { fetchComments, createComment, deleteComment } from '../../lib/feedService';
import type { FeedCommentUI, CreateCommentRequest } from '../../types/feed';

export function useComments(postId: string) {
    const [comments, setComments] = useState<FeedCommentUI[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    return {
        comments,
        isLoading,
        isCreating,
        error,
        addComment,
        removeComment,
        refresh: loadComments,
    };
}
