// SHPE Brand Colors and Application Palette
// Source of truth for all colors used in the application.
// Updated with modern design system tokens for depth and contrast

export const SHPE_COLORS = {
    // Brand Colors - Refined
    darkBlue: '#002855',
    orange: '#FF5F05',
    lightBlue: '#00A3E0',
    white: '#FFFFFF',

    // Modern Sunset Orange (Primary CTA) - Less harsh, more refined
    sunsetOrange: '#E55A2B',
    sunsetOrangeLight: '#F97316', // For gradients/highlights
    sunsetOrangeDark: '#C2410C', // For shadows/depth

    // Secondary Blue Accent - Soft blue for progress/secondary
    accentBlue: '#3B82F6',
    accentBlueLight: '#60A5FA',
    accentBlueDark: '#2563EB',

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
    // Events feed specific
    ongoingBadge: string;
    fabBackground: string;
    fabIcon: string;
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
    ongoingBadge: '#FF3B30',
    fabBackground: SHPE_COLORS.orange,
    fabIcon: '#FFFFFF',
};

export const darkTheme: ThemeColors = {
    primary: SHPE_COLORS.sunsetOrange,
    background: '#0A0F1E', // Deeper midnight blue for gradient base
    card: '#1E293B', // Lighter surface (desaturated blue-grey)
    text: '#FFFFFF',
    subtext: 'rgba(255, 255, 255, 0.85)', // Soft white at 85% opacity
    border: '#334155', // Subtle border for cards
    success: '#30D158',
    error: '#FF453A',
    info: SHPE_COLORS.accentBlue,
    shadow: '#000000',
    calendarBackground: '#1E293B',
    calendarText: '#FFFFFF',
    calendarAccent: '#2C2C2E',
    ongoingBadge: '#FF453A',
    fabBackground: SHPE_COLORS.orange,
    fabIcon: '#FFFFFF',
};

// Modern UI Gradients for depth and visual hierarchy
export const GRADIENTS = {
    // Background gradients (subtle vertical gradients)
    darkBackground: ['#0A0F1E', '#0F172A'], // Midnight blue → deeper blue
    lightBackground: ['#F8FAFC', '#E2E8F0'], // Soft grey gradient

    // Primary button gradients (sunset orange)
    primaryButton: ['#F97316', '#E55A2B'], // Light → main sunset orange
    primaryButtonPressed: ['#E55A2B', '#C2410C'], // Main → dark (pressed state)

    // Card/Surface gradients (glass effect)
    darkCard: ['rgba(30, 41, 59, 0.8)', 'rgba(30, 41, 59, 0.6)'],
    lightCard: ['rgba(255, 255, 255, 0.9)', 'rgba(249, 250, 251, 0.8)'],
} as const;

// Typography scale with weight and color guidance
export const TYPOGRAPHY = {
    // Headlines - bold weight, tight letter spacing
    headline: {
        fontSize: 28,
        fontWeight: '700' as const,
        letterSpacing: -0.5,
    },
    // Title - semibold
    title: {
        fontSize: 20,
        fontWeight: '600' as const,
        letterSpacing: -0.3,
    },
    // Body - regular weight, soft white in dark mode
    body: {
        fontSize: 16,
        fontWeight: '400' as const,
        lineHeight: 24,
    },
    // Caption/Label - lighter weight, muted grey
    caption: {
        fontSize: 14,
        fontWeight: '400' as const,
    },
    small: {
        fontSize: 12,
        fontWeight: '400' as const,
    },
} as const;

// Spacing constants for consistent layout
export const SPACING = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
} as const;

// Border radius for modern UI
export const RADIUS = {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    full: 9999,
} as const;

// Shadow presets for depth
export const SHADOWS = {
    small: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    medium: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 4,
    },
    large: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.2,
        shadowRadius: 16,
        elevation: 8,
    },
    // Colored shadow for primary buttons (glow effect)
    primaryGlow: {
        shadowColor: SHPE_COLORS.sunsetOrange,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 6,
    },
} as const;

