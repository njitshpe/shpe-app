import * as Calendar from 'expo-calendar';
import { Alert, Platform } from 'react-native';

export interface CalendarEvent {
  title: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  location?: string;
  notes?: string;
}

/**
 * Calendar Service for adding events to device calendar
 */
class CalendarService {
  /**
   * Request calendar permissions
   */
  private async requestPermissions(): Promise<boolean> {
    try {
      const { status } = await Calendar.requestCalendarPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Failed to request calendar permissions:', error);
      return false;
    }
  }

  /**
   * Get or create a calendar to use
   */
  private async getCalendarId(): Promise<string | null> {
    try {
      const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);

      // Try to find the default calendar
      let defaultCalendar = calendars.find(
        (cal) => cal.allowsModifications && cal.isPrimary
      );

      // If no primary calendar, find any writable calendar
      if (!defaultCalendar) {
        defaultCalendar = calendars.find((cal) => cal.allowsModifications);
      }

      if (defaultCalendar) {
        return defaultCalendar.id;
      }

      // If no suitable calendar exists, create one (Android only)
      if (Platform.OS === 'android') {
        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'SHPE Events',
          color: '#1C1C1E',
          entityType: Calendar.EntityTypes.EVENT,
          sourceId: calendars[0]?.source?.id,
          source: calendars[0]?.source,
          name: 'shpe-events',
          ownerAccount: 'personal',
          accessLevel: Calendar.CalendarAccessLevel.OWNER,
        });
        return newCalendarId;
      }

      return null;
    } catch (error) {
      console.error('Failed to get calendar:', error);
      return null;
    }
  }

  /**
   * Add event to device calendar
   */
  async addToCalendar(event: CalendarEvent): Promise<boolean> {
    try {
      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Denied',
          'Please grant calendar access in Settings to add events to your calendar.',
          [
            {
              text: 'OK',
            },
          ]
        );
        return false;
      }

      // Get calendar ID
      const calendarId = await this.getCalendarId();
      if (!calendarId) {
        Alert.alert(
          'Calendar Not Available',
          'No suitable calendar found on your device.',
          [
            {
              text: 'OK',
            },
          ]
        );
        return false;
      }

      // Create event details
      const eventDetails = {
        title: event.title,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        location: event.location || '',
        notes: event.notes || '',
        timeZone: 'America/Los_Angeles', // Adjust based on your needs
        alarms: [
          {
            relativeOffset: -60, // 1 hour before
          },
          {
            relativeOffset: -1440, // 1 day before
          },
        ],
      };

      // Create the event
      const eventId = await Calendar.createEventAsync(calendarId, eventDetails);

      if (eventId) {
        Alert.alert(
          'Added to Calendar',
          `"${event.title}" has been added to your calendar.`,
          [
            {
              text: 'OK',
            },
          ]
        );
        return true;
      }

      return false;
    } catch (error) {
      console.error('Failed to add to calendar:', error);
      Alert.alert(
        'Error',
        'Failed to add event to calendar. Please try again.',
        [
          {
            text: 'OK',
          },
        ]
      );
      return false;
    }
  }
}

export const calendarService = new CalendarService();
