# /services/ - Platform/Device Services (No Business Logic)

**Purpose**: Abstraction layer for native device APIs

**Rules**:
- ❌ No business logic
- ❌ No Supabase calls
- ✅ Device abstraction only
- ✅ Returns raw data/results

**Planned Services**:
```
services/
├── camera.service.ts          # QR code scanning
├── photos.service.ts          # Image picker & compression
├── notifications.service.ts   # Push notifications
└── location.service.ts        # GPS/directions (post-MVP)
```

**Service Pattern**:
```typescript
// Example: camera.service.ts
import { Camera } from 'expo-camera'

export async function scanQRCode(): Promise<string> {
  // Request permissions
  const { status } = await Camera.requestCameraPermissionsAsync()
  if (status !== 'granted') {
    throw new Error('Camera permission denied')
  }

  // Open camera, scan QR, return data
  // NO check-in logic here - just return the QR string
  return qrData
}
```

**Responsibilities by Service**:

## camera.service.ts
- Request camera permissions
- Open camera with QR scanner
- Return scanned QR code string
- Handle camera errors

## photos.service.ts
- Request photo library permissions
- Open image picker
- Compress/resize images
- Return image URI/blob

## notifications.service.ts
- Request notification permissions
- Register push token
- Schedule local notifications
- Handle notification tap events

## location.service.ts (post-MVP)
- Request location permissions
- Get current GPS coordinates
- Calculate directions to event
- Return location data

**Key Principle**:
Services return raw data. Business logic (like "what to do with the QR code") lives in hooks.
