import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useLikes } from '@/hooks/feed';
import { formatRelativeTime } from '@/utils/feed';
import type { FeedPostUI } from '@/types/feed';

interface FeedCardProps {
    post: FeedPostUI;
    onDelete?: (postId: string) => void;
    onCommentPress?: (postId: string) => void;
    compact?: boolean;
}

export function FeedCard({ post, onDelete, onCommentPress, compact = false }: FeedCardProps) {
    const { theme } = useTheme();
    const router = useRouter();
    const { isLiked, likeCount, toggleLike } = useLikes(
        post.id,
        post.isLikedByCurrentUser,
        post.likeCount
    );

    const handleAuthorPress = () => {
        router.push(`/profile/${post.userId}`);
    };

    const handleEventPress = () => {
        if (post.event) {
            router.push(`/event/${post.event.id}`);
        }
    };

    const handleDeletePress = () => {
        Alert.alert(
            'Delete Post',
            'Are you sure you want to delete this post?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => onDelete?.(post.id),
                },
            ]
        );
    };

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress}>
                    {post.author.profilePictureUrl ? (
                        <Image
                            source={{ uri: post.author.profilePictureUrl }}
                            style={styles.avatar}
                        />
                    ) : (
                        <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                            <Ionicons name="person" size={20} color={theme.subtext} />
                        </View>
                    )}
                    <View>
                        <Text style={[styles.authorName, { color: theme.text }]}>
                            {post.author.firstName} {post.author.lastName}
                        </Text>
                        <Text style={[styles.timestamp, { color: theme.subtext }]}>
                            {formatRelativeTime(post.createdAt)}
                        </Text>
                    </View>
                </TouchableOpacity>

                {onDelete && (
                    <TouchableOpacity onPress={handleDeletePress}>
                        <Ionicons name="trash-outline" size={20} color={theme.error} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <Text style={[styles.content, { color: theme.text }]}>{post.content}</Text>

            {/* Images */}
            {post.imageUrls.length > 0 && (
                <View style={styles.imagesContainer}>
                    {post.imageUrls.slice(0, compact ? 1 : 4).map((url, index) => {
                        console.log('Rendering image:', url);
                        return (
                            <Image
                                key={index}
                                source={{ uri: url }}
                                style={[
                                    styles.image,
                                    post.imageUrls.length === 1 && styles.singleImage,
                                    post.imageUrls.length > 1 && styles.multiImage,
                                ]}
                                resizeMode="cover"
                                onError={(error) => console.error('Image load error:', error.nativeEvent.error, 'URL:', url)}
                                onLoad={() => console.log('Image loaded successfully:', url)}
                            />
                        );
                    })}
                    {post.imageUrls.length > 4 && !compact && (
                        <View style={[styles.moreImagesOverlay, { backgroundColor: 'rgba(0,0,0,0.6)' }]}>
                            <Text style={styles.moreImagesText}>+{post.imageUrls.length - 4}</Text>
                        </View>
                    )}
                </View>
            )}

            {/* Event Link */}
            {post.event && (
                <TouchableOpacity
                    style={[styles.eventLink, { backgroundColor: theme.calendarAccent, borderColor: theme.border }]}
                    onPress={handleEventPress}
                >
                    <Ionicons name="calendar" size={16} color={theme.primary} />
                    <Text style={[styles.eventText, { color: theme.text }]}>{post.event.name}</Text>
                </TouchableOpacity>
            )}

            {/* Tagged Users */}
            {post.taggedUsers.length > 0 && (
                <View style={styles.tagsContainer}>
                    <Ionicons name="pricetag" size={14} color={theme.subtext} />
                    <Text style={[styles.tagsText, { color: theme.subtext }]}>
                        {post.taggedUsers.map(u => `${u.firstName} ${u.lastName}`).join(', ')}
                    </Text>
                </View>
            )}

            {/* Actions */}
            {!compact && (
                <View style={[styles.actions, { borderTopColor: theme.border }]}>
                    <TouchableOpacity style={styles.actionButton} onPress={toggleLike}>
                        <Ionicons
                            name={isLiked ? 'heart' : 'heart-outline'}
                            size={22}
                            color={isLiked ? theme.error : theme.subtext}
                        />
                        <Text style={[styles.actionText, { color: theme.subtext }]}>
                            {likeCount}
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onCommentPress?.(post.id)}
                    >
                        <Ionicons name="chatbubble-outline" size={20} color={theme.subtext} />
                        <Text style={[styles.actionText, { color: theme.subtext }]}>
                            {post.commentCount}
                        </Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 12,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        fontSize: 16,
        fontWeight: '600',
    },
    timestamp: {
        fontSize: 12,
        marginTop: 2,
    },
    content: {
        fontSize: 15,
        lineHeight: 20,
        marginBottom: 12,
    },
    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        marginBottom: 12,
        borderRadius: 8,
        overflow: 'hidden',
    },
    image: {
        borderRadius: 8,
    },
    singleImage: {
        width: '100%',
        height: 300,
    },
    multiImage: {
        width: '49%',
        height: 150,
    },
    moreImagesOverlay: {
        position: 'absolute',
        bottom: 4,
        right: 4,
        width: '49%',
        height: 150,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 8,
    },
    moreImagesText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: 'bold',
    },
    eventLink: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        marginBottom: 8,
    },
    eventText: {
        fontSize: 14,
        fontWeight: '500',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 8,
    },
    tagsText: {
        fontSize: 13,
    },
    actions: {
        flexDirection: 'row',
        gap: 24,
        paddingTop: 12,
        borderTopWidth: 1,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '500',
    },
});
