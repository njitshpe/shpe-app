import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

export default function TabsLayout() {
    const { theme, isDark } = useTheme();

    return (
        <Tabs
            screenOptions={{
                headerShown: false,
                tabBarActiveTintColor: '#a8a8a8',
                tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)', // Dimmed for inactive
                tabBarStyle: {
                    position: 'absolute', // Float over content
                    bottom: 0,
                    left: 0,
                    right: 0,
                    backgroundColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(255,255,255,0.8)', // Glassy background
                    borderTopWidth: 0, // No border for cleaner look
                    elevation: 0, // Remove shadow on Android
                    height: Platform.OS === 'ios' ? 85 : 70,
                    paddingTop: 10,
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                },
                tabBarBackground: () => (
                    // Blur Effect for Glass UI
                    <BlurView 
                        intensity={80} 
                        tint={isDark ? 'dark' : 'light'} 
                        style={StyleSheet.absoluteFill} 
                    />
                ),
                tabBarLabelStyle: {
                    fontSize: 10,
                    fontWeight: '700',
                    letterSpacing: 0.5,
                    marginTop: 4,
                },
            }}
        >
            <Tabs.Screen
                name="home/index"
                options={{
                    title: 'HOME',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "home" : "home-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="calendar/index"
                options={{
                    title: 'EVENTS',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "calendar" : "calendar-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="feed/index"
                options={{
                    title: 'FEED',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "newspaper" : "newspaper-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="leaderboard/index"
                options={{
                    title: 'RANK',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "trophy" : "trophy-outline"} size={22} color={color} />
                    ),
                }}
            />
            <Tabs.Screen
                name="profile/index"
                options={{
                    title: 'PROFILE',
                    tabBarIcon: ({ color, focused }) => (
                        <Ionicons name={focused ? "person" : "person-outline"} size={22} color={color} />
                    ),
                }}
            />
        </Tabs>
    );
}