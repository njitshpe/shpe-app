import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTime, formatDateHeader } from '../../utils/date';
import { useEvents } from '../../context/EventsContext';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events } = useEvents();

  // Find the event from context
  const event = events.find((evt) => evt.id === id);

  // Defensive: handle null/undefined hostName
  const hostName = (event?.hostName ?? '').trim();
  const hostInitial = (hostName[0] ?? '?').toUpperCase();

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Cover Image - Square 1:1 with rounded bottom corners */}
        <View style={styles.heroContainer}>
          {event.coverImageUrl && (
            <Image source={{ uri: event.coverImageUrl }} style={styles.coverImage} />
          )}

          {/* Floating Top Controls */}
          <View style={[styles.topControls, { paddingTop: insets.top + 8 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#1C1C1E" />
            </Pressable>

            <Pressable style={styles.shareButton} onPress={() => console.log('Share')}>
              <Ionicons name="share-outline" size={22} color="#1C1C1E" />
            </Pressable>
          </View>
        </View>

        {/* Event Content */}
        <View style={styles.content}>

          {/* Title - High-end Typography */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Tags */}
          {event.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {event.tags.map((tag) => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Action Pill Row */}
          <View style={styles.actionPillRow}>
            {/* Register Pill - Black Background */}
            <Pressable
              style={({ pressed }) => [
                styles.registerPill,
                pressed && styles.pillPressed,
              ]}
              onPress={() => console.log('Register')}
            >
              <Ionicons name="add-circle-outline" size={20} color="#FDFBF7" />
              <Text style={styles.registerPillText}>Register</Text>
            </Pressable>

            {/* Contact Pill - White Background */}
            <Pressable
              style={({ pressed }) => [
                styles.contactPill,
                pressed && styles.pillPressed,
              ]}
              onPress={() => console.log('Contact')}
            >
              <Ionicons name="camera-outline" size={20} color="#1C1C1E" />
              <Text style={styles.contactPillText}>Check-In</Text>
            </Pressable>

            {/* More Circle - White Background */}
            <Pressable
              style={({ pressed }) => [
                styles.moreCircle,
                pressed && styles.pillPressed,
              ]}
              onPress={() => console.log('More')}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="#1C1C1E" />
            </Pressable>
          </View>

          {/* Date & Time */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>DATE & TIME</Text>
            <Text style={styles.infoValue}>{formatDateHeader(event.startTimeISO)}</Text>
            <Text style={styles.infoValue}>
              {formatTime(event.startTimeISO)} - {formatTime(event.endTimeISO)}
            </Text>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color="#1C1C1E" style={styles.locationIcon} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{event.locationName}</Text>
                {event.address && <Text style={styles.locationAddress}>{event.address}</Text>}
              </View>
            </View>

            {/* Map Preview Card */}
            <View style={styles.mapCard}>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={40} color="#6e6e73" />
              </View>
              <Text style={styles.mapSubtext}>Map preview</Text>
            </View>
          </View>

          {/* Partners Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Partners</Text>
            <View style={styles.hostRow}>
              <View style={styles.hostAvatarLarge}>
                <Text style={styles.hostAvatarLargeText}>{hostInitial}</Text>
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostNameLarge}>{hostName || 'Unknown host'}</Text>
                <Text style={styles.hostMeta}>Event organizer</Text>
              </View>
              <Pressable onPress={() => console.log('Contact host')}>
                <Ionicons name="mail-outline" size={22} color="#1C1C1E" />
              </Pressable>
            </View>
          </View>

          {/* About Event Section */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

          {/* Capacity Warning */}
          {event.capacityLabel && (
            <View style={styles.capacityWarning}>
              <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" style={styles.warningIcon} />
              <Text style={styles.capacityText}>{event.capacityLabel}</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  // GALLERY THEME - Warm Paper Background
  container: {
    flex: 1,
    backgroundColor: '#FDFBF7',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },

  // HERO IMAGE - Square 1:1 with rounded bottom corners (Tab feel)
  heroContainer: {
    position: 'relative',
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH, // Square 1:1 aspect ratio
    backgroundColor: '#E8E5E0',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    backgroundColor: '#E8E5E0',
  },

  // FLOATING CONTROLS - Light mode with shadows
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253, 251, 247, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  shareButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(253, 251, 247, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },

  // CONTENT AREA
  content: {
    padding: 24,
  },
  // HOST LINE
  hostLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  hostAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  hostAvatarText: {
    color: '#FDFBF7',
    fontSize: 11,
    fontWeight: '700',
  },
  hostLineText: {
    fontSize: 15,
    color: '#6e6e73',
    fontWeight: '500',
    flex: 1,
  },

  // TITLE - HIGH-END TYPOGRAPHY
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1C1C1E',
    marginBottom: 20,
    lineHeight: 38,
    letterSpacing: -0.5,
  },

  // TAGS
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  tag: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#F5F3F0',
    borderWidth: 1,
    borderColor: '#E8E5E0',
  },
  tagText: {
    color: '#6e6e73',
    fontSize: 13,
    fontWeight: '600',
  },

  // ACTION PILL ROW - Artistic Floating Buttons
  actionPillRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  registerPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  registerPillText: {
    color: '#FDFBF7',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  contactPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FDFBF7',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 24,
    gap: 8,
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  contactPillText: {
    color: '#1C1C1E',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  moreCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#FDFBF7',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#1C1C1E',
  },
  pillPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },

  // INFO BLOCKS
  infoBlock: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E5E0',
  },
  infoLabel: {
    fontSize: 11,
    color: '#6e6e73',
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '500',
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 22,
    color: '#1C1C1E',
    fontWeight: '700',
  },

  // SECTIONS
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 18,
    letterSpacing: -0.4,
  },
  // LOCATION
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 15,
    color: '#6e6e73',
    lineHeight: 22,
  },
  mapCard: {
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
  mapPlaceholder: {
    backgroundColor: '#F5F3F0',
    borderRadius: 12,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  mapSubtext: {
    fontSize: 13,
    color: '#6e6e73',
    textAlign: 'center',
    fontWeight: '500',
  },
  // HOST SECTION
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  hostAvatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1C1C1E',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarLargeText: {
    color: '#FDFBF7',
    fontSize: 22,
    fontWeight: '700',
  },
  hostInfo: {
    flex: 1,
  },
  hostNameLarge: {
    fontSize: 17,
    color: '#1C1C1E',
    fontWeight: '600',
    marginBottom: 4,
  },
  hostMeta: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '500',
  },

  // DESCRIPTION
  description: {
    fontSize: 16,
    color: '#1C1C1E',
    lineHeight: 26,
    fontWeight: '400',
  },
  // CAPACITY WARNING
  capacityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF4E6',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE4B8',
  },
  warningIcon: {
    marginRight: 10,
  },
  capacityText: {
    color: '#D97706',
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },

  // ERROR STATE
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
    backgroundColor: '#FDFBF7',
  },
  errorText: {
    fontSize: 18,
    color: '#1C1C1E',
    marginBottom: 24,
    fontWeight: '600',
  },
  errorBackButton: {
    backgroundColor: '#1C1C1E',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
  },
  backButtonText: {
    color: '#FDFBF7',
    fontSize: 16,
    fontWeight: '600',
  },
});
