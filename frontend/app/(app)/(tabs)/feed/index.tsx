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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
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
    const { theme, isDark } = useTheme();
    const router = useRouter();
    const insets = useSafeAreaInsets();
    const { user } = useAuth();
    const { posts, isLoading, isRefreshing, error, loadMore, refresh, removePost } = useFeed();
    const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
    const headerHeight = insets.top + 56;
    const listTopPadding = headerHeight + 12;
    const listBottomPadding = 24 + insets.bottom;
    const feedBackground = isDark ? '#0A0A0A' : '#FAFAFA';
    const gradientColors = isDark
        ? (['#0B0B0B', '#000000'] as const)
        : (['#FFFFFF', '#F1F4FA'] as const);
    const headerBackground = isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(255, 255, 255, 0.95)';
    const headerBorder = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)';

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

    const renderPost = ({ item, index }: { item: FeedPostUI; index: number }) => (
        <FeedCard
            post={item}
            index={index}
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
        <View
            style={[
                styles.header,
                {
                    paddingTop: insets.top + 6,
                    backgroundColor: headerBackground,
                    borderBottomColor: headerBorder,
                },
            ]}
        >
            <View style={styles.headerContent}>
                <Text style={[styles.headerTitle, { color: theme.text }]}>Feed</Text>
                <TouchableOpacity
                    style={[styles.createButton, { borderColor: headerBorder }]}
                    onPress={() => router.push('/feed/create')}
                >
                    <Ionicons name="add" size={22} color={theme.text} />
                </TouchableOpacity>
            </View>
        </View>
    );

    const listHeader = error ? (
        <View style={[styles.errorBanner, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.errorText, { color: theme.error }]}>
                {error}
            </Text>
        </View>
    ) : null;

    if (isLoading && posts.length === 0) {
        return (
            <View style={[styles.container, { backgroundColor: feedBackground }]}>
                <LinearGradient
                    colors={gradientColors}
                    style={StyleSheet.absoluteFillObject}
                    pointerEvents="none"
                />
                <View style={[styles.listContent, { paddingTop: listTopPadding, paddingBottom: listBottomPadding }]}>
                    <FeedSkeleton />
                    <FeedSkeleton />
                    <FeedSkeleton />
                </View>
                {renderHeader()}
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: feedBackground }]}>
            <LinearGradient
                colors={gradientColors}
                style={StyleSheet.absoluteFillObject}
                pointerEvents="none"
            />
            <FlatList
                data={posts}
                renderItem={renderPost}
                keyExtractor={(item) => item.id}
                contentContainerStyle={[styles.listContent, { paddingTop: listTopPadding, paddingBottom: listBottomPadding }]}
                ListHeaderComponent={listHeader}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefreshing}
                        onRefresh={refresh}
                        tintColor={theme.primary}
                        progressViewOffset={headerHeight}
                    />
                }
                onEndReached={loadMore}
                onEndReachedThreshold={0.5}
                initialNumToRender={10}
                maxToRenderPerBatch={10}
                windowSize={5}
                removeClippedSubviews={true}
                showsVerticalScrollIndicator={false}
            />

            {/* Absolutely positioned header for top bar */}
            {renderHeader()}

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
        padding: 10,
        borderRadius: 10,
        borderWidth: 1,
    },
    errorText: {
        fontSize: 13,
        fontWeight: '600',
    },
    header: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        paddingHorizontal: 16,
        paddingBottom: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
        zIndex: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
        elevation: 6,
    },
    headerContent: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 26,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    createButton: {
        width: 36,
        height: 36,
        borderRadius: 10,
        borderWidth: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    listContent: {
        paddingBottom: 0,
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
