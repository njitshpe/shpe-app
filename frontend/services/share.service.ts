import { Share, Platform } from 'react-native';
import * as Linking from 'expo-linking';
import { formatDateHeader, formatTime } from '../utils/date';

export interface ShareEventData {
  id?: string;
  title: string;
  startTimeISO: string;
  endTimeISO: string;
  locationName?: string;
  address?: string;
  description?: string;
  deepLink?: string;
}

/**
 * Share Service for sharing events via native share sheet
 */
class ShareService {
  /**
   * Share event details
   */
  async shareEvent(event: ShareEventData): Promise<boolean> {
    try {
      // Generate deep link if not provided
      let deepLink = event.deepLink;
      if (!deepLink && event.id) {
        deepLink = Linking.createURL(`/event/${event.id}`);
        console.log('[ShareService] Generated deep link:', deepLink);
        console.log('[ShareService] Event ID used:', event.id);
      }

      const message = this.buildShareMessage({ ...event, deepLink });

      const result = await Share.share(
        {
          message: Platform.OS === 'ios' ? message : message,
          title: event.title,
          url: deepLink, // iOS only, will be ignored on Android
        },
        {
          dialogTitle: `Share ${event.title}`, // Android only
          subject: event.title, // Email subject (if sharing via email)
        }
      );

      if (result.action === Share.sharedAction) {
        if (result.activityType) {
          // Shared with activity type (iOS)
          console.log('Shared with activity:', result.activityType);
        } else {
          // Shared (Android or iOS without activity type)
          console.log('Event shared successfully');
        }
        return true;
      } else if (result.action === Share.dismissedAction) {
        // Dismissed
        console.log('Share dismissed');
        return false;
      }

      return false;
    } catch (error) {
      console.error('Error sharing event:', error);
      return false;
    }
  }

  /**
   * Build formatted share message
   */
  private buildShareMessage(event: ShareEventData): string {
    const parts: string[] = [];

    // Title
    parts.push(`📅 ${event.title}`);
    parts.push('');

    // Date & Time
    parts.push(`🗓 ${formatDateHeader(event.startTimeISO)}`);
    parts.push(`⏰ ${formatTime(event.startTimeISO)} - ${formatTime(event.endTimeISO)}`);
    parts.push('');

    // Location
    if (event.locationName) {
      parts.push(`📍 ${event.locationName}`);
      if (event.address) {
        parts.push(`   ${event.address}`);
      }
      parts.push('');
    }

    // Description (truncated if too long)
    if (event.description) {
      const maxDescLength = 200;
      const desc =
        event.description.length > maxDescLength
          ? event.description.substring(0, maxDescLength) + '...'
          : event.description;
      parts.push(desc);
      parts.push('');
    }

    // Links
    parts.push('📲 View in App:');
    if (event.deepLink) {
      parts.push(event.deepLink);
    } else {
      // Allow fallback if deepLink wasn't passed or generated (shouldn't happen with new logic)
      parts.push('Open SHPE App to view details');
    }

    // TODO: Replace with actual App Store / Play Store link
    // parts.push('');
    // parts.push('Download the app: https://shpe-njit.org/app');

    return parts.join('\n');
  }
}

export const shareService = new ShareService();
