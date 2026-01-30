import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Modal,
  Platform,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Constants from 'expo-constants';
import { useTheme } from '@/contexts/ThemeContext';
import { GRADIENTS, SHADOWS, RADIUS, SPACING, SHPE_COLORS, TYPOGRAPHY } from '@/constants/colors';

interface ResumePreviewProps {
  file: DocumentPicker.DocumentPickerAsset;
  onRemove?: () => void;
  showRemove?: boolean;
  style?: StyleProp<ViewStyle>;
}

const isExpoGo = Constants.appOwnership === 'expo';
let PdfComponent: any = null;

if (!isExpoGo) {
  try {
    const module = require('react-native-pdf');
    PdfComponent = module.default ?? module;
  } catch (error) {
    console.warn('PDF preview unavailable:', error);
  }
}

export default function ResumePreview({ file, onRemove, showRemove = false, style }: ResumePreviewProps) {
  const { theme, isDark } = useTheme();
  const [viewerOpen, setViewerOpen] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const source = useMemo(() => ({ uri: file.uri, cache: true }), [file.uri]);

  useEffect(() => {
    setIsLoading(true);
    setHasError(false);
  }, [file.uri]);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    return `${(bytes / 1024).toFixed(1)} KB`;
  };

  if (hasError || !PdfComponent) {
    return (
      <View style={[styles.fallbackRow, { borderColor: theme.border }, style]}>
        <View style={[styles.fallbackIcon, { backgroundColor: isDark ? '#1F2937' : '#F3F4F6' }]}>
          <Text style={styles.fallbackIconText}>📄</Text>
        </View>
        <View style={styles.fallbackText}>
          <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={[styles.fileSize, { color: theme.subtext }]}>
            {formatFileSize(file.size)}
          </Text>
          {!PdfComponent ? (
            <Text style={[styles.previewNote, { color: theme.subtext }]}>
              Preview available in dev build
            </Text>
          ) : null}
        </View>
        {showRemove && onRemove ? (
          <Pressable onPress={onRemove} style={styles.removeButton}>
            <Ionicons name="close-circle" size={22} color="#EF4444" />
          </Pressable>
        ) : null}
      </View>
    );
  }

  return (
    <>
      <View style={[styles.container, style]}>
        <Pressable
          onPress={() => setViewerOpen(true)}
          style={[
            styles.previewCard,
            {
              backgroundColor: isDark ? GRADIENTS.darkCard[0] : GRADIENTS.lightCard[0],
              borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(15,23,42,0.08)',
            },
          ]}
        >
          <PdfComponent
            source={source}
            page={1}
            singlePage
            trustAllCerts={false}
            enablePaging={false}
            horizontal={false}
            onLoadComplete={() => setIsLoading(false)}
            onError={(error: any) => {
              console.error('PDF preview error:', error);
              setIsLoading(false);
              setHasError(true);
            }}
            style={styles.pdf}
          />

          {isLoading ? (
            <View style={styles.loaderOverlay}>
              <ActivityIndicator size="small" color={SHPE_COLORS.sunsetOrange} />
              <Text style={[styles.loaderText, { color: theme.subtext }]}>Loading preview...</Text>
            </View>
          ) : null}

          <View style={[styles.overlayIcon, { backgroundColor: isDark ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.9)' }]}>
            <Ionicons name="search" size={16} color={SHPE_COLORS.sunsetOrange} />
          </View>
        </Pressable>

        {showRemove && onRemove ? (
          <Pressable onPress={onRemove} style={styles.removeButtonFloating}>
            <Ionicons name="close-circle" size={26} color="#EF4444" />
          </Pressable>
        ) : null}

        <View style={styles.meta}>
          <Text style={[styles.fileName, { color: theme.text }]} numberOfLines={1}>
            {file.name}
          </Text>
          <Text style={[styles.fileSize, { color: theme.subtext }]}>
            {formatFileSize(file.size)}
          </Text>
        </View>
      </View>

      <Modal visible={viewerOpen} animationType="slide" onRequestClose={() => setViewerOpen(false)}>
        <View style={[styles.viewerContainer, { backgroundColor: theme.background }]}>
          <View style={styles.viewerHeader}>
            <Text style={[styles.viewerTitle, { color: theme.text }]}>Resume Preview</Text>
            <Pressable onPress={() => setViewerOpen(false)} style={styles.viewerClose}>
              <Ionicons name="close" size={26} color={theme.text} />
            </Pressable>
          </View>
          <PdfComponent
            source={source}
            trustAllCerts={false}
            onError={(error: any) => console.error('PDF viewer error:', error)}
            style={styles.viewerPdf}
          />
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    position: 'relative',
  },
  previewCard: {
    width: '100%',
    aspectRatio: 1 / 1.41,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  pdf: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  loaderText: {
    marginTop: SPACING.xs,
    fontSize: 12,
  },
  overlayIcon: {
    position: 'absolute',
    right: SPACING.sm,
    bottom: SPACING.sm,
    padding: SPACING.xs,
    borderRadius: RADIUS.full,
  },
  removeButtonFloating: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  meta: {
    marginTop: SPACING.sm,
  },
  fileName: {
    ...TYPOGRAPHY.caption,
    fontWeight: '600',
  },
  fileSize: {
    ...TYPOGRAPHY.small,
  },
  fallbackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderWidth: 1,
    borderRadius: RADIUS.md,
  },
  fallbackIcon: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  fallbackIconText: {
    fontSize: 20,
  },
  fallbackText: {
    flex: 1,
  },
  previewNote: {
    ...TYPOGRAPHY.small,
    marginTop: 2,
  },
  removeButton: {
    padding: SPACING.xs,
  },
  viewerContainer: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 32 : 48,
  },
  viewerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.md,
  },
  viewerTitle: {
    ...TYPOGRAPHY.title,
  },
  viewerClose: {
    padding: SPACING.xs,
  },
  viewerPdf: {
    flex: 1,
    width: '100%',
  },
});
