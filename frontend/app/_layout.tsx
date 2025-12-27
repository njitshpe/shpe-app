import { Stack } from 'expo-router';
import { EventsProvider } from '../context/EventsContext';

export default function RootLayout() {
  return (
    <EventsProvider>
      <Stack>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="event/[id]"
          options={{
            headerShown: false,
            presentation: 'card',
          }}
        />
        <Stack.Screen
          name="(modals)/event-form"
          options={{
            presentation: 'modal',
            title: 'Event Form',
            headerStyle: {
              backgroundColor: '#111827',
            },
            headerTintColor: '#F9FAFB',
          }}
        />
      </Stack>
    </EventsProvider>
  );
}
