import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBlock } from '@/contexts/BlockContext';
import { useLikes } from '@/hooks/feed';
import { formatRelativeTime } from '@/utils/feed';
import { ReportModal } from '@/components/shared/ReportModal';
import type { FeedPostUI } from '@/types/feed';

interface FeedCardProps {
    post: FeedPostUI;
    onDelete?: (postId: string) => void;
    onEdit?: (post: FeedPostUI) => void;
    onCommentPress?: (postId: string) => void;
    compact?: boolean;
}

export function FeedCard({ post, onDelete, onEdit, onCommentPress, compact = false }: FeedCardProps) {
    const { theme, isDark } = useTheme();
    const { user } = useAuth();
    const { isUserBlocked } = useBlock();
    const router = useRouter();
    const isAuthor = user?.id === post.userId;
    const isBlocked = isUserBlocked(post.userId);
    const { isLiked, likeCount, toggleLike } = useLikes(
        post.id,
        post.isLikedByCurrentUser,
        post.likeCount
    );
    const [showReportModal, setShowReportModal] = useState(false);

    const handleAuthorPress = () => {
        if (isBlocked) {
            Alert.alert('User Blocked', 'You have blocked this user.');
            return;
        }
        router.push(`/profile/${post.userId}`);
    };

    const handleEventPress = () => {
        if (post.event) {
            router.push(`/event/${post.event.publicId || post.event.id}`);
        }
    };

    const handleOptionsPress = () => {
        if (isAuthor) {
            // Author options: Edit and Delete
            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ['Cancel', 'Edit Post', 'Delete Post'],
                        destructiveButtonIndex: 2,
                        cancelButtonIndex: 0,
                        userInterfaceStyle: isDark ? 'dark' : 'light',
                    },
                    (buttonIndex) => {
                        if (buttonIndex === 1) {
                            onEdit?.(post);
                        } else if (buttonIndex === 2) {
                            handleDeletePress();
                        }
                    }
                );
            } else {
                Alert.alert(
                    'Post Options',
                    'Choose an action',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Edit', onPress: () => onEdit?.(post) },
                        { text: 'Delete', onPress: handleDeletePress, style: 'destructive' },
                    ]
                );
            }
        } else {
            // Non-author options: Report
            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ['Cancel', 'Report Post'],
                        destructiveButtonIndex: 1,
                        cancelButtonIndex: 0,
                        userInterfaceStyle: isDark ? 'dark' : 'light',
                    },
                    (buttonIndex) => {
                        if (buttonIndex === 1) {
                            setShowReportModal(true);
                        }
                    }
                );
            } else {
                Alert.alert(
                    'Post Options',
                    'Choose an action',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        { text: 'Report', onPress: () => setShowReportModal(true), style: 'destructive' },
                    ]
                );
            }
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

    const handleLike = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        toggleLike();
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
                        <View style={styles.nameContainer}>
                            <Text style={[styles.authorName, { color: theme.text }]}>
                                {post.author.firstName} {post.author.lastName}
                            </Text>
                            {post.event && (
                                <View style={styles.headerEventTag}>
                                    <View style={[styles.dot, { backgroundColor: theme.subtext }]} />
                                    <Ionicons name="location-outline" size={12} color={theme.subtext} />
                                    <TouchableOpacity onPress={handleEventPress}>
                                        <Text style={[styles.headerEventText, { color: theme.subtext }]}>
                                            {post.event.name}
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            )}
                        </View>
                        <Text style={[styles.timestamp, { color: theme.subtext }]}>
                            {formatRelativeTime(post.createdAt)}
                        </Text>
                    </View>
                </TouchableOpacity>

                {!compact && (
                    <TouchableOpacity onPress={handleOptionsPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Content */}
            <Text style={[styles.content, { color: theme.text }]}>
                {post.content.split(/(@\w+\s?)/g).map((part, index) => {
                    if (part.startsWith('@')) {
                        const mentionName = part.substring(1).trim();
                        // Find the user with this name in taggedUsers
                        const taggedUser = post.taggedUsers.find(
                            u => `${u.firstName}${u.lastName}` === mentionName ||
                                `${u.firstName} ${u.lastName}` === mentionName
                        );

                        if (taggedUser) {
                            return (
                                <Text
                                    key={index}
                                    style={{ color: theme.primary, fontWeight: '600' }}
                                    onPress={() => router.push(`/profile/${taggedUser.id}`)}
                                >
                                    {part}
                                </Text>
                            );
                        }
                    }
                    return <Text key={index}>{part}</Text>;
                })}
            </Text>

            {/* Images */}
            {post.imageUrls.length > 0 && (
                <View style={styles.imagesContainer}>
                    {post.imageUrls.slice(0, compact ? 1 : 4).map((url, index) => {
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



            {/* Tagged Users */}
            {post.taggedUsers.length > 0 && (
                <View style={styles.tagsContainer}>
                    <Ionicons name="pricetag" size={14} color={theme.subtext} style={{ marginTop: 2 }} />
                    <View style={styles.tagsList}>
                        {post.taggedUsers.map((user, index) => (
                            <TouchableOpacity
                                key={user.id}
                                onPress={() => router.push(`/profile/${user.id}`)}
                            >
                                <Text style={[styles.tagsText, { color: theme.primary }]}>
                                    {user.firstName} {user.lastName}{index < post.taggedUsers.length - 1 ? ',' : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Actions */}
            {!compact && (
                <View style={[styles.actions, { borderTopColor: theme.border }]}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
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

            {/* Report Modal */}
            <ReportModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetType="post"
                targetId={post.id}
                targetName={`${post.author.firstName} ${post.author.lastName}`}
            />
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
        alignItems: 'flex-start',
        gap: 6,
        marginBottom: 8,
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
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
    nameContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        flexWrap: 'wrap',
    },
    headerEventTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    dot: {
        width: 3,
        height: 3,
        borderRadius: 1.5,
    },
    headerEventText: {
        fontSize: 14,
        fontWeight: '400',
    },
});
