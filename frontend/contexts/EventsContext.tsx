import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { eventsService } from '../services/events.service';
import { adminService } from '../services/admin.service';
import { adminEventsService, CreateEventData } from '../services/adminEvents.service';
import { supabase, EventRow } from '../lib/supabase';
import { Event } from '../types/events';
import { mapSupabaseError } from '../types/errors';

// State shape
interface EventsState {
  events: Event[];
  isAdminMode: boolean;
  isCurrentUserAdmin: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action types
type EventsAction =
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: { id: string; event: Event } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'TOGGLE_ADMIN_MODE' }
  | { type: 'SET_ADMIN_STATUS'; payload: boolean }
  | { type: 'SET_EVENTS'; payload: Event[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

// Context shape
interface EventsContextValue extends EventsState {
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Event) => void;
  deleteEvent: (id: string) => void;
  toggleAdminMode: () => void;
  refetchEvents: () => Promise<void>;
  createEvent: (eventData: CreateEventData) => Promise<boolean>;
  updateEventAdmin: (eventId: string, eventData: Partial<CreateEventData>) => Promise<boolean>;
  deleteEventAdmin: (eventId: string) => Promise<boolean>;
}

// Create context
const EventsContext = createContext<EventsContextValue | undefined>(undefined);

// Reducer
function eventsReducer(state: EventsState, action: EventsAction): EventsState {
  switch (action.type) {
    case 'ADD_EVENT':
      return {
        ...state,
        events: [...state.events, action.payload],
      };
    case 'UPDATE_EVENT':
      return {
        ...state,
        events: state.events.map((event) =>
          event.id === action.payload.id ? action.payload.event : event
        ),
      };
    case 'DELETE_EVENT':
      return {
        ...state,
        events: state.events.filter((event) => event.id !== action.payload),
      };
    case 'TOGGLE_ADMIN_MODE':
      return {
        ...state,
        isAdminMode: !state.isAdminMode,
      };
    case 'SET_ADMIN_STATUS':
      return {
        ...state,
        isCurrentUserAdmin: action.payload,
      };
    case 'SET_EVENTS':
      return {
        ...state,
        events: action.payload,
      };
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };
    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
      };
    default:
      return state;
  }
}

function mapEventRowToEvent(row: EventRow): Event {
  const isPast = new Date(row.end_time) < new Date();

  return {
    id: row.event_id || String(row.id),
    title: row.name,
    description: row.description ?? undefined,
    startTimeISO: row.start_time,
    endTimeISO: row.end_time,
    locationName: row.location_name,
    address: row.location ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    hostName: row.host_name ?? undefined,
    tags: row.tags ?? [],
    priceLabel: row.price_label ?? undefined,
    capacityLabel: undefined,
    status: isPast ? 'past' : 'upcoming',
  };
}

// Provider component
export function EventsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, {
    events: [],
    isAdminMode: false,
    isCurrentUserAdmin: false,
    isLoading: true,
    error: null,
  });

  const addEvent = (event: Event) => {
    dispatch({ type: 'ADD_EVENT', payload: event });
  };

  const updateEvent = (id: string, event: Event) => {
    dispatch({ type: 'UPDATE_EVENT', payload: { id, event } });
  };

  const deleteEvent = (id: string) => {
    dispatch({ type: 'DELETE_EVENT', payload: id });
  };

  const toggleAdminMode = () => {
    dispatch({ type: 'TOGGLE_ADMIN_MODE' });
  };

  const createEvent = async (eventData: CreateEventData): Promise<boolean> => {
    const response = await adminEventsService.createEvent(eventData);
    if (response.success) {
      await refetchEvents();
      return true;
    }
    console.error('Failed to create event:', response.error);
    return false;
  };

  const updateEventAdmin = async (
    eventId: string,
    eventData: Partial<CreateEventData>
  ): Promise<boolean> => {
    const response = await adminEventsService.updateEvent(eventId, eventData);
    if (response.success) {
      await refetchEvents();
      return true;
    }
    console.error('Failed to update event:', response.error);
    return false;
  };

  const deleteEventAdmin = async (eventId: string): Promise<boolean> => {
    const response = await adminEventsService.deleteEvent(eventId);
    if (response.success) {
      await refetchEvents();
      return true;
    }
    console.error('Failed to delete event:', response.error);
    return false;
  };

  const refetchEvents = useCallback(async () => {
    console.log('[EventsContext] 🔄 Starting refetch...');
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      console.log('[EventsContext] 📡 Querying Supabase for events...');
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[EventsContext] ❌ Supabase error:', error.message);
        console.error('[EventsContext] Error details:', JSON.stringify(error, null, 2));
        dispatch({ type: 'SET_ERROR', payload: mapSupabaseError(error).message });
        return;
      }

      console.log('[EventsContext] ✅ Query successful!');
      console.log('[EventsContext] 📊 Raw rows returned:', data?.length ?? 0);
      console.log('[EventsContext] 📋 First row sample:', data?.[0] ? JSON.stringify(data[0], null, 2) : 'No data');

      const mappedEvents = (data ?? []).map(mapEventRowToEvent);
      console.log('[EventsContext] 🗺️  Mapped events:', mappedEvents.length);
      console.log('[EventsContext] 📌 First mapped event:', mappedEvents[0] ? JSON.stringify(mappedEvents[0], null, 2) : 'No events');

      dispatch({ type: 'SET_EVENTS', payload: mappedEvents });
    } catch (err) {
      console.error('[EventsContext] ❌ Fetch error:', err);
      dispatch({ type: 'SET_ERROR', payload: mapSupabaseError(err).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
      console.log('[EventsContext] ✅ Refetch complete');
    }
  }, []);

  useEffect(() => {
    refetchEvents();

    // Check admin status
    const checkAdminStatus = async () => {
      const response = await adminService.isCurrentUserAdmin();
      if (response.success && response.data !== undefined) {
        dispatch({ type: 'SET_ADMIN_STATUS', payload: response.data });
      }
    };
    checkAdminStatus();
  }, [refetchEvents]);

  return (
    <EventsContext.Provider
      value={{
        events: state.events,
        isAdminMode: state.isAdminMode,
        isCurrentUserAdmin: state.isCurrentUserAdmin,
        isLoading: state.isLoading,
        error: state.error,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleAdminMode,
        refetchEvents,
        createEvent,
        updateEventAdmin,
        deleteEventAdmin,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
}

// Hook to use context
export function useEvents() {
  const context = useContext(EventsContext);
  if (context === undefined) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
}
