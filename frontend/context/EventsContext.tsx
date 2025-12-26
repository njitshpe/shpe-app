import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Event, mockEvents } from '../data/mockEvents';

// State shape
interface EventsState {
  events: Event[];
  isAdminMode: boolean;
}

// Action types
type EventsAction =
  | { type: 'ADD_EVENT'; payload: Event }
  | { type: 'UPDATE_EVENT'; payload: { id: string; event: Event } }
  | { type: 'DELETE_EVENT'; payload: string }
  | { type: 'TOGGLE_ADMIN_MODE' };

// Context shape
interface EventsContextValue extends EventsState {
  addEvent: (event: Event) => void;
  updateEvent: (id: string, event: Event) => void;
  deleteEvent: (id: string) => void;
  toggleAdminMode: () => void;
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
    default:
      return state;
  }
}

// Provider component
export function EventsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(eventsReducer, {
    events: mockEvents,
    isAdminMode: false,
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

  return (
    <EventsContext.Provider
      value={{
        events: state.events,
        isAdminMode: state.isAdminMode,
        addEvent,
        updateEvent,
        deleteEvent,
        toggleAdminMode,
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
