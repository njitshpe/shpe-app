import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { Event } from '../data/mockEvents';
import { supabase, EventRow } from '../lib/supabase';

// State shape
interface EventsState {
  events: Event[];
  isAdminMode: boolean;
  isLoading: boolean;
  error: string | null;
}

// Action types
type EventsAction =
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: { id: string; event: Event } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'TOGGLE_ADMIN_MODE' }
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
    hostName: row.host_name,
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

  const refetchEvents = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('is_active', true)
        .order('start_time', { ascending: true });

      if (error) {
        console.error('[EventsContext] Supabase error:', error.message);
        dispatch({ type: 'SET_ERROR', payload: error.message });
        return;
      }

      const mappedEvents = (data ?? []).map(mapEventRowToEvent);
      dispatch({ type: 'SET_EVENTS', payload: mappedEvents });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load events';
      console.error('[EventsContext] Fetch error:', message);
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  useEffect(() => {
    refetchEvents();
  }, [refetchEvents]);

  return (
    <EventsContext.Provider
      value={{
        events: state.events,
        isAdminMode: state.isAdminMode,
        isLoading: state.isLoading,
        error: state.error,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleAdminMode,
        refetchEvents,
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
