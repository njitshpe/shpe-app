import type { FeedPostDB, FeedPostUI, FeedCommentDB, FeedCommentUI } from '../types/feed';

/**
 * Maps a feed post from database schema (snake_case) to UI schema (camelCase)
 */
export function mapFeedPostDBToUI(db: any): FeedPostUI {
    return {
        id: db.id,
        userId: db.user_id,
        content: db.content,
        imageUrls: db.image_urls || [],
        eventId: db.event_id,
        createdAt: db.created_at,
        updatedAt: db.updated_at,

        // Joined data
        author: {
            id: db.author?.id || db.user_id,
            firstName: db.author?.first_name || '',
            lastName: db.author?.last_name || '',
            profilePictureUrl: db.author?.profile_picture_url,
        },
        likeCount: db.like_count || 0,
        commentCount: db.comment_count || 0,
        isLikedByCurrentUser: db.is_liked_by_current_user || false,
        taggedUsers: [],
        event: db.event ? {
            id: db.event.id,
            name: db.event.name,
        } : undefined,
    };
}

/**
 * Maps a feed comment from database schema to UI schema
 */
export function mapFeedCommentDBToUI(db: any): FeedCommentUI {
    return {
        id: db.id,
        postId: db.post_id,
        userId: db.user_id,
        content: db.content,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        author: {
            id: db.author?.id || db.user_id,
            firstName: db.author?.first_name || '',
            lastName: db.author?.last_name || '',
            profilePictureUrl: db.author?.profile_picture_url,
        },
    };
}

/**
 * Validates post content
 */
export function validatePostContent(content: string): string | null {
    if (!content.trim()) {
        return 'Post content cannot be empty';
    }
    if (content.length > 5000) {
        return 'Post content is too long (maximum 5000 characters)';
    }
    return null;
}

/**
 * Validates comment content
 */
export function validateCommentContent(content: string): string | null {
    if (!content.trim()) {
        return 'Comment cannot be empty';
    }
    if (content.length > 1000) {
        return 'Comment is too long (maximum 1000 characters)';
    }
    return null;
}

/**
 * Formats a relative time string (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours}h ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
        return `${diffInDays}d ago`;
    }

    const diffInWeeks = Math.floor(diffInDays / 7);
    if (diffInWeeks < 4) {
        return `${diffInWeeks}w ago`;
    }

    // For older posts, show the actual date
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
