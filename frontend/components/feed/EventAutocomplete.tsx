import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/lib/supabase';
import type { EventDB } from '@/types/events';

interface EventAutocompleteProps {
    onSelect: (event: { id: string; name: string } | null) => void;
    initialEvent?: { id: string; name: string } | null;
}

export function EventAutocomplete({ onSelect, initialEvent }: EventAutocompleteProps) {
    const { theme } = useTheme();
    const [query, setQuery] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<{ id: string; name: string } | null>(null);
    const [suggestions, setSuggestions] = useState<EventDB[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (initialEvent) {
            setSelectedEvent(initialEvent);
            setQuery(initialEvent.name);
        }
    }, [initialEvent]);

    useEffect(() => {
        // Debounce search
        const timeoutId = setTimeout(() => {
            if (query.trim().length > 1 && !selectedEvent) {
                searchEvents(query);
            } else {
                setSuggestions([]);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [query, selectedEvent]);

    const searchEvents = async (searchText: string) => {
        setIsLoading(true);
        try {
            // Search for upcoming or recent events
            const { data, error } = await supabase
                .from('events')
                .select('id, name, start_time')
                .ilike('name', `%${searchText}%`)
                .order('start_time', { ascending: false })
                .limit(5);

            if (!error && data) {
                setSuggestions(data as any);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSelect = (event: EventDB) => {
        const eventData = { id: event.id, name: event.name };
        setSelectedEvent(eventData);
        setQuery(event.name);
        setSuggestions([]);
        onSelect(eventData);
        setIsFocused(false);
    };

    const handleClear = () => {
        setQuery('');
        setSelectedEvent(null);
        setSuggestions([]);
        onSelect(null);
    };

    return (
        <View style={styles.container}>
            <View style={[styles.inputContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                <Ionicons name="calendar-outline" size={20} color={theme.subtext} style={styles.icon} />
                <TextInput
                    style={[styles.input, { color: theme.text }]}
                    placeholder="Tag an event..."
                    placeholderTextColor={theme.subtext}
                    value={query}
                    onChangeText={(text) => {
                        setQuery(text);
                        if (selectedEvent && text !== selectedEvent.name) {
                            setSelectedEvent(null);
                            onSelect(null);
                        }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                />
                {(query.length > 0 || isLoading) && (
                    <View style={styles.rightIcon}>
                        {isLoading ? (
                            <ActivityIndicator size="small" color={theme.primary} />
                        ) : (
                            <TouchableOpacity onPress={handleClear}>
                                <Ionicons name="close-circle" size={18} color={theme.subtext} />
                            </TouchableOpacity>
                        )}
                    </View>
                )}
            </View>

            {isFocused && suggestions.length > 0 && (
                <View style={[styles.suggestionsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
                    {suggestions.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            style={[styles.suggestionItem, { borderBottomColor: theme.border }]}
                            onPress={() => handleSelect(item)}
                        >
                            <Text style={[styles.suggestionText, { color: theme.text }]}>{item.name}</Text>
                            <Text style={[styles.suggestionDate, { color: theme.subtext }]}>
                                {new Date(item.start_time).toLocaleDateString()}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        zIndex: 10,
        marginBottom: 12,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 50,
    },
    icon: {
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 16,
        paddingVertical: 12,
    },
    rightIcon: {
        marginLeft: 8,
    },
    suggestionsContainer: {
        position: 'absolute',
        top: 55, // Height of input + margin
        left: 0,
        right: 0,
        borderWidth: 1,
        borderRadius: 12,
        maxHeight: 200,
        overflow: 'hidden',
        zIndex: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 5,
    },
    suggestionItem: {
        padding: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    suggestionText: {
        fontSize: 14,
        fontWeight: '500',
    },
    suggestionDate: {
        fontSize: 12,
        marginTop: 2,
    },
});
