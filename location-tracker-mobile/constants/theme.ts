import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
    ...MD3LightTheme,
    colors: {
        ...MD3LightTheme.colors,
        primary: '#3B82F6', // Blue for users
        secondary: '#10B981', // Green for admins
        error: '#EF4444',
        background: '#F9FAFB',
        surface: '#FFFFFF',
        onSurface: '#1F2937',
        onBackground: '#1F2937',
    },
};

export const darkTheme = {
    ...MD3DarkTheme,
    colors: {
        ...MD3DarkTheme.colors,
        primary: '#60A5FA',
        secondary: '#34D399',
        error: '#F87171',
        background: '#111827',
        surface: '#1F2937',
        onSurface: '#F9FAFB',
        onBackground: '#F9FAFB',
    },
};

export const Colors = {
    user: {
        primary: '#3B82F6',
        light: '#DBEAFE',
        dark: '#1E40AF',
    },
    admin: {
        primary: '#10B981',
        light: '#D1FAE5',
        dark: '#047857',
    },
    error: '#EF4444',
    warning: '#F59E0B',
    success: '#10B981',
    gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
    },
};
