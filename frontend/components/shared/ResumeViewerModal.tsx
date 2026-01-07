import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { SHPE_COLORS } from '@/constants';

interface ResumeViewerModalProps {
  visible: boolean;
  onClose: () => void;
  resumeUrl: string;
}

export default function ResumeViewerModal({ visible, onClose, resumeUrl }: ResumeViewerModalProps) {
  const { theme, isDark } = useTheme();
  const [loading, setLoading] = useState(true);

  // Format the URL for platform-specific rendering
  const getViewerUrl = () => {
    if (Platform.OS === 'ios') {
      // iOS can render PDFs directly
      return resumeUrl;
    } else {
      // Android uses Google Docs Viewer
      const encodedUrl = encodeURIComponent(resumeUrl);
      return `https://docs.google.com/gview?embedded=true&url=${encodedUrl}`;
    }
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleLoadStart = () => {
    setLoading(true);
  };

  // Reset loading state when modal opens/closes
  React.useEffect(() => {
    if (visible) {
      setLoading(true);
    }
  }, [visible]);

  const dynamicStyles = {
    container: { backgroundColor: theme.background },
    header: { backgroundColor: isDark ? '#1C1C1E' : SHPE_COLORS.darkBlue },
    headerText: { color: SHPE_COLORS.white },
    closeButton: { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, dynamicStyles.container]} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'light-content'} />

        {/* Custom Header */}
        <View style={[styles.header, dynamicStyles.header]}>
          <View style={styles.headerContent}>
            <Text style={[styles.headerTitle, dynamicStyles.headerText]}>Resume</Text>
            <TouchableOpacity
              style={[styles.closeButton, dynamicStyles.closeButton]}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={24} color={SHPE_COLORS.white} />
            </TouchableOpacity>
          </View>
        </View>

        {/* WebView */}
        <View style={styles.webViewContainer}>
          <WebView
            source={{ uri: getViewerUrl() }}
            style={styles.webView}
            onLoadStart={handleLoadStart}
            onLoadEnd={handleLoadEnd}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.error('WebView error:', nativeEvent);
              setLoading(false);
            }}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowFileAccess={true}
            allowUniversalAccessFromFileURLs={true}
          />

          {/* Loading Overlay */}
          {loading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color={SHPE_COLORS.orange} />
              <Text style={[styles.loadingText, { color: theme.text }]}>
                Loading resume...
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
});
