import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

interface ResumeUploaderProps {
  resumeName: string | null;
  onUpload: () => void;
  onRemove?: () => void;
}

export function ResumeUploader({ resumeName, onUpload, onRemove }: ResumeUploaderProps) {
  const { theme, isDark } = useTheme();

  const dynamicStyles = {
    label: { color: theme.text },
    uploadBox: { backgroundColor: isDark ? '#333' : '#F3F4F6' },
    fileName: { color: theme.subtext },
    button: { backgroundColor: theme.primary },
    buttonText: { color: '#FFFFFF' }, // Always white on primary
  };

  return (
    <View style={styles.container}>
      <Text style={[styles.label, dynamicStyles.label]}>Resume</Text>
      <View style={[styles.uploadBox, dynamicStyles.uploadBox]}>
        <View style={styles.fileInfo}>
          <Text style={[styles.fileName, dynamicStyles.fileName]} numberOfLines={1}>
            {resumeName || 'No resume uploaded'}
          </Text>
        </View>

        <View style={styles.actions}>
          {resumeName && onRemove && (
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={onRemove}
            >
              <Text style={[styles.buttonText, dynamicStyles.buttonText]}>✕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={[styles.button, dynamicStyles.button]} onPress={onUpload}>
            <Text style={[styles.buttonText, dynamicStyles.buttonText]}>
              {resumeName ? 'Replace' : 'Upload PDF'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 15,
    borderRadius: 10
  },
  fileInfo: {
    flex: 1,
    marginRight: 10
  },
  fileName: {
    flex: 1,
    marginRight: 10
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6
  },
  removeButton: {
    backgroundColor: '#FF3B30'
  },
  buttonText: {
    fontWeight: '600'
  },
});