import React, { useState } from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet, Alert, ActionSheetIOS, Platform, FlatList, useWindowDimensions, LayoutChangeEvent } from 'react-native';
import { MotiView } from 'moti';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBlock } from '@/contexts/BlockContext';
import { useLikes } from '@/hooks/feed';
import { formatRelativeTime } from '@/utils/feed';
import { ReportModal } from '@/components/shared/ReportModal';
import { GradientAvatarBorder } from './GradientAvatarBorder';
import type { FeedPostUI } from '@/types/feed';

interface FeedCardProps {
    post: FeedPostUI;
    onDelete?: (postId: string) => void;
    onEdit?: (post: FeedPostUI) => void;
    onCommentPress?: (postId: string) => void;
    compact?: boolean;
    index?: number;
}

export function FeedCard({ post, onDelete, onEdit, onCommentPress, compact = false, index }: FeedCardProps) {
    const { theme, isDark } = useTheme();
    const { width: screenWidth } = useWindowDimensions();

    const cardBackground = isDark ? '#000000' : '#FFFFFF';
    const dividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';
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
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [cardWidth, setCardWidth] = useState<number | null>(null);
    const authorName = `${post.author.firstName} ${post.author.lastName}`;
    const showCarousel = post.imageUrls.length > 1 && !compact;
    const hasCaption = post.content.trim().length > 0;
    const staggerDelay = typeof index === 'number' ? Math.min(index * 60, 360) : 0;

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

    const handleCardLayout = (event: LayoutChangeEvent) => {
        const { width } = event.nativeEvent.layout;
        if (width && width !== cardWidth) {
            setCardWidth(width);
        }
    };

    const resolvedWidth = cardWidth ?? screenWidth;
    const imageWidth = Math.max(resolvedWidth, 1);
    const imageCountLabel = post.imageUrls.length > 1
        ? (compact ? `+${post.imageUrls.length - 1}` : `${activeImageIndex + 1}/${post.imageUrls.length}`)
        : '';
    const likeLabel = likeCount === 1 ? 'like' : 'likes';
    const commentLabel = post.commentCount === 1 ? 'comment' : 'comments';

    const handleCarouselMomentumEnd = (event: { nativeEvent: { contentOffset: { x: number } } }) => {
        if (!showCarousel || imageWidth === 0) {
            return;
        }
        const nextIndex = Math.round(event.nativeEvent.contentOffset.x / imageWidth);
        setActiveImageIndex(nextIndex);
    };

    const renderCaptionText = () => (
        post.content.split(/(@\w+\s?)/g).map((part, index) => {
            if (part.startsWith('@')) {
                const mentionName = part.substring(1).trim();

                // Find the user with this name in taggedUsers
                const taggedUser = post.taggedUsers.find(
                    u => {
                        const fullName = `${u.firstName}${u.lastName}`.toLowerCase();
                        const spacedName = `${u.firstName} ${u.lastName}`.toLowerCase();
                        const search = mentionName.toLowerCase();
                        const match = fullName === search || spacedName === search;
                        return match;
                    }
                );

                if (taggedUser) {
                    return (
                        <Text
                            key={index}
                            style={{ color: theme.info, fontWeight: '600' }}
                            onPress={() => router.push(`/profile/${taggedUser.id}`)}
                        >
                            {part}
                        </Text>
                    );
                }
            }
            return <Text key={index}>{part}</Text>;
        })
    );

    return (
        <MotiView
            from={{ opacity: 0, translateY: 12 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{
                type: 'timing',
                duration: 350,
                delay: staggerDelay,
            }}
            onLayout={handleCardLayout}
            style={[styles.container, { backgroundColor: cardBackground, borderBottomColor: dividerColor }]}
        >
            {/* Header */}
            <View style={[styles.header, styles.sectionPadding]}>
                <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress}>
                    <GradientAvatarBorder tier={post.author.tier} size={36} borderWidth={2}>
                        {post.author.profilePictureUrl ? (
                            <Image
                                source={{ uri: post.author.profilePictureUrl }}
                                style={styles.avatar}
                            />
                        ) : (
                            <View style={[styles.avatar, styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                                <Ionicons name="person" size={18} color={theme.subtext} />
                            </View>
                        )}
                    </GradientAvatarBorder>
                    <View>
                        <Text style={[styles.authorName, { color: theme.text }]} numberOfLines={1}>
                            {authorName}
                        </Text>
                    </View>
                </TouchableOpacity>

                {!compact && (
                    <TouchableOpacity onPress={handleOptionsPress} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                        <Ionicons name="ellipsis-horizontal" size={20} color={theme.subtext} />
                    </TouchableOpacity>
                )}
            </View>

            {post.event && (
                <TouchableOpacity style={[styles.eventRow, styles.sectionPadding]} onPress={handleEventPress}>
                    <Ionicons name="location-outline" size={14} color={theme.subtext} />
                    <Text style={[styles.eventText, { color: theme.subtext }]} numberOfLines={1}>
                        {post.event.name}
                    </Text>
                </TouchableOpacity>
            )}

            {/* Images */}
            {post.imageUrls.length > 0 && (
                <View style={[styles.mediaWrapper, { backgroundColor: isDark ? '#000000' : '#F1F1F1' }]}>
                    {showCarousel ? (
                        <FlatList
                            data={post.imageUrls}
                            keyExtractor={(_, imageIndex) => `${post.id}-${imageIndex}`}
                            renderItem={({ item }) => (
                                <Image
                                    source={{ uri: item }}
                                    style={[styles.carouselImage, { width: imageWidth, height: imageWidth }]}
                                    resizeMode="cover"
                                />
                            )}
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onMomentumScrollEnd={handleCarouselMomentumEnd}
                            getItemLayout={(_, imageIndex) => ({
                                length: imageWidth,
                                offset: imageWidth * imageIndex,
                                index: imageIndex,
                            })}
                        />
                    ) : (
                        <Image
                            source={{ uri: post.imageUrls[0] }}
                            style={[styles.carouselImage, { width: imageWidth, height: imageWidth }]}
                            resizeMode="cover"
                        />
                    )}

                    {post.imageUrls.length > 1 && (
                        <View style={styles.imageCountBadge}>
                            <Text style={styles.imageCountText}>{imageCountLabel}</Text>
                        </View>
                    )}

                    {showCarousel && (
                        <View style={styles.pagination}>
                            {post.imageUrls.map((_, dotIndex) => (
                                <View
                                    key={`${post.id}-dot-${dotIndex}`}
                                    style={[
                                        styles.paginationDot,
                                        {
                                            backgroundColor: dotIndex === activeImageIndex
                                                ? theme.info
                                                : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)'),
                                        },
                                    ]}
                                />
                            ))}
                        </View>
                    )}
                </View>
            )}

            {!compact && (
                <View style={[styles.actions, styles.sectionPadding]}>
                    <TouchableOpacity style={styles.actionButton} onPress={handleLike}>
                        <Ionicons
                            name={isLiked ? 'heart' : 'heart-outline'}
                            size={24}
                            color={isLiked ? theme.error : theme.text}
                        />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onCommentPress?.(post.id)}
                    >
                        <Ionicons name="chatbubble-outline" size={22} color={theme.text} />
                    </TouchableOpacity>
                </View>
            )}

            <View style={[styles.meta, styles.sectionPadding]}>
                {!compact && (
                    <Text style={[styles.likesText, { color: theme.text }]}>
                        {likeCount} {likeLabel}
                    </Text>
                )}

                {hasCaption && (
                    <Text style={[styles.captionText, { color: theme.text }]}>
                        <Text style={styles.captionAuthor}>{authorName}</Text>{' '}
                        {renderCaptionText()}
                    </Text>
                )}

                {post.taggedUsers.length > 0 && (
                    <View style={styles.tagsContainer}>
                        <Ionicons name="pricetag" size={12} color={theme.subtext} style={styles.tagsIcon} />
                        <View style={styles.tagsList}>
                            {post.taggedUsers.map((user, taggedIndex) => (
                                <TouchableOpacity
                                    key={user.id}
                                    onPress={() => router.push(`/profile/${user.id}`)}
                                >
                                    <Text style={[styles.tagsText, { color: theme.info }]}>
                                        {user.firstName} {user.lastName}{taggedIndex < post.taggedUsers.length - 1 ? ',' : ''}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {!compact && post.commentCount > 0 && (
                    onCommentPress ? (
                        <TouchableOpacity onPress={() => onCommentPress(post.id)}>
                            <Text style={[styles.commentLink, { color: theme.subtext }]}>
                                View all {post.commentCount} {commentLabel}
                            </Text>
                        </TouchableOpacity>
                    ) : (
                        <Text style={[styles.commentLink, { color: theme.subtext }]}>
                            {post.commentCount} {commentLabel}
                        </Text>
                    )
                )}

                <Text style={[styles.timestamp, { color: theme.subtext }]}>
                    {formatRelativeTime(post.createdAt)}
                </Text>
            </View>

            {/* Report Modal */}
            <ReportModal
                visible={showReportModal}
                onClose={() => setShowReportModal(false)}
                targetType="post"
                targetId={post.id}
                targetName={authorName}
            />
        </MotiView>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingBottom: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    sectionPadding: {
        paddingHorizontal: 16,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        paddingBottom: 8,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        flex: 1,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
    },
    eventRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingBottom: 8,
    },
    eventText: {
        fontSize: 13,
        fontWeight: '500',
        flexShrink: 1,
    },
    mediaWrapper: {
        width: '100%',
    },
    carouselImage: {
        width: '100%',
        backgroundColor: '#000000',
    },
    imageCountBadge: {
        position: 'absolute',
        top: 10,
        right: 10,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 12,
        paddingHorizontal: 8,
        paddingVertical: 4,
    },
    imageCountText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '600',
    },
    pagination: {
        position: 'absolute',
        bottom: 10,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 6,
    },
    paginationDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        paddingTop: 12,
    },
    actionButton: {
        paddingVertical: 2,
    },
    meta: {
        paddingTop: 8,
        paddingBottom: 12,
    },
    likesText: {
        fontSize: 14,
        fontWeight: '600',
    },
    captionText: {
        fontSize: 14,
        lineHeight: 20,
        marginTop: 4,
    },
    captionAuthor: {
        fontWeight: '600',
    },
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginTop: 6,
    },
    tagsIcon: {
        marginTop: 2,
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
    },
    tagsText: {
        fontSize: 12,
        fontWeight: '500',
    },
    commentLink: {
        fontSize: 13,
        marginTop: 6,
    },
    timestamp: {
        fontSize: 11,
        letterSpacing: 0.2,
        marginTop: 6,
    },
});
