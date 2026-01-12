import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import MyReportsScreen from '@/components/settings/my-reports';

export default function MyReportsRoute() {
  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Reports',
          headerBackTitle: 'Settings',
          headerShadowVisible: false,
        }}
      />
      <MyReportsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
