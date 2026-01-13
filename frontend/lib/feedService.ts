import { supabase } from './supabase';
import type { FeedPostUI, FeedCommentUI, CreatePostRequest, CreateCommentRequest } from '../types/feed';
import { PhotoHelper } from '../services/photo.service';
import * as FileSystem from 'expo-file-system';

import type { ServiceResponse } from '../types/errors';
import { createError, mapSupabaseError } from '../types/errors';
import { mapFeedPostDBToUI, mapFeedCommentDBToUI, validatePostContent, validateCommentContent, validateImageUpload } from '../utils/feed';
import { checkPostRateLimit, recordPostCreation } from '../utils/rateLimiter';

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
    userId?: string
): Promise<ServiceResponse<FeedPostUI[]>> {
    try {
        const currentUser = (await supabase.auth.getUser()).data.user;

        const { data, error } = await supabase
            .from('feed_posts_visible')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        event:events(id, event_id, name)
      `)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (error) {
            return { success: false, error: mapSupabaseError(error) };
        }

        // Get counts separately for each post
        const postsWithCounts = await Promise.all(
            data.map(async (post) => {
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

                return {
                    ...post,
                    like_count: likeCount || 0,
                    comment_count: commentCount || 0,
                    is_liked_by_current_user: isLiked,
                };
            })
        );

        const posts = postsWithCounts.map(mapFeedPostDBToUI);

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
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        likes:feed_likes(count),
        comments:feed_comments(count),
        tagged_users:feed_post_tags(tagged_user:user_profiles(id, first_name, last_name)),
        event:events(id, name)
      `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (error) {
            return { success: false, error: mapSupabaseError(error) };
        }

        // Check if current user liked each post
        const postsWithLikeStatus = await Promise.all(
            data.map(async (post) => {
                if (!currentUser) {
                    return { ...post, is_liked_by_current_user: false };
                }

                const { data: likeData } = await supabase
                    .from('feed_likes')
                    .select('id')
                    .eq('post_id', post.id)
                    .eq('user_id', currentUser.id)
                    .single();

                return { ...post, is_liked_by_current_user: !!likeData };
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
        event:events(id, name)
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

        const comments = data.map(mapFeedCommentDBToUI);

        return { success: true, data: comments };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
                severity: 'error',
            },
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
        const { postId, content } = request;

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
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
                severity: 'error',
            },
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

        const { error } = await supabase
            .from('feed_comments')
            .update({ is_active: false })
            .eq('id', commentId)
            .eq('user_id', user.id);

        if (error) {
            return {
                success: false,
                error: createError('Failed to delete comment', 'DATABASE_ERROR', undefined, error.message),
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
                severity: 'error',
            },
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
                    console.warn('Could not get file size for:', uri);
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

                // Generate unique path
                const timestamp = Date.now();
                const path = `${userId}/${timestamp}_${index}.webp`;

                // For React Native, we need to use the file URI directly
                const formData = new FormData();
                formData.append('file', {
                    uri: compressedImage,
                    type: 'image/webp',
                    name: `${timestamp}_${index}.webp`,
                } as any);

                // Upload to Supabase Storage using FormData
                const { data, error } = await supabase.storage
                    .from('feed-images')
                    .upload(path, formData, {
                        contentType: 'image/webp',
                        upsert: false,
                    });

                if (error) {
                    console.error('Upload error:', error);
                    throw error;
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

        const { data: post, error } = await supabase
            .from('feed_posts')
            .update({
                content,
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
        event:events(id, name)
      `)
            .eq('id', post.id)
            .single();

        const postUI = mapFeedPostDBToUI({ ...completePost, is_liked_by_current_user: false }); // User like status might need refresh, but fine for now

        return { success: true, data: postUI };
    } catch (error) {
        return {
            success: false,
            error: {
                code: 'UNKNOWN_ERROR',
                message: 'An unexpected error occurred',
                details: error instanceof Error ? error.message : 'Unknown error',
                severity: 'error',
            },
        };
    }
}