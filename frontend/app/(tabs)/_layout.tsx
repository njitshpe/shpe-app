import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
    >
      {/* Let Expo Router auto-register tabs from file structure */}
      {/* File: (tabs)/calendar/index.tsx → route: calendar */}
    </Tabs>
  );
}
