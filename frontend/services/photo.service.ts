import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert, Platform } from 'react-native';

export interface ImagePickerServiceOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
}

const DEFAULT_OPTIONS: ImagePickerServiceOptions = {
  allowsEditing: true,
  aspect: [1, 1],
  quality: 0.8,
};

export const PhotoHelper = {

  // 1. Take Photo (Uses System Camera)
  takePhoto: async (options: ImagePickerServiceOptions = DEFAULT_OPTIONS): Promise<string | null> => {
    try {
      // We request permission specifically for the Image Picker
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera access to take your profile picture.');
        return null;
      }

      // Note: This will crash on Simulator (since they have no camera)
      // It will work on Expo Go app however
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? DEFAULT_OPTIONS.allowsEditing,
        aspect: options.aspect ?? DEFAULT_OPTIONS.aspect,
        quality: options.quality ?? DEFAULT_OPTIONS.quality,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.log('Error taking photo:', error);
      // Only show this alert if we are essentially sure it's not a user cancellation
      Alert.alert('Error', 'Could not open camera. (If on Simulator, this is expected)');
    }
    return null;
  },

  // 2. Choose from Library (Camera Reel)
  pickFromLibrary: async (options: ImagePickerServiceOptions = DEFAULT_OPTIONS): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery access to select a photo.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing ?? DEFAULT_OPTIONS.allowsEditing,
        aspect: options.aspect ?? DEFAULT_OPTIONS.aspect,
        quality: options.quality ?? DEFAULT_OPTIONS.quality,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        return result.assets[0].uri;
      }
    } catch (error) {
      console.log('Error picking from library:', error);
    }
    return null;
  },

  // 3. Choose from Files (iCloud / Google Drive)
  pickFromFiles: async (): Promise<string | null> => {
    try {
      // We use '*/*' to ensure the picker opens on all Android/iOS versions
      // Then we validate if it's an image afterwards
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Manual validation to ensure it's an image
        // We check if the MIME type starts with 'image/' OR if the name ends with extensions
        const isImage = file.mimeType?.startsWith('image/') ||
          /\.(jpg|jpeg|png|heic)$/i.test(file.name);

        if (!isImage) {
          Alert.alert('Invalid File', 'Please select a valid image file (JPG, PNG).');
          return null;
        }

        return file.uri;
      }
    } catch (error) {
      console.log('Error picking file:', error);
    }
    return null;
  },

  // 4. Compress Image (Standardize to WebP)
  compressImage: async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 1080 } }], // Max width 1080px to save space
        {
          compress: 0.7, // 70% quality
          format: ImageManipulator.SaveFormat.WEBP,
        }
      );
      return result.uri;
    } catch (error) {
      console.log('Error compressing image:', error);
      // If compression fails, return original URI as fallback
      return uri;
    }
  },

  // 5. Compress Image for Posters (Higher quality for event posters)
  compressImageForPoster: async (uri: string): Promise<string> => {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { height: 2400 } }], // Max height 2400px for portrait posters
        {
          compress: 0.85, // 85% quality - less compression for posters
          format: ImageManipulator.SaveFormat.WEBP,
        }
      );
      return result.uri;
    } catch (error) {
      console.log('Error compressing poster image:', error);
      // If compression fails, return original URI as fallback
      return uri;
    }
  },
};