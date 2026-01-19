import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TouchableOpacity,
  Image as RNImage,
  ImageBackground,
  Dimensions,
  Alert,
  Modal,
  Platform,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { formatTime, formatDateHeader, formatEventDetailDate } from '@/utils';

import { useEvents } from '@/contexts/EventsContext';
import { Event } from '@/types/events';
import { Ionicons } from '@expo/vector-icons';
import { MapPreview } from '@/components/shared';
import RegistrationFormModal from '@/components/events/RegistrationFormModal';
import {
  AttendeesPreview,
  RegistrationSuccessModal,
  EventRegistrationConfirmModal,
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Helper Component for Scale Animation
const ScaleButton = ({ onPress, disabled, style, children }: { onPress?: () => void, disabled?: boolean, style?: any, children: React.ReactNode }) => {
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scaleValue, {
      toValue: 0.92,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled}
      style={({ pressed }) => [
        style,
      ]}
    >
      <Animated.View style={[{ transform: [{ scale: scaleValue }], width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }]}>
        {children}
      </Animated.View>
    </Pressable>
  );
};

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { events, isCurrentUserAdmin, updateEventAdmin, deleteEventAdmin } = useEvents();
  // Find the event from context
  const event = events.find((evt) => evt.id === id);

  const { theme, isDark } = useTheme();

  // Determine image size dynamically to allow rounded corners + contain effect
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

  useEffect(() => {
    if (event?.coverImageUrl) {
      RNImage.getSize(event.coverImageUrl, (width, height) => {
        const aspectRatio = width / height;
        const maxHeight = SCREEN_HEIGHT * 0.45;
        const maxWidth = SCREEN_WIDTH - 48;

        let finalWidth = maxHeight * aspectRatio;
        let finalHeight = maxHeight;

        if (finalWidth > maxWidth) {
          finalWidth = maxWidth;
          finalHeight = maxWidth / aspectRatio;
        }

        setImageDimensions({ width: finalWidth, height: finalHeight });
      }, (error) => {
        console.error("Failed to load image dimensions", error);
      });
    }
  }, [event?.coverImageUrl]);



  // Registration state
  const { isRegistered, loading, register, cancel } = useEventRegistration(id || '');

  // UI state
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
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

  /**
   * Handle Register button press
   */
  const handleRegister = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (!event) return;

    if (hasEventPassed) {
      Alert.alert('Event Has Ended', 'Registration is no longer available.');
      return;
    }

    if (isRegistered) {
      Alert.alert('Already Registered', 'You are already registered for this event.');
      return;
    }

    // Step 1: Open Confirmation Modal (Poster View)
    setShowConfirmModal(true);
  };

  const handleConfirmRegistration = async () => {
    if (!event) return;
    setShowConfirmModal(false);

    // Step 2: Check for questions
    if (event.registration_questions && event.registration_questions.length > 0) {
      // Delay slightly to allow confirm modal to close nicely
      setTimeout(() => setShowRegistrationForm(true), 300);
    } else {
      // Step 3: No questions, just register
      await executeRegistration({});
    }
  };

  const executeRegistration = async (answers: Record<string, string>) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      await register(answers);
      // Success Flow
      setShowRegistrationForm(false);
      setShowSuccessModal(true);

    } catch (error: any) {
      console.error('Registration error:', error);
      let errorMessage = 'Unable to register for this event. Please check your internet connection and try again.';
      if (error?.message?.includes('full')) {
        errorMessage = 'Sorry, this event has reached its capacity.';
      }
      Alert.alert('Registration Issue', errorMessage, [{ text: 'Try Again' }]);
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
      Alert.alert('Registration Cancelled', 'Your registration has been cancelled.', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Cancellation Failed', 'Unable to cancel registration. Please try again.', [{ text: 'OK' }]);
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
              router.back();
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
      {/* FULL SCREEN GLASS BACKGROUND */}
      <ImageBackground
        source={{ uri: event.coverImageUrl }}
        style={StyleSheet.absoluteFill}
        blurRadius={Platform.OS === 'android' ? 40 : 50}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.35)' : 'rgba(0,0,0,0.3)' }]} />

        {/* iOS Native Blur */}
        {Platform.OS === 'ios' && (
          <BlurView intensity={70} style={StyleSheet.absoluteFill} tint="dark" />
        )}

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 32, paddingTop: insets.top + 60 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          {/* Top Controls */}
          <View style={[styles.topControls, { top: insets.top + 10 }]}>
            <Pressable style={styles.backButton} onPress={() => router.back()}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </Pressable>


          </View>

          {/* Centered Poster */}
          <View style={styles.posterContainer}>
            {event.coverImageUrl && (
              <Image
                source={event.coverImageUrl}
                style={[
                  styles.posterImage,
                  imageDimensions && { width: imageDimensions.width, height: imageDimensions.height }
                ]}
                contentFit="cover"
                transition={500}
              />
            )}
          </View>

          <View style={styles.content}>
            {/* Title */}
            <Text style={styles.title}>{event.title}</Text>

            {/* Date & Time */}
            <Text style={styles.dateText}>
              {formatEventDetailDate(event.startTimeISO)}, {formatTime(event.startTimeISO)} - {formatTime(event.endTimeISO)}
            </Text>

            {/* Attendance Status */}
            {isRegistered && (
              <View style={styles.statusRow}>
                <Ionicons name="checkmark-circle" size={16} color="#4ADE80" />
                <Text style={styles.statusText}>You're Going</Text>
              </View>
            )}



            {/* ACTION ROW (SQUIRCLE STYLE) */}
            <View style={styles.actionRow}>

              {/* Primary Action: Join/Register */}
              <ScaleButton
                style={[
                  styles.actionButton,
                  styles.primaryButton,
                  hasEventPassed && styles.disabledButton
                ]}
                onPress={handleRegister}
                disabled={hasEventPassed || loading}
              >
                <Ionicons
                  name={isRegistered ? "checkmark-circle" : "ticket-outline"}
                  size={24}
                  color="#000"
                />
                <Text style={styles.primaryButtonText}>
                  {loading ? "..." : (isRegistered ? "Registered" : "Register")}
                </Text>
              </ScaleButton>

              {/* Secondary Action: Check-In */}
              <ScaleButton
                style={[
                  styles.actionButton,
                  styles.glassButton,
                  checkInState !== 'active' && !isCurrentUserAdmin && styles.disabledButton
                ]}
                onPress={handleCheckIn}
                disabled={checkInState !== 'active' && !isCurrentUserAdmin}
              >
                <Ionicons name="qr-code-outline" size={22} color="#fff" />
                <Text style={styles.glassButtonText}>Check-in</Text>
              </ScaleButton>

              {/* Share Action */}
              <ScaleButton
                style={[styles.actionButton, styles.glassButton]}
                onPress={handleShare}
              >
                <Ionicons name="share-outline" size={22} color="#fff" />
                <Text style={styles.glassButtonText}>Share</Text>
              </ScaleButton>

              {/* More Action */}
              <ScaleButton
                style={[styles.actionButton, styles.glassButton]}
                onPress={handleMorePress}
              >
                <Ionicons name="ellipsis-horizontal" size={22} color="#fff" />
                <Text style={styles.glassButtonText}>More</Text>
              </ScaleButton>

            </View>

            {/* Admin Buttons Stack */}
            {isCurrentUserAdmin && (
              <View style={{ gap: 12, marginTop: 4 }}>
                {/* Check In Guests */}
                <TouchableOpacity
                  style={styles.glassButtonFull}
                  onPress={() => checkInState === 'active' ? setShowQRModal(true) : Alert.alert('Check-In Not Active', checkInButtonLabel)}
                >
                  <Ionicons name="scan-outline" size={20} color="#fff" />
                  <Text style={styles.glassButtonText}>Check In Guests</Text>
                </TouchableOpacity>

                {/* Manage Event */}
                <TouchableOpacity
                  style={styles.glassButtonFull}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Alert.alert(
                      "Manage Event",
                      "Choose an action",
                      [
                        { text: "Edit Event", onPress: handleEditEvent },
                        { text: "Delete Event", onPress: handleDeleteEvent, style: "destructive" },
                        { text: "Cancel", style: "cancel" }
                      ]
                    );
                  }}
                >
                  <Ionicons name="settings-outline" size={20} color="#fff" />
                  <Text style={styles.glassButtonText}>Manage Event</Text>
                </TouchableOpacity>
              </View>
            )}



            {/* About */}
            {event.description && (
              <View style={{ marginTop: 12 }}>
                <Text style={styles.sectionHeader}>About</Text>
                <View style={styles.divider} />
                <Text style={styles.descriptionText}>{event.description}</Text>
              </View>
            )}

            {/* Location */}
            <View style={{ marginTop: 12 }}>
              <Text style={styles.sectionHeader}>Location</Text>
              <View style={styles.divider} />
              <View style={styles.locationContainer}>
                <View style={styles.locationRow}>
                  <Text style={styles.locationText}>{event.locationName}</Text>
                </View>
                {event.address && (
                  <Text style={styles.addressText}>{event.address}</Text>
                )}
                <View style={styles.mapContainer}>
                  <MapPreview
                    locationName={event.locationName}
                    address={event.address}
                    latitude={event.latitude}
                    longitude={event.longitude}
                  />
                </View>
              </View>
            </View>

            {/* Who's Going */}
            <View style={styles.hostsSection}>
              <AttendeesPreview eventId={event.id} previewCount={3} />
            </View>

            {/* Highlights Section (Moved) */}
            <View style={{ marginTop: 12, marginBottom: 12 }}>
              <TouchableOpacity
                style={[styles.glassButtonFull, showHighlights && styles.activeGlassButton]}
                onPress={() => setShowHighlights(!showHighlights)}
              >
                <Ionicons name="images-outline" size={20} color="#fff" />
                <Text style={styles.glassButtonText}>
                  {showHighlights ? "Hide Highlights" : "See Highlights"}
                </Text>
                <Ionicons
                  name={showHighlights ? "chevron-up" : "chevron-down"}
                  size={20}
                  color="#fff"
                  style={{ marginLeft: 'auto' }}
                />
              </TouchableOpacity>

              {showHighlights && (
                <View style={{ marginTop: 16 }}>
                  <FeedList eventId={event.uuid} scrollEnabled={false} />
                </View>
              )}
            </View>



          </View>
        </ScrollView>
      </ImageBackground>

      {/* MODALS */}
      <RegistrationFormModal
        isVisible={showRegistrationForm}
        questions={event.registration_questions || []}
        onClose={() => setShowRegistrationForm(false)}
        onSubmit={executeRegistration}
      />
      {event && (
        <EventRegistrationConfirmModal
          visible={showConfirmModal}
          event={event}
          onConfirm={handleConfirmRegistration}
          onClose={() => setShowConfirmModal(false)}
        />
      )}
      <RegistrationSuccessModal
        visible={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
      <EventMoreMenu
        visible={showMoreMenu}
        onClose={() => setShowMoreMenu(false)}
        isRegistered={isRegistered}
        onAddToCalendar={handleAddToCalendar}
        onCancelRegistration={handleCancelRegistration}
      />
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
              id: event.id,
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
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    // paddingBottom handled dynamically
  },

  // POSTER
  posterContainer: {
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 8,
  },
  posterImage: {
    width: SCREEN_WIDTH - 48,
    height: SCREEN_HEIGHT * 0.45,
    borderRadius: 24,
    resizeMode: 'contain',
  },

  // CONTROLS
  topControls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightControls: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // CONTENT
  content: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 8,
    lineHeight: 34,
  },
  dateText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12
  },
  statusText: {
    color: '#4ADE80',
    fontWeight: '600',
    fontSize: 14
  },

  // ACTION ROW (Updated)
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 12,
    marginTop: 8,
  },
  actionButton: {
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    aspectRatio: 1.5,
    flex: 1,
    height: 'auto', // Allow aspect ratio to control height
  },
  primaryButton: {
    backgroundColor: '#fff',
    flexDirection: 'column',
  },
  glassButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  activeGlassButton: {
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderColor: '#fff',
    borderWidth: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 11,
    fontWeight: '600',
  },
  glassButtonText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  glassButtonFull: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.15)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },

  // HIGHLIGHTS
  highlightsSection: {
    marginBottom: 24,
    paddingHorizontal: 0,
  },

  // SECTIONS
  sectionHeader: {
    fontSize: 15,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    marginTop: 8,
    letterSpacing: 0.5,
  },
  locationContainer: {
    marginBottom: 24,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '500'
  },
  addressText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 16,
  },
  mapContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 8,
  },

  // HOSTS
  hostsSection: {
    marginBottom: 24,
  },
  hostsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },
  hostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  hostAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hostName: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },

  // DESCRIPTION
  descriptionText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.85)',
    lineHeight: 24,
  },

  // ADMIN
  adminSection: {
    marginTop: 24,
    paddingTop: 24,
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },

  // ERRORS
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
    marginBottom: 16,
  },
  errorBackButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.15)',
    marginTop: 6,
    marginBottom: 10,
  },
});
