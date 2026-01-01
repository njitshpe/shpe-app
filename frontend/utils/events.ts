import { EventDB, EventUI } from '../types/events';

/**
 * Maps a Supabase EventDB (database schema) to EventUI (frontend schema)
 */
export function mapEventDBToUI(event: EventDB): EventUI {
  const isPast = new Date(event.end_time) < new Date();

  return {
    id: event.event_id || event.id,
    title: event.name,
    description: event.description,
    startTimeISO: event.start_time,
    endTimeISO: event.end_time,
    locationName: event.location || '',
    address: event.location,
    latitude: undefined,  // Not in EventDB schema
    longitude: undefined, // Not in EventDB schema
    coverImageUrl: undefined,  // Not in EventDB schema
    hostName: null,  // Not in EventDB schema
    tags: [],  // Not in EventDB schema
    priceLabel: undefined,  // Not in EventDB schema
    capacityLabel: event.max_attendees ? `${event.max_attendees} spots` : undefined,
    status: isPast ? 'past' : 'upcoming',
  };
}

/**
 * Maps EventUI (frontend schema) to EventDB (database schema) - partial for updates
 */
export function mapEventUIToDB(event: EventUI): Partial<EventDB> {
  return {
    event_id: event.id,
    name: event.title,
    description: event.description,
    location: event.address || event.locationName,
    start_time: event.startTimeISO,
    end_time: event.endTimeISO,
  };
}
