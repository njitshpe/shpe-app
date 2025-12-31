import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
// We go up one level (..) to leave 'app', then into 'components'
import { GeneralSettings } from '../components/settings/GeneralSettings';

export default function SettingsPage() {
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: 'Settings', 
          headerBackTitle: 'Profile',
          headerStyle: { backgroundColor: '#F2F2F7' },
          headerShadowVisible: false,
        }} 
      />
      <GeneralSettings />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  }
});