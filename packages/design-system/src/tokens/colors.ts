/**
 * Atlas Design System - Color Tokens
 * 
 * Semantic color system with light and dark mode support
 */

export const colors = {
  // Base colors
  white: '#ffffff',
  black: '#000000',
  
  // Gray scale
  gray: {
    50: '#f9fafb',
    100: '#f3f4f6',
    200: '#e5e7eb',
    300: '#d1d5db',
    400: '#9ca3af',
    500: '#6b7280',
    600: '#4b5563',
    700: '#374151',
    800: '#1f2937',
    900: '#111827',
    950: '#030712',
  },
  
  // Atlas brand colors
  atlas: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554',
  },
  
  // Semantic colors
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
} as const;

export const semanticColors = {
  light: {
    background: colors.white,
    foreground: colors.gray[900],
    muted: colors.gray[100],
    mutedForeground: colors.gray[500],
    primary: colors.atlas[600],
    primaryForeground: colors.white,
    secondary: colors.gray[100],
    secondaryForeground: colors.gray[900],
    success: colors.success[600],
    successForeground: colors.white,
    warning: colors.warning[600],
    warningForeground: colors.white,
    danger: colors.danger[600],
    dangerForeground: colors.white,
    border: colors.gray[200],
    input: colors.gray[200],
    ring: colors.atlas[600],
  },
  dark: {
    background: colors.gray[950],
    foreground: colors.gray[50],
    muted: colors.gray[800],
    mutedForeground: colors.gray[400],
    primary: colors.atlas[500],
    primaryForeground: colors.gray[950],
    secondary: colors.gray[800],
    secondaryForeground: colors.gray[50],
    success: colors.success[500],
    successForeground: colors.gray[950],
    warning: colors.warning[500],
    warningForeground: colors.gray[950],
    danger: colors.danger[500],
    dangerForeground: colors.gray[950],
    border: colors.gray[800],
    input: colors.gray[800],
    ring: colors.atlas[500],
  },
} as const;
