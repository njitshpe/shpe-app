import React, { useState } from 'react';
import {
    View,
    FlatList,
    StyleSheet,
    RefreshControl,
    TouchableOpacity,
    Text,
    Modal,
    SafeAreaView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useFeed } from '@/hooks/feed';
import { FeedCard, CommentList } from '@/components/feed';
import type { FeedPostUI } from '@/types/feed';

export default function FeedScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { posts, isLoading, isRefreshing, hasMore, loadMore, refresh } = useFeed();
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

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

    return (
        <View style={[styles.container, { backgroundColor: theme.background }]}>
            {renderHeader()}

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
                    {selectedPostId && <CommentList postId={selectedPostId} />}
                </SafeAreaView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
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
