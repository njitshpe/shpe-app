import React, { useState, useEffect } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Text,
    Modal,
    Alert,
    DeviceEventEmitter,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { useFeed } from '@/hooks/feed';
import { deletePost } from '@/lib/feedService';
import { FeedCard, CommentList } from '@/components/feed';
import type { FeedPostUI } from '@/types/feed';
import { FeedSkeleton } from '@/components/ui/FeedSkeleton';

export default function FeedScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { user } = useAuth();
    const { posts, isLoading, isRefreshing, error, hasMore, loadMore, refresh, removePost } = useFeed();
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

    // Listen for refresh events (e.g. from creating a post)
    useEffect(() => {
        const subscription = DeviceEventEmitter.addListener('feed:refresh', () => {
            refresh();
        });
        return () => {
            subscription.remove();
        };
    }, [refresh]);

    const handleCommentPress = (postId: string) => {
        setSelectedPostId(postId);
    };

    const handleCloseComments = () => {
        setSelectedPostId(null);
    };

    const renderPost = ({ item }: { item: FeedPostUI }) => (
        <FeedCard
            post={item}
            onCommentPress={handleCommentPress}
            onEdit={(post) => router.push({ pathname: '/feed/create', params: { id: post.id } })}
            onDelete={async (postId) => {
                const result = await deletePost(postId);
                if (result.success) {
                    removePost(postId);
                } else {
                    Alert.alert('Error', result.error?.message || 'Failed to delete post');
                }
            }}
        />
    );

    const renderHeader = () => (
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Feed</Text>
            <TouchableOpacity
                style={[styles.createButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/feed/create')}
            >
                <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
        </View>
    );

    if (isLoading && posts.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: theme.background }]}>
                {renderHeader()}
                <View style={styles.listContent}>
                    <FeedSkeleton />
                    <FeedSkeleton />
                    <FeedSkeleton />
                </View>
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}

            {error ? (
                <View style={[styles.errorBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    <Text style={[styles.errorText, { color: theme.error }]}>
                        {error}
                    </Text>
                </View>
            ) : null}

            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listContent}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        tintColor={theme.primary}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
            />

            {/* Comments Modal */}
            <Modal
                visible={selectedPostId !== null}
                animationType="slide"
                presentationStyle="pageSheet"
                onRequestClose={handleCloseComments}
            >
                <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.background }]}>
                    <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
                        <TouchableOpacity onPress={handleCloseComments}>
                            <Ionicons name="close" size={28} color={theme.text} />
                        </TouchableOpacity>
                    </View>
                    {selectedPostId && <CommentList postId={selectedPostId} currentUserId={user?.id} />}
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    errorBanner: {
        marginHorizontal: 16,
        marginTop: 12,
        padding: 12,
        borderRadius: 12,
        borderWidth: 1,
    },
    errorText: {
        fontSize: 14,
        fontWeight: '600',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        paddingTop: 60, // Account for status bar
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    createButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        padding: 16,
    },
    modalContainer: {
        flex: 1,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        padding: 16,
        borderBottomWidth: 1,
    },
});
