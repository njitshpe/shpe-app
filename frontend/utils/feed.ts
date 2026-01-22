import type { FeedPostDB, FeedPostUI, FeedCommentDB, FeedCommentUI } from '../types/feed';
import { resolveProfilePictureUrl } from './profilePicture';

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
            profilePictureUrl: resolveProfilePictureUrl(db.author?.profile_picture_url),
            tier: db.author?.tier || db.author_tier || undefined,
        },
        likeCount: db.like_count || 0,
        commentCount: db.comment_count || 0,
        isLikedByCurrentUser: db.is_liked_by_current_user || false,
        taggedUsers: [],
        event: db.event ? {
            id: db.event.id,
            publicId: db.event.event_id,
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
        parentId: db.parent_id || null,
        content: db.content,
        createdAt: db.created_at,
        updatedAt: db.updated_at,
        author: {
            id: db.author?.id || db.user_id,
            firstName: db.author?.first_name || '',
            lastName: db.author?.last_name || '',
            profilePictureUrl: resolveProfilePictureUrl(db.author?.profile_picture_url),
        },
        replies: [], // Initialize replies
    };
}

// Banned words list (case-insensitive, ASCII only)
export const BANNED_WORDS: string[] = [
    // ======================
    // PROFANITY
    // ======================
    "fuck", "fucker", "motherfucker", "shit", "bullshit", "bitch", "asshole", "bastard", "cunt",
    "dick", "cock", "pussy", "slut", "whore", "twat", "prick", "jackass", "dumbass", "dipshit", "hell", "arse", "bloody",

    // ======================
    // COMMON BYPASSES
    // ======================
    "f*ck", "f**k", "fucc", "fuk", "phuck", "sh1t", "5hit", "b1tch", "biatch", "a$$", "azz",
    "d1ck", "dik", "pu$$y", "cnt", "wh0re", "slvt",

    // ======================
    // SEXUAL / NSFW
    // ======================
    "sex", "porn", "porno", "nude", "nudes", "nsfw", "blowjob", "handjob", "cum", "orgasm",
    "boobs", "tits", "ass", "anal", "vagina", "penis", "erection", "masturbate", "milf", "fetish",
    "threesome", "softcore", "stripper", "hooker", "onlyfans",
    "camgirl", "deepthroat", "creampie", "bdsm", "hentai", "dildo",

    // ======================
    // HARASSMENT / BULLYING
    // ======================
    "retard", "idiot", "moron", "loser", "worthless",
    "pathetic", "clown", "weirdo", "creep", "pervert",

    "kill yourself", "kys", "go die", "nobody likes you", "hate you", "kill you",

    // ======================
    // HATE / SLURS
    // ======================
    "nigger", "nigga", "faggot", "fag", "tranny", "chink", "spic", "kike", "wetback", "coon",
    "raghead", "towelhead", "gypsy", "cripple", "mongoloid",

    "nazi", "hitler", "white power", "kkk", "neo nazi", "terrorist",

    // ======================
    // VIOLENCE / THREATS
    // ======================
    "murder", "rape", "shoot", "stab", "suicide", "die", "dead", "massacre",
    "assault", "kidnap", "behead", "genocide", "slaughter",
    "school shooting", "mass shooting", "bomb threat", "i will kill you",

    // ======================
    // DRUGS / ILLEGAL
    // ======================
    "cocaine", "heroin", "meth", "weed", "marijuana", "lsd", "ecstasy", "mdma", "fentanyl",
    "opioid", "overdose", "dealer", "drug dealer", "xanax", "adderall", "percocet",
    "oxycontin", "codeine", "shrooms",

    // ======================
    // SPAM / SCAMS
    // ======================
    "crypto", "bitcoin giveaway", "guaranteed profit", "onlyfans link",
    "cashapp", "venmo me", "paypal me", "telegram",
];

/**
 * Checks if content contains banned words or phrases
 */
export function containsBannedWords(content: string): boolean {
    const normalized = content
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\s+/g, " ");

    return BANNED_WORDS.some(word => normalized.includes(word));
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
    if (containsBannedWords(content)) {
        return "That content isn't allowed.";
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
    if (containsBannedWords(content)) {
        return "That content isn't allowed.";
    }
    return null;
}

/**
 * Validates image file for upload
 * @param uri - The image URI
 * @param fileSize - File size in bytes (if available)
 * @returns Error message if invalid, null if valid
 */
export function validateImageUpload(uri: string, fileSize?: number): string | null {
    // Check file extension
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'heic'];
    const extension = uri.toLowerCase().split('.').pop();

    if (!extension || !allowedExtensions.includes(extension)) {
        return 'Only JPG, JPEG, PNG, and HEIC images are allowed.';
    }

    // Check file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB in bytes
    if (fileSize && fileSize > MAX_SIZE) {
        return 'Image size must be less than 5MB.';
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
