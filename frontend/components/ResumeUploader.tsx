import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SHPE_COLORS } from '../constants/colors';

interface ResumeUploaderProps {
  resumeName: string | null;
  onUpload: () => void;
  onRemove?: () => void;
}

export function ResumeUploader({ resumeName, onUpload, onRemove }: ResumeUploaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Resume</Text>
      <View style={styles.uploadBox}>
        <View style={styles.fileInfo}>
          <Text style={styles.fileName} numberOfLines={1}>
            {resumeName || 'No resume uploaded'}
          </Text>
        </View>

        <View style={styles.actions}>
          {resumeName && onRemove && (
            <TouchableOpacity
              style={[styles.button, styles.removeButton]}
              onPress={onRemove}
            >
              <Text style={styles.buttonText}>✕</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.button} onPress={onUpload}>
            <Text style={styles.buttonText}>
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
    color: SHPE_COLORS.darkBlue,
    marginBottom: 10
  },
  uploadBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: SHPE_COLORS.gray,
    padding: 15,
    borderRadius: 10
  },
  fileInfo: {
    flex: 1,
    marginRight: 10
  },
  fileName: {
    color: SHPE_COLORS.darkGray,
    flex: 1,
    marginRight: 10
  },
  actions: {
    flexDirection: 'row',
    gap: 8
  },
  button: {
    backgroundColor: SHPE_COLORS.lightBlue,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 6
  },
  removeButton: {
    backgroundColor: '#FF3B30'
  },
  buttonText: {
    color: SHPE_COLORS.white,
    fontWeight: '600'
  },
});