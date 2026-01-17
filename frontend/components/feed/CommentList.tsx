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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useComments } from '@/hooks/feed';
import { formatRelativeTime } from '@/utils/feed';
import type { FeedCommentUI } from '@/types/feed';

interface CommentListProps {
    postId: string;
    currentUserId?: string;
}

export function CommentList({ postId, currentUserId }: CommentListProps) {
    const { theme } = useTheme();
    const { comments, isLoading, isCreating, addComment, removeComment } = useComments(postId);
    const [commentText, setCommentText] = useState('');

    const handleSubmit = async () => {
        if (!commentText.trim()) return;

        const success = await addComment(commentText);
        if (success) {
            setCommentText('');
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

    const renderComment = ({ item }: { item: FeedCommentUI }) => (
        <View style={styles.commentContainer}>
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
                </View>
                {currentUserId === item.userId && (
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                        <Ionicons name="trash-outline" size={16} color={theme.error} />
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    return (
        <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.container}
        >
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
                <Text style={[styles.headerText, { color: theme.text }]}>
                    Comments ({comments.length})
                </Text>
            </View>

            <FlatList
                data={comments}
                renderItem={renderComment}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
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
        marginBottom: 16,
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
});
