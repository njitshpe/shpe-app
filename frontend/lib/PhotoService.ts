import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Alert, Platform } from 'react-native';

export const PhotoHelper = {
  
  // 1. Take Photo (Uses System Camera)
  takePhoto: async (): Promise<string | null> => {
    try {
      // We request permission specifically for the Image Picker
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera access to take your profile picture.');
        return null;
      }

      // Note: This will crash on Simulator (Simulators have no camera)
      // It will work on your real device via Expo Go
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Allows user to crop to a square
        aspect: [1, 1],
        quality: 0.8,
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
  pickFromLibrary: async (): Promise<string | null> => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need gallery access to select a photo.');
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
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
};