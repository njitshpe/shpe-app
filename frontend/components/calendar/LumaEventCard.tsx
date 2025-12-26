import React from 'react';
import { View, Text, StyleSheet, Pressable, Image } from 'react-native';
import { Event } from '../../data/mockEvents';
import { formatTime } from '../../utils/date';
import { Ionicons } from '@expo/vector-icons';

interface LumaEventCardProps {
  event: Event;
  onPress: () => void;
  isAdminMode?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function LumaEventCard({
  event,
  onPress,
  isAdminMode,
  onEdit,
  onDelete,
}: LumaEventCardProps) {
  // Defensive: handle null/undefined hostName
  const hostName = (event.hostName ?? '').trim();
  const hostInitial = (hostName[0] ?? '?').toUpperCase();

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.content}>
        {/* Left: Event Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {event.coverImageUrl ? (
            <Image source={{ uri: event.coverImageUrl }} style={styles.thumbnail} />
          ) : (
            <View style={[styles.thumbnail, styles.placeholderThumbnail]}>
              <Ionicons name="calendar-outline" size={28} color="#6B7280" />
            </View>
          )}
        </View>

        {/* Center: Event Info */}
        <View style={styles.centerContent}>
          {/* Host Row */}
          <View style={styles.hostRow}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>
                {hostInitial}
              </Text>
            </View>
            <Text style={styles.hostName}>{hostName || 'Unknown host'}</Text>
          </View>

          {/* Title */}
          <Text style={styles.title} numberOfLines={2}>
            {event.title}
          </Text>

          {/* Meta Row: Time + Location */}
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={13} color="#6B7280" />
              <Text style={styles.metaText}>{formatTime(event.startTimeISO)}</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="location-outline" size={13} color="#6B7280" />
              <Text style={styles.metaText} numberOfLines={1}>
                {event.locationName}
              </Text>
            </View>
          </View>
        </View>

        {/* Right: Price */}
        {event.priceLabel && (
          <View style={styles.priceContainer}>
            <View style={styles.priceBadge}>
              <Text style={styles.priceLabel}>{event.priceLabel}</Text>
            </View>
          </View>
        )}
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
            <Ionicons name="pencil-outline" size={14} color="#9CA3AF" />
            <Text style={styles.adminButtonText}>Edit</Text>
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
            <Ionicons name="trash-outline" size={14} color="#FCA5A5" />
            <Text style={[styles.adminButtonText, styles.deleteButtonText]}>Delete</Text>
          </Pressable>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  cardPressed: {
    opacity: 0.65,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },
  content: {
    flexDirection: 'row',
    gap: 12,
  },
  thumbnailContainer: {
    width: 58,
    height: 58,
  },
  thumbnail: {
    width: 58,
    height: 58,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  placeholderThumbnail: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 1,
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 5,
  },
  hostAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarText: {
    color: '#FFFFFF',
    fontSize: 8,
    fontWeight: '700',
  },
  hostName: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
    fontWeight: '500',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 21,
    marginBottom: 5,
    letterSpacing: -0.2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
  },
  metaDivider: {
    width: 1,
    height: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  metaText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.50)',
    flex: 1,
  },
  priceContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingLeft: 8,
  },
  priceBadge: {
    // No badge background for minimal Luma style
  },
  priceLabel: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  adminControls: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  adminButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  adminButtonPressed: {
    opacity: 0.65,
  },
  adminButtonText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.60)',
    fontWeight: '600',
  },
  deleteButton: {
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
  },
  deleteButtonText: {
    color: '#FCA5A5',
  },
});
