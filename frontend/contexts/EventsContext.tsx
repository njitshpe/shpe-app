import React, {
  createContext,
  useContext,
  useReducer,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventsService } from '../services/events.service';
import { adminService } from '../services/admin.service';
import { adminEventsService, CreateEventData } from '../services/adminEvents.service';
import { supabase, EventRow } from '../lib/supabase';
import { Event, EventTag } from '../types/events';
import { mapSupabaseError } from '../types/errors';

// State shape
interface EventsState {
  events: Event[];
  isAdminMode: boolean;
  isCurrentUserAdmin: boolean;
  isCurrentUserSuperAdmin: boolean;
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
  | { type: 'SET_SUPER_ADMIN_STATUS'; payload: boolean }
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
    case 'SET_SUPER_ADMIN_STATUS':
      return {
        ...state,
        isCurrentUserSuperAdmin: action.payload,
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
    uuid: row.id,
    title: row.name,
    description: row.description ?? undefined,
    startTimeISO: row.start_time,
    endTimeISO: row.end_time,
    locationName: row.location_name,
    address: row.location_address ?? undefined,
    latitude: row.latitude ?? undefined,
    longitude: row.longitude ?? undefined,
    coverImageUrl: row.cover_image_url ?? undefined,
    tags: (row.tags as EventTag[]) ?? [],
    status: isPast ? 'past' : 'upcoming',
    registration_questions: row.registration_questions ?? [],
    points: row.points ?? 50,
    requiresRsvp: row.requires_rsvp ?? false,
    eventLimit: row.event_limit ?? undefined,
  };
}

// Provider component
export function EventsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, {
    events: [],
    isAdminMode: false,
    isCurrentUserAdmin: false,
    isCurrentUserSuperAdmin: false,
    isLoading: true,
    error: null,
  });

  const { session } = useAuth();

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

    return false;
  };

  const deleteEventAdmin = async (eventId: string): Promise<boolean> => {
    const response = await adminEventsService.deleteEvent(eventId);
    if (response.success) {
      await refetchEvents();
      return true;
    }

    return false;
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
        console.error('[EventsContext] ❌ Supabase error:', error.message);
        console.error('[EventsContext] Error details:', JSON.stringify(error, null, 2));
        dispatch({ type: 'SET_ERROR', payload: mapSupabaseError(error).message });
        return;
      }



      const mappedEvents = (data ?? []).map(mapEventRowToEvent);


      // Fetch attendance status for the current user
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession?.user?.id) {

        const { data: attendanceData, error: attendanceError } = await supabase
          .from('event_attendance')
          .select('event_id, status')
          .eq('user_id', currentSession.user.id);

        if (!attendanceError && attendanceData) {


          const attendanceMap = new Map(attendanceData.map(a => [a.event_id, a.status]));

          // Merge status into events
          mappedEvents.forEach(event => {
            if (attendanceMap.has(event.uuid)) {

              event.userRegistrationStatus = attendanceMap.get(event.uuid);
            }
          });
        } else if (attendanceError) {

        }
      }



      dispatch({ type: 'SET_EVENTS', payload: mappedEvents });
    } catch (err) {
      console.error('[EventsContext] ❌ Fetch error:', err);
      dispatch({ type: 'SET_ERROR', payload: mapSupabaseError(err).message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });

    }
  }, []);

  // Initial fetch and listen for auth changes
  useEffect(() => {
    if (session?.user?.id) {

      refetchEvents();
    }
  }, [session?.user?.id, refetchEvents]);

  useEffect(() => {
    // Check admin status
    const checkAdminStatus = async () => {

      const response = await adminService.isCurrentUserAdmin();

      if (response.success && response.data !== undefined) {

        dispatch({ type: 'SET_ADMIN_STATUS', payload: response.data });
      }

      // Check super admin status
      const superAdminResponse = await adminService.isCurrentUserSuperAdmin();
      if (superAdminResponse.success && superAdminResponse.data !== undefined) {

        dispatch({ type: 'SET_SUPER_ADMIN_STATUS', payload: superAdminResponse.data });
      }
    };

    if (session?.user?.id) {
      checkAdminStatus();
    }
  }, [session?.user?.id]);

  return (
    <EventsContext.Provider
      value={{
        events: state.events,
        isAdminMode: state.isAdminMode,
        isCurrentUserAdmin: state.isCurrentUserAdmin,
        isCurrentUserSuperAdmin: state.isCurrentUserSuperAdmin,
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
