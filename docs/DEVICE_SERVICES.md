# DEVICE SERVICES LAYER

This document provides implementation examples for the device/platform services layer.

**Key Principle:** Services are pure device API abstractions with NO business logic and NO Supabase calls.

---

## Architecture Overview

```
services/
├─ camera.service.ts          # QR scanning via device camera
├─ photos.service.ts          # Image picker and photo management
└─ notifications.service.ts   # Push notifications
```

**Rules:**
- No business logic in services
- No Supabase calls
- Pure device/platform abstraction only
- Services return raw data; hooks handle the logic

---

## 1. Camera Service (QR Scanning)

```typescript
// services/camera.service.ts

import { Camera, CameraView } from 'expo-camera';
import { BarcodeScanningResult } from 'expo-camera/build/Camera.types';

export interface QRScanResult {
  data: string;
  type: string;
  timestamp: number;
}

export interface CameraPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

/**
 * Request camera permissions from the user
 */
export async function requestCameraPermission(): Promise<CameraPermissionStatus> {
  const { status, canAskAgain } = await Camera.requestCameraPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Check current camera permission status
 */
export async function getCameraPermissionStatus(): Promise<CameraPermissionStatus> {
  const { status, canAskAgain } = await Camera.getCameraPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Parse barcode scanning result into QRScanResult
 */
export function parseBarcodeScanResult(result: BarcodeScanningResult): QRScanResult {
  return {
    data: result.data,
    type: result.type,
    timestamp: Date.now(),
  };
}
```

### Usage with Hook

```typescript
// hooks/useCheckIn.ts

import { useState } from 'react';
import {
  requestCameraPermission,
  parseBarcodeScanResult,
  QRScanResult
} from '@/services/camera.service';
import { supabase } from '@/lib/supabase';

export function useCheckIn() {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function initializeScanner() {
    const permission = await requestCameraPermission();
    if (!permission.granted) {
      setError('Camera permission required for check-in');
      return false;
    }
    setScanning(true);
    return true;
  }

  async function handleScan(result: QRScanResult) {
    setScanning(false);

    // Business logic lives in hook, not service
    const { data, error } = await supabase.functions.invoke('check-in', {
      body: { eventCode: result.data },
    });

    if (error) {
      setError(error.message);
      return null;
    }
    return data;
  }

  return { scanning, error, initializeScanner, handleScan, parseBarcodeScanResult };
}
```

### QR Scanner Component

```typescript
// components/QRScanner.tsx

import { CameraView } from 'expo-camera';
import { parseBarcodeScanResult, QRScanResult } from '@/services/camera.service';

interface QRScannerProps {
  onScan: (result: QRScanResult) => void;
  enabled: boolean;
}

export function QRScanner({ onScan, enabled }: QRScannerProps) {
  if (!enabled) return null;

  return (
    <CameraView
      style={{ flex: 1 }}
      facing="back"
      barcodeScannerSettings={{
        barcodeTypes: ['qr'],
      }}
      onBarcodeScanned={(result) => {
        onScan(parseBarcodeScanResult(result));
      }}
    />
  );
}
```

---

## 2. Photos Service (Image Picker)

```typescript
// services/photos.service.ts

import * as ImagePicker from 'expo-image-picker';

export interface PickedImage {
  uri: string;
  width: number;
  height: number;
  type: 'image' | 'video';
  fileSize?: number;
  base64?: string;
}

export interface PhotoPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export interface PickerOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  includeBase64?: boolean;
}

/**
 * Request media library permissions
 */
export async function requestMediaLibraryPermission(): Promise<PhotoPermissionStatus> {
  const { status, canAskAgain } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Request camera permissions for taking photos
 */
export async function requestCameraRollPermission(): Promise<PhotoPermissionStatus> {
  const { status, canAskAgain } = await ImagePicker.requestCameraPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Pick an image from the device gallery
 */
export async function pickImageFromGallery(
  options: PickerOptions = {}
): Promise<PickedImage | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [1, 1],
    quality: options.quality ?? 0.8,
    base64: options.includeBase64 ?? false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: asset.type === 'video' ? 'video' : 'image',
    fileSize: asset.fileSize,
    base64: asset.base64,
  };
}

/**
 * Take a photo using the device camera
 */
export async function takePhoto(
  options: PickerOptions = {}
): Promise<PickedImage | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect ?? [1, 1],
    quality: options.quality ?? 0.8,
    base64: options.includeBase64 ?? false,
  });

  if (result.canceled || !result.assets[0]) {
    return null;
  }

  const asset = result.assets[0];
  return {
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: 'image',
    fileSize: asset.fileSize,
    base64: asset.base64,
  };
}

/**
 * Pick multiple images from the gallery
 */
export async function pickMultipleImages(
  options: PickerOptions = {}
): Promise<PickedImage[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsMultipleSelection: true,
    quality: options.quality ?? 0.8,
    base64: options.includeBase64 ?? false,
  });

  if (result.canceled || !result.assets.length) {
    return [];
  }

  return result.assets.map((asset) => ({
    uri: asset.uri,
    width: asset.width,
    height: asset.height,
    type: 'image' as const,
    fileSize: asset.fileSize,
    base64: asset.base64,
  }));
}
```

### Usage with Hook

```typescript
// hooks/useProfilePhoto.ts

import { useState } from 'react';
import {
  pickImageFromGallery,
  takePhoto,
  requestMediaLibraryPermission,
  requestCameraRollPermission,
  PickedImage
} from '@/services/photos.service';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export function useProfilePhoto() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id);

  async function uploadProfilePhoto(source: 'gallery' | 'camera') {
    setError(null);

    // Request appropriate permission
    const permission = source === 'gallery'
      ? await requestMediaLibraryPermission()
      : await requestCameraRollPermission();

    if (!permission.granted) {
      setError('Permission required to access photos');
      return null;
    }

    // Get image using service (no business logic in service)
    const image = source === 'gallery'
      ? await pickImageFromGallery({ aspect: [1, 1], quality: 0.7 })
      : await takePhoto({ aspect: [1, 1], quality: 0.7 });

    if (!image) {
      return null; // User cancelled
    }

    // Business logic: upload to Supabase (lives in hook)
    setUploading(true);
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const response = await fetch(image.uri);
      const blob = await response.blob();

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, blob, { contentType: 'image/jpeg' });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setUploading(false);
    }
  }

  return { uploadProfilePhoto, uploading, error };
}
```

---

## 3. Notifications Service (Push Notifications)

```typescript
// services/notifications.service.ts

import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export interface PushToken {
  token: string;
  platform: 'ios' | 'android' | 'web';
}

export interface NotificationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
}

export interface LocalNotificationOptions {
  title: string;
  body: string;
  data?: Record<string, unknown>;
  trigger?: Notifications.NotificationTriggerInput;
}

/**
 * Configure default notification behavior
 */
export function configureNotifications(): void {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<NotificationPermissionStatus> {
  if (!Device.isDevice) {
    return { granted: false, canAskAgain: false };
  }

  const { status, canAskAgain } = await Notifications.requestPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Get the current notification permission status
 */
export async function getNotificationPermissionStatus(): Promise<NotificationPermissionStatus> {
  const { status, canAskAgain } = await Notifications.getPermissionsAsync();
  return {
    granted: status === 'granted',
    canAskAgain,
  };
}

/**
 * Get the Expo push token for this device
 */
export async function getPushToken(): Promise<PushToken | null> {
  if (!Device.isDevice) {
    return null;
  }

  // Android requires a notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { data: token } = await Notifications.getExpoPushTokenAsync();

  return {
    token,
    platform: Platform.OS as 'ios' | 'android',
  };
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  options: LocalNotificationOptions
): Promise<string> {
  return Notifications.scheduleNotificationAsync({
    content: {
      title: options.title,
      body: options.body,
      data: options.data ?? {},
    },
    trigger: options.trigger ?? null, // null = immediate
  });
}

/**
 * Cancel a scheduled notification
 */
export async function cancelScheduledNotification(notificationId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(notificationId);
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllScheduledNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get the number of badge count
 */
export async function getBadgeCount(): Promise<number> {
  return Notifications.getBadgeCountAsync();
}

/**
 * Set the badge count
 */
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Add listener for received notifications (foreground)
 */
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void
): Notifications.Subscription {
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add listener for notification responses (user tapped notification)
 */
export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void
): Notifications.Subscription {
  return Notifications.addNotificationResponseReceivedListener(callback);
}
```

### Usage with Hook

```typescript
// hooks/useNotifications.ts

import { useEffect, useState } from 'react';
import {
  configureNotifications,
  requestNotificationPermission,
  getPushToken,
  addNotificationReceivedListener,
  addNotificationResponseListener,
  PushToken
} from '@/services/notifications.service';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/auth.store';

export function useNotifications() {
  const [pushToken, setPushToken] = useState<PushToken | null>(null);
  const [error, setError] = useState<string | null>(null);
  const userId = useAuthStore((state) => state.user?.id);

  useEffect(() => {
    configureNotifications();
  }, []);

  async function registerForPushNotifications() {
    const permission = await requestNotificationPermission();

    if (!permission.granted) {
      setError('Notification permission required');
      return null;
    }

    const token = await getPushToken();
    if (!token) {
      setError('Failed to get push token');
      return null;
    }

    setPushToken(token);

    // Business logic: save token to Supabase (lives in hook)
    if (userId) {
      const { error: dbError } = await supabase
        .from('user_push_tokens')
        .upsert({
          user_id: userId,
          token: token.token,
          platform: token.platform,
          updated_at: new Date().toISOString(),
        });

      if (dbError) {
        setError('Failed to register push token');
      }
    }

    return token;
  }

  function setupNotificationListeners(
    onReceived: (data: Record<string, unknown>) => void,
    onTapped: (data: Record<string, unknown>) => void
  ) {
    const receivedSub = addNotificationReceivedListener((notification) => {
      onReceived(notification.request.content.data);
    });

    const responseSub = addNotificationResponseListener((response) => {
      onTapped(response.notification.request.content.data);
    });

    // Return cleanup function
    return () => {
      receivedSub.remove();
      responseSub.remove();
    };
  }

  return {
    pushToken,
    error,
    registerForPushNotifications,
    setupNotificationListeners
  };
}
```

### App Entry Point Setup

```typescript
// App.tsx

import { useEffect } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useRouter } from 'expo-router';

export default function App() {
  const { registerForPushNotifications, setupNotificationListeners } = useNotifications();
  const router = useRouter();

  useEffect(() => {
    registerForPushNotifications();

    const cleanup = setupNotificationListeners(
      (data) => {
        // Handle foreground notification
        console.log('Notification received:', data);
      },
      (data) => {
        // Handle notification tap - navigate to relevant screen
        if (data.eventId) {
          router.push(`/event/${data.eventId}`);
        }
      }
    );

    return cleanup;
  }, []);

  return (
    // ... app content
  );
}
```

---

## Summary: Service vs Hook Responsibilities

| Concern | Service | Hook |
|---------|---------|------|
| Device permissions | Request & check | Decide when to request |
| Raw device APIs | Wrap & normalize | Consume results |
| Error handling | Return null/status | Set error state |
| Business logic | Never | Always |
| Supabase calls | Never | Always |
| State management | Never | Always |

**Remember:** Services are thin wrappers around device APIs. All decision-making, data persistence, and business rules belong in hooks.
