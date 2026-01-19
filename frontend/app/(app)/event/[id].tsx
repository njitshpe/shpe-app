import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { formatTime, formatDateHeader } from '@/utils';
import { useEvents } from '@/contexts/EventsContext';
import { Event } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';
import { MapPreview } from '@/components/shared';
import {
  AttendeesPreview,
  EventActionBar,
  ACTION_BAR_BASE_HEIGHT,
  RegistrationSuccessModal,
  EventMoreMenu,
} from '@/components/events';
import { CheckInQRModal } from '@/components/admin/CheckInQRModal';
import { useEventRegistration } from '@/hooks/events';
import { deviceCalendarService, shareService } from '@/services';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { AdminEventForm } from '@/components/admin/AdminEventForm';
import { CreateEventData } from '@/services/adminEvents.service';
import { FeedList } from '@/components/feed/FeedList';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events, isCurrentUserAdmin, updateEventAdmin, deleteEventAdmin } = useEvents();
  const { theme, isDark } = useTheme();

  // Find the event from context
  const event = events.find((evt) => evt.id === id);

  // Registration state
  const { isRegistered, loading, register, cancel } = useEventRegistration(id || '');

  // UI state
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showHighlights, setShowHighlights] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Force re-render for time updates

  // Auto-refresh button state every 60 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshTrigger((prev) => prev + 1);
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval);
  }, []);

  // Check if event has passed (based on end time)
  const hasEventPassed = event ? new Date(event.endTimeISO) < new Date() : false;

  // Check-in window times default to event times since specific columns were removed
  const checkInOpens = event?.startTimeISO || '';
  const checkInCloses = event?.endTimeISO || '';

  // Calculate check-in state for admin button
  // useMemo with refreshTrigger dependency causes re-calculation every 60 seconds
  const checkInState = useMemo((): 'not_open' | 'active' | 'closed' => {
    if (!checkInOpens || !checkInCloses) return 'not_open';
    const now = new Date();
    const opens = new Date(checkInOpens);
    const closes = new Date(checkInCloses);
    if (now < opens) return 'not_open';
    if (now > closes) return 'closed';
    return 'active';
  }, [checkInOpens, checkInCloses, refreshTrigger]);

  // Get button label based on state
  const checkInButtonLabel = useMemo((): string => {
    if (checkInState === 'not_open') {
      const now = new Date();
      const opens = new Date(checkInOpens);
      const diff = opens.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        return `Check-In Opens in ${hours}h ${minutes % 60}m`;
      }
      return `Check-In Opens in ${minutes}m`;
    }
    if (checkInState === 'closed') return 'Check-In Closed';
    return 'Show Check-In QR Code';
  }, [checkInState, checkInOpens, refreshTrigger]);

  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    text: { color: theme.text },
    subtext: { color: theme.subtext },
    heroBackground: { backgroundColor: theme.card },
    buttonBackground: { backgroundColor: theme.card },
    iconColor: theme.text,
    tagBackground: { backgroundColor: theme.card, borderColor: theme.border },
    tagText: { color: theme.subtext },
    infoLabel: { color: theme.subtext },
    divider: { borderBottomColor: theme.border },
    capacityWarning: {
      backgroundColor: isDark ? 'rgba(217, 119, 6, 0.1)' : '#FFF4E6',
      borderColor: isDark ? 'rgba(217, 119, 6, 0.3)' : '#FFE4B8'
    },
    errorContainer: { backgroundColor: theme.background },
    hostAvatar: { backgroundColor: theme.text },
    hostAvatarText: { color: theme.background },
  };

  /**
   * Handle Register button press
   */
  const handleRegister = async () => {
    if (hasEventPassed) {
      Alert.alert(
        'Event Has Ended',
        'This event has already ended. Registration is no longer available.',
        [{ text: 'OK' }]
      );
      return;
    }

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
    if (hasEventPassed) {
      Alert.alert(
        'Event Has Ended',
        'This event has already ended. Check-in is no longer available.',
        [{ text: 'OK' }]
      );
      return;
    }

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

  /**
   * Handle Edit Event (Admin only)
   */
  const handleEditEvent = () => {
    if (!isCurrentUserAdmin) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowEditModal(true);
  };

  /**
   * Handle Delete Event (Admin only)
   */
  const handleDeleteEvent = () => {
    if (!isCurrentUserAdmin || !event) return;

    Alert.alert(
      'Delete Event',
      `Are you sure you want to delete "${event.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            const success = await deleteEventAdmin(event.id);
            if (success) {
              // Navigate back immediately to prevent rendering issues
              router.back();
              // Show success message after navigation
              setTimeout(() => {
                Alert.alert('Event Deleted', 'The event has been deleted successfully.');
              }, 300);
            } else {
              Alert.alert('Error', 'Failed to delete event. Please try again.');
            }
          },
        },
      ]
    );
  };

  /**
   * Handle Edit Form Submit
   */
  const handleEditSubmit = async (data: CreateEventData): Promise<boolean> => {
    if (!event) return false;
    const success = await updateEventAdmin(event.id, data);
    if (success) {
      setShowEditModal(false);
    }
    return success;
  };

  if (!event) {
    return (
      <View style={[styles.container, dynamicStyles.container]}>
        <View style={[styles.errorContainer, dynamicStyles.errorContainer]}>
          <Text style={[styles.errorText, dynamicStyles.text]}>Event not found</Text>
          <Pressable style={styles.errorBackButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, dynamicStyles.container]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: ACTION_BAR_BASE_HEIGHT + (insets.bottom || 16) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Cover Image - Square 1:1 with rounded bottom corners */}
        <View style={[styles.heroContainer, dynamicStyles.heroBackground]}>
          {event.coverImageUrl && (
            <Image source={{ uri: event.coverImageUrl }} style={[styles.coverImage, dynamicStyles.heroBackground]} />
          )}

          {/* Floating Top Controls */}
          <View style={[styles.topControls, { paddingTop: insets.top + 8 }]}>
            <Pressable style={[styles.backButton, dynamicStyles.buttonBackground]} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color={theme.text} />
            </Pressable>

            <View style={styles.rightControls}>
              {isCurrentUserAdmin && (
                <>
                  <Pressable style={[styles.adminButton, dynamicStyles.buttonBackground]} onPress={handleEditEvent}>
                    <Ionicons name="create-outline" size={22} color={theme.primary} />
                  </Pressable>
                  <Pressable style={[styles.adminButton, dynamicStyles.buttonBackground]} onPress={handleDeleteEvent}>
                    <Ionicons name="trash-outline" size={22} color="#EF4444" />
                  </Pressable>
                </>
              )}
              <Pressable style={[styles.shareButton, dynamicStyles.buttonBackground]} onPress={handleShare}>
                <Ionicons name="share-outline" size={22} color={theme.text} />
              </Pressable>
            </View>
          </View>
        </View>

        {/* Event Content */}
        <View style={styles.content}>

          {/* Title - High-end Typography */}
          <Text style={[styles.title, dynamicStyles.text]}>{event.title}</Text>

          {/* Date & Time */}
          <View style={[styles.infoBlock, dynamicStyles.divider]}>
            <Text style={[styles.infoLabel, dynamicStyles.infoLabel]}>DATE & TIME</Text>
            <Text style={[styles.infoValue, dynamicStyles.text]}>{formatDateHeader(event.startTimeISO)}</Text>
            <Text style={[styles.infoValue, dynamicStyles.text]}>
              {formatTime(event.startTimeISO)} - {formatTime(event.endTimeISO)}
            </Text>
          </View>

          {/* About Event Section */}
          {event.description && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>About Event</Text>
              <Text style={[styles.description, dynamicStyles.text]}>{event.description}</Text>
            </View>
          )}

          {/* Location Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Location</Text>
            <View style={styles.locationRow}>
              <Ionicons name="location" size={20} color={theme.text} style={styles.locationIcon} />
              <View style={styles.locationInfo}>
                <Text style={[styles.locationName, dynamicStyles.text]}>{event.locationName}</Text>
                {event.address && <Text style={[styles.locationAddress, dynamicStyles.subtext]}>{event.address}</Text>}
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

          {/* Attendees Preview Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Who&apos;s Going</Text>
            <AttendeesPreview eventId={event.id} />
          </View>

          {/* Admin QR Code Section */}
          {isCurrentUserAdmin && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, dynamicStyles.text]}>Admin Tools</Text>
              <TouchableOpacity
                style={[
                  styles.adminCheckInButton,
                  checkInState === 'not_open' && styles.adminButtonDisabled,
                  checkInState === 'active' && { backgroundColor: '#28a745' },
                  checkInState === 'closed' && styles.adminButtonExpired,
                ]}
                onPress={() => checkInState === 'active' && setShowQRModal(true)}
                disabled={checkInState !== 'active'}
              >
                <Ionicons
                  name="qr-code-outline"
                  size={24}
                  color={checkInState === 'active' ? '#fff' : '#adb5bd'}
                />
                <Text
                  style={[
                    styles.adminButtonText,
                    checkInState !== 'active' && { color: '#adb5bd' },
                  ]}
                >
                  {checkInButtonLabel}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.adminHint, dynamicStyles.subtext]}>
                {checkInState === 'not_open' && 'Check-in window has not opened yet'}
                {checkInState === 'active' && 'Display a QR code for students to check in'}
                {checkInState === 'closed' && 'Check-in window has closed'}
              </Text>
            </View>
          )}

          {/* Tags */}
          {event.tags.length > 0 && (
            <View style={styles.tagsRow}>
              {event.tags.map((tag) => (
                <View key={tag} style={[styles.tag, dynamicStyles.tagBackground]}>
                  <Text style={[styles.tagText, dynamicStyles.tagText]}>{tag}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Highlights Section */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, dynamicStyles.text]}>Highlights</Text>
            {!showHighlights ? (
              <TouchableOpacity
                style={[styles.highlightsButton, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => setShowHighlights(true)}
              >
                <Ionicons name="images-outline" size={24} color={theme.primary} />
                <Text style={[styles.highlightsButtonText, { color: theme.text }]}>View Event Highlights</Text>
                <Ionicons name="chevron-down" size={20} color={theme.subtext} />
              </TouchableOpacity>
            ) : (
              <View>
                <FeedList eventId={event.uuid} scrollEnabled={false} />
                <TouchableOpacity
                  style={styles.hideHighlightsButton}
                  onPress={() => setShowHighlights(false)}
                >
                  <Text style={{ color: theme.subtext }}>Hide Highlights</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>


        </View>
      </ScrollView>


      {/* Sticky Action Bar */}
      <EventActionBar
        onRegisterPress={handleRegister}
        onCheckInPress={handleCheckIn}
        onMorePress={handleMorePress}
        isRegistered={isRegistered}
        isCheckInAvailable={!hasEventPassed}
        isLoading={loading}
        isRegisterAvailable={!hasEventPassed}
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

      {/* Admin Check-In QR Code Modal */}
      {isCurrentUserAdmin && event && (
        <CheckInQRModal
          visible={showQRModal}
          onClose={() => setShowQRModal(false)}
          eventId={event.id}
          eventName={event.title}
          checkInOpens={checkInOpens}
          checkInCloses={checkInCloses}
        />
      )}

      {/* Edit Event Modal (Admin only) */}
      {isCurrentUserAdmin && (
        <Modal
          visible={showEditModal}
          animationType="slide"
          presentationStyle="pageSheet"
          onRequestClose={() => setShowEditModal(false)}
        >
          <AdminEventForm
            mode="edit"
            initialData={{
              name: event.title,
              description: event.description,
              location_name: event.locationName,
              location_address: event.address,
              start_time: event.startTimeISO,
              end_time: event.endTimeISO,
              cover_image_url: event.coverImageUrl,
            }}
            onSubmit={handleEditSubmit}
            onCancel={() => setShowEditModal(false)}
          />
        </Modal>
      )}
    </View >

  );
}

const styles = StyleSheet.create({
  // GALLERY THEME - Warm Paper Background
  container: {
    flex: 1,
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
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
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
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  rightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  adminButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    borderWidth: 1,
  },
  tagText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // INFO BLOCKS
  infoBlock: {
    marginBottom: 24,
    paddingBottom: 24,
    borderBottomWidth: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 10,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 16,
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
    fontWeight: '600',
    marginBottom: 6,
  },
  locationAddress: {
    fontSize: 15,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostAvatarLargeText: {
    fontSize: 22,
    fontWeight: '700',
  },
  hostInfo: {
    flex: 1,
  },
  hostNameLarge: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 4,
  },
  hostMeta: {
    fontSize: 14,
    fontWeight: '500',
  },

  // DESCRIPTION
  description: {
    fontSize: 16,
    lineHeight: 26,
    fontWeight: '400',
  },
  // CAPACITY WARNING
  capacityWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 24,
    borderWidth: 1,
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

  // ADMIN BUTTONS
  adminCheckInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF', // Default blue, overridden by dynamic check-in state
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    marginBottom: 8,
    gap: 8,
  },
  adminButtonDisabled: {
    backgroundColor: '#F2F2F7', // Light gray
  },
  adminButtonExpired: {
    backgroundColor: '#E5E5EA', // Darker gray
  },
  adminButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  adminHint: {
    textAlign: 'center',
    fontSize: 13,
    marginBottom: 24,
  },

  // HIGHLIGHTS
  highlightsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  highlightsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  hideHighlightsButton: {
    alignItems: 'center',
    padding: 16,
    marginTop: 8,
  },

  // ERROR STATE
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorText: {
    fontSize: 18,
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
