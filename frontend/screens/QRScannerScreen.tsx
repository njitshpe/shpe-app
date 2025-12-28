import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Vibration,
} from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { cameraService } from '../lib/cameraService';
import { eventsService } from '../lib/eventsService';
import { useAuth } from '../contexts/AuthContext';
import { SHPE_COLORS } from '../constants/colors';

interface QRScannerScreenProps {
  onClose: () => void;
  onSuccess?: (eventName: string) => void;
}

export function QRScannerScreen({ onClose, onSuccess }: QRScannerScreenProps) {
  const { user } = useAuth();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const lastScannedRef = useRef<string>('');
  const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isScanningRef = useRef<boolean>(false); // Lock to prevent race conditions

  useEffect(() => {
    requestCameraPermission();

    return () => {
      if (scanTimeoutRef.current) {
        clearTimeout(scanTimeoutRef.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    const { granted, canAskAgain } = await cameraService.requestPermission();

    if (!granted) {
      setHasPermission(false);
      cameraService.handlePermissionDenied(canAskAgain);
    } else {
      setHasPermission(true);
    }
  };

  // Validates if the scanned QR code should be processed
  // returns true if valid and should proceed, false otherwise
  const validateScan = (data: string): boolean => {
    // Prevent duplicate scans
    if (scanned || processing || data === lastScannedRef.current) {
      return false;
    }

    // Validate event ID format
    if (!cameraService.validateEventId(data)) {
      // Set lock to prevent repeated invalid scans
      isScanningRef.current = true;
      lastScannedRef.current = data;

      Alert.alert('Invalid QR Code', 'This does not appear to be a valid event QR code.', [
        {
          text: 'OK',
          onPress: () => {
            // Reset after user dismisses alert
            isScanningRef.current = false;
            setTimeout(() => {
              lastScannedRef.current = '';
            }, 2000);
          },
        },
      ]);
      return false;
    }

    return true;
  };

  // Handles successful check-in
  const handleCheckInSuccess = (eventName: string) => {
    Alert.alert(
      'Check-In Successful!',
      `You have been checked in to ${eventName}`,
      [
        {
          text: 'OK',
          onPress: () => {
            onSuccess?.(eventName);
            onClose();
          },
        },
      ]
    );
  };

  // Handles check-in failure
  const handleCheckInFailure = (errorMessage?: string) => {
    Alert.alert(
      'Check-In Failed',
      errorMessage || 'Unable to check in to this event.',
      [
        {
          text: 'Try Again',
          onPress: resetScanner,
        },
        {
          text: 'Cancel',
          onPress: onClose,
          style: 'cancel',
        },
      ]
    );
  };

  // Handles unexpected errors during check-in
  const handleCheckInError = (error: unknown) => {
    console.error('Error during check-in:', error);
    Alert.alert(
      'Error',
      'An unexpected error occurred. Please try again.',
      [
        {
          text: 'Try Again',
          onPress: resetScanner,
        },
        {
          text: 'Cancel',
          onPress: onClose,
          style: 'cancel',
        },
      ]
    );
  };

  // Processes the event check-in
  const processCheckIn = async (eventId: string) => {
    if (!user) {
      Alert.alert('Error', 'You must be logged in to check in to events.');
      resetScanner();
      return;
    }

    const result = await eventsService.checkInToEvent(eventId, user.id);

    if (result.success && result.data) {
      handleCheckInSuccess(result.data.event.name);
    } else {
      handleCheckInFailure(result.error?.message);
    }
  };

  // Main barcode scan handler, orchestrates the check-in flow
  const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
    // Immediate lock check, prevents race conditions from rapid camera firing
    if (isScanningRef.current) {
      return;
    }

    if (!validateScan(data)) {
      return;
    }

    // Set lock immediately before any async operations
    isScanningRef.current = true;
    setScanned(true);
    setProcessing(true);
    lastScannedRef.current = data;

    // Haptic feedback
    Vibration.vibrate(100);

    const eventId = cameraService.normalizeEventId(data);

    try {
      await processCheckIn(eventId);
    } catch (error) {
      handleCheckInError(error);
    } finally {
      setProcessing(false);
      // Note: Don't reset isScanningRef here - let resetScanner handle it
    }
  };

  const resetScanner = () => {
    setScanned(false);
    isScanningRef.current = false; // Reset the scanning lock

    // Add cooldown to prevent immediate re-scan
    // Keep lastScannedRef set during cooldown, then clear it
    scanTimeoutRef.current = setTimeout(() => {
      lastScannedRef.current = '';
    }, 2000);
  };

  const toggleTorch = () => {
    setTorchOn((prev) => !prev);
  };

  // Loading state
  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  // Permission denied state
  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission is required to scan QR codes.</Text>
        <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={onClose}>
          <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Camera view
  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
        enableTorch={torchOn}
      >
        <View style={styles.overlay}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerText}>Scan Event QR Code</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Scanning frame */}
          <View style={styles.scanArea}>
            <View style={styles.scanFrame} />
            {processing && (
              <View style={styles.processingOverlay}>
                <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
                <Text style={styles.processingText}>Processing check-in...</Text>
              </View>
            )}
          </View>

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <Text style={styles.instructionsText}>
              Position the QR code within the frame
            </Text>

            {/* Torch toggle */}
            <TouchableOpacity
              style={styles.torchButton}
              onPress={toggleTorch}
            >
              <Text style={styles.torchButtonText}>
                {torchOn ? 'Flashlight On 🔦 ' : 'Flashlight Off 🔦'}
              </Text>
            </TouchableOpacity>

            {scanned && !processing && (
              <TouchableOpacity style={styles.button} onPress={resetScanner}>
                <Text style={styles.buttonText}>Scan Again</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: SHPE_COLORS.darkBlue,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 20,
    color: SHPE_COLORS.white,
    fontSize: 16,
  },
  errorText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 40,
    marginBottom: 30,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerText: {
    color: SHPE_COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
  },
  scanArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: SHPE_COLORS.orange,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },
  processingOverlay: {
    position: 'absolute',
    width: 250,
    height: 250,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingText: {
    color: SHPE_COLORS.white,
    marginTop: 15,
    fontSize: 16,
  },
  instructionsContainer: {
    paddingHorizontal: 30,
    paddingBottom: 50,
    alignItems: 'center',
  },
  instructionsText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  torchButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginBottom: 15,
  },
  torchButtonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  button: {
    backgroundColor: SHPE_COLORS.orange,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 10,
    minWidth: 200,
    alignItems: 'center',
  },
  buttonText: {
    color: SHPE_COLORS.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: SHPE_COLORS.orange,
  },
  secondaryButtonText: {
    color: SHPE_COLORS.orange,
  },
});