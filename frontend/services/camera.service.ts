import { Camera } from 'expo-camera';
import { Alert, Linking } from 'react-native';
import type { CameraPermissionStatus } from '../types/camera';

class CameraService {
  // Request camera permissions from the user
  // Handles permission states and provides helpful error messages
  async requestPermission(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error requesting camera permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Check current camera permission status without requesting
  async checkPermission(): Promise<CameraPermissionStatus> {
    try {
      const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();

      return {
        granted: status === 'granted',
        canAskAgain,
        status: status as 'granted' | 'denied' | 'undetermined',
      };
    } catch (error) {
      console.error('Error checking camera permission:', error);
      return {
        granted: false,
        canAskAgain: false,
        status: 'denied',
      };
    }
  }

  // Handle permission denial by showing appropriate message
  handlePermissionDenied(canAskAgain: boolean): void {
    if (!canAskAgain) {
      Alert.alert(
        'Camera Permission Required',
        'Please enable camera access in your device settings to scan QR codes.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => Linking.openSettings() },
        ]
      );
    } else {
      Alert.alert(
        'Camera Permission Required',
        'Camera access is needed to scan event QR codes.',
        [{ text: 'OK' }]
      );
    }
  }

  // Validate that scanned data matches expected format
  // For simple event IDs: expects format like 'event-123' or just 'event123'
  validateEventId(data: string): boolean {
    // Allow alphanumeric with optional 'event-' prefix
    const pattern = /^(event-)?[a-zA-Z0-9-_]+$/;
    return pattern.test(data) && data.length > 0 && data.length < 100;
  }

  // Normalize event ID (keep as-is since database stores the full event_id)
  normalizeEventId(rawData: string): string {
    return rawData.trim();
  }
}

export const cameraService = new CameraService();
