import { MD3LightTheme } from 'react-native-paper';

export const colors = {
  // Brand Identity
  primary: '#1E293B',    // Dark Slate (Sidebar, Headers)
  secondary: '#2563EB',  // Royal Blue (Buttons, Links, Active States)
  accent: '#F59E0B',     // Amber (Warnings, Pending status)
  
  // Backgrounds
  background: '#F1F5F9', // Lightest Gray (Main App Background)
  surface: '#FFFFFF',    // Pure White (Cards, Sidebars)
  
  // Functional Colors
  error: '#EF4444',      // Red
  success: '#10B981',    // Green
  warning: '#F59E0B',    // Orange
  
  // Text
  text: '#0F172A',       // Almost Black (Main Headings)
  textSecondary: '#64748B', // Cool Gray (Subtitles)
  textLight: '#94A3B8',  // Light Gray (Placeholders)
  textWhite: '#FFFFFF',
  
  // Borders
  border: '#E2E8F0',     // Subtle Gray border
  
  // Status Specific (Badges)
  active: '#2563EB',     // Blue
  delivered: '#10B981',  // Green
  pending: '#F59E0B',    // Orange
  cancelled: '#EF4444',  // Red
  cod: '#1E293B',        // Dark Slate
  online: '#2563EB',     // Blue
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    surface: colors.surface,
    background: colors.background,
    error: colors.error,
    text: colors.text,
  },
  roundness: 8, // Reduced roundness for a more professional look
};

export const shadows = {
  small: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  medium: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  large: {
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
    elevation: 10,
  },
};