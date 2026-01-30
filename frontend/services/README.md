# /services/ - Platform/Device Services (No Business Logic)

**Purpose**: Abstraction layer for native device APIs

**Rules**:
- ❌ No business logic
- ❌ No Supabase calls
- ✅ Device abstraction only
- ✅ Returns raw data/results

**Services**:
```
services/
├── camera.service.ts          # QR code scanning
├── photo.service.ts           # Image picker & compression (PhotoHelper)
├── deviceCalendar.service.ts  # Calendar integration
├── registration.service.ts    # Event registration
└── share.service.ts           # Native sharing
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

## photo.service.ts (PhotoHelper)
- Request photo library permissions
- Open image picker
- Compress/resize images
- Return image URI/blob

## deviceCalendar.service.ts
- Request calendar permissions
- Add events to device calendar
- Handle calendar operations

## registration.service.ts
- Event registration logic
- RSVP management

## share.service.ts
- Native share functionality
- Share events, links, etc.

**Key Principle**:
Services return raw data. Business logic (like "what to do with the QR code") lives in hooks.
