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
import { useRouter } from 'expo-router';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { cameraService } from '@/services';
import { CheckInTokenService } from '@/services/checkInToken.service';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';

export default function CheckInScreen() {
    const router = useRouter();
    const { user } = useAuth();
    const { theme } = useTheme();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const lastScannedRef = useRef<string>('');
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isScanningRef = useRef<boolean>(false);

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

    const validateScan = (data: string): boolean => {
        if (scanned || processing || data === lastScannedRef.current) {
            return false;
        }

        // Token validation will happen server-side
        // We just check that data is not empty
        if (!data || data.trim().length === 0) {
            isScanningRef.current = true;
            lastScannedRef.current = data;

            Alert.alert('Invalid QR Code', 'The scanned QR code is empty.', [
                {
                    text: 'OK',
                    onPress: () => {
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

    const handleCheckInSuccess = (eventName: string) => {
        Alert.alert(
            'Check-In Successful!',
            `You have been checked in to ${eventName}`,
            [
                {
                    text: 'OK',
                    onPress: () => router.back(),
                },
            ]
        );
    };

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
                    onPress: () => router.back(),
                    style: 'cancel',
                },
            ]
        );
    };

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
                    onPress: () => router.back(),
                    style: 'cancel',
                },
            ]
        );
    };

    const processCheckIn = async (token: string) => {
        if (!user) {
            Alert.alert('Error', 'You must be logged in to check in to events.');
            resetScanner();
            return;
        }

        // Use token-based validation
        const result = await CheckInTokenService.validateCheckIn(token);

        if (result.success && result.event) {
            handleCheckInSuccess(result.event.name);
        } else {
            // Provide user-friendly error messages based on error codes
            let errorMessage = result.error || 'Unable to check in to this event.';

            switch (result.errorCode) {
                case 'INVALID_TOKEN':
                    errorMessage = 'This QR code is invalid or has expired. Please ask the admin to generate a new one.';
                    break;
                case 'CHECK_IN_CLOSED':
                    errorMessage = 'Check-in for this event has closed.';
                    break;
                case 'ALREADY_CHECKED_IN':
                    errorMessage = 'You have already checked in to this event.';
                    break;
                case 'MAX_CAPACITY_REACHED':
                    errorMessage = 'This event has reached maximum capacity.';
                    break;
                case 'EVENT_NOT_FOUND':
                    errorMessage = 'This event could not be found or is no longer active.';
                    break;
                case 'NETWORK_ERROR':
                    errorMessage = 'Network error. Please check your connection and try again.';
                    break;
            }

            handleCheckInFailure(errorMessage);
        }
    };

    const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
        if (isScanningRef.current) {
            return;
        }

        if (!validateScan(data)) {
            return;
        }

        isScanningRef.current = true;
        setScanned(true);
        setProcessing(true);
        lastScannedRef.current = data;

        Vibration.vibrate(100);

        // Use the scanned data directly as the token (JWT from QR code)
        try {
            await processCheckIn(data);
        } catch (error) {
            handleCheckInError(error);
        } finally {
            setProcessing(false);
        }
    };

    const resetScanner = () => {
        setScanned(false);
        isScanningRef.current = false;

        scanTimeoutRef.current = setTimeout(() => {
            lastScannedRef.current = '';
        }, 2000);
    };

    const toggleTorch = () => {
        setTorchOn((prev) => !prev);
    };

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        text: { color: theme.text },
        button: { backgroundColor: theme.primary },
        buttonText: { color: '#FFFFFF' }, // Always white on primary
        secondaryButton: { borderColor: theme.primary },
        secondaryButtonText: { color: theme.primary },
        scanFrame: { borderColor: theme.primary },
        loadingIndicator: { color: theme.primary },
    };

    if (hasPermission === null) {
        return (
            <View style={[styles.container, dynamicStyles.container]}>
                <ActivityIndicator size="large" color={theme.primary} />
                <Text style={[styles.loadingText, dynamicStyles.text]}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={[styles.container, dynamicStyles.container]}>
                <Text style={[styles.errorText, dynamicStyles.text]}>Camera permission is required to scan QR codes.</Text>
                <TouchableOpacity style={[styles.button, dynamicStyles.button]} onPress={requestCameraPermission}>
                    <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton, dynamicStyles.secondaryButton]} onPress={() => router.back()}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText, dynamicStyles.secondaryButtonText]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ['qr'],
                }}
                enableTorch={torchOn}
            />
            <View style={styles.overlay}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Scan Event QR Code</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.scanArea}>
                    <View style={[styles.scanFrame, dynamicStyles.scanFrame]} />
                    {processing && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.processingText}>Processing check-in...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.instructionsContainer}>
                    <Text style={styles.instructionsText}>
                        Position the QR code within the frame
                    </Text>

                    <TouchableOpacity
                        style={styles.torchButton}
                        onPress={toggleTorch}
                    >
                        <Text style={styles.torchButtonText}>
                            {torchOn ? 'Flashlight On 🔦 ' : 'Flashlight Off 🔦'}
                        </Text>
                    </TouchableOpacity>

                    {scanned && !processing && (
                        <TouchableOpacity style={[styles.button, dynamicStyles.button]} onPress={resetScanner}>
                            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>Scan Again</Text>
                        </TouchableOpacity>
                    )}
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        marginTop: 20,
        fontSize: 16,
    },
    errorText: {
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
        width: '100%',
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
        color: '#FFFFFF',
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
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        marginTop: 15,
        fontSize: 16,
    },
    instructionsContainer: {
        paddingHorizontal: 30,
        paddingBottom: 50,
        alignItems: 'center',
    },
    instructionsText: {
        color: '#FFFFFF',
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
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
    },
    button: {
        paddingVertical: 15,
        paddingHorizontal: 40,
        borderRadius: 12,
        marginTop: 10,
        minWidth: 200,
        alignItems: 'center',
    },
    buttonText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
    secondaryButton: {
        backgroundColor: 'transparent',
        borderWidth: 2,
    },
    secondaryButtonText: {
        // color handled by dynamic styles
    },
});
