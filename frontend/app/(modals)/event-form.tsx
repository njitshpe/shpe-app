import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useEvents } from '@/contexts/EventsContext';
import { Event } from '@/data/mockEvents';

export default function EventFormScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ mode: 'create' | 'edit'; id?: string }>();
  const { events, addEvent, updateEvent } = useEvents();

  const isEditMode = params.mode === 'edit';
  const existingEvent = isEditMode
    ? events.find((e) => e.id === params.id)
    : undefined;

  // Form state
  const [title, setTitle] = useState(existingEvent?.title || '');
  const [description, setDescription] = useState(existingEvent?.description || '');
  const [startTimeISO, setStartTimeISO] = useState(existingEvent?.startTimeISO || '');
  const [endTimeISO, setEndTimeISO] = useState(existingEvent?.endTimeISO || '');
  const [locationName, setLocationName] = useState(existingEvent?.locationName || '');
  const [address, setAddress] = useState(existingEvent?.address || '');
  const [coverImageUrl, setCoverImageUrl] = useState(existingEvent?.coverImageUrl || '');
  const [hostName, setHostName] = useState(existingEvent?.hostName || 'SHPE NJIT');
  const [tags, setTags] = useState(existingEvent?.tags?.join(', ') || '');
  const [priceLabel, setPriceLabel] = useState(existingEvent?.priceLabel || '');
  const [capacityLabel, setCapacityLabel] = useState(existingEvent?.capacityLabel || '');
  const [status, setStatus] = useState<'upcoming' | 'past'>(
    existingEvent?.status || 'upcoming'
  );

  const handleSave = () => {
    // Validation
    if (!title.trim()) {
      Alert.alert('Validation Error', 'Title is required');
      return;
    }
    if (!startTimeISO.trim()) {
      Alert.alert('Validation Error', 'Start time is required');
      return;
    }
    if (!endTimeISO.trim()) {
      Alert.alert('Validation Error', 'End time is required');
      return;
    }

    // Parse tags
    const parsedTags = tags
      .split(',')
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0);

    const eventData: Event = {
      id: isEditMode && existingEvent ? existingEvent.id : `evt-${Date.now()}`,
      title: title.trim(),
      description: description.trim() || undefined,
      startTimeISO: startTimeISO.trim(),
      endTimeISO: endTimeISO.trim(),
      locationName: locationName.trim() || 'TBD',
      address: address.trim() || undefined,
      coverImageUrl: coverImageUrl.trim() || undefined,
      hostName: hostName.trim(),
      tags: parsedTags,
      priceLabel: priceLabel.trim() || undefined,
      capacityLabel: capacityLabel.trim() || undefined,
      status,
    };

    if (isEditMode && existingEvent) {
      updateEvent(existingEvent.id, eventData);
    } else {
      addEvent(eventData);
    }

    router.back();
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>{isEditMode ? 'Edit Event' : 'Create Event'}</Text>

        {/* Title */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Title <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Event title"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Description */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Event description"
            placeholderTextColor="#6B7280"
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Start Time */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            Start Time (ISO) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={startTimeISO}
            onChangeText={setStartTimeISO}
            placeholder="2026-01-28T18:00:00Z"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* End Time */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>
            End Time (ISO) <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.input}
            value={endTimeISO}
            onChangeText={setEndTimeISO}
            placeholder="2026-01-28T20:00:00Z"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Location Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Location Name</Text>
          <TextInput
            style={styles.input}
            value={locationName}
            onChangeText={setLocationName}
            placeholder="GITC 1100"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Address */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Address</Text>
          <TextInput
            style={styles.input}
            value={address}
            onChangeText={setAddress}
            placeholder="123 Main St, Newark, NJ"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Cover Image URL */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Cover Image URL</Text>
          <TextInput
            style={styles.input}
            value={coverImageUrl}
            onChangeText={setCoverImageUrl}
            placeholder="https://..."
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Host Name */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Host Name</Text>
          <TextInput
            style={styles.input}
            value={hostName}
            onChangeText={setHostName}
            placeholder="SHPE NJIT"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Tags */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Tags (comma-separated)</Text>
          <TextInput
            style={styles.input}
            value={tags}
            onChangeText={setTags}
            placeholder="General Meeting, Networking, All Majors"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Capacity Label */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Capacity Label</Text>
          <TextInput
            style={styles.input}
            value={capacityLabel}
            onChangeText={setCapacityLabel}
            placeholder="Limited spots"
            placeholderTextColor="#6B7280"
          />
        </View>

        {/* Status Toggle */}
        <View style={styles.fieldContainer}>
          <Text style={styles.label}>Status</Text>
          <View style={styles.statusToggle}>
            <Pressable
              style={[
                styles.statusButton,
                status === 'upcoming' && styles.statusButtonSelected,
              ]}
              onPress={() => setStatus('upcoming')}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === 'upcoming' && styles.statusButtonTextSelected,
                ]}
              >
                Upcoming
              </Text>
            </Pressable>
            <Pressable
              style={[styles.statusButton, status === 'past' && styles.statusButtonSelected]}
              onPress={() => setStatus('past')}
            >
              <Text
                style={[
                  styles.statusButtonText,
                  status === 'past' && styles.statusButtonTextSelected,
                ]}
              >
                Past
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
            onPress={handleSave}
          >
            <Text style={styles.saveButtonText}>Save Event</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.cancelButton, pressed && styles.buttonPressed]}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 24,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  required: {
    color: '#EF4444',
  },
  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#F9FAFB',
  },
  textArea: {
    minHeight: 100,
    paddingTop: 12,
  },
  statusToggle: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    alignItems: 'center',
  },
  statusButtonSelected: {
    backgroundColor: '#10B981',
    borderColor: '#10B981',
  },
  statusButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  statusButtonTextSelected: {
    color: '#FFFFFF',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
