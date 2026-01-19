import React, { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Alert,
    ActivityIndicator,
    Vibration,
    Dimensions,
    Platform,
    StatusBar,
} from 'react-native';
import { CameraView, BarcodeScanningResult } from 'expo-camera';
import { BlurView } from 'expo-blur';
import MaskedView from '@react-native-masked-view/masked-view';
import Svg, { Path } from 'react-native-svg';
import { cameraService } from '@/services';
import { PendingCheckInService } from '@/services/pendingCheckIn.service';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');
const SCAN_FRAME_SIZE = 300;
const BORDER_RADIUS = 30;

interface GuestCheckInScannerProps {
    visible: boolean;
    onClose: () => void;
    onScanSuccess: (eventName: string) => void;
}

export function GuestCheckInScanner({ visible, onClose, onScanSuccess }: GuestCheckInScannerProps) {
    const { theme } = useTheme();
    const [hasPermission, setHasPermission] = useState<boolean | null>(null);
    const [scanned, setScanned] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [torchOn, setTorchOn] = useState(false);
    const lastScannedRef = useRef<string>('');
    const scanTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const isScanningRef = useRef<boolean>(false);

    useEffect(() => {
        if (visible) {
            requestCameraPermission();
            // Reset state when opening
            setScanned(false);
            setProcessing(false);
            isScanningRef.current = false;
            lastScannedRef.current = '';
        }

        return () => {
            if (scanTimeoutRef.current) {
                clearTimeout(scanTimeoutRef.current);
            }
        };
    }, [visible]);

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

    const handleScanError = (error: any) => {
        console.error('Scan error:', error);
        Alert.alert(
            'Invalid QR Code',
            'This QR code could not be processed. Please try again.',
            [
                {
                    text: 'Try Again',
                    onPress: resetScanner
                }
            ]
        );
    };

    const processScan = async (token: string) => {
        try {
            await PendingCheckInService.save(token);
            const pending = await PendingCheckInService.get();
            if (pending) {
                onScanSuccess(pending.eventName);
            } else {
                throw new Error('Failed to save check-in');
            }
        } catch (error) {
            handleScanError(error);
        }
    };

    const handleBarCodeScanned = async ({ data }: BarcodeScanningResult) => {
        if (isScanningRef.current) return;
        if (!validateScan(data)) return;

        isScanningRef.current = true;
        setScanned(true);
        setProcessing(true);
        lastScannedRef.current = data;

        Vibration.vibrate(100);

        try {
            await processScan(data);
        } catch (error) {
            handleScanError(error);
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

    // Don't render if not visible
    if (!visible) return null;

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        text: { color: theme.text },
        button: { backgroundColor: theme.primary },
        buttonText: { color: '#FFFFFF' },
        secondaryButton: { borderColor: theme.primary },
        secondaryButtonText: { color: theme.primary },
        scanFrame: { borderColor: theme.primary },
    };

    const verticalOffset = (height - SCAN_FRAME_SIZE) / 2 - 70;

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
                <TouchableOpacity style={[styles.button, styles.secondaryButton, dynamicStyles.secondaryButton]} onPress={onClose}>
                    <Text style={[styles.buttonText, styles.secondaryButtonText, dynamicStyles.secondaryButtonText]}>Cancel</Text>
                </TouchableOpacity>
            </View>
        );
    }

    const createMaskPath = () => {
        const x = (width - SCAN_FRAME_SIZE) / 2;
        const y = verticalOffset;
        const s = SCAN_FRAME_SIZE;
        const r = BORDER_RADIUS;

        const outer = `M0,0H${width}V${height}H0Z`;
        const inner = [
            `M${x + r},${y}`,
            `h${s - 2 * r}`,
            `a${r},${r} 0 0 1 ${r},${r}`,
            `v${s - 2 * r}`,
            `a${r},${r} 0 0 1 -${r},${r}`,
            `h-${s - 2 * r}`,
            `a${r},${r} 0 0 1 -${r},-${r}`,
            `v-${s - 2 * r}`,
            `a${r},${r} 0 0 1 ${r},-${r}`,
            `z`
        ].join(' ');

        return `${outer} ${inner}`;
    };

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                enableTorch={torchOn}
            />

            <MaskedView
                style={StyleSheet.absoluteFill}
                maskElement={
                    <View style={styles.maskContainer}>
                        <Svg height={height} width={width} style={StyleSheet.absoluteFill}>
                            <Path d={createMaskPath()} fill="black" fillRule="evenodd" />
                        </Svg>
                    </View>
                }
            >
                <BlurView style={StyleSheet.absoluteFill} intensity={80} tint="dark" />
            </MaskedView>

            <View style={styles.uiContainer} pointerEvents="box-none">
                <View style={styles.header}>
                    <Text style={styles.headerText}>Scan Event QR Code</Text>
                    <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                </View>

                <View style={[
                    styles.scanFrameContainer,
                    {
                        width: SCAN_FRAME_SIZE,
                        height: SCAN_FRAME_SIZE,
                        left: (width - SCAN_FRAME_SIZE) / 2,
                        top: verticalOffset,
                    }
                ]}>
                    <View style={[styles.scanFrame, dynamicStyles.scanFrame]} />
                    {processing && (
                        <View style={styles.processingOverlay}>
                            <ActivityIndicator size="large" color={theme.primary} />
                            <Text style={styles.processingText}>Saving...</Text>
                        </View>
                    )}
                </View>

                <View style={styles.bottomControls}>
                    <Text style={styles.instructionsText}>
                        Sign-up is required to check in.
                        {'\n'}Scan now to save your spot!
                    </Text>

                    <TouchableOpacity style={styles.torchButton} onPress={toggleTorch}>
                        <Text style={styles.torchButtonText}>
                            {torchOn ? 'Flashlight On 🔦 ' : 'Flashlight Off 🔦'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#000',
        zIndex: 100,
    },
    loadingText: { marginTop: 20, fontSize: 16 },
    errorText: { fontSize: 16, textAlign: 'center', marginHorizontal: 40, marginBottom: 30 },
    maskContainer: { flex: 1, backgroundColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
    uiContainer: { flex: 1, justifyContent: 'space-between', zIndex: 10 },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight! + 20 : 60,
        paddingHorizontal: 20,
        paddingBottom: 20,
    },
    headerText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeButtonText: { color: '#FFFFFF', fontSize: 24, fontWeight: 'bold' },
    scanFrameContainer: { position: 'absolute', justifyContent: 'center', alignItems: 'center' },
    scanFrame: { width: '100%', height: '100%', borderWidth: 2, borderRadius: 20, backgroundColor: 'transparent' },
    processingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        borderRadius: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    processingText: { color: '#FFFFFF', marginTop: 10, fontSize: 14, fontWeight: '600' },
    bottomControls: { alignItems: 'center', paddingBottom: 50, paddingHorizontal: 20 },
    instructionsText: {
        color: '#FFFFFF',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
        textShadowColor: 'rgba(0, 0, 0, 0.75)',
        textShadowOffset: { width: -1, height: 1 },
        textShadowRadius: 10
    },
    torchButton: {
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginBottom: 15,
    },
    torchButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    button: { paddingVertical: 15, paddingHorizontal: 40, borderRadius: 12, marginTop: 10, minWidth: 200, alignItems: 'center' },
    buttonText: { fontSize: 16, fontWeight: 'bold' },
    secondaryButton: { backgroundColor: 'transparent', borderWidth: 2 },
    secondaryButtonText: {},
});
