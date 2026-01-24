import { supabase } from '../lib/supabase';
import type { ServiceResponse } from '../types/errors';
import { createError } from '../types/errors';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { PhotoHelper } from './photo.service';

interface UploadResult {
  url: string;
  path: string;
}

class StorageService {
  /**
   * Upload profile photo to Supabase Storage
   * @param userId - User ID for organizing files
   * @param imageAsset - Image picker asset
   * @returns Public URL of uploaded image
   */
  async uploadProfilePhoto(
    userId: string,
    imageAsset: ImagePicker.ImagePickerAsset
  ): Promise<ServiceResponse<UploadResult>> {
    try {
      // Compress the image first (Standardizes to WebP + 70% Quality)
      const compressedUri = await PhotoHelper.compressImage(imageAsset.uri);

      // Create a unique filename (forcing .webp extension since we compressed it)
      const timestamp = Date.now();
      const fileName = `${userId}_${timestamp}.webp`;
      const filePath = `profile-photos/${fileName}`;

      // Use FormData for React Native uploads (fixes 0-byte issue)
      const formData = new FormData();
      formData.append('file', {
        uri: compressedUri,
        type: 'image/webp',
        name: fileName,
      } as any);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, formData, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) {
        console.error('Profile photo upload error:', error);
        return {
          success: false,
          error: createError(
            'Failed to upload profile photo',
            'UPLOAD_ERROR',
            undefined,
            error.message
          ),
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filePath,
        },
      };
    } catch (error) {
      console.error('Profile photo upload exception:', error);
      return {
        success: false,
        error: createError(
          'Failed to upload profile photo',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * Upload resume to Supabase Storage
   * @param userId - User ID for organizing files
   * @param documentAsset - Document picker asset
   * @returns Public URL and original filename
   */
  async uploadResume(
    userId: string,
    documentAsset: DocumentPicker.DocumentPickerAsset
  ): Promise<ServiceResponse<UploadResult & { originalName: string }>> {
    try {
      // Create a unique filename while preserving original name
      const timestamp = Date.now();
      const fileExt = documentAsset.name.split('.').pop() || 'pdf';
      const fileName = `${userId}_${timestamp}.${fileExt}`;
      const filePath = `resumes/${fileName}`;

      // Fetch the document as a blob
      const response = await fetch(documentAsset.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, blob, {
          contentType: documentAsset.mimeType || 'application/pdf',
          upsert: false,
        });

      if (error) {
        console.error('Resume upload error:', error);
        return {
          success: false,
          error: createError(
            'Failed to upload resume',
            'UPLOAD_ERROR',
            undefined,
            error.message
          ),
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filePath,
          originalName: documentAsset.name,
        },
      };
    } catch (error) {
      console.error('Resume upload exception:', error);
      return {
        success: false,
        error: createError(
          'Failed to upload resume',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * Delete a file from Supabase Storage
   * @param filePath - Path to the file in storage
   */
  async deleteFile(filePath: string): Promise<ServiceResponse<void>> {
    try {
      const { error } = await supabase.storage
        .from('user-uploads')
        .remove([filePath]);

      if (error) {
        return {
          success: false,
          error: createError(
            'Failed to delete file',
            'DELETE_ERROR',
            undefined,
            error.message
          ),
        };
      }

      return { success: true, data: undefined };
    } catch (error) {
      return {
        success: false,
        error: createError(
          'Failed to delete file',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }

  /**
   * Upload event poster to Supabase Storage
   * @param eventId - Event ID for organizing files
   * @param imageAsset - Image picker asset
   * @returns Public URL of uploaded poster
   */
  async uploadEventPoster(
    eventId: string,
    imageAsset: ImagePicker.ImagePickerAsset
  ): Promise<ServiceResponse<UploadResult>> {
    try {
      // Compress the image for posters (higher quality than profile photos)
      const compressedUri = await PhotoHelper.compressImageForPoster(imageAsset.uri);

      // Create a unique filename
      const timestamp = Date.now();
      const fileName = `${eventId}_${timestamp}.webp`;
      const filePath = `event-posters/${fileName}`;

      // Use FormData for React Native uploads
      const formData = new FormData();
      formData.append('file', {
        uri: compressedUri,
        type: 'image/webp',
        name: fileName,
      } as any);

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('user-uploads')
        .upload(filePath, formData, {
          contentType: 'image/webp',
          upsert: false,
        });

      if (error) {
        console.error('Event poster upload error:', error);
        return {
          success: false,
          error: createError(
            'Failed to upload event poster',
            'UPLOAD_ERROR',
            undefined,
            error.message
          ),
        };
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('user-uploads')
        .getPublicUrl(filePath);

      return {
        success: true,
        data: {
          url: urlData.publicUrl,
          path: filePath,
        },
      };
    } catch (error) {
      console.error('Event poster upload exception:', error);
      return {
        success: false,
        error: createError(
          'Failed to upload event poster',
          'UNKNOWN_ERROR',
          undefined,
          error instanceof Error ? error.message : 'Unknown error'
        ),
      };
    }
  }
}

export const storageService = new StorageService();
