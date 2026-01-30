import { useImagePicker, PhotoSource } from './useImagePicker';

/**
 * Hook for handling profile photo selection
 * Wraps useImagePicker with preset options for profile photos (1:1 aspect ratio)
 */
export function useProfilePhoto() {
  const { pickImage, pickFromSource } = useImagePicker({
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  return {
    pickPhoto: pickImage,
    pickFromSource,
  };
}

export type { PhotoSource };
