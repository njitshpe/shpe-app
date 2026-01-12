import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import BlockedUsersScreen from '@/components/settings/blocked-users';

export default function BlockedUsersRoute() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'Blocked Users',
          headerBackTitle: 'Settings',
          headerShadowVisible: false,
        }}
      />
      <BlockedUsersScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
