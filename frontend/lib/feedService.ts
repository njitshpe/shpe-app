import { supabase } from './supabase';
import type { FeedPostUI, FeedCommentUI, CreatePostRequest, CreateCommentRequest } from '../types/feed';
import { PhotoHelper } from '../services/photo.service';
import * as FileSystem from 'expo-file-system';

import type { ServiceResponse } from '../types/errors';
import { createError, mapSupabaseError } from '../types/errors';
import { mapFeedPostDBToUI, mapFeedCommentDBToUI, validatePostContent, validateCommentContent, validateImageUpload } from '../utils/feed';
import { checkPostRateLimit, recordPostCreation } from '../utils/rateLimiter';

/**
 * Compute current season_id (Spring = Jan-May, Summer = Jun-Aug, Fall = Sep-Dec)
 */
function getCurrentSeasonId(date: Date = new Date()): string {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // 1-indexed

    let season: string;
    if (month >= 1 && month <= 5) {
        season = 'Spring';
    } else if (month >= 6 && month <= 8) {
        season = 'Summer';
    } else {
        season = 'Fall';
    }
    return `${season}_${year}`;
}

export interface AnnouncementPost {
    id: string;
    title?: string | null;
    content: string;
    createdAt: string;
}

export async function fetchAnnouncementPosts(
    limit: number = 20
): Promise<ServiceResponse<AnnouncementPost[]>> {
    try {
        const { data, error } = await supabase
            .from('feed_posts')
            .select('id, title, content, created_at, is_announcement, is_active')
            .eq('is_announcement', true)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(limit);

        if (error) {
            return { success: false, error: mapSupabaseError(error) };
        }

        const announcements = (data ?? []).map((row) => ({
            id: row.id,
            title: (row as any).title ?? null,
            content: row.content,
            createdAt: row.created_at,
        }));

        return { success: true, data: announcements };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'Failed to fetch announcements',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}

export async function fetchLatestAnnouncement(): Promise<ServiceResponse<AnnouncementPost | null>> {
    try {
        const { data, error } = await supabase
            .from('feed_posts')
            .select('id, title, content, created_at, is_announcement, is_active')
            .eq('is_announcement', true)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            return { success: false, error: mapSupabaseError(error) };
        }

        if (!data) {
            return { success: true, data: null };
        }

        return {
            success: true,
            data: {
                id: data.id,
                title: (data as any).title ?? null,
                content: data.content,
                createdAt: data.created_at,
            },
        };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'Failed to fetch latest announcement',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}

/**
 * Fetches a single post by ID
 */
export async function fetchPostById(postId: string): Promise<ServiceResponse<FeedPostUI>> {
    try {
        const currentUser = (await supabase.auth.getUser()).data.user;

        const { data, error } = await supabase
            .from('feed_posts')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        event:events(id, event_id, name)
      `)
            .eq('id', postId)
            .single();

        if (error) {
            return {
                success: false,
                error: createError('Failed to fetch post', 'DATABASE_ERROR', undefined, error.message)
            };
        }

        if (!data) {
            return {
                success: false,
                error: createError('Post not found', 'NOT_FOUND'),
            };
        }

        // Get like count
        const { count: likeCount } = await supabase
            .from('feed_likes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId);

        // Get comment count
        const { count: commentCount } = await supabase
            .from('feed_comments')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
            .eq('is_active', true);

        // Check if current user liked
        let isLiked = false;
        if (currentUser) {
            const { data: likeData } = await supabase
                .from('feed_likes')
                .select('id')
                .eq('post_id', postId)
                .eq('user_id', currentUser.id)
                .maybeSingle();
            isLiked = !!likeData;
        }

        const postWithCounts = {
            ...data,
            like_count: likeCount || 0,
            comment_count: commentCount || 0,
            is_liked_by_current_user: isLiked,
        };

        const post = mapFeedPostDBToUI(postWithCounts);

        return { success: true, data: post };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'Failed to fetch post',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}

/**
 * Fetches feed posts with pagination (chronological order)
 */
export async function fetchFeedPosts(
    page: number = 0,
    limit: number = 20,
    userId?: string,
    eventId?: string // Added eventId param
): Promise<ServiceResponse<FeedPostUI[]>> {
    try {
        const currentUser = (await supabase.auth.getUser()).data.user;

        let query = supabase
            .from('feed_posts_visible')
            .select('*')
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (userId) {
            query = query.eq('user_id', userId);
        }

        if (eventId) {
            query = query.eq('event_id', eventId);
        }

        const { data, error } = await query;

        if (error) {
            return { success: false, error: mapSupabaseError(error) };
        }

        const rows = data ?? [];

        // Fetch joined data in separate queries because PostgREST cannot reliably infer
        // relationships from a view (e.g. feed_posts_visible).
        const userIds = Array.from(
            new Set(rows.map((row: any) => row.user_id).filter(Boolean))
        ) as string[];

        const authorsById = new Map<string, any>();
        if (userIds.length > 0) {
            const { data: authors, error: authorsError } = await supabase
                .from('user_profiles')
                .select('id, first_name, last_name, profile_picture_url')
                .in('id', userIds);
            if (!authorsError) {
                (authors ?? []).forEach((author: any) => authorsById.set(author.id, author));
            } else if (__DEV__) {
                console.warn('[Feed] Failed to fetch authors:', authorsError);
            }

            // Fetch author tiers from points_balances
            const currentSeasonId = getCurrentSeasonId();
            const { data: balances, error: balancesError } = await supabase
                .from('points_balances')
                .select('user_id, points_total')
                .in('user_id', userIds)
                .eq('season_id', currentSeasonId);

            if (!balancesError && balances) {
                // Fetch tier thresholds
                const { data: tiers } = await supabase
                    .from('rank_tiers')
                    .select('tier, min_points')
                    .order('min_points', { ascending: true });

                // Compute tier for each author
                balances.forEach((balance: any) => {
                    const author = authorsById.get(balance.user_id);
                    if (author && tiers) {
                        let tier = 'unranked';
                        for (const t of tiers) {
                            if (t.min_points <= balance.points_total) {
                                tier = t.tier;
                            } else {
                                break;
                            }
                        }
                        author.tier = tier;
                    }
                });
            } else if (__DEV__ && balancesError) {
                console.warn('[Feed] Failed to fetch author tiers:', balancesError);
            }
        }

        const rawEventIds = Array.from(
            new Set(rows.map((row: any) => row.event_id).filter(Boolean))
        ) as string[];
        const eventsByKey = new Map<string, any>();
        if (rawEventIds.length > 0) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const eventUuidIds = rawEventIds.filter((v) => uuidRegex.test(v));
            const eventPublicIds = rawEventIds.filter((v) => !uuidRegex.test(v));

            if (eventUuidIds.length > 0) {
                const { data: eventsByUuid, error: eventsByUuidError } = await supabase
                    .from('events')
                    .select('id, event_id, name')
                    .in('id', eventUuidIds);
                if (__DEV__ && eventsByUuidError) {
                    console.warn('[Feed] Failed to fetch events by id:', eventsByUuidError);
                }
                (eventsByUuid ?? []).forEach((evt: any) => {
                    eventsByKey.set(evt.id, evt);
                    if (evt.event_id) eventsByKey.set(evt.event_id, evt);
                });
            }

            if (eventPublicIds.length > 0) {
                const { data: eventsByPublic, error: eventsByPublicError } = await supabase
                    .from('events')
                    .select('id, event_id, name')
                    .in('event_id', eventPublicIds);
                if (__DEV__ && eventsByPublicError) {
                    console.warn('[Feed] Failed to fetch events by event_id:', eventsByPublicError);
                }
                (eventsByPublic ?? []).forEach((evt: any) => {
                    eventsByKey.set(evt.id, evt);
                    if (evt.event_id) eventsByKey.set(evt.event_id, evt);
                });
            }
        }

        // Get counts separately for each post
        const postsWithCounts = await Promise.all(
            rows.map(async (post: any) => {
                // Get like count
                const { count: likeCount } = await supabase
                    .from('feed_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);

                // Get comment count
                const { count: commentCount } = await supabase
                    .from('feed_comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id)
                    .eq('is_active', true);

                // Check if current user liked
                let isLiked = false;
                if (currentUser) {
                    const { data: likeData } = await supabase
                        .from('feed_likes')
                        .select('id')
                        .eq('post_id', post.id)
                        .eq('user_id', currentUser.id)
                        .maybeSingle();
                    isLiked = !!likeData;
                }

                // Get tagged users
                const { data: tagsData } = await supabase
                    .from('feed_post_tags')
                    .select('tagged_user_id')
                    .eq('post_id', post.id);

                let taggedUsers: any[] = [];
                if (tagsData && tagsData.length > 0) {
                    const tagUserIds = tagsData.map(t => t.tagged_user_id);
                    const { data: tagProfiles } = await supabase
                        .from('user_profiles')
                        .select('id, first_name, last_name, profile_picture_url')
                        .in('id', tagUserIds);

                    if (tagProfiles) {
                        taggedUsers = tagProfiles.map(p => ({
                            id: p.id,
                            firstName: p.first_name,
                            lastName: p.last_name,
                            profilePictureUrl: p.profile_picture_url
                        }));
                    }
                }

                return {
                    ...post,
                    author: authorsById.get(post.user_id) ?? null,
                    event: post.event_id ? eventsByKey.get(post.event_id) ?? null : null,
                    like_count: likeCount || 0,
                    comment_count: commentCount || 0,
                    is_liked_by_current_user: isLiked,
                    tagged_users: taggedUsers,
                };
            })
        );

        const posts = postsWithCounts.map(p => ({
            ...mapFeedPostDBToUI(p),
            taggedUsers: p.tagged_users || []
        }));

        return { success: true, data: posts };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * Fetches posts by a specific user (for profile screen)
 */
export async function fetchUserPosts(
    userId: string,
    page: number = 0,
    limit: number = 10
): Promise<ServiceResponse<FeedPostUI[]>> {
    try {
        const currentUser = (await supabase.auth.getUser()).data.user;

        const { data, error } = await supabase
            .from('feed_posts_visible')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (error) {
            return { success: false, error: mapSupabaseError(error) };
        }

        const rows = data ?? [];

        const authorsById = new Map<string, any>();
        const { data: author, error: authorError } = await supabase
            .from('user_profiles')
            .select('id, first_name, last_name, profile_picture_url')
            .eq('id', userId)
            .maybeSingle();
        if (__DEV__ && authorError) {
            console.warn('[Feed] Failed to fetch author profile:', authorError);
        }
        if (author) authorsById.set(author.id, author);

        const rawEventIds = Array.from(
            new Set(rows.map((row: any) => row.event_id).filter(Boolean))
        ) as string[];
        const eventsByKey = new Map<string, any>();
        if (rawEventIds.length > 0) {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const eventUuidIds = rawEventIds.filter((v) => uuidRegex.test(v));
            const eventPublicIds = rawEventIds.filter((v) => !uuidRegex.test(v));

            if (eventUuidIds.length > 0) {
                const { data: eventsByUuid, error: eventsByUuidError } = await supabase
                    .from('events')
                    .select('id, event_id, name')
                    .in('id', eventUuidIds);
                if (__DEV__ && eventsByUuidError) {
                    console.warn('[Feed] Failed to fetch events by id:', eventsByUuidError);
                }
                (eventsByUuid ?? []).forEach((evt: any) => {
                    eventsByKey.set(evt.id, evt);
                    if (evt.event_id) eventsByKey.set(evt.event_id, evt);
                });
            }

            if (eventPublicIds.length > 0) {
                const { data: eventsByPublic, error: eventsByPublicError } = await supabase
                    .from('events')
                    .select('id, event_id, name')
                    .in('event_id', eventPublicIds);
                if (__DEV__ && eventsByPublicError) {
                    console.warn('[Feed] Failed to fetch events by event_id:', eventsByPublicError);
                }
                (eventsByPublic ?? []).forEach((evt: any) => {
                    eventsByKey.set(evt.id, evt);
                    if (evt.event_id) eventsByKey.set(evt.event_id, evt);
                });
            }
        }

        // Check if current user liked each post
        const postsWithLikeStatus = await Promise.all(
            rows.map(async (post: any) => {
                if (!currentUser) {
                    return { ...post, is_liked_by_current_user: false };
                }

                const { data: likeData } = await supabase
                    .from('feed_likes')
                    .select('id')
                    .eq('post_id', post.id)
                    .eq('user_id', currentUser.id)
                    .maybeSingle();

                return {
                    ...post,
                    author: authorsById.get(post.user_id) ?? null,
                    event: post.event_id ? eventsByKey.get(post.event_id) ?? null : null,
                    is_liked_by_current_user: !!likeData,
                };
            })
        );

        const posts = postsWithLikeStatus.map(mapFeedPostDBToUI);

        return { success: true, data: posts };
    } catch (error) {
        return { success: false, error: mapSupabaseError(error) };
    }
}

// Creates a new feed post
export async function createPost(
    request: CreatePostRequest
): Promise<ServiceResponse<FeedPostUI>> {
    try {
        const { content, imageUris, eventId, taggedUserIds } = request;

        // Validate content
        const validationError = validatePostContent(content);
        if (validationError) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validationError,
                },
            };
        }

        // Get current user
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to create a post', 'UNAUTHORIZED'),
            };
        }

        // Check rate limit
        const rateLimitCheck = checkPostRateLimit(user.id);
        if (!rateLimitCheck.canPost) {
            return {
                success: false,
                error: {
                    code: 'RATE_LIMIT_ERROR',
                    message: rateLimitCheck.error || 'Rate limit exceeded',
                },
            };
        }

        // Upload images
        let imageUrls: string[];
        try {
            imageUrls = await uploadImages(user.id, imageUris);
        } catch (uploadError: any) {
            // Check if this is a validation error
            if (uploadError.code === 'VALIDATION_ERROR') {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: uploadError.message,
                    },
                };
            }
            // Re-throw other errors to be caught by outer catch
            throw uploadError;
        }

        // Create post
        const { data: post, error } = await supabase
            .from('feed_posts')
            .insert({
                user_id: user.id,
                content,
                image_urls: imageUrls,
                event_id: eventId || null,
            })
            .select()
            .single();

        if (error) {
            console.error('[createPost] Supabase insert error:', error);
            return {
                success: false,
                error: createError('Failed to create post', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        // Record post creation for rate limiting
        recordPostCreation(user.id);

        // Create tags
        if (taggedUserIds && taggedUserIds.length > 0) {
            const { error: tagError } = await supabase
                .from('feed_post_tags')
                .insert(
                    taggedUserIds.map((taggedUserId) => ({
                        post_id: post.id,
                        tagged_user_id: taggedUserId,
                    }))
                );

            if (tagError) {
                console.warn('Failed to create tags:', tagError);
                // Don't fail the entire operation if tagging fails
            }
        }

        // Fetch the complete post with joined data
        const { data: completePost } = await supabase
            .from('feed_posts')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        likes:feed_likes(count),
        comments:feed_comments(count),
        tagged_users:feed_post_tags(tagged_user:user_profiles(id, first_name, last_name)),
        event:events(id, event_id, name)
      `)
            .eq('id', post.id)
            .single();

        const postUI = mapFeedPostDBToUI({ ...completePost, is_liked_by_current_user: false });

        return { success: true, data: postUI };
    } catch (error) {
        return { success: false, error: mapSupabaseError(error) };
    }
}

// Deletes a post (hard delete)
export async function deletePost(postId: string): Promise<ServiceResponse<void>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to delete a post', 'UNAUTHORIZED'),
            };
        }

        // Debug: Fetch post first to verify existence and ownership
        const { data: existingPost, error: fetchError } = await supabase
            .from('feed_posts')
            .select('id, user_id, is_active')
            .eq('id', postId)
            .single();

        if (fetchError || !existingPost) {
            return {
                success: false,
                error: createError('Post not found', 'NOT_FOUND'),
            };
        }



        if (existingPost.user_id !== user.id) {
            return {
                success: false,
                error: createError('You can only delete your own posts', 'UNAUTHORIZED'),
            };
        }

        const { error } = await supabase
            .from('feed_posts')
            .delete()
            .eq('id', postId);

        if (error) {
            return {
                success: false,
                error: createError('Failed to delete post', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * Likes a post
 */
export async function likePost(postId: string): Promise<ServiceResponse<void>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to like a post', 'UNAUTHORIZED'),
            };
        }

        const { error } = await supabase
            .from('feed_likes')
            .insert({
                post_id: postId,
                user_id: user.id,
            });

        if (error) {
            // Check if it's a duplicate like error
            if (error.code === '23505') {
                return {
                    success: false,
                    error: createError('You have already liked this post', 'ALREADY_EXISTS'),
                };
            }

            return {
                success: false,
                error: createError('Failed to like post', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * Unlikes a post
 */
export async function unlikePost(postId: string): Promise<ServiceResponse<void>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to unlike a post', 'UNAUTHORIZED'),
            };
        }

        const { error } = await supabase
            .from('feed_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

        if (error) {
            return {
                success: false,
                error: createError('Failed to unlike post', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
        };
    }
}

/**
 * Fetches comments for a post
 */
export async function fetchComments(postId: string): Promise<ServiceResponse<FeedCommentUI[]>> {
    try {
        const { data, error } = await supabase
            .from('feed_comments')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url)
      `)
            .eq('post_id', postId)
            .eq('is_active', true)
            .order('created_at', { ascending: true });

        if (error) {
            return {
                success: false,
                error: createError('Failed to fetch comments', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        // Transform DB comments to UI structure
        const flatComments = data.map(mapFeedCommentDBToUI);

        // Build tree structure
        const commentMap = new Map<string, FeedCommentUI>();
        const rootComments: FeedCommentUI[] = [];

        // First pass: create all comment objects
        flatComments.forEach(comment => {
            comment.replies = []; // Initialize replies array
            commentMap.set(comment.id, comment);
        });

        // Second pass: link repies to parents
        flatComments.forEach(comment => {
            if (comment.parentId) {
                const parent = commentMap.get(comment.parentId);
                if (parent) {
                    parent.replies?.push(comment);
                } else {
                    // Parent not found (maybe loaded separately or deleted), treat as root for now
                    rootComments.push(comment);
                }
            } else {
                rootComments.push(comment);
            }
        });

        return { success: true, data: rootComments };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'An unexpected error occurred',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}

/**
 * Creates a comment on a post
 */
export async function createComment(
    request: CreateCommentRequest
): Promise<ServiceResponse<FeedCommentUI>> {
    try {
        const { postId, content, parentId } = request;

        // Validate content
        const validationError = validateCommentContent(content);
        if (validationError) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validationError,
                },
            };
        }

        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to comment', 'UNAUTHORIZED'),
            };
        }

        const { data: comment, error } = await supabase
            .from('feed_comments')
            .insert({
                post_id: postId,
                user_id: user.id,
                content,
                parent_id: parentId || null,
            })
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url)
      `)
            .single();

        if (error) {
            return {
                success: false,
                error: createError('Failed to create comment', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        const commentUI = mapFeedCommentDBToUI(comment);

        return { success: true, data: commentUI };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'An unexpected error occurred',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}

// Deletes a comment (soft delete)
export async function deleteComment(commentId: string): Promise<ServiceResponse<void>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to delete a comment', 'UNAUTHORIZED'),
            };
        }

        // Try hard delete first for now
        const { error, data } = await supabase
            .from('feed_comments')
            .delete()
            .eq('id', commentId)
            .eq('user_id', user.id)
            .select();

        if (error) {
            return {
                success: false,
                error: createError(
                    'Failed to delete comment',
                    'DATABASE_ERROR',
                    undefined,
                    (error as any).message
                ),
            };
        }

        return { success: true, data: undefined };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'An unexpected error occurred',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}

// Compresses and uploads images to Supabase Storage
async function uploadImages(userId: string, imageUris: string[]): Promise<string[]> {
    if (imageUris.length === 0) return [];

    try {
        const uploadPromises = imageUris.map(async (uri, index) => {
            try {
                // Get file info to check size
                let fileSize: number | undefined;
                try {
                    const fileInfo = await FileSystem.getInfoAsync(uri);
                    if (fileInfo.exists && 'size' in fileInfo) {
                        fileSize = fileInfo.size;
                    }
                } catch (err) {
                    // If we can't get file info, continue without size validation
                    // This often happens on first pick on iOS but doesn't prevent upload
                    if (__DEV__) console.log('Notice: Could not get file size for:', uri);
                }

                // Validate image before upload (with size if available)
                const validationError = validateImageUpload(uri, fileSize);
                if (validationError) {
                    // Throw a custom error with VALIDATION_ERROR marker
                    const error = new Error(validationError);
                    (error as any).code = 'VALIDATION_ERROR';
                    throw error;
                }

                // Compress image using shared helper
                const compressedImage = await PhotoHelper.compressImage(uri);

                // Determine file type and name based on whether compression happened (webp) or fallback (original)
                const isWebP = compressedImage.endsWith('.webp');
                const extension = isWebP ? 'webp' : uri.split('.').pop() || 'jpg';
                const mimeType = isWebP ? 'image/webp' : `image/${extension === 'jpg' ? 'jpeg' : extension}`;

                // Generate unique path
                const timestamp = Date.now();
                const path = `${userId}/${timestamp}_${index}.${extension}`;

                // For React Native, we need to use the file URI directly
                const formData = new FormData();
                formData.append('file', {
                    uri: compressedImage,
                    type: mimeType,
                    name: `${timestamp}_${index}.${extension}`,
                } as any);

                // Upload to Supabase Storage using FormData
                const { data, error } = await supabase.storage
                    .from('feed-images')
                    .upload(path, formData, {
                        contentType: mimeType,
                        upsert: false,
                    });

                if (error) {
                    console.error('Upload error details:', error);
                    throw new Error(`Upload failed: ${error.message}`);
                }

                // Return public URL
                const { data: urlData } = supabase.storage
                    .from('feed-images')
                    .getPublicUrl(path);

                return urlData.publicUrl;
            } catch (err) {
                console.error('Image upload failed:', err);
                throw err;
            }
        });

        return Promise.all(uploadPromises);
    } catch (error) {
        console.error('uploadImages error:', error);
        throw error;
    }
}

// Updates a post
export async function updatePost(
    postId: string,
    content: string,
    imageUris: string[],
    eventId?: string
): Promise<ServiceResponse<FeedPostUI>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: createError('You must be logged in to update a post', 'UNAUTHORIZED'),
            };
        }

        // Validate content
        const validationError = validatePostContent(content);
        if (validationError) {
            return {
                success: false,
                error: {
                    code: 'VALIDATION_ERROR',
                    message: validationError,
                },
            };
        }

        // Handle images
        let finalImageUrls: string[] = [];
        const existingUrls = imageUris.filter(uri => uri.startsWith('http'));
        const newUris = imageUris.filter(uri => !uri.startsWith('http'));

        try {
            const uploadedUrls = await uploadImages(user.id, newUris);
            finalImageUrls = [...existingUrls, ...uploadedUrls];
        } catch (uploadError: any) {
            if (uploadError.code === 'VALIDATION_ERROR') {
                return {
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: uploadError.message,
                    },
                };
            }
            throw uploadError;
        }

        const { data: post, error } = await supabase
            .from('feed_posts')
            .update({
                content,
                image_urls: finalImageUrls,
                event_id: eventId || null,
                updated_at: new Date().toISOString(),
            })
            .eq('id', postId)
            .eq('user_id', user.id)
            .select()
            .single();

        if (error) {
            return {
                success: false,
                error: createError('Failed to update post', 'DATABASE_ERROR', undefined, error.message),
            };
        }

        // Fetch the complete post with joined data
        const { data: completePost } = await supabase
            .from('feed_posts')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        likes:feed_likes(count),
        comments:feed_comments(count),
        tagged_users:feed_post_tags(tagged_user:user_profiles(id, first_name, last_name)),
        event:events(id, event_id, name)
      `)
            .eq('id', post.id)
            .single();

        const postUI = mapFeedPostDBToUI({ ...completePost, is_liked_by_current_user: false }); // User like status might need refresh, but fine for now

        return { success: true, data: postUI };
    } catch (error) {
        return {
            success: false,
            error: createError(
                'An unexpected error occurred',
                'UNKNOWN_ERROR',
                undefined,
                error instanceof Error ? error.message : 'Unknown error'
            ),
        };
    }
}
