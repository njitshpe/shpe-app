import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CheckInTokenService } from '@/services/checkInToken.service';

interface CheckInQRModalProps {
  visible: boolean;
  onClose: () => void;
  eventId: string;
  eventName: string;
  checkInOpens: string;
  checkInCloses: string;
}

type EventState = 'not_open' | 'active' | 'closed';

export const CheckInQRModal: React.FC<CheckInQRModalProps> = ({
  visible,
  onClose,
  eventId,
  eventName,
  checkInOpens,
  checkInCloses,
}) => {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [eventState, setEventState] = useState<EventState>('not_open');
  const [timeUntilOpen, setTimeUntilOpen] = useState<string>('');
  const [timeUntilClose, setTimeUntilClose] = useState<string>('');

  // Update event state based on current time
  const updateEventState = useCallback(() => {
    const state = CheckInTokenService.getEventState(checkInOpens, checkInCloses);
    setEventState(state);

    const now = new Date();
    const opens = new Date(checkInOpens);
    const closes = new Date(checkInCloses);

    if (state === 'not_open') {
      const diff = opens.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        setTimeUntilOpen(`Opens in ${hours}h ${minutes % 60}m`);
      } else {
        setTimeUntilOpen(`Opens in ${minutes}m`);
      }
    } else if (state === 'active') {
      const diff = closes.getTime() - now.getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(minutes / 60);
      if (hours > 0) {
        setTimeUntilClose(`Closes in ${hours}h ${minutes % 60}m`);
      } else {
        setTimeUntilClose(`Closes in ${minutes}m`);
      }
    }
  }, [checkInOpens, checkInCloses]);

  // Update state every minute
  useEffect(() => {
    updateEventState();
    const interval = setInterval(updateEventState, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [updateEventState]);

  // Load token when modal opens
  useEffect(() => {
    if (visible && eventState === 'active') {
      loadToken();
    } else if (!visible) {
      // Reset state when modal closes
      setToken(null);
      setError(null);
    }
  }, [visible, eventState]);

  const loadToken = async () => {
    setLoading(true);
    setError(null);
    setToken(null); // Clear any existing token

    try {
      // FETCH-FIRST: Always try server first
      // Cache fallback handled inside getCheckInToken only for true network errors
      const result = await CheckInTokenService.getCheckInToken(eventId);
      setToken(result.token);
    } catch (err: any) {
      console.error('Error loading check-in token:', err);
      console.error('Error context status:', err?.context?.status);

      let errorCode = err?.errorCode;
      let backendMessage: string | undefined;

      // Try to extract error from response body
      try {
        if (err?.context?._bodyBlob?._data || err?.context?.json) {
          const responseData = await err.context.json();
          console.error('Backend response:', responseData);
          errorCode = responseData?.errorCode || responseData?.code;
          backendMessage = responseData?.error || responseData?.message;
        } else if (err?.context?._data) {
          console.error('Backend response (_data):', err.context._data);
          errorCode = err.context._data?.errorCode;
          backendMessage = err.context._data?.error;
        }
      } catch (parseErr) {
        console.error('Failed to parse error response:', parseErr);
      }

      let errorMessage = backendMessage || err?.message || 'Failed to load QR code';

      // Map error codes to user-friendly messages
      if (errorCode) {
        const errorMessages: Record<string, string> = {
          CHECK_IN_NOT_OPEN: 'Check-in window has not opened yet',
          CHECK_IN_CLOSED: 'Check-in window has closed',
          NOT_ADMIN: 'Admin access required',
        };

        errorMessage = errorMessages[errorCode]
          ? `${errorMessages[errorCode]}`
          : backendMessage
          ? `${errorCode}: ${backendMessage}`
          : errorCode;
      }

      setError(errorMessage);
      Alert.alert(
        'Error',
        errorMessage + '\n\nPlease check your permissions and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const getButtonStyle = () => {
    switch (eventState) {
      case 'not_open':
        return styles.buttonDisabled;
      case 'active':
        return styles.buttonActive;
      case 'closed':
        return styles.buttonExpired;
      default:
        return styles.buttonDisabled;
    }
  };

  const getButtonText = () => {
    switch (eventState) {
      case 'not_open':
        return `Check-in Not Open - ${timeUntilOpen}`;
      case 'active':
        return token ? 'QR Code Active' : 'Loading QR Code...';
      case 'closed':
        return 'Check-in Closed';
      default:
        return 'Loading...';
    }
  };

  const renderContent = () => {
    if (eventState !== 'active') {
      return (
        <View style={styles.messageContainer}>
          <Text style={styles.messageTitle}>
            {eventState === 'not_open' ? '⏰ Check-in Not Yet Open' : '🔒 Check-in Closed'}
          </Text>
          <Text style={styles.messageText}>
            {eventState === 'not_open'
              ? `Check-in opens at ${new Date(checkInOpens).toLocaleString()}`
              : `Check-in closed at ${new Date(checkInCloses).toLocaleString()}`}
          </Text>
          {eventState === 'not_open' && (
            <Text style={styles.countdownText}>{timeUntilOpen}</Text>
          )}
        </View>
      );
    }

    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Generating QR Code...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>⚠️ Error</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadToken}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (token) {
      return (
        <View style={styles.qrContainer}>
          <View style={styles.qrWrapper}>
            <QRCode value={token} size={280} backgroundColor="white" color="black" />
          </View>
          <Text style={styles.eventNameText}>{eventName}</Text>
          <Text style={styles.instructionText}>
            Students scan this QR code to check in
          </Text>
          <Text style={styles.timeRemainingText}>⏱ {timeUntilClose}</Text>
          <View style={styles.offlineIndicator}>
            <Text style={styles.offlineText}>
              ✓ QR code cached for offline use
            </Text>
          </View>
        </View>
      );
    }

    return null;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Check-In QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.statusBar}>
            <View style={[styles.statusIndicator, getButtonStyle()]} />
            <Text style={styles.statusText}>{getButtonText()}</Text>
          </View>

          <View style={styles.content}>{renderContent()}</View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '90%',
    maxWidth: 500,
    backgroundColor: 'white',
    borderRadius: 20,
    overflow: 'hidden',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 10,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#e9ecef',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 20,
    color: '#495057',
    fontWeight: '600',
  },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#495057',
  },
  buttonDisabled: {
    backgroundColor: '#adb5bd',
  },
  buttonActive: {
    backgroundColor: '#28a745',
  },
  buttonExpired: {
    backgroundColor: '#dc3545',
  },
  content: {
    padding: 24,
    minHeight: 300,
  },
  messageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#212529',
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  countdownText: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
    marginTop: 10,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#dc3545',
    marginBottom: 12,
  },
  errorText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  qrContainer: {
    alignItems: 'center',
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#e9ecef',
    marginBottom: 20,
  },
  eventNameText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#212529',
    textAlign: 'center',
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
    marginBottom: 12,
  },
  timeRemainingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  offlineIndicator: {
    backgroundColor: '#d4edda',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#c3e6cb',
  },
  offlineText: {
    fontSize: 12,
    color: '#155724',
    fontWeight: '600',
  },
});
