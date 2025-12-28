import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventAttendeesPreview } from '../../hooks/useEventAttendees';

interface AttendeesPreviewProps {
  eventId: string;
  previewCount?: number; // Number of avatars to show (default: 4)
  namesCount?: number; // Number of names to list (default: 4)
}

export default function AttendeesPreview({
  eventId,
  previewCount = 4,
  namesCount = 4,
}: AttendeesPreviewProps) {
  const router = useRouter();
  const { totalCount, attendees, isLoading, error } = useEventAttendeesPreview(eventId, previewCount);

  // Generate initials from name
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return parts[0]?.substring(0, 2).toUpperCase() || '??';
  };

  // Format the names string
  const namesString = useMemo(() => {
    if (attendees.length === 0) return 'Be the first to register';

    const displayNames = attendees.slice(0, namesCount).map((a) => a.name);
    const remaining = totalCount - namesCount;

    if (remaining > 0) {
      return `${displayNames.join(', ')}, and ${remaining} more`;
    }
    return displayNames.join(', ');
  }, [attendees, totalCount, namesCount]);

  const handlePress = () => {
    router.push(`/event/${eventId}/attendees`);
  };

  // Error state
  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color="#EF4444" />
          <Text style={styles.errorText}>Failed to load attendees</Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="small" color="#1C1C1E" />
      </View>
    );
  }

  const remainingCount = Math.max(0, totalCount - previewCount);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, pressed && styles.containerPressed]}
      onPress={handlePress}
    >
      {/* Header: "X Going" */}
      <View style={styles.header}>
        <Text style={styles.goingCount}>
          {totalCount} Going
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#6e6e73" />
      </View>

      {/* Avatars Row with +X */}
      {totalCount > 0 && (
        <View style={styles.avatarsRow}>
          {attendees.slice(0, previewCount).map((attendee, index) => (
            <View
              key={attendee.id}
              style={[
                styles.avatarWrapper,
                index > 0 && styles.avatarOverlap,
                { zIndex: previewCount - index },
              ]}
            >
              {attendee.avatarUrl ? (
                <Image source={{ uri: attendee.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarInitials}>{getInitials(attendee.name)}</Text>
                </View>
              )}
            </View>
          ))}

          {/* +X Circle */}
          {remainingCount > 0 && (
            <View style={[styles.avatarWrapper, styles.avatarOverlap, styles.remainingCircle]}>
              <Text style={styles.remainingText}>+{remainingCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Names Preview Line */}
      <Text style={styles.namesText} numberOfLines={2}>
        {namesString}
      </Text>
    </Pressable>
  );
}

const AVATAR_SIZE = 40;
const AVATAR_OVERLAP = -12;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8E5E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  containerPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  goingCount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1C1C1E',
    letterSpacing: -0.3,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarWrapper: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    backgroundColor: '#E8E5E0',
    overflow: 'hidden',
  },
  avatarOverlap: {
    marginLeft: AVATAR_OVERLAP,
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  avatarFallback: {
    width: '100%',
    height: '100%',
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    color: '#FDFBF7',
    fontSize: 14,
    fontWeight: '700',
  },
  remainingCircle: {
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    color: '#FDFBF7',
    fontSize: 13,
    fontWeight: '700',
  },
  namesText: {
    fontSize: 14,
    color: '#6e6e73',
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontWeight: '500',
  },
});
