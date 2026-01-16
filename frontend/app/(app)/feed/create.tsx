import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Audio } from 'expo-av';
import { useTheme } from '@/contexts/ThemeContext';
import { usePost } from '@/hooks/feed';
import { validatePostContent } from '@/utils/feed';
import { SuccessToast } from '@/components/ui/SuccessToast';
import { EventAutocomplete } from '@/components/feed';
import { UserAutocomplete } from '@/components/feed/UserAutocomplete';
import { supabase } from '@/lib/supabase';
import type { UserProfile } from '@/types/userProfile';

export default function CreatePostScreen() {
    const { theme } = useTheme();
    const router = useRouter();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { create, update, isCreating } = usePost();

    const [content, setContent] = useState('');
    const [imageUris, setImageUris] = useState<string[]>([]);
    const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null);
    const [taggedUsers, setTaggedUsers] = useState<UserProfile[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [showSuccess, setShowSuccess] = useState(false);
    const [isLoadingPost, setIsLoadingPost] = useState(false);

    React.useEffect(() => {
        if (id) {
            fetchPostDetails(id);
        }
    }, [id]);

    const fetchPostDetails = async (postId: string) => {
        setIsLoadingPost(true);
        const { data: post, error } = await supabase
            .from('feed_posts')
            .select('content, image_urls, event_id')
            .eq('id', postId)
            .single();

        if (error) {
            console.error('[CreatePost] Error fetching post:', error);
            setIsLoadingPost(false);
            return;
        }

        if (post) {
            setContent(post.content);
            setImageUris(post.image_urls || []);

            if (post.event_id) {
                const { data: event } = await supabase
                    .from('events')
                    .select('id, name')
                    .eq('id', post.event_id)
                    .single();

                if (event) {
                    setSelectedEvent(event);
                }
            }
        }
        setIsLoadingPost(false);
    };

    const handlePickImages = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (status !== 'granted') {
            Alert.alert('Permission Required', 'Please allow access to your photo library to upload images.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsMultipleSelection: true,
            quality: 1,
            selectionLimit: 5,
        });

        if (!result.canceled) {
            const newUris = result.assets.map(asset => asset.uri);
            setImageUris(prev => [...prev, ...newUris].slice(0, 5)); // Max 5 images
        }
    };

    const handleRemoveImage = (index: number) => {
        setImageUris(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async () => {
        const validationError = validatePostContent(content);
        if (validationError) {
            Alert.alert('Validation Error', validationError);
            return;
        }

        let result;
        if (id) {
            result = await update(id, content, imageUris, selectedEvent?.id);
        } else {
            result = await create({
                content,
                imageUris,
                eventId: selectedEvent?.id,
                taggedUserIds: taggedUsers.map(u => u.id),
            });
        }

        if (result) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            await playSuccessSound();
            setShowSuccess(true);
        }
    };

    const playSuccessSound = async () => {
        try {
            const { sound } = await Audio.Sound.createAsync(
                require('@/assets/sounds/success.mp3')
            );
            await sound.playAsync();
        } catch (error) {
            // Fallback to system sound if file missing, or just ignore
            console.log('Error playing sound', error);
        }
    };

    const handleSuccessHide = () => {
        setShowSuccess(false);
        router.back();
    };

    const canSubmit = content.trim().length > 0 && !isCreating;

    return (
        <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
                <TouchableOpacity onPress={() => router.back()}>
                    <Ionicons name="close" size={28} color={theme.text} />
                </TouchableOpacity>
                <Text style={[styles.headerTitle, { color: theme.text }]}>
                    {id ? 'Edit Post' : 'Create Post'}
                </Text>
                <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={!canSubmit}
                    style={[
                        styles.postButton,
                        { backgroundColor: canSubmit ? theme.primary : theme.border },
                    ]}
                >
                    {isCreating ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                        <Text style={styles.postButtonText}>{id ? 'Update' : 'Post'}</Text>
                    )}
                </TouchableOpacity>
            </View>

            {isLoadingPost ? (
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={theme.primary} />
                </View>
            ) : (
                <ScrollView
                    style={styles.content}
                    contentContainerStyle={styles.contentContainer}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Event Tagging */}
                    <EventAutocomplete
                        onSelect={setSelectedEvent}
                        initialEvent={selectedEvent}
                    />

                    {/* Text Input */}
                    <View style={styles.inputContainer}>
                        <TextInput
                            style={[styles.input, { color: theme.text }]}
                            placeholder="What's on your mind? Type @ to tag someone..."
                            placeholderTextColor={theme.subtext}
                            value={content}
                            onChangeText={(text) => {
                                setContent(text);
                                const lastWord = text.split(' ').pop();
                                if (lastWord && lastWord.startsWith('@')) {
                                    setMentionQuery(lastWord.substring(1));
                                } else {
                                    setMentionQuery('');
                                }
                            }}
                            multiline
                            maxLength={5000}
                            autoFocus
                        />
                        <UserAutocomplete
                            query={mentionQuery}
                            onSelect={(user) => {
                                const words = content.split(' ');
                                words.pop(); // Remove the partial @mention
                                words.push(`@${user.first_name}${user.last_name} `);
                                setContent(words.join(' '));
                                setMentionQuery('');
                                // Add to tagged users if not already added
                                if (!taggedUsers.find(u => u.id === user.id)) {
                                    setTaggedUsers(prev => [...prev, user]);
                                }
                            }}
                        />
                    </View>

                    {/* Character Count */}
                    <Text style={[styles.charCount, { color: theme.subtext }]}>
                        {content.length} / 5000
                    </Text>

                    {/* Image Preview */}
                    {imageUris.length > 0 && (
                        <View style={styles.imagesContainer}>
                            {imageUris.map((uri, index) => (
                                <View key={index} style={styles.imageWrapper}>
                                    <Image source={{ uri }} style={styles.image} />
                                    <TouchableOpacity
                                        style={[styles.removeButton, { backgroundColor: theme.error }]}
                                        onPress={() => handleRemoveImage(index)}
                                    >
                                        <Ionicons name="close" size={16} color="#FFFFFF" />
                                    </TouchableOpacity>
                                </View>
                            ))}
                        </View>
                    )}

                    {/* Add Images Button */}
                    {imageUris.length < 5 && (
                        <TouchableOpacity
                            style={[styles.addButton, { borderColor: theme.border }]}
                            onPress={handlePickImages}
                        >
                            <Ionicons name="image-outline" size={24} color={theme.primary} />
                            <Text style={[styles.addButtonText, { color: theme.text }]}>
                                Add Images ({imageUris.length}/5)
                            </Text>
                        </TouchableOpacity>
                    )}

                    {/* Info Text */}
                    <Text style={[styles.infoText, { color: theme.subtext }]}>
                        Images will be compressed to optimize storage and loading times.
                    </Text>
                </ScrollView>
            )}

            <SuccessToast
                visible={showSuccess}
                message={id ? "Post updated!" : "Posted successfully!"}
                onHide={handleSuccessHide}
            />
        </SafeAreaView>
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
        borderBottomWidth: 1,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    postButton: {
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        minWidth: 70,
        alignItems: 'center',
    },
    postButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    content: {
        flex: 1,
    },
    contentContainer: {
        padding: 16,
    },
    inputContainer: {
        position: 'relative',
        zIndex: 10,
    },
    input: {
        fontSize: 16,
        lineHeight: 22,
        minHeight: 150,
        textAlignVertical: 'top',
    },
    charCount: {
        fontSize: 12,
        textAlign: 'right',
        marginTop: 8,
        marginBottom: 16,
    },
    imagesContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 16,
    },
    imageWrapper: {
        position: 'relative',
        width: '48%',
        aspectRatio: 1,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 8,
    },
    removeButton: {
        position: 'absolute',
        top: 8,
        right: 8,
        width: 24,
        height: 24,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: 16,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderRadius: 8,
        marginBottom: 16,
    },
    addButtonText: {
        fontSize: 16,
        fontWeight: '500',
    },
    infoText: {
        fontSize: 12,
        textAlign: 'center',
        fontStyle: 'italic',
        marginBottom: 20,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
});
