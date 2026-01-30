import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';
import { createError } from '../../types/errors';
import type { AppError } from '../../types/errors';

export function useResume() {
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeUri, setResumeUri] = useState<string | null>(null);

  const pickResume = async (): Promise<{ name: string; uri: string } | null> => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeName(file.name);
        setResumeUri(file.uri);
        return { name: file.name, uri: file.uri };
      }
    } catch (err) {
      console.error('Error picking resume:', err);
      Alert.alert('Error', 'Failed to pick resume. Please try again.');
    }
    return null;
  };

  return { resumeName, resumeUri, pickResume };
}