import { supabase } from './supabase';
import * as ImageManipulator from 'expo-image-manipulator';
import type { FeedPostUI, FeedCommentUI, CreatePostRequest, CreateCommentRequest } from '../types/feed';
import type { ServiceResponse } from '../types/errors';
import { mapFeedPostDBToUI, mapFeedCommentDBToUI, validatePostContent, validateCommentContent } from '../utils/feed';

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
            .from('feed_posts')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        event:events(id, name)
      `)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (error) {
            console.error('Feed fetch error:', error);
            return {
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to fetch feed posts',
                    details: error.message,
                },
            };
        }

        console.log('Fetched posts:', data?.length);

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
            .from('feed_posts')
            .select(`
        *,
        author:user_profiles!user_id(id, first_name, last_name, profile_picture_url),
        likes:feed_likes(count),
        comments:feed_comments(count),
        tagged_users:feed_post_tags(tagged_user:user_profiles(id, first_name, last_name)),
        event:events(id, name)
      `)
            .eq('user_id', userId)
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .range(page * limit, (page + 1) * limit - 1);

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to fetch user posts',
                    details: error.message,
                },
            };
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
 * Creates a new feed post
 */
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
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to create a post',
                },
            };
        }

        // Upload images
        const imageUrls = await uploadImages(user.id, imageUris);

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
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to create post',
                    details: error.message,
                },
            };
        }

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
 * Deletes a post (soft delete)
 */
export async function deletePost(postId: string): Promise<ServiceResponse<void>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to delete a post',
                },
            };
        }

        // Debug: Fetch post first to verify existence and ownership
        const { data: existingPost, error: fetchError } = await supabase
            .from('feed_posts')
            .select('id, user_id, is_active')
            .eq('id', postId)
            .single();

        if (fetchError || !existingPost) {
            console.error('Delete Debug: Post not found', fetchError);
            return {
                success: false,
                error: {
                    code: 'NOT_FOUND',
                    message: 'Post not found',
                },
            };
        }



        if (existingPost.user_id !== user.id) {
            return {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You can only delete your own posts',
                },
            };
        }

        const { error } = await supabase
            .from('feed_posts')
            .delete()
            .eq('id', postId);

        if (error) {
            return {
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to delete post',
                    details: error.message,
                },
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
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to like a post',
                },
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
                    error: {
                        code: 'ALREADY_EXISTS',
                        message: 'You have already liked this post',
                    },
                };
            }

            return {
                success: false,
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to like post',
                    details: error.message,
                },
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
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to unlike a post',
                },
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
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to unlike post',
                    details: error.message,
                },
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
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to fetch comments',
                    details: error.message,
                },
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
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to comment',
                },
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
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to create comment',
                    details: error.message,
                },
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

/**
 * Deletes a comment (soft delete)
 */
export async function deleteComment(commentId: string): Promise<ServiceResponse<void>> {
    try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) {
            return {
                success: false,
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to delete a comment',
                },
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
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to delete comment',
                    details: error.message,
                },
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

/**
 * Compresses and uploads images to Supabase Storage
 */
async function uploadImages(userId: string, imageUris: string[]): Promise<string[]> {
    if (imageUris.length === 0) return [];

    try {
        const uploadPromises = imageUris.map(async (uri, index) => {
            try {
                console.log('Compressing image:', uri);
                // Compress image
                const compressedImage = await compressImage(uri);
                console.log('Compressed:', compressedImage);

                // Generate unique path
                const timestamp = Date.now();
                const path = `${userId}/${timestamp}_${index}.webp`;

                console.log('Uploading to path:', path);

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

                console.log('Upload success:', urlData.publicUrl);
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

/**
 * Compresses an image using expo-image-manipulator
 */
async function compressImage(uri: string): Promise<string> {
    const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Max width 1080px (Instagram-style)
        {
            compress: 0.7, // 70% quality
            format: ImageManipulator.SaveFormat.WEBP,
        }
    );
    return result.uri;
}

/**
 * Updates a post
 */
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
                error: {
                    code: 'UNAUTHORIZED',
                    message: 'You must be logged in to update a post',
                },
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
                error: {
                    code: 'DATABASE_ERROR',
                    message: 'Failed to update post',
                    details: error.message,
                },
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

