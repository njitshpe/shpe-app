import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useEventAttendeesPreview } from '@/hooks/events';
import { useTheme } from '@/contexts/ThemeContext';

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
  const { theme, isDark } = useTheme();
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

  const dynamicStyles = {
    container: { backgroundColor: theme.card, borderColor: theme.border },
    text: { color: theme.text },
    subtext: { color: theme.subtext },
    avatarWrapper: { borderColor: theme.card, backgroundColor: theme.border },
    avatarFallback: { backgroundColor: theme.text },
    avatarInitials: { color: theme.background },
    remainingCircle: { backgroundColor: theme.text },
    remainingText: { color: theme.background },
    iconColor: theme.subtext,
  };

  // Error state
  if (error) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={20} color={theme.error} />
          <Text style={[styles.errorText, { color: theme.error }]}>Failed to load attendees</Text>
        </View>
      </View>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <ActivityIndicator size="small" color={theme.text} />
      </View>
    );
  }

  const remainingCount = Math.max(0, totalCount - previewCount);

  return (
    <Pressable
      style={({ pressed }) => [styles.container, dynamicStyles.container, pressed && styles.containerPressed]}
      onPress={handlePress}
    >
      {/* Header: "X Going" */}
      <View style={styles.header}>
        <Text style={[styles.goingCount, dynamicStyles.text]}>
          {totalCount} Going
        </Text>
        <Ionicons name="chevron-forward" size={20} color={dynamicStyles.iconColor} />
      </View>

      {/* Avatars Row with +X */}
      {totalCount > 0 && (
        <View style={styles.avatarsRow}>
          {attendees.slice(0, previewCount).map((attendee, index) => (
            <View
              key={attendee.id}
              style={[
                styles.avatarWrapper,
                dynamicStyles.avatarWrapper,
                index > 0 && styles.avatarOverlap,
                { zIndex: previewCount - index },
              ]}
            >
              {attendee.avatarUrl ? (
                <Image source={{ uri: attendee.avatarUrl }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatarFallback, dynamicStyles.avatarFallback]}>
                  <Text style={[styles.avatarInitials, dynamicStyles.avatarInitials]}>{getInitials(attendee.name)}</Text>
                </View>
              )}
            </View>
          ))}

          {/* +X Circle */}
          {remainingCount > 0 && (
            <View style={[styles.avatarWrapper, dynamicStyles.avatarWrapper, styles.avatarOverlap, styles.remainingCircle, dynamicStyles.remainingCircle]}>
              <Text style={[styles.remainingText, dynamicStyles.remainingText]}>+{remainingCount}</Text>
            </View>
          )}
        </View>
      )}

      {/* Names Preview Line */}
      <Text style={[styles.namesText, dynamicStyles.subtext]} numberOfLines={2}>
        {namesString}
      </Text>
    </Pressable>
  );
}

const AVATAR_SIZE = 40;
const AVATAR_OVERLAP = -12;

const styles = StyleSheet.create({
  container: {
    // backgroundColor removed
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    // borderColor removed
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
    // color removed
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
    // borderColor removed
    // backgroundColor removed
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
    // backgroundColor removed
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    // color removed
    fontSize: 14,
    fontWeight: '700',
  },
  remainingCircle: {
    // backgroundColor removed
    alignItems: 'center',
    justifyContent: 'center',
  },
  remainingText: {
    // color removed
    fontSize: 13,
    fontWeight: '700',
  },
  namesText: {
    fontSize: 14,
    // color removed
    lineHeight: 20,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    // color removed
    fontWeight: '500',
  },
});
