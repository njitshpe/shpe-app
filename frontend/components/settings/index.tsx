import React from 'react';
import { Stack } from 'expo-router';
// Import the new consolidated component
import { GeneralSettings } from '../../components/settings/GeneralSettings';

export default function SettingsPage() {
  return (
    <>
      <Stack.Screen 
        options={{ 
          title: 'Settings', 
          headerBackTitle: 'Profile',
          headerStyle: { backgroundColor: '#fff' },
          headerShadowVisible: false,
        }} 
      />
      <GeneralSettings />
    </>
  );
}