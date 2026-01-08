import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Alert,
    ActivityIndicator,
} from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { CreateEventData } from '@/services/adminEvents.service';
import { Ionicons } from '@expo/vector-icons';

interface AdminEventFormProps {
    initialData?: Partial<CreateEventData>;
    onSubmit: (data: CreateEventData) => Promise<boolean>;
    onCancel: () => void;
    mode: 'create' | 'edit';
}

export function AdminEventForm({ initialData, onSubmit, onCancel, mode }: AdminEventFormProps) {
    const { theme, isDark } = useTheme();
    const [loading, setLoading] = useState(false);

    // Form state
    const [name, setName] = useState(initialData?.name || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [locationName, setLocationName] = useState(initialData?.location_name || '');
    const [location, setLocation] = useState(initialData?.location || '');
    const [startTime, setStartTime] = useState(initialData?.start_time || '');
    const [endTime, setEndTime] = useState(initialData?.end_time || '');
    const [hostName, setHostName] = useState(initialData?.host_name || '');
    const [priceLabel, setPriceLabel] = useState(initialData?.price_label || '');
    const [maxAttendees, setMaxAttendees] = useState(initialData?.max_attendees?.toString() || '');

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        card: { backgroundColor: theme.card, borderColor: theme.border },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        input: {
            backgroundColor: isDark ? '#1C1C1E' : '#F5F5F5',
            color: theme.text,
            borderColor: theme.border,
        },
        button: { backgroundColor: theme.primary },
        cancelButton: { backgroundColor: isDark ? '#333' : '#E5E5E5' },
    };

    const validateForm = (): string | null => {
        if (!name.trim()) return 'Event name is required';
        if (!locationName.trim()) return 'Location name is required';
        if (!startTime.trim()) return 'Start time is required';
        if (!endTime.trim()) return 'End time is required';

        // Validate date format (ISO 8601)
        const startDate = new Date(startTime);
        const endDate = new Date(endTime);

        if (isNaN(startDate.getTime())) return 'Invalid start time format. Use ISO 8601 (e.g., 2026-02-01T18:00:00Z)';
        if (isNaN(endDate.getTime())) return 'Invalid end time format. Use ISO 8601 (e.g., 2026-02-01T20:00:00Z)';
        if (endDate <= startDate) return 'End time must be after start time';

        return null;
    };

    const handleSubmit = async () => {
        const error = validateForm();
        if (error) {
            Alert.alert('Validation Error', error);
            return;
        }

        setLoading(true);
        try {
            const eventData: CreateEventData = {
                name: name.trim(),
                description: description.trim() || undefined,
                location_name: locationName.trim(),
                location: location.trim() || undefined,
                start_time: startTime.trim(),
                end_time: endTime.trim(),
                host_name: hostName.trim() || undefined,
                price_label: priceLabel.trim() || undefined,
                max_attendees: maxAttendees ? parseInt(maxAttendees, 10) : undefined,
            };

            const success = await onSubmit(eventData);
            if (success) {
                Alert.alert(
                    'Success',
                    `Event ${mode === 'create' ? 'created' : 'updated'} successfully!`,
                    [{ text: 'OK', onPress: onCancel }]
                );
            } else {
                Alert.alert('Error', `Failed to ${mode} event. Please try again.`);
            }
        } catch (error) {
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={[styles.container, dynamicStyles.container]}>
            <View style={styles.content}>
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.title, dynamicStyles.text]}>
                        {mode === 'create' ? 'Create Event' : 'Edit Event'}
                    </Text>
                    <TouchableOpacity onPress={onCancel} disabled={loading}>
                        <Ionicons name="close" size={28} color={theme.text} />
                    </TouchableOpacity>
                </View>

                {/* Form Fields */}
                <View style={styles.form}>
                    {/* Event Name */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Event Name *</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={name}
                            onChangeText={setName}
                            placeholder="e.g., General Meeting"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                        />
                    </View>

                    {/* Description */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea, dynamicStyles.input]}
                            value={description}
                            onChangeText={setDescription}
                            placeholder="Event description..."
                            placeholderTextColor={theme.subtext}
                            multiline
                            numberOfLines={4}
                            editable={!loading}
                        />
                    </View>

                    {/* Location Name */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Location Name *</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={locationName}
                            onChangeText={setLocationName}
                            placeholder="e.g., GITC 1100"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                        />
                    </View>

                    {/* Full Address */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Full Address</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={location}
                            onChangeText={setLocation}
                            placeholder="e.g., 323 Dr Martin Luther King Jr Blvd, Newark, NJ"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                        />
                    </View>

                    {/* Start Time */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Start Time (ISO 8601) *</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={startTime}
                            onChangeText={setStartTime}
                            placeholder="2026-02-01T18:00:00Z"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                            autoCapitalize="none"
                        />
                        <Text style={[styles.hint, dynamicStyles.subtext]}>
                            Format: YYYY-MM-DDTHH:MM:SSZ
                        </Text>
                    </View>

                    {/* End Time */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>End Time (ISO 8601) *</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={endTime}
                            onChangeText={setEndTime}
                            placeholder="2026-02-01T20:00:00Z"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                            autoCapitalize="none"
                        />
                    </View>

                    {/* Host Name */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Host Name</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={hostName}
                            onChangeText={setHostName}
                            placeholder="e.g., SHPE NJIT"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                        />
                    </View>

                    {/* Price Label */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Price Label</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={priceLabel}
                            onChangeText={setPriceLabel}
                            placeholder="e.g., Free, $5, Members Only"
                            placeholderTextColor={theme.subtext}
                            editable={!loading}
                        />
                    </View>

                    {/* Max Attendees */}
                    <View style={styles.field}>
                        <Text style={[styles.label, dynamicStyles.text]}>Max Attendees</Text>
                        <TextInput
                            style={[styles.input, dynamicStyles.input]}
                            value={maxAttendees}
                            onChangeText={setMaxAttendees}
                            placeholder="Leave empty for unlimited"
                            placeholderTextColor={theme.subtext}
                            keyboardType="number-pad"
                            editable={!loading}
                        />
                    </View>
                </View>

                {/* Action Buttons */}
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={[styles.button, dynamicStyles.cancelButton]}
                        onPress={onCancel}
                        disabled={loading}
                    >
                        <Text style={[styles.buttonText, dynamicStyles.text]}>Cancel</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.button, styles.submitButton, dynamicStyles.button]}
                        onPress={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.submitButtonText}>
                                {mode === 'create' ? 'Create Event' : 'Save Changes'}
                            </Text>
                        )}
                    </TouchableOpacity>
                </View>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        padding: 20,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 28,
        fontWeight: '700',
    },
    form: {
        gap: 20,
    },
    field: {
        gap: 8,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    input: {
        borderWidth: 1,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
    },
    textArea: {
        minHeight: 100,
        textAlignVertical: 'top',
    },
    hint: {
        fontSize: 12,
        marginTop: 4,
    },
    actions: {
        flexDirection: 'row',
        gap: 12,
        marginTop: 32,
        marginBottom: 40,
    },
    button: {
        flex: 1,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButton: {
        flex: 2,
    },
    buttonText: {
        fontSize: 16,
        fontWeight: '600',
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});
