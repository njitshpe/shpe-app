import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    TextInput,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

interface AnnouncementModalProps {
    visible: boolean;
    onClose: () => void;
    onSend: (title: string, message: string) => Promise<boolean>;
}

export function AnnouncementModal({ visible, onClose, onSend }: AnnouncementModalProps) {
    const { theme, isDark } = useTheme();
    const [title, setTitle] = useState('');
    const [message, setMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    // Reset state when modal opens
    useEffect(() => {
        if (visible) {
            setTitle('');
            setMessage('');
            setIsSending(false);
        }
    }, [visible]);

    const handleSend = () => {
        if (!title.trim() || !message.trim()) {
            Alert.alert('Missing Fields', 'Please add a title and message.');
            return;
        }

        Alert.alert(
            'Confirm Announcement',
            'This will send a push notification to ALL users. Are you sure?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Send Now',
                    style: 'destructive',
                    onPress: async () => {
                        setIsSending(true);
                        const success = await onSend(title, message);
                        setIsSending(false);
                        if (success) {
                            onClose();
                        }
                    },
                },
            ]
        );
    };

    const dynamicStyles = {
        container: { backgroundColor: theme.background },
        modalContent: { backgroundColor: isDark ? '#1C1C1E' : '#FFFFFF' },
        text: { color: theme.text },
        subtext: { color: theme.subtext },
        input: {
            backgroundColor: isDark ? '#2C2C2E' : '#F2F2F7',
            color: theme.text,
            borderColor: theme.border
        },
        previewCard: { backgroundColor: isDark ? 'rgba(40,40,40,0.9)' : 'rgba(255,255,255,0.85)' },
        previewText: { color: isDark ? '#FFFFFF' : '#000000' },
        previewSubtext: { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' },
    };

    // Current time for preview
    const now = new Date();
    const timeString = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={[styles.container, dynamicStyles.container]}
            >
                {/* Header */}
                <View style={styles.header}>
                    <Text style={[styles.headerTitle, dynamicStyles.text]}>New Announcement</Text>
                    <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                        <Ionicons name="close-circle" size={30} color={theme.subtext} />
                    </TouchableOpacity>
                </View>

                <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">

                    {/* Live Preview Section */}
                    <Text style={[styles.sectionLabel, dynamicStyles.subtext]}>LOCK SCREEN PREVIEW</Text>
                    <View style={styles.previewContainer}>
                        {/* Mock Wallpaper Background */}
                        <View style={[styles.wallpaper, { backgroundColor: isDark ? '#1a2a4d' : '#a2c2e6' }]}>

                            {/* Only render BlurView if we are on iOS */}
                            {Platform.OS === 'ios' && (
                                <BlurView intensity={20} style={StyleSheet.absoluteFill} />
                            )}
                            
                            {/* Notification Card */}
                            <View style={[styles.notificationCard, dynamicStyles.previewCard]}>
                                <View style={styles.notificationHeader}>
                                    <View style={styles.appIcon}>
                                        <Ionicons name="cube" size={12} color="#fff" />
                                    </View>
                                    <Text style={[styles.appName, dynamicStyles.previewSubtext]}>SHPE NJIT</Text>
                                    <Text style={[styles.timeText, dynamicStyles.previewSubtext]}>{timeString}</Text>
                                </View>
                                <Text style={[styles.notificationTitle, dynamicStyles.previewText]} numberOfLines={1}>
                                    {title || 'New Announcement'}
                                </Text>
                                <Text style={[styles.notificationBody, dynamicStyles.previewText]} numberOfLines={2}>
                                    {message || 'Your message will appear here...'}
                                </Text>
                            </View>
                        </View>
                    </View>

                    {/* Input Wrapper */}
                    <View style={styles.inputsContainer}>

                        {/* Title Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, dynamicStyles.text]}>Title</Text>
                                <Text style={[
                                    styles.counter,
                                    title.length > 40 ? styles.warning : dynamicStyles.subtext
                                ]}>
                                    {title.length}/40
                                </Text>
                            </View>
                            <TextInput
                                style={[styles.input, dynamicStyles.input]}
                                placeholder="Event or Update Title"
                                placeholderTextColor={theme.subtext}
                                value={title}
                                onChangeText={setTitle}
                                maxLength={60}
                            />
                        </View>

                        {/* Message Input */}
                        <View style={styles.inputGroup}>
                            <View style={styles.labelRow}>
                                <Text style={[styles.label, dynamicStyles.text]}>Message</Text>
                                <Text style={[
                                    styles.counter,
                                    message.length > 140 ? styles.warning : dynamicStyles.subtext
                                ]}>
                                    {message.length}/140
                                </Text>
                            </View>
                            <TextInput
                                style={[styles.input, styles.textArea, dynamicStyles.input]}
                                placeholder="What would you like to tell everyone?"
                                placeholderTextColor={theme.subtext}
                                value={message}
                                onChangeText={setMessage}
                                multiline
                                numberOfLines={4}
                                maxLength={200}
                            />
                        </View>
                    </View>

                    {/* Info */}
                    <View style={styles.infoBox}>
                        <Ionicons name="information-circle" size={20} color={theme.primary} />
                        <Text style={[styles.infoText, dynamicStyles.subtext]}>
                            This message will be sent immediately to all users who have notifications enabled.
                        </Text>
                    </View>

                </ScrollView>

                {/* Footer Action */}
                <View style={[styles.footer, { borderTopColor: theme.border }]}>
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: theme.primary, opacity: isSending ? 0.7 : 1 }
                        ]}
                        onPress={handleSend}
                        disabled={isSending}
                    >
                        {isSending ? (
                            <Text style={styles.sendButtonText}>Sending...</Text>
                        ) : (
                            <>
                                <Ionicons name="paper-plane" size={20} color="#fff" style={{ marginRight: 8 }} />
                                <Text style={styles.sendButtonText}>Send to All Users</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 20,
        paddingTop: 24,
    },
    headerTitle: {
        fontSize: 22,
        fontWeight: 'bold',
    },
    closeButton: {
        padding: 4,
    },
    content: {
        flex: 1,
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '600',
        letterSpacing: 1,
        marginBottom: 8,
        marginLeft: 20,
        opacity: 0.7,
    },
    previewContainer: {
        marginHorizontal: 20,
        height: 140, // Notification area height
        marginBottom: 30,
        borderRadius: 16,
        overflow: 'hidden',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 5,
        elevation: 6,
    },
    wallpaper: {
        flex: 1,
        justifyContent: 'center',
        padding: 16,
    },
    notificationCard: {
        borderRadius: 12,
        padding: 12,
        overflow: 'hidden', // Look like glossy blur
    },
    notificationHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },
    appIcon: {
        width: 18,
        height: 18,
        borderRadius: 4,
        backgroundColor: '#D35400', // Brand color
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 6,
    },
    appName: {
        fontSize: 12,
        fontWeight: '600',
        flex: 1,
    },
    timeText: {
        fontSize: 11,
    },
    notificationTitle: {
        fontSize: 14,
        fontWeight: '700',
        marginBottom: 2,
    },
    notificationBody: {
        fontSize: 14,
        lineHeight: 18,
    },
    inputsContainer: {
        paddingHorizontal: 20,
        gap: 20,
    },
    inputGroup: {
        gap: 8,
    },
    labelRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
    },
    counter: {
        fontSize: 12,
    },
    warning: {
        color: '#FF3B30',
        fontWeight: 'bold',
    },
    input: {
        borderRadius: 12,
        padding: 14,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'transparent',
    },
    textArea: {
        height: 100,
        textAlignVertical: 'top',
    },
    infoBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(211, 84, 0, 0.1)',
        margin: 20,
        padding: 12,
        borderRadius: 12,
        gap: 12,
    },
    infoText: {
        flex: 1,
        fontSize: 13,
    },
    footer: {
        padding: 20,
        paddingBottom: 40,
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    sendButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 16,
        borderRadius: 16,
    },
    sendButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});
