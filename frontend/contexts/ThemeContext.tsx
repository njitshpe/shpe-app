import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { lightTheme, darkTheme, ThemeColors } from '../constants/colors';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeContextType {
    theme: ThemeColors;
    mode: ThemeMode;
    isDark: boolean;
    setMode: (mode: ThemeMode) => Promise<void>;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
    const systemColorScheme = useColorScheme();
    const [mode, setModeState] = useState<ThemeMode>('system');

    // Load saved preference on mount
    useEffect(() => {
        loadThemePreference();
    }, []);

    const loadThemePreference = async () => {
        try {
            const savedMode = await AsyncStorage.getItem('theme_mode');
            if (savedMode && (savedMode === 'light' || savedMode === 'dark' || savedMode === 'system')) {
                setModeState(savedMode as ThemeMode);
            }
        } catch (error) {
            console.error('Failed to load theme preference:', error);
        }
    };

    const setMode = async (newMode: ThemeMode) => {
        setModeState(newMode);
        try {
            await AsyncStorage.setItem('theme_mode', newMode);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
        }
    };

    // Determine actual theme to use
    const activeMode = mode === 'system' ? (systemColorScheme || 'light') : mode;
    const theme = activeMode === 'dark' ? darkTheme : lightTheme;
    const isDark = activeMode === 'dark';

    return (
        <ThemeContext.Provider value={{ theme, mode, isDark, setMode }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
