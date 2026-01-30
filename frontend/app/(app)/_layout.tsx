import { Stack } from 'expo-router';

export default function AppLayout() {
    return (
        <Stack
            screenOptions={{
                headerShown: false,
            }}
        >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
                name="event/[id]"
                options={{
                    headerShown: false,
                    presentation: 'card',
                }}
            />
            <Stack.Screen
                name="check-in"
                options={{
                    headerShown: false,
                    presentation: 'modal',
                }}
            />


        </Stack>
    );
}
