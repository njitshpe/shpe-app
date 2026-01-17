import { Share, Platform } from 'react-native';
import { formatDateHeader, formatTime } from '../utils/date';

export interface ShareEventData {
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
      const message = this.buildShareMessage(event);

      const result = await Share.share(
        {
          message: Platform.OS === 'ios' ? message : message,
          title: event.title,
          url: event.deepLink, // iOS only, will be ignored on Android
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

    // Deep link or app promotion
    if (event.deepLink) {
      parts.push(`🔗 ${event.deepLink}`);
    } else {
      parts.push('Shared from SHPE App');
    }

    return parts.join('\n');
  }
}

export const shareService = new ShareService();
