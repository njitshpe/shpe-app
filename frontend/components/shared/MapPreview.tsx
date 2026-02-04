import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Modal,
  Animated,
  Linking,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface MapPreviewProps {
  locationName: string;
  address?: string;
  latitude?: number;
  longitude?: number;
}

export default function MapPreview({
  locationName,
  address,
  latitude,
  longitude,
}: MapPreviewProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const scaleAnim = useState(new Animated.Value(0))[0];
  const { theme, isDark } = useTheme();

  // Determine if we have valid location data
  const hasCoordinates = latitude !== undefined && longitude !== undefined;
  const hasAddress = address && address.trim().length > 0;
  const hasLocation = hasCoordinates || hasAddress;

  // Default region (NJIT campus as fallback)
  const defaultRegion = {
    latitude: 40.7425,
    longitude: -74.1792,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  const region = hasCoordinates
    ? {
      latitude: latitude!,
      longitude: longitude!,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    }
    : defaultRegion;

  const handleMapPress = () => {
    if (hasLocation) {
      // ANDROID: Skip modal, go straight to Google Maps
      if (Platform.OS === 'android') {
        openGoogleMaps();
        return;
      }

      // IOS: Show the modal (Apple Maps vs Google Maps)
      setModalVisible(true);
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleCloseModal = () => {
    Animated.timing(scaleAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setModalVisible(false);
    });
  };

  const openAppleMaps = async () => {
    let url: string;
    if (hasCoordinates) {
      url = `http://maps.apple.com/?daddr=${latitude},${longitude}`;
    } else if (hasAddress) {
      url = `http://maps.apple.com/?q=${encodeURIComponent(address!)}`;
    } else {
      return;
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        handleCloseModal();
      }
    } catch (error) {
      console.error('Error opening Apple Maps:', error);
    }
  };

  const openGoogleMaps = async () => {
    let url: string;
    
    // ANDROID: Use geo scheme for direct app launch
    if (Platform.OS === 'android') {
      const label = encodeURIComponent(locationName || 'Event Location');
      if (hasCoordinates) {
        url = `geo:0,0?q=${latitude},${longitude}(${label})`;
      } else if (hasAddress) {
        url = `geo:0,0?q=${encodeURIComponent(address!)}`;
      } else {
        return;
      }
    } 
    // IOS/WEB: Use Universal Link
    else {
      if (hasCoordinates) {
        url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      } else if (hasAddress) {
        url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address!)}`;
      } else {
        return;
      }
    }

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
        handleCloseModal();
      } else {
        // Fallback for Android if Maps app isn't installed (opens browser)
        if (Platform.OS === 'android') {
           await Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
        }
      }
    } catch (error) {
      console.error('Error opening Google Maps:', error);
    }
  };

  const dynamicStyles = {
    mapCard: { backgroundColor: theme.card, borderColor: theme.border },
    mapContainer: { backgroundColor: isDark ? '#333' : '#F5F3F0' },
    mapSubtext: { color: theme.text },
    fallbackContainer: { backgroundColor: isDark ? '#333' : '#F5F3F0' },
    fallbackText: { color: theme.subtext },
    modalContent: { backgroundColor: theme.card },
    modalTitle: { color: theme.text },
    modalButton: { backgroundColor: theme.background, borderColor: theme.border },
    modalButtonText: { color: theme.text },
    cancelButton: { backgroundColor: theme.text }, // Inverted for contrast
    cancelButtonText: { color: theme.background },
  };

  // Fallback UI for missing location
  if (!hasLocation) {
    return (
      <View style={[styles.mapCard, dynamicStyles.mapCard]}>
        <View style={[styles.fallbackContainer, dynamicStyles.fallbackContainer]}>
          <Ionicons name="location-outline" size={40} color={theme.subtext} />
          <Text style={[styles.fallbackText, dynamicStyles.fallbackText]}>Location unavailable</Text>
        </View>
      </View>
    );
  }

  return (
    <>
      <Pressable
        style={({ pressed }) => [styles.mapCard, dynamicStyles.mapCard, pressed && styles.mapCardPressed]}
        onPress={handleMapPress}
      >
        <View style={[styles.mapContainer, dynamicStyles.mapContainer]}>
          <MapView
            style={styles.map}
            region={region}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
            provider={PROVIDER_DEFAULT}
            userInterfaceStyle={isDark ? 'dark' : 'light'}
          >
            {hasCoordinates && (
              <Marker
                coordinate={{ latitude: latitude!, longitude: longitude! }}
                title={locationName}
                description={address}
                pinColor="red"
              />
            )}
          </MapView>
        </View>
        <View style={styles.mapFooter}>
          <Ionicons name="navigate" size={16} color={theme.text} />
          <Text style={[styles.mapSubtext, dynamicStyles.mapSubtext]}>Tap for directions</Text>
        </View>
      </Pressable>

      {/* Directions Modal */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <Pressable style={styles.modalBackdrop} onPress={handleCloseModal}>
          <Animated.View
            style={[
              styles.modalContent,
              dynamicStyles.modalContent,
              {
                transform: [
                  {
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 1],
                    }),
                  },
                ],
                opacity: scaleAnim,
              },
            ]}
          >
            <Pressable>
              <Text style={[styles.modalTitle, dynamicStyles.modalTitle]}>Get Directions</Text>

              {/* Apple Maps Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  dynamicStyles.modalButton,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={openAppleMaps}
              >
                <Ionicons name="map" size={20} color={theme.text} />
                <Text style={[styles.modalButtonText, dynamicStyles.modalButtonText]}>Open in Apple Maps</Text>
              </Pressable>

              {/* Google Maps Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.modalButton,
                  dynamicStyles.modalButton,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={openGoogleMaps}
              >
                <Ionicons name="navigate" size={20} color={theme.text} />
                <Text style={[styles.modalButtonText, dynamicStyles.modalButtonText]}>Open in Google Maps</Text>
              </Pressable>

              {/* Cancel Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.cancelButton,
                  dynamicStyles.cancelButton,
                  pressed && styles.modalButtonPressed,
                ]}
                onPress={handleCloseModal}
              >
                <Text style={[styles.cancelButtonText, dynamicStyles.cancelButtonText]}>Cancel</Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  mapCard: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  mapCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  mapContainer: {
    height: 180,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    gap: 8,
  },
  mapSubtext: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Fallback styles
  fallbackContainer: {
    borderRadius: 12,
    height: 180,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  fallbackText: {
    fontSize: 13,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: 8,
  },

  // Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.4,
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    marginBottom: 12,
    gap: 10,
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  modalButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 28,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
});
