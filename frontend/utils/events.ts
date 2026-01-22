import { Event, EventDB, EventTag } from '@/types/events';

/**
 * Maps a Supabase EventDB (database schema) to Event (frontend schema)
 */
export function mapEventDBToUI(event: EventDB): Event {
  const isPast = new Date(event.end_time) < new Date();

  return {
    id: event.event_id || event.id,
    uuid: event.id,
    title: event.name,
    description: event.description ?? undefined,
    startTimeISO: event.start_time,
    endTimeISO: event.end_time,
    locationName: event.location_name,
    address: event.location_address ?? undefined,
    latitude: event.latitude ?? undefined,
    longitude: event.longitude ?? undefined,
    coverImageUrl: event.cover_image_url ?? undefined,
    tags: [] as EventTag[],
    status: isPast ? 'past' : 'upcoming',
    registration_questions: event.registration_questions ?? [],
    points: event.points ?? 0,
    requiresRsvp: event.requires_rsvp ?? false,
    eventLimit: event.event_limit ?? undefined,
  };
}

/**
 * Maps Event (frontend schema) to EventDB (database schema) - partial for updates
 */
export function mapEventUIToDB(event: Event): Partial<EventDB> {
  return {
    event_id: event.id,
    name: event.title,
    description: event.description ?? undefined,
    location_name: event.locationName,
    location_address: event.address ?? undefined,
    start_time: event.startTimeISO,
    end_time: event.endTimeISO,
    cover_image_url: event.coverImageUrl ?? null,
    requires_rsvp: event.requiresRsvp,
    event_limit: event.eventLimit ?? undefined,
    points: event.points,
  };
}
