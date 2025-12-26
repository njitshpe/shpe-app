import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTime, formatDateHeader } from '../../utils/date';
import { useEvents } from '../../context/EventsContext';
import { FloatingIconButton } from '../../components/ui/FloatingIconButton';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events } = useEvents();

  // Find the event from context
  const event = events.find((evt) => evt.id === id);

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Event not found</Text>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
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
        {/* Hero Cover Image with Floating Controls */}
        <View style={styles.heroContainer}>
          {event.coverImageUrl && (
            <Image source={{ uri: event.coverImageUrl }} style={styles.coverImage} />
          )}

          {/* Dark Gradient Scrim */}
          <LinearGradient
            colors={['rgba(11, 18, 32, 0)', 'rgba(11, 18, 32, 0.9)']}
            style={styles.gradientScrim}
          />

          {/* Floating Top Controls */}
          <View style={[styles.topControls, { paddingTop: insets.top + 8 }]}>
            <FloatingIconButton
              icon={<Ionicons name="arrow-back" size={20} color="#F9FAFB" />}
              onPress={() => router.back()}
            />

            <FloatingIconButton
              icon={<Ionicons name="share-outline" size={20} color="#F9FAFB" />}
              onPress={() => console.log('Share')}
            />
          </View>
        </View>

        {/* Event Content */}
        <View style={styles.content}>
          {/* Host Line */}
          <Pressable style={styles.hostLine} onPress={() => console.log('View host')}>
            <View style={styles.hostAvatar}>
              <Text style={styles.hostAvatarText}>{event.hostName.charAt(0)}</Text>
            </View>
            <Text style={styles.hostLineText}>{event.hostName}</Text>
            <Ionicons name="chevron-forward" size={18} color="#6B7280" />
          </Pressable>

          {/* Title */}
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

          {/* Date & Time */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>DATE & TIME</Text>
            <Text style={styles.infoValue}>{formatDateHeader(event.startTimeISO)}</Text>
            <Text style={styles.infoValue}>
              {formatTime(event.startTimeISO)} - {formatTime(event.endTimeISO)}
            </Text>
          </View>

          {/* Price */}
          {event.priceLabel && (
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>PRICE</Text>
              <Text style={styles.priceValue}>{event.priceLabel}</Text>
            </View>
          )}

          {/* Action Buttons Row */}
          <View style={styles.actionButtons}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.primaryButtonText}>Register</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            >
              <Text style={styles.secondaryButtonText}>Contact</Text>
            </Pressable>

            <Pressable
              style={({ pressed }) => [styles.iconButton, pressed && styles.buttonPressed]}
            >
              <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255, 255, 255, 0.70)" />
            </Pressable>
          </View>

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={18} color="rgba(255, 255, 255, 0.55)" style={styles.locationIcon} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationName}>{event.locationName}</Text>
                {event.address && <Text style={styles.locationAddress}>{event.address}</Text>}
              </View>
            </View>

            {/* Map Preview Card */}
            <View style={styles.mapCard}>
              <View style={styles.mapPlaceholder}>
                <Ionicons name="map-outline" size={40} color="rgba(255, 255, 255, 0.35)" />
              </View>
              <Text style={styles.mapSubtext}>Map preview</Text>
            </View>
          </View>

          {/* Host Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Host</Text>
            <View style={styles.hostRow}>
              <View style={styles.hostAvatarLarge}>
                <Text style={styles.hostAvatarLargeText}>{event.hostName.charAt(0)}</Text>
              </View>
              <View style={styles.hostInfo}>
                <Text style={styles.hostNameLarge}>{event.hostName}</Text>
                <Text style={styles.hostMeta}>Event organizer</Text>
              </View>
              <Pressable onPress={() => console.log('Contact host')}>
                <Ionicons name="mail-outline" size={22} color="rgba(255, 255, 255, 0.60)" />
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
  container: {
    flex: 1,
    backgroundColor: '#0A0F1C',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  heroContainer: {
    position: 'relative',
    height: 300,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  gradientScrim: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  content: {
    padding: 20,
  },
  hostLine: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  hostAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  hostAvatarText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  hostLineText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.60)',
    fontWeight: '500',
    flex: 1,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: 'rgba(255, 255, 255, 0.96)',
    marginBottom: 18,
    lineHeight: 40,
    letterSpacing: -0.6,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 26,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 13,
    fontWeight: '500',
  },
  infoBlock: {
    marginBottom: 22,
    paddingBottom: 22,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  infoLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.8,
  },
  infoValue: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.90)',
    fontWeight: '500',
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 36,
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  iconButton: {
    width: 56,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  secondaryButtonText: {
    color: 'rgba(255, 255, 255, 0.70)',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  buttonPressed: {
    opacity: 0.65,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationIcon: {
    marginTop: 2,
    marginRight: 10,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.88)',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.55)',
    lineHeight: 20,
  },
  mapCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  mapPlaceholder: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    height: 160,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  mapSubtext: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.45)',
    textAlign: 'center',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatarLarge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarLargeText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '600',
  },
  hostInfo: {
    flex: 1,
  },
  hostNameLarge: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.90)',
    fontWeight: '600',
    marginBottom: 2,
  },
  hostMeta: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.50)',
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.70)',
    lineHeight: 24,
  },
  capacityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.10)',
    padding: 14,
    borderRadius: 14,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  warningIcon: {
    marginRight: 8,
  },
  capacityText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.55)',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
