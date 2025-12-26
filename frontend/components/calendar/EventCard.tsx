import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Event } from '../../data/mockEvents';
import { formatTime } from '../../utils/date';

interface EventCardProps {
  event: Event;
  onPress: () => void;
  isAdminMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function EventCard({ event, onPress, isAdminMode, onEdit, onDelete }: EventCardProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Left: Event Info */}
        <View style={styles.leftContent}>
          <Text style={styles.time}>{formatTime(event.startTimeISO)}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>
          <Text style={styles.host}>{event.hostName}</Text>
          <Text style={styles.location} numberOfLines={1}>
            📍 {event.locationName}
          </Text>

          {/* Tags and Badges */}
          <View style={styles.tagsContainer}>
            {event.tags.slice(0, 3).map((tag) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
            {event.priceLabel && (
              <View style={[styles.tag, styles.priceTag]}>
                <Text style={styles.priceText}>{event.priceLabel}</Text>
              </View>
            )}
            {event.capacityLabel && (
              <View style={[styles.tag, styles.capacityTag]}>
                <Text style={styles.capacityText}>{event.capacityLabel}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Right: Cover Image */}
        <View style={styles.rightContent}>
          {event.coverImageUrl ? (
            <Image source={{ uri: event.coverImageUrl }} style={styles.coverImage} />
          ) : (
            <View style={[styles.coverImage, styles.placeholderImage]} />
          )}
        </View>
      </View>

      {/* Admin Controls */}
      {isAdminMode && (
        <View style={styles.adminControls}>
          <Pressable
            style={({ pressed }) => [styles.adminButton, pressed && styles.adminButtonPressed]}
            onPress={(e) => {
              e.stopPropagation();
              onEdit?.();
            }}
          >
            <Text style={styles.adminButtonText}>✏️ Edit</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.adminButton,
              styles.deleteButton,
              pressed && styles.adminButtonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              onDelete?.();
            }}
          >
            <Text style={[styles.adminButtonText, styles.deleteButtonText]}>🗑️ Delete</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  cardPressed: {
    opacity: 0.7,
  },
  content: {
    flexDirection: 'row',
    gap: 16,
  },
  leftContent: {
    flex: 1,
  },
  rightContent: {
    width: 100,
  },
  time: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 6,
    lineHeight: 24,
  },
  host: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  location: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  tagText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  priceTag: {
    backgroundColor: '#10B98120',
  },
  priceText: {
    color: '#10B981',
    fontWeight: '600',
  },
  capacityTag: {
    backgroundColor: '#F59E0B20',
  },
  capacityText: {
    color: '#F59E0B',
    fontWeight: '600',
  },
  coverImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#374151',
  },
  placeholderImage: {
    backgroundColor: '#4B5563',
  },
  adminControls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#374151',
  },
  adminButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#374151',
  },
  adminButtonPressed: {
    opacity: 0.7,
  },
  adminButtonText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
  },
  deleteButtonText: {
    color: '#FCA5A5',
  },
});
