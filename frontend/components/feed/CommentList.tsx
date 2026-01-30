import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    StyleSheet,
    KeyboardAvoidingView,
    Platform,
    Image,
    Alert,
    ActionSheetIOS,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useHeaderHeight } from '@react-navigation/elements';
import { useTheme } from '@/contexts/ThemeContext';
import { useComments } from '@/hooks/feed';
import { formatRelativeTime } from '@/utils/feed';
import { ReportModal } from '@/components/shared/ReportModal';
import type { FeedCommentUI } from '@/types/feed';

interface CommentListProps {
    postId: string;
    currentUserId?: string;
}

export function CommentList({ postId, currentUserId }: CommentListProps) {
    const { theme, isDark } = useTheme();
    const headerHeight = useHeaderHeight();
    const { comments, isLoading, isCreating, addComment, removeComment } = useComments(postId);
    const [commentText, setCommentText] = useState('');
    const [replyingTo, setReplyingTo] = useState<{ id: string; name: string } | null>(null);
    const [reportingComment, setReportingComment] = useState<{ id: string; authorName: string } | null>(null);

    const handleSubmit = async () => {
        if (!commentText.trim()) return;

        const success = await addComment(commentText, replyingTo?.id);
        if (success) {
            setCommentText('');
            setReplyingTo(null);
        }
    };

    const handleDelete = (commentId: string) => {
        Alert.alert(
            'Delete Comment',
            'Are you sure you want to delete this comment?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => removeComment(commentId),
                },
            ]
        );
    };

    const handleCommentOptions = (comment: FeedCommentUI) => {
        const isAuthor = currentUserId === comment.userId;
        const authorName = `${comment.author.firstName} ${comment.author.lastName}`;

        if (isAuthor) {
            // Author can only delete
            handleDelete(comment.id);
        } else {
            // Non-author can report
            if (Platform.OS === 'ios') {
                ActionSheetIOS.showActionSheetWithOptions(
                    {
                        options: ['Cancel', 'Report Comment'],
                        destructiveButtonIndex: 1,
                        cancelButtonIndex: 0,
                        userInterfaceStyle: isDark ? 'dark' : 'light',
                    },
                    (buttonIndex) => {
                        if (buttonIndex === 1) {
                            setReportingComment({ id: comment.id, authorName });
                        }
                    }
                );
            } else {
                Alert.alert(
                    'Comment Options',
                    'Choose an action',
                    [
                        { text: 'Cancel', style: 'cancel' },
                        {
                            text: 'Report',
                            onPress: () => setReportingComment({ id: comment.id, authorName }),
                            style: 'destructive',
                        },
                    ]
                );
            }
        }
    };

    const renderComment = ({ item, isReply = false, depth = 0 }: { item: FeedCommentUI; isReply?: boolean; depth?: number }) => (
        <View style={[
            styles.commentContainer,
            isReply && styles.replyContainer,
            isReply && { borderLeftColor: theme.border }
        ]}>
            <View style={styles.commentHeader}>
                {item.author.profilePictureUrl ? (
                    <Image
                        source={{ uri: item.author.profilePictureUrl }}
                        style={styles.commentAvatar}
                    />
                ) : (
                    <View style={[styles.commentAvatar, styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                        <Ionicons name="person" size={14} color={theme.subtext} />
                    </View>
                )}
                <View style={styles.commentContent}>
                    <View style={styles.commentMeta}>
                        <Text style={[styles.commentAuthor, { color: theme.text }]}>
                            {item.author.firstName} {item.author.lastName}
                        </Text>
                        <Text style={[styles.commentTime, { color: theme.subtext }]}>
                            {formatRelativeTime(item.createdAt)}
                        </Text>
                    </View>
                    <Text style={[styles.commentText, { color: theme.text }]}>{item.content}</Text>

                    {/* Actions Row */}
                    <View style={styles.actionRow}>
                        {depth < 5 && (
                            <TouchableOpacity
                                onPress={() => setReplyingTo({ id: item.id, name: `${item.author.firstName} ${item.author.lastName}` })}
                                style={styles.replyButton}
                            >
                                <Text style={[styles.replyButtonText, { color: theme.subtext }]}>Reply</Text>
                            </TouchableOpacity>
                        )}

                        {currentUserId === item.userId ? (
                            <TouchableOpacity onPress={() => handleDelete(item.id)}>
                                <Ionicons name="trash-outline" size={16} color={theme.error} />
                            </TouchableOpacity>
                        ) : (
                            <TouchableOpacity onPress={() => handleCommentOptions(item)}>
                                <Ionicons name="ellipsis-horizontal" size={16} color={theme.subtext} />
                            </TouchableOpacity>
                        )}
                    </View>
                </View>
            </View>

            {/* Nested Replies */}
            {item.replies && item.replies.length > 0 && (
                <View style={styles.repliesList}>
                    {item.replies.map((reply, index) => (
                        <View key={reply.id} style={index === item.replies!.length - 1 ? { marginBottom: 0 } : { marginBottom: 16 }}>
                            {renderComment({ item: reply, isReply: true, depth: depth + 1 })}
                        </View>
                    ))}
                </View>
            )}
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={Platform.OS === 'ios' ? headerHeight + 60 : 0}
            style={styles.container}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerText, { color: theme.text }]}>
                    Comments ({comments.length})
                </Text>
            </View>

            <FlatList
                data={comments}
                renderItem={(props) => renderComment({ ...props, isReply: false })}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
                ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                        <Ionicons name="chatbubble-outline" size={48} color={theme.subtext} />
                        <Text style={[styles.emptyText, { color: theme.subtext }]}>
                            No comments yet. Be the first to comment!
                        </Text>
                    </View>
                }
            />

            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderTopColor: theme.border }]}>
                {replyingTo && (
                    <View style={[styles.replyingToBar, { backgroundColor: theme.background }]}>
                        <Text style={[styles.replyingToText, { color: theme.subtext }]}>
                            Replying to <Text style={{ fontWeight: 'bold' }}>{replyingTo.name}</Text>
                        </Text>
                        <TouchableOpacity onPress={() => setReplyingTo(null)}>
                            <Ionicons name="close-circle" size={20} color={theme.subtext} />
                        </TouchableOpacity>
                    </View>
                )}
                <View style={styles.inputWrapper}>
                    <TextInput
                        style={[styles.input, { color: theme.text, backgroundColor: theme.background }]}
                        placeholder="Add a comment..."
                        placeholderTextColor={theme.subtext}
                        value={commentText}
                        onChangeText={setCommentText}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: commentText.trim() ? theme.primary : theme.border },
                        ]}
                        onPress={handleSubmit}
                        disabled={!commentText.trim() || isCreating}
                    >
                        {isCreating ? (
                            <Ionicons name="hourglass-outline" size={20} color="#FFFFFF" />
                        ) : (
                            <Ionicons name="send" size={20} color="#FFFFFF" />
                        )}
                    </TouchableOpacity>
                </View>
            </View>

            {/* Report Modal for Comments */}
            <ReportModal
                visible={reportingComment !== null}
                onClose={() => setReportingComment(null)}
                targetType="comment"
                targetId={reportingComment?.id || ''}
                targetName={reportingComment?.authorName}
            />
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        padding: 16,
        borderBottomWidth: 1,
    },
    headerText: {
        fontSize: 18,
        fontWeight: '600',
    },
    listContent: {
        padding: 16,
    },
    commentContainer: {
        // marginBottom removed here and handled by parent wrapper or list separator
    },
    commentHeader: {
        flexDirection: 'row',
        gap: 10,
    },
    commentAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
    },
    avatarPlaceholder: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    commentContent: {
        flex: 1,
    },
    commentMeta: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    commentAuthor: {
        fontSize: 14,
        fontWeight: '600',
    },
    commentTime: {
        fontSize: 12,
    },
    commentText: {
        fontSize: 14,
        lineHeight: 18,
    },
    emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 40,
    },
    emptyText: {
        fontSize: 14,
        marginTop: 12,
        textAlign: 'center',
    },
    inputContainer: {
        flexDirection: 'row',
        padding: 12,
        gap: 10,
        borderTopWidth: 1,
    },
    input: {
        flex: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 10,
        fontSize: 14,
        maxHeight: 100,
    },
    sendButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 12,
    },
    replyButton: {
        paddingVertical: 2,
    },
    replyButtonText: {
        fontSize: 12,
        fontWeight: '500',
    },
    replyContainer: {
        marginLeft: 16,
        marginTop: 8,
        paddingLeft: 12,
        borderLeftWidth: 2,
        // color set dynamically in component
    },
    repliesList: {
        marginTop: 4,
    },
    replyingToBar: {
        position: 'absolute',
        top: -30,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 6,
        borderTopLeftRadius: 12,
        borderTopRightRadius: 12,
        zIndex: 1,
    },
    replyingToText: {
        fontSize: 12,
    },
    inputWrapper: {
        flexDirection: 'row',
        gap: 10,
        flex: 1,
    }
});
