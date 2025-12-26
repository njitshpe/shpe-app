# `/services/` - Platform/Device Services (No Business Logic)

## Purpose
Abstraction layer for **native device APIs** (camera, photos, notifications, location).

## Rules
- ❌ **NO business logic**
- ❌ **NO Supabase calls**
- ❌ **NO state management**
- ✅ Device abstraction only
- ✅ Returns raw data/results
- ✅ Handles platform differences

## Planned Services

```
services/
├── camera.service.ts          # QR code scanning
├── photos.service.ts          # Image picker & compression
├── notifications.service.ts   # Push notifications
└── location.service.ts        # GPS/directions (post-MVP)
```

## Camera Service Example

```typescript
// services/camera.service.ts
import { Camera } from 'expo-camera'
import { BarCodeScanner } from 'expo-barcode-scanner'

/**
 * Request camera permissions
 * @returns true if granted, false otherwise
 */
export async function requestCameraPermission(): Promise<boolean> {
  const { status } = await Camera.requestCameraPermissionsAsync()
  return status === 'granted'
}

/**
 * Scan QR code
 * @returns QR code data string
 */
export async function scanQRCode(): Promise<string> {
  const hasPermission = await requestCameraPermission()
  
  if (!hasPermission) {
    throw new Error('Camera permission denied')
  }
  
  // Returns QR data, no check-in logic here
  // The hook (useCheckIn) will handle the business logic
  return new Promise((resolve, reject) => {
    // Scanner implementation
    // resolve(qrData) when scanned
  })
}

/**
 * Check if device has camera
 */
export async function hasCamera(): Promise<boolean> {
  const { status } = await Camera.getCameraPermissionsAsync()
  return status !== 'undetermined'
}
```

## Photo Service Example

```typescript
// services/photos.service.ts
import * as ImagePicker from 'expo-image-picker'
import * as ImageManipulator from 'expo-image-manipulator'

export interface PhotoResult {
  uri: string
  width: number
  height: number
  base64?: string
}

/**
 * Pick image from gallery
 */
export async function pickImage(): Promise<PhotoResult | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
  
  if (status !== 'granted') {
    throw new Error('Photo library permission denied')
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  })

  if (result.canceled) {
    return null
  }

  return {
    uri: result.assets[0].uri,
    width: result.assets[0].width,
    height: result.assets[0].height,
  }
}

/**
 * Take photo with camera
 */
export async function takePhoto(): Promise<PhotoResult | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync()
  
  if (status !== 'granted') {
    throw new Error('Camera permission denied')
  }

  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: true,
    aspect: [4, 3],
    quality: 0.8,
  })

  if (result.canceled) {
    return null
  }

  return {
    uri: result.assets[0].uri,
    width: result.assets[0].width,
    height: result.assets[0].height,
  }
}

/**
 * Compress image to max size
 */
export async function compressImage(
  uri: string,
  maxWidth: number = 1024,
  maxHeight: number = 1024
): Promise<string> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: maxWidth, height: maxHeight } }],
    { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
  )
  
  return result.uri
}
```

## Notifications Service Example

```typescript
// services/notifications.service.ts
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

/**
 * Configure notification handler
 */
export function configureNotifications() {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  })
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermission(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  
  let finalStatus = existingStatus
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }
  
  return finalStatus === 'granted'
}

/**
 * Get push notification token
 */
export async function getPushToken(): Promise<string | null> {
  const hasPermission = await requestNotificationPermission()
  
  if (!hasPermission) {
    return null
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_PROJECT_ID
  })
  
  return token.data
}

/**
 * Schedule local notification
 */
export async function scheduleNotification(
  title: string,
  body: string,
  trigger: Date | number
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
    },
    trigger: typeof trigger === 'number' 
      ? { seconds: trigger }
      : trigger,
  })
}

/**
 * Cancel all scheduled notifications
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync()
}
```

## Location Service Example (Post-MVP)

```typescript
// services/location.service.ts
import * as Location from 'expo-location'

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Request location permissions
 */
export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync()
  return status === 'granted'
}

/**
 * Get current location
 */
export async function getCurrentLocation(): Promise<Coordinates | null> {
  const hasPermission = await requestLocationPermission()
  
  if (!hasPermission) {
    return null
  }

  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
  })
  
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  }
}

/**
 * Open maps with directions
 */
export async function openDirections(
  latitude: number,
  longitude: number,
  label: string
) {
  const url = Platform.select({
    ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
    android: `geo:0,0?q=${latitude},${longitude}(${label})`,
  })
  
  if (url) {
    // Open native maps app
    // Implementation here
  }
}
```

## Usage in Hooks

Services are called by hooks, NOT directly in components:

```typescript
// hooks/useCheckIn.ts (GOOD)
import { scanQRCode } from '@/services/camera.service'
import { supabase } from '@/lib/supabase'

export function useCheckIn() {
  async function performCheckIn(eventId: string) {
    // Service returns raw QR data
    const qrData = await scanQRCode()
    
    // Hook handles business logic
    const { data, error } = await supabase.functions.invoke('check-in', {
      body: { eventId, qrData }
    })
    
    if (error) throw error
    return data
  }
  
  return { performCheckIn }
}
```

```typescript
// hooks/usePhotoUpload.ts (GOOD)
import { pickImage, compressImage } from '@/services/photos.service'
import { supabase } from '@/lib/supabase'

export function usePhotoUpload() {
  async function uploadEventPhoto(eventId: string) {
    // Service returns raw photo
    const photo = await pickImage()
    if (!photo) return null
    
    // Compress before upload
    const compressed = await compressImage(photo.uri)
    
    // Hook handles upload logic
    const { data, error } = await supabase.storage
      .from('event-photos')
      .upload(`${eventId}/${Date.now()}.jpg`, compressed)
    
    if (error) throw error
    return data
  }
  
  return { uploadEventPhoto }
}
```

## Anti-Patterns (What NOT to Do)

```typescript
// BAD: Business logic in service
export async function checkInToEvent(eventId: string, qrData: string) {
  // ❌ NO! Services should not call Supabase
  await supabase.functions.invoke('check-in', { body: { eventId, qrData } })
}

// GOOD: Service returns raw data
export async function scanQRCode(): Promise<string> {
  // ✅ Just returns QR data
  return qrData
}
```

```typescript
// BAD: Calling service directly in component
function EventScreen() {
  const handleCheckIn = async () => {
    // ❌ NO! Components shouldn't call services directly
    const qrData = await scanQRCode()
  }
}

// GOOD: Call service via hook
function EventScreen() {
  const { performCheckIn } = useCheckIn()
  
  const handleCheckIn = async () => {
    // ✅ Hook handles the service call
    await performCheckIn(eventId)
  }
}
```

## Best Practices

1. **Permissions First**: Always request permissions before using device features
2. **Error Handling**: Throw descriptive errors when permissions denied
3. **Platform Differences**: Handle iOS vs Android differences in services
4. **No State**: Services are stateless, just pure functions
5. **Type Safety**: Define clear return types for all functions

## What Goes Here
- Camera/QR scanning
- Photo picking/taking
- Image compression
- Push notifications
- Location/GPS (post-MVP)
- Device info queries

## What Does NOT Go Here
- Business logic → Use `hooks/`
- API calls → Use `lib/`
- Data transformations → Use `utils/`
- UI components → Use `components/`
- State management → Use `store/`
