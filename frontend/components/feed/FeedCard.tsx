import React, { useState, useRef, useEffect, memo } from 'react';
import {
    View,
    Text,
    Image,
    TouchableOpacity,
    TouchableWithoutFeedback,
    StyleSheet,
    Alert,
    ActionSheetIOS,
    Platform,
    Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useBlock } from '@/contexts/BlockContext';
import { useLikes } from '@/hooks/feed';
import { formatRelativeTime } from '@/utils/feed';
import { ReportModal } from '@/components/shared/ReportModal';
import { SPACING, RADIUS } from '@/constants/colors';
import type { FeedPostUI } from '@/types/feed';

// Design System Constants
const DESIGN = {
    // Obsidian Glass
    cardBackground: 'rgba(255,255,255,0.05)',
    cardBorder: 'rgba(255,255,255,0.1)',
    cardBorderRadius: 20,

    // Platinum Accent
    platinum: '#E0E0E0',
    platinumDark: '#A0A0A0',
    platinumBackground: 'rgba(224, 224, 224, 0.15)',
    platinumGradient: ['#E0E0E0', '#A0A0A0'] as const,

    // Avatar Rank Ring Colors
    rankPlatinum: ['#E0E0E0', '#C0C0C0', '#E0E0E0'] as const,
    rankSilver: ['#C0C0C0', '#A8A8A8', '#C0C0C0'] as const,
    rankBronze: ['#CD7F32', '#8B4513', '#CD7F32'] as const,

    // Typography Colors
    textPrimary: '#FFFFFF',
    textSecondary: 'rgba(255,255,255,0.6)',
    textTertiary: 'rgba(255,255,255,0.4)',

    // Light mode equivalents
    lightCardBackground: 'rgba(255,255,255,0.95)',
    lightCardBorder: 'rgba(0,0,0,0.08)',

    // Animation
    entranceDelay: 80,
    entranceDuration: 400,
};

interface FeedCardProps {
    post: FeedPostUI;
    onDelete?: (postId: string) => void;
    onEdit?: (post: FeedPostUI) => void;
    onCommentPress?: (postId: string) => void;
    compact?: boolean;
    index?: number; // For staggered animation
}

export const FeedCard = memo(function FeedCard({ post, onDelete, onEdit, onCommentPress, compact = false, index = 0 }: FeedCardProps) {
    const { theme, isDark } = useTheme();

    // Darker card background to match the rest of the UI
    const cardBackground = isDark ? 'rgba(18, 18, 20, 0.85)' : theme.card;
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

    // Animation refs
    const likeScale = useRef(new Animated.Value(1)).current;
    const entranceAnim = useRef(new Animated.Value(0)).current;
    const doubleTapHeartScale = useRef(new Animated.Value(0)).current;
    const doubleTapHeartOpacity = useRef(new Animated.Value(0)).current;

    // Double tap tracking
    const lastTapRef = useRef<number>(0);
    const [showDoubleTapHeart, setShowDoubleTapHeart] = useState(false);

    // Staggered entrance animation
    useEffect(() => {
        const delay = index * DESIGN.entranceDelay;
        const timeout = setTimeout(() => {
            Animated.spring(entranceAnim, {
                toValue: 1,
                friction: 8,
                tension: 40,
                useNativeDriver: true,
            }).start();
        }, delay);

        return () => clearTimeout(timeout);
    }, [index, entranceAnim]);

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

        // Bounce animation
        Animated.sequence([
            Animated.spring(likeScale, {
                toValue: 1.3,
                friction: 3,
                tension: 200,
                useNativeDriver: true,
            }),
            Animated.spring(likeScale, {
                toValue: 1,
                friction: 3,
                tension: 200,
                useNativeDriver: true,
            }),
        ]).start();

        toggleLike();
    };

    // Double tap to like handler
    const handleDoubleTap = () => {
        const now = Date.now();
        const DOUBLE_TAP_DELAY = 300;

        if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
            // Double tap detected
            if (!isLiked) {
                toggleLike();
            }

            // Show heart animation
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowDoubleTapHeart(true);

            // Reset animation values
            doubleTapHeartScale.setValue(0);
            doubleTapHeartOpacity.setValue(1);

            // Animate heart
            Animated.parallel([
                Animated.spring(doubleTapHeartScale, {
                    toValue: 1,
                    friction: 3,
                    tension: 100,
                    useNativeDriver: true,
                }),
                Animated.sequence([
                    Animated.delay(600),
                    Animated.timing(doubleTapHeartOpacity, {
                        toValue: 0,
                        duration: 300,
                        useNativeDriver: true,
                    }),
                ]),
            ]).start(() => {
                setShowDoubleTapHeart(false);
            });

            lastTapRef.current = 0;
        } else {
            lastTapRef.current = now;
        }
    };

    // Render the cinematic image layout with double-tap support
    const renderImages = () => {
        const images = post.imageUrls;
        if (images.length === 0) return null;

        const maxDisplay = compact ? 1 : 4;
        const displayImages = images.slice(0, maxDisplay);
        const extraCount = images.length - maxDisplay;

        const renderImageContent = () => {
            // Single image - Hero layout
            if (images.length === 1) {
                return (
                    <Image
                        source={{ uri: images[0] }}
                        style={styles.heroImage}
                        resizeMode="cover"
                    />
                );
            }

            // Two images - Side by side
            if (images.length === 2) {
                return (
                    <View style={styles.twoImageGrid}>
                        <Image
                            source={{ uri: images[0] }}
                            style={styles.halfImage}
                            resizeMode="cover"
                        />
                        <Image
                            source={{ uri: images[1] }}
                            style={styles.halfImage}
                            resizeMode="cover"
                        />
                    </View>
                );
            }

            // Three images - Mosaic (1 large left, 2 stacked right)
            if (images.length === 3) {
                return (
                    <View style={styles.mosaicGrid}>
                        <Image
                            source={{ uri: images[0] }}
                            style={styles.mosaicLarge}
                            resizeMode="cover"
                        />
                        <View style={styles.mosaicRight}>
                            <Image
                                source={{ uri: images[1] }}
                                style={styles.mosaicSmall}
                                resizeMode="cover"
                            />
                            <Image
                                source={{ uri: images[2] }}
                                style={styles.mosaicSmall}
                                resizeMode="cover"
                            />
                        </View>
                    </View>
                );
            }

            // Four+ images - Grid with +N overlay
            return (
                <View style={styles.fourImageGrid}>
                    {displayImages.map((url, idx) => (
                        <View key={idx} style={styles.quarterImageWrapper}>
                            <Image
                                source={{ uri: url }}
                                style={styles.quarterImage}
                                resizeMode="cover"
                            />
                            {idx === 3 && extraCount > 0 && (
                                <View style={styles.moreOverlay}>
                                    <Text style={styles.moreOverlayText}>+{extraCount}</Text>
                                </View>
                            )}
                        </View>
                    ))}
                </View>
            );
        };

        return (
            <TouchableWithoutFeedback onPress={handleDoubleTap}>
                <View style={styles.imageContainer}>
                    {renderImageContent()}

                    {/* Double-tap heart overlay */}
                    {showDoubleTapHeart && (
                        <Animated.View
                            style={[
                                styles.doubleTapHeartContainer,
                                {
                                    opacity: doubleTapHeartOpacity,
                                    transform: [{ scale: doubleTapHeartScale }],
                                },
                            ]}
                            pointerEvents="none"
                        >
                            <Ionicons name="heart" size={80} color="#FFFFFF" />
                        </Animated.View>
                    )}
                </View>
            </TouchableWithoutFeedback>
        );
    };

    // Render content with mentions highlighted
    const renderContent = () => {
        return (
            <Text style={[
                styles.content,
                { color: isDark ? DESIGN.textPrimary : theme.text }
            ]}>
                {post.content.split(/(@\w+\s?)/g).map((part, idx) => {
                    if (part.startsWith('@')) {
                        const mentionName = part.substring(1).trim();

                        const taggedUser = post.taggedUsers.find(
                            (u) => {
                                const fullName = `${u.firstName}${u.lastName}`.toLowerCase();
                                const spacedName = `${u.firstName} ${u.lastName}`.toLowerCase();
                                const search = mentionName.toLowerCase();
                                return fullName === search || spacedName === search;
                            }
                        );

                        if (taggedUser) {
                            return (
                                <Text
                                    key={idx}
                                    style={[
                                        styles.mention,
                                        { color: isDark ? DESIGN.platinum : theme.primary }
                                    ]}
                                    onPress={() => router.push(`/profile/${taggedUser.id}`)}
                                >
                                    {part}
                                </Text>
                            );
                        }
                    }
                    return <Text key={idx}>{part}</Text>;
                })}
            </Text>
        );
    };

    // Render avatar with gradient rank ring
    const renderAvatar = () => {
        const avatarContent = post.author.profilePictureUrl ? (
            <Image
                source={{ uri: post.author.profilePictureUrl }}
                style={styles.avatar}
            />
        ) : (
            <View style={[
                styles.avatarPlaceholder,
                { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : theme.border }
            ]}>
                <Ionicons
                    name="person"
                    size={18}
                    color={isDark ? 'rgba(255,255,255,0.5)' : theme.subtext}
                />
            </View>
        );

        // Always show gold rank ring for active members
        return (
            <LinearGradient
                colors={DESIGN.rankPlatinum}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarRingGradient}
            >
                <View style={[
                    styles.avatarInner,
                    { backgroundColor: isDark ? '#0a0a0a' : '#FFFFFF' }
                ]}>
                    {avatarContent}
                </View>
            </LinearGradient>
        );
    };

    // Card content
    const cardContent = (
        <View style={[
            styles.cardInner,
            isDark ? styles.cardInnerDark : styles.cardInnerLight,
            // Remove border if event post (gradient border handles it)
            post.event && isDark && { borderWidth: 0 },
        ]}>
            {/* Header Row */}
            <View style={styles.header}>
                <TouchableOpacity style={styles.authorInfo} onPress={handleAuthorPress}>
                    {/* Avatar with Rank Ring */}
                    {renderAvatar()}

                    {/* Name and Timestamp */}
                    <View style={styles.authorDetails}>
                        <Text style={[
                            styles.authorName,
                            { color: isDark ? DESIGN.textPrimary : theme.text }
                        ]}>
                            {post.author.firstName} {post.author.lastName}
                        </Text>
                        <Text style={[
                            styles.timestamp,
                            { color: isDark ? DESIGN.textSecondary : theme.subtext }
                        ]}>
                            {formatRelativeTime(post.createdAt).toUpperCase()}
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Options Button */}
                {!compact && (
                    <TouchableOpacity
                        onPress={handleOptionsPress}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={[
                            styles.optionsButton,
                            isDark && styles.optionsButtonDark
                        ]}
                    >
                        <Ionicons
                            name="ellipsis-horizontal"
                            size={18}
                            color={isDark ? DESIGN.textSecondary : theme.subtext}
                        />
                    </TouchableOpacity>
                )}
            </View>

            {/* Event Tag - Gold Pill Badge */}
            {post.event && (
                <TouchableOpacity
                    onPress={handleEventPress}
                    style={[
                        styles.eventTag,
                        { backgroundColor: isDark ? DESIGN.platinumBackground : 'rgba(224, 224, 224, 0.12)' }
                    ]}
                    activeOpacity={0.7}
                >
                    <Ionicons
                        name="calendar"
                        size={12}
                        color={DESIGN.platinum}
                    />
                    <Text style={styles.eventTagText}>
                        {post.event.name}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={12}
                        color={DESIGN.platinum}
                    />
                </TouchableOpacity>
            )}

            {/* Content */}
            {renderContent()}

            {/* Images - Cinematic Layout with Double-Tap */}
            {renderImages()}

            {/* Tagged Users */}
            {post.taggedUsers.length > 0 && (
                <View style={styles.tagsContainer}>
                    <Ionicons
                        name="people-outline"
                        size={14}
                        color={isDark ? DESIGN.textTertiary : theme.subtext}
                        style={{ marginTop: 1 }}
                    />
                    <View style={styles.tagsList}>
                        {post.taggedUsers.map((taggedUser, idx) => (
                            <TouchableOpacity
                                key={taggedUser.id}
                                onPress={() => router.push(`/profile/${taggedUser.id}`)}
                            >
                                <Text style={[
                                    styles.tagsText,
                                    { color: isDark ? DESIGN.platinum : theme.primary }
                                ]}>
                                    {taggedUser.firstName} {taggedUser.lastName}
                                    {idx < post.taggedUsers.length - 1 ? ',' : ''}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}

            {/* Action Bar */}
            {!compact && (
                <View style={[
                    styles.actions,
                    { borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }
                ]}>
                    {/* Like Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={handleLike}
                        activeOpacity={0.7}
                    >
                        <Animated.View style={{ transform: [{ scale: likeScale }] }}>
                            <Ionicons
                                name={isLiked ? 'heart' : 'heart-outline'}
                                size={22}
                                color={isLiked ? DESIGN.platinum : (isDark ? DESIGN.textSecondary : theme.subtext)}
                            />
                        </Animated.View>
                        <Text style={[
                            styles.actionText,
                            { color: isDark ? DESIGN.textSecondary : theme.subtext },
                            isLiked && { color: DESIGN.platinum }
                        ]}>
                            {likeCount}
                        </Text>
                    </TouchableOpacity>

                    {/* Comment Button */}
                    <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => onCommentPress?.(post.id)}
                        activeOpacity={0.7}
                    >
                        <Ionicons
                            name="chatbubble-outline"
                            size={20}
                            color={isDark ? DESIGN.textSecondary : theme.subtext}
                        />
                        <Text style={[
                            styles.actionText,
                            { color: isDark ? DESIGN.textSecondary : theme.subtext }
                        ]}>
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

    // Animated entrance wrapper
    const entranceStyle = {
        opacity: entranceAnim,
        transform: [
            {
                translateY: entranceAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [30, 0],
                }),
            },
        ],
    };

    // Event posts get gradient border wrapper
    if (post.event && isDark) {
        return (
            <Animated.View style={entranceStyle}>
                <LinearGradient
                    colors={DESIGN.platinumGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.gradientBorderWrapper}
                >
                    {cardContent}
                </LinearGradient>
            </Animated.View>
        );
    }

    // Normal posts
    return (
        <Animated.View style={entranceStyle}>
            {cardContent}
        </Animated.View>
    );
});

const styles = StyleSheet.create({
    // Gradient border wrapper for event posts
    gradientBorderWrapper: {
        borderRadius: DESIGN.cardBorderRadius + 1,
        padding: 1.5,
    },

    // Card Inner - Obsidian Glass
    cardInner: {
        borderRadius: DESIGN.cardBorderRadius,
        padding: SPACING.md,
        borderWidth: 1,
        overflow: 'hidden',
    },
    cardInnerDark: {
        backgroundColor: DESIGN.cardBackground,
        borderColor: DESIGN.cardBorder,
    },
    cardInnerLight: {
        backgroundColor: DESIGN.lightCardBackground,
        borderColor: DESIGN.lightCardBorder,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 2,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: SPACING.sm,
    },
    authorInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: SPACING.sm,
        flex: 1,
    },

    // Avatar with Rank Ring
    avatarRingGradient: {
        width: 48,
        height: 48,
        borderRadius: 24,
        padding: 2,
    },
    avatarInner: {
        width: '100%',
        height: '100%',
        borderRadius: 22,
        overflow: 'hidden',
    },
    avatar: {
        width: '100%',
        height: '100%',
    },
    avatarPlaceholder: {
        width: '100%',
        height: '100%',
        justifyContent: 'center',
        alignItems: 'center',
    },

    authorDetails: {
        flex: 1,
    },
    authorName: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 2,
    },
    timestamp: {
        fontSize: 11,
        fontWeight: '500',
        letterSpacing: 0.5,
    },
    optionsButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
    },
    optionsButtonDark: {
        backgroundColor: 'rgba(255,255,255,0.05)',
    },

    // Event Tag - Gold Pill
    eventTag: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 6,
        paddingHorizontal: SPACING.sm + 2,
        paddingVertical: 6,
        borderRadius: RADIUS.full,
        marginBottom: SPACING.sm,
    },
    eventTagText: {
        color: DESIGN.platinum,
        fontSize: 12,
        fontWeight: '600',
    },

    // Content
    content: {
        fontSize: 15,
        lineHeight: 22,
        marginBottom: SPACING.sm,
    },
    mention: {
        fontWeight: '600',
    },

    // Image Layouts
    imageContainer: {
        borderRadius: RADIUS.lg,
        overflow: 'hidden',
        marginBottom: SPACING.sm,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: 280,
        borderRadius: RADIUS.lg,
    },
    twoImageGrid: {
        flexDirection: 'row',
        gap: 3,
    },
    halfImage: {
        flex: 1,
        height: 200,
        borderRadius: RADIUS.md,
    },
    mosaicGrid: {
        flexDirection: 'row',
        gap: 3,
        height: 240,
    },
    mosaicLarge: {
        flex: 1.2,
        height: '100%',
        borderRadius: RADIUS.md,
    },
    mosaicRight: {
        flex: 0.8,
        gap: 3,
    },
    mosaicSmall: {
        flex: 1,
        borderRadius: RADIUS.md,
    },
    fourImageGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 3,
    },
    quarterImageWrapper: {
        width: '49%',
        height: 140,
        position: 'relative',
    },
    quarterImage: {
        width: '100%',
        height: '100%',
        borderRadius: RADIUS.sm,
    },
    moreOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: RADIUS.sm,
        justifyContent: 'center',
        alignItems: 'center',
    },
    moreOverlayText: {
        color: '#FFFFFF',
        fontSize: 24,
        fontWeight: '700',
    },

    // Double-tap heart overlay
    doubleTapHeartContainer: {
        ...StyleSheet.absoluteFillObject,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.1)',
    },

    // Tagged Users
    tagsContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 6,
        marginBottom: SPACING.sm,
    },
    tagsList: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 4,
        flex: 1,
    },
    tagsText: {
        fontSize: 13,
        fontWeight: '500',
    },

    // Actions
    actions: {
        flexDirection: 'row',
        gap: SPACING.xl,
        paddingTop: SPACING.sm,
        borderTopWidth: 1,
        marginTop: SPACING.xs,
    },
    actionButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    actionText: {
        fontSize: 14,
        fontWeight: '600',
    },
});
