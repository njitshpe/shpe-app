import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profile.service';
import { mentionCacheService } from '@/services/mentionCache.service';
import type { UserProfile } from '@/types/userProfile';

interface UserAutocompleteProps {
    query: string | null;
    onSelect: (user: UserProfile) => void;
}

export function UserAutocomplete({ query, onSelect }: UserAutocompleteProps) {
    const { theme } = useTheme();
    const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (query === null) return;

        const loadSuggestions = async () => {
            // Case 1: Query is empty or too short -> show recent tags
            if (!query || query.trim().length < 3) {
                setLoading(false);
                const recents = await mentionCacheService.getRecents();
                // Filter recents by query if there is one (even if < 3 chars)
                if (query && query.trim().length > 0) {
                    const lowerQuery = query.toLowerCase();
                    const filtered = recents.filter(u =>
                        u.first_name.toLowerCase().includes(lowerQuery) ||
                        u.last_name.toLowerCase().includes(lowerQuery)
                    );
                    setSuggestions(filtered);
                } else {
                    setSuggestions(recents);
                }
                return;
            }

            // Case 2: Query is long enough -> search database
            setLoading(true);
            const { data } = await profileService.searchProfiles(query);
            if (data) {
                setSuggestions(data);
            }
            setLoading(false);
        };

        // 300ms delay to prevent too many requests or flickering
        const timeout = setTimeout(loadSuggestions, 300); 
        return () => clearTimeout(timeout);
    }, [query]);

    // If query is null, it means we are NOT in a tagging state
    if (query === null) return null;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ActivityIndicator color={theme.primary} size="small" style={{ margin: 10 }} />
            </View>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                nestedScrollEnabled={true}
                style={{ maxHeight: 200 }}
            >
                {suggestions.map((item) => (
                    <TouchableOpacity
                        key={item.id}
                        style={[styles.item, { borderBottomColor: theme.border }]}
                        onPress={() => onSelect(item)}
                    >
                        <Image
                            source={{
                                uri: item.profile_picture_url || 'https://via.placeholder.com/40' // Fallback
                            }}
                            style={styles.avatar}
                        />
                        <View style={styles.info}>
                            <Text style={[styles.name, { color: theme.text }]}>
                                {item.first_name} {item.last_name}
                            </Text>
                            <Text style={[styles.handle, { color: theme.subtext }]}>
                                @{item.first_name.toLowerCase()}.{item.last_name.toLowerCase()}
                            </Text>
                        </View>
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        top: '100%', // Position below the input box
        left: 0,
        right: 0,
        backgroundColor: 'white',
        maxHeight: 200,
        borderRadius: 8,
        borderWidth: 1,
        marginTop: 4, // Little bit of spacing
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 9999, // Ensure it's on top
    },
    item: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 10,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    avatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        marginRight: 10,
    },
    info: {
        flex: 1,
    },
    name: {
        fontWeight: '600',
        fontSize: 14,
    },
    handle: {
        fontSize: 12,
    },
});
