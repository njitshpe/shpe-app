import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTime, formatDateHeader } from '../../../utils/date';
import { useEvents } from '../../../contexts/EventsContext';
import { Ionicons } from '@expo/vector-icons';
import MapPreview from '../../../components/MapPreview';
import AttendeesPreview from '../../../components/events/AttendeesPreview';
import EventActionBar, { ACTION_BAR_BASE_HEIGHT } from '../../../components/events/EventActionBar';
import RegistrationSuccessModal from '../../../components/events/RegistrationSuccessModal';
import EventMoreMenu from '../../../components/events/EventMoreMenu';
import { useEventRegistration } from '../../../hooks/useEventRegistration';
import { deviceCalendarService } from '../../../services/deviceCalendar.service';
import { shareService } from '../../../services/share.service';
import * as Haptics from 'expo-haptics';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events } = useEvents();

  // Find the event from context
  const event = events.find((evt) => evt.id === id);

  // Registration state
  const { isRegistered, loading, register, cancel } = useEventRegistration(id || '');

  // UI state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);

  // Defensive: handle null/undefined hostName
  const hostName = (event?.hostName ?? '').trim();
  const hostInitial = (hostName[0] ?? '?').toUpperCase();

  /**
   * Handle Register button press
   */
  const handleRegister = async () => {
    if (isRegistered) {
      // Already registered - could show ticket or just do nothing
      Alert.alert(
        'Already Registered',
        'You are already registered for this event.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await register();
      setShowSuccessModal(true);
    } catch (error) {
      Alert.alert(
        'Registration Failed',
        'Unable to register for this event. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  /**
   * Handle Check-In button press
   */
  const handleCheckIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push({
      pathname: '/check-in',
      params: { eventId: id },
    });
  };

  /**
   * Handle More menu button press
   */
  const handleMorePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowMoreMenu(true);
  };

  /**
   * Handle Share button press
   */
  const handleShare = async () => {
    if (!event) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await shareService.shareEvent({
      title: event.title,
      startTimeISO: event.startTimeISO,
      endTimeISO: event.endTimeISO,
      locationName: event.locationName,
      address: event.address,
      description: event.description,
      // deepLink: `shpe-app://event/${event.id}`, // Add when deep linking is implemented
    });
  };

  /**
   * Handle Add to Calendar
   */
  const handleAddToCalendar = async () => {
    if (!event) return;

    await deviceCalendarService.addToCalendar({
      title: event.title,
      startDate: event.startTimeISO,
      endDate: event.endTimeISO,
      location: event.address || event.locationName,
      notes: event.description,
    });
  };

  /**
   * Handle Cancel Registration
   */
  const handleCancelRegistration = async () => {
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      await cancel();
      Alert.alert(
        'Registration Cancelled',
        'Your registration has been cancelled.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert(
        'Cancellation Failed',
        'Unable to cancel registration. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

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
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: ACTION_BAR_BASE_HEIGHT + (insets.bottom || 16) + 16 },
        ]}
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

            <Pressable style={styles.shareButton} onPress={handleShare}>
              <Ionicons name="share-outline" size={22} color="#1C1C1E" />
            </Pressable>
          </View>
        </View>

        {/* Event Content */}
        <View style={styles.content}>

          {/* Title - High-end Typography */}
          <Text style={styles.title}>{event.title}</Text>

          {/* Date & Time */}
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>DATE & TIME</Text>
            <Text style={styles.infoValue}>{formatDateHeader(event.startTimeISO)}</Text>
            <Text style={styles.infoValue}>
              {formatTime(event.startTimeISO)} - {formatTime(event.endTimeISO)}
            </Text>
          </View>

          {/* About Event Section */}
          {event.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>About Event</Text>
              <Text style={styles.description}>{event.description}</Text>
            </View>
          )}

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
            <MapPreview
              locationName={event.locationName}
              address={event.address}
              latitude={event.latitude}
              longitude={event.longitude}
            />
          </View>

          {/* Hosts Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hosts</Text>
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

          {/* Attendees Preview Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Who's Going</Text>
            <AttendeesPreview eventId={event.id} />
          </View>

          {/* Capacity Warning */}
          {event.capacityLabel && (
            <View style={styles.capacityWarning}>
              <Ionicons name="alert-circle-outline" size={18} color="#F59E0B" style={styles.warningIcon} />
              <Text style={styles.capacityText}>{event.capacityLabel}</Text>
            </View>
          )}

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


        </View>
      </ScrollView>


      {/* Sticky Action Bar */}
      <EventActionBar
        onRegisterPress={handleRegister}
        onCheckInPress={handleCheckIn}
        onMorePress={handleMorePress}
        isRegistered={isRegistered}
        isCheckInAvailable={true}
        isLoading={loading}
      />

      {/* Registration Success Modal */}
      <RegistrationSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />

      {/* More Menu */}
      <EventMoreMenu
        visible={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        isRegistered={isRegistered}
        onAddToCalendar={handleAddToCalendar}
        onCancelRegistration={handleCancelRegistration}
      />
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
    // paddingBottom is set dynamically in component
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
