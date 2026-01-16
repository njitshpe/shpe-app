import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { profileService } from '@/services/profile.service';
import type { UserProfile } from '@/types/userProfile';

interface UserAutocompleteProps {
    query: string;
    onSelect: (user: UserProfile) => void;
}

export function UserAutocomplete({ query, onSelect }: UserAutocompleteProps) {
    const { theme } = useTheme();
    const [suggestions, setSuggestions] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (!query.trim()) {
                setSuggestions([]);
                return;
            }

            setLoading(true);
            const { data } = await profileService.searchProfiles(query);
            if (data) {
                setSuggestions(data);
            }
            setLoading(false);
        };

        const timeout = setTimeout(fetchSuggestions, 300); // 300ms debounce
        return () => clearTimeout(timeout);
    }, [query]);

    if (!query) return null;

    if (loading) {
        return (
            <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <ActivityIndicator color={theme.primary} size="small" />
            </View>
        );
    }

    if (suggestions.length === 0) {
        return null;
    }

    return (
        <View style={[styles.container, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <FlatList
                data={suggestions}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => (
                    <TouchableOpacity
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
                )}
            />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 60, // Above toolbar
        left: 10,
        right: 10,
        maxHeight: 200,
        borderRadius: 12,
        borderWidth: 1,
        elevation: 5,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 1000,
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
