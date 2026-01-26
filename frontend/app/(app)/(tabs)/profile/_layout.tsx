import { Stack } from 'expo-router';
import React from 'react';

export default function ProfileLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="index" />
            <Stack.Screen
                name="settings"
                options={{
                    presentation: 'card',
                    headerShown: false,
                }}
            />
        </Stack>
    );
}
