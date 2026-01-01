import { Platform, Alert, ActionSheetIOS } from 'react-native';
import { PhotoHelper } from '../../services/photo.service';

export type PhotoSource = 'camera' | 'library' | 'files';

/**
 * Hook for handling profile photo selection
 * Provides a unified interface for picking photos from camera, library, or files
 */
export function useProfilePhoto() {
  /**
   * Shows platform-specific photo picker (ActionSheet on iOS, Alert on Android)
   * @param onPhotoPicked - Callback with the selected photo URI
   */
  const pickPhoto = async (onPhotoPicked: (uri: string) => void) => {
    const options = ['Take Photo', 'Choose from Library', 'Choose from Files', 'Cancel'];
    const cancelButtonIndex = 3;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options,
          cancelButtonIndex,
        },
        async (buttonIndex) => {
          const uri = await handlePhotoSourceSelection(buttonIndex);
          if (uri) onPhotoPicked(uri);
        }
      );
    } else {
      // Android / Web fallback
      Alert.alert(
        'Change Profile Picture',
        'Choose an option',
        [
          {
            text: 'Take Photo',
            onPress: async () => {
              const uri = await PhotoHelper.takePhoto();
              if (uri) onPhotoPicked(uri);
            }
          },
          {
            text: 'Choose from Library',
            onPress: async () => {
              const uri = await PhotoHelper.pickFromLibrary();
              if (uri) onPhotoPicked(uri);
            }
          },
          {
            text: 'Choose from Files',
            onPress: async () => {
              const uri = await PhotoHelper.pickFromFiles();
              if (uri) onPhotoPicked(uri);
            }
          },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
    }
  };

  /**
   * Handles photo source selection for iOS ActionSheet
   * @param buttonIndex - The selected button index
   * @returns Photo URI or null
   */
  const handlePhotoSourceSelection = async (buttonIndex: number): Promise<string | null> => {
    switch (buttonIndex) {
      case 0:
        return await PhotoHelper.takePhoto();
      case 1:
        return await PhotoHelper.pickFromLibrary();
      case 2:
        return await PhotoHelper.pickFromFiles();
      default:
        return null;
    }
  };

  /**
   * Directly pick from a specific source without showing picker
   * @param source - The photo source to use
   * @returns Photo URI or null
   */
  const pickFromSource = async (source: PhotoSource): Promise<string | null> => {
    switch (source) {
      case 'camera':
        return await PhotoHelper.takePhoto();
      case 'library':
        return await PhotoHelper.pickFromLibrary();
      case 'files':
        return await PhotoHelper.pickFromFiles();
    }
  };

  return {
    pickPhoto,
    pickFromSource,
  };
}
