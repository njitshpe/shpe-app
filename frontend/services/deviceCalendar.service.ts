import * as Calendar from 'expo-calendar';
import { Alert, Platform, Linking } from 'react-native';
import { SHPE_COLORS } from '../constants/colors';

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

      // If no suitable calendar exists, create one
      if (Platform.OS === 'ios') {
        const sources = await Calendar.getSourcesAsync();
        const defaultSource = sources.find(
          (source) => source.type === Calendar.SourceType.CALDAV && source.name === 'iCloud'
        ) || sources.find(
          (source) => source.type === Calendar.SourceType.LOCAL
        );

        if (defaultSource) {
          const newCalendarId = await Calendar.createCalendarAsync({
            title: 'SHPE Events',
            color: SHPE_COLORS.sunsetOrange,
            entityType: Calendar.EntityTypes.EVENT,
            sourceId: defaultSource.id,
            name: 'shpe-events',
            ownerAccount: 'personal',
            accessLevel: Calendar.CalendarAccessLevel.OWNER,
          });
          return newCalendarId;
        }
      } else if (Platform.OS === 'android') {
        const newCalendarId = await Calendar.createCalendarAsync({
          title: 'SHPE Events',
          color: SHPE_COLORS.sunsetOrange,
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
   * Add event to device calendar (Apple/Native)
   */
  async addToDeviceCalendar(event: CalendarEvent): Promise<boolean> {
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
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
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

  /**
   * Add event to Google Calendar via Web Intent
   */
  async addToGoogleCalendar(event: CalendarEvent): Promise<void> {
    try {
      const { title, startDate, endDate, location, notes } = event;

      const start = new Date(startDate).toISOString().replace(/-|:|\.\d\d\d/g, "");
      const end = new Date(endDate).toISOString().replace(/-|:|\.\d\d\d/g, "");

      const baseUrl = "https://calendar.google.com/calendar/render";
      const params = new URLSearchParams({
        action: "TEMPLATE",
        text: title,
        dates: `${start}/${end}`,
        details: notes || "",
        location: location || "",
      });

      const url = `${baseUrl}?${params.toString()}`;

      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert("Error", "Unable to open Google Calendar.");
      }
    } catch (error) {
      console.error("Error opening Google Calendar:", error);
      Alert.alert("Error", "Failed to open Google Calendar.");
    }
  }
}

export const calendarService = new CalendarService();
