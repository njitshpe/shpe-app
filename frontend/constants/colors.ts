// SHPE Brand Colors and Application Palette
// Source of truth for all colors used in the application.

export const SHPE_COLORS = {
    // Brand Colors
    darkBlue: '#002855',
    orange: '#FF5F05',
    lightBlue: '#00A3E0',
    white: '#FFFFFF',

    // UI Colors (Legacy/Static)
    gray: '#F4F4F4',
    darkGray: '#666666',
    textGray: '#666666',
    border: '#E0E0E0',

    // Semantic Colors
    success: '#4CAF50',
    error: '#F44336',
    background: '#f5f5f5',
} as const;

export const NEON_COLORS = {
    red: '#FF3B30',
    green: '#34C759',
    blue: '#007AFF',
    yellow: '#FFCC00',
    orange: '#FF9500',
    purple: '#AF52DE',
    pink: '#FF2D55',
} as const;

export interface ThemeColors {
    primary: string;
    background: string;
    card: string;
    text: string;
    subtext: string;
    border: string;
    success: string;
    error: string;
    info: string;
    shadow: string;
    // Calendar specific
    calendarBackground: string;
    calendarText: string;
    calendarAccent: string;
}

export const lightTheme: ThemeColors = {
    primary: SHPE_COLORS.orange,
    background: '#F2F2F7', // System gray 6 (iOS standard)
    card: '#FFFFFF',
    text: '#000000',
    subtext: '#666666',
    border: '#E5E5EA',
    success: '#34C759',
    error: '#FF3B30',
    info: '#007AFF',
    shadow: '#000000',
    calendarBackground: '#FFFFFF',
    calendarText: '#000000',
    calendarAccent: '#F2F2F7',
};

export const darkTheme: ThemeColors = {
    primary: SHPE_COLORS.orange,
    background: '#000000',
    card: '#1C1C1E', // System gray 6 dark
    text: '#FFFFFF',
    subtext: '#8E8E93',
    border: '#38383A',
    success: '#30D158',
    error: '#FF453A',
    info: '#0A84FF',
    shadow: '#000000',
    calendarBackground: '#1C1C1E',
    calendarText: '#FFFFFF',
    calendarAccent: '#2C2C2E',
};

