import { Platform, Alert, ActionSheetIOS } from 'react-native';
import { PhotoHelper, ImagePickerServiceOptions } from '../../services/photo.service';

export type PhotoSource = 'camera' | 'library' | 'files';

/**
 * Generic hook for handling image selection
 * Provides a unified interface for picking photos from camera, library, or files
 */
export function useImagePicker(options?: ImagePickerServiceOptions) {
    /**
     * Shows platform-specific photo picker (ActionSheet on iOS, Alert on Android)
     * @param onPhotoPicked - Callback with the selected photo URI
     */
    const pickImage = async (onPhotoPicked: (uri: string) => void) => {
        const pickerOptions = ['Take Photo', 'Choose from Library', 'Choose from Files', 'Cancel'];
        const cancelButtonIndex = 3;

        if (Platform.OS === 'ios') {
            ActionSheetIOS.showActionSheetWithOptions(
                {
                    options: pickerOptions,
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
                'Upload Image',
                'Choose an option',
                [
                    {
                        text: 'Take Photo',
                        onPress: async () => {
                            const uri = await PhotoHelper.takePhoto(options);
                            if (uri) onPhotoPicked(uri);
                        }
                    },
                    {
                        text: 'Choose from Library',
                        onPress: async () => {
                            const uri = await PhotoHelper.pickFromLibrary(options);
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
                return await PhotoHelper.takePhoto(options);
            case 1:
                return await PhotoHelper.pickFromLibrary(options);
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
                return await PhotoHelper.takePhoto(options);
            case 'library':
                return await PhotoHelper.pickFromLibrary(options);
            case 'files':
                return await PhotoHelper.pickFromFiles();
        }
    };

    return {
        pickImage,
        pickFromSource,
    };
}
