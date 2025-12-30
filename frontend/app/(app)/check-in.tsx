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
import { eventsService } from '@/lib/eventsService';
import { useAuth } from '@/contexts/AuthContext';
import { SHPE_COLORS } from '@/constants';

export default function CheckInScreen() {
    const router = useRouter();
    const { user } = useAuth();
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

        if (!cameraService.validateEventId(data)) {
            isScanningRef.current = true;
            lastScannedRef.current = data;

            Alert.alert('Invalid QR Code', 'This does not appear to be a valid event QR code.', [
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

    const handleBarCodeScanned = async ({ type, data }: BarcodeScanningResult) => {
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

        const eventId = cameraService.normalizeEventId(data);

        try {
            await processCheckIn(eventId);
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

    if (hasPermission === null) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
                <Text style={styles.loadingText}>Requesting camera permission...</Text>
            </View>
        );
    }

    if (hasPermission === false) {
        return (
            <View style={styles.container}>
                <Text style={styles.errorText}>Camera permission is required to scan QR codes.</Text>
                <TouchableOpacity style={styles.button} onPress={requestCameraPermission}>
                    <Text style={styles.buttonText}>Grant Permission</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.button, styles.secondaryButton]} onPress={() => router.back()}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

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
                    <View style={styles.header}>
                        <Text style={styles.headerText}>Scan Event QR Code</Text>
                        <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
                            <Text style={styles.closeButtonText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    <View style={styles.scanArea}>
                        <View style={styles.scanFrame} />
                        {processing && (
                            <View style={styles.processingOverlay}>
                                <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
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
