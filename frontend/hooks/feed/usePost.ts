import { useState } from 'react';
import { Alert } from 'react-native';
import { createPost, deletePost, updatePost } from '../../lib/feedService';
import type { CreatePostRequest, FeedPostUI } from '../../types/feed';

export function usePost() {
    const [isCreating, setIsCreating] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const create = async (request: CreatePostRequest): Promise<FeedPostUI | null> => {
        setIsCreating(true);

        const response = await createPost(request);

        setIsCreating(false);

        if (response.success && response.data) {
            return response.data;
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to create post');
            return null;
        }
    };

    const remove = async (postId: string): Promise<boolean> => {
        setIsDeleting(true);

        const response = await deletePost(postId);

        setIsDeleting(false);

        if (response.success) {
            return true;
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to delete post');
            return false;
        }
    };

    const update = async (postId: string, content: string, imageUris: string[], eventId?: string): Promise<FeedPostUI | null> => {
        setIsCreating(true); // Reuse creating state for loading

        const response = await updatePost(postId, content, imageUris, eventId);

        setIsCreating(false);

        if (response.success && response.data) {
            return response.data;
        } else {
            Alert.alert('Error', response.error?.message || 'Failed to update post');
            return null;
        }
    };

    return {
        create,
        remove,
        update,
        isCreating,
        isDeleting,
    };
}
