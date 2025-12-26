import { useState } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { Alert } from 'react-native';

export function useResume() {
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [resumeUri, setResumeUri] = useState<string | null>(null);

  const pickResume = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];
        setResumeName(file.name);
        setResumeUri(file.uri);
        Alert.alert('Success', 'Resume attached!');
        return file.name;
      }
    } catch (err) {
      console.log('Error picking resume:', err);
    }
    return null;
  };

  return { resumeName, resumeUri, pickResume };
}