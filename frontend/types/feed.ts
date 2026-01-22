// Database schema types (snake_case, matches Supabase)
export interface FeedPostDB {
    id: string;
    user_id: string;
    content: string;
    image_urls: string[];
    event_id: string | null;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface FeedLikeDB {
    id: string;
    post_id: string;
    user_id: string;
    created_at: string;
}

export interface FeedCommentDB {
    id: string;
    post_id: string;
    user_id: string;
    parent_id: string | null;
    content: string;
    created_at: string;
    updated_at: string;
    is_active: boolean;
}

export interface FeedPostTagDB {
    id: string;
    post_id: string;
    tagged_user_id: string;
    created_at: string;
}

// UI schema types (camelCase, optimized for React Native components)
export interface FeedPostUI {
    id: string;
    userId: string;
    content: string;
    imageUrls: string[];
    eventId: string | null;
    createdAt: string;
    updatedAt: string;

    // Joined data from queries
    author: {
        id: string;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
        tier?: string; // Rank tier: 'unranked', 'bronze', 'silver', 'gold'
    };
    likeCount: number;
    commentCount: number;
    isLikedByCurrentUser: boolean;
    taggedUsers: Array<{
        id: string;
        firstName: string;
        lastName: string;
    }>;
    event?: {
        id: string;
        publicId?: string;
        name: string;
    };
}

export interface FeedCommentUI {
    id: string;
    postId: string;
    userId: string;
    parentId: string | null;
    content: string;
    createdAt: string;
    updatedAt: string;
    author: {
        id: string;
        firstName: string;
        lastName: string;
        profilePictureUrl?: string;
    };
    replies?: FeedCommentUI[]; // For UI tree structure
}

// API request/response types
export interface CreatePostRequest {
    content: string;
    imageUris: string[];
    eventId?: string;
    taggedUserIds?: string[];
}

export interface CreateCommentRequest {
    postId: string;
    content: string;
    parentId?: string;
}

export interface LikePostRequest {
    postId: string;
}
