export const tokens = {
  color: {
    text: {
      primary: '#111827',
      secondary: '#4b5563', 
      inverse: '#ffffff'
    },
    background: {
      primary: '#ffffff',
      secondary: '#f9fafb',
      inverse: '#111827'
    },
    border: {
      default: '#e5e7eb',
      focus: '#3b82f6'
    },
    interactive: {
      primary: '#2563eb',
      primaryHover: '#1d4ed8',
      success: '#059669',
      danger: '#dc2626'
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px', 
    md: '16px',
    lg: '24px',
    xl: '32px'
  },
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, sans-serif'
    },
    fontSize: {
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px'
    }
  },
  borderRadius: {
    sm: '4px',
    md: '8px', 
    lg: '12px'
  }
};

export const cssVariables = `
:root {
  --color-text-primary: ${tokens.color.text.primary};
  --color-text-secondary: ${tokens.color.text.secondary};
  --color-text-inverse: ${tokens.color.text.inverse};
  --color-bg-primary: ${tokens.color.background.primary};
  --color-bg-secondary: ${tokens.color.background.secondary};
  --color-bg-inverse: ${tokens.color.background.inverse};
  --color-border-default: ${tokens.color.border.default};
  --color-border-focus: ${tokens.color.border.focus};
  --color-interactive-primary: ${tokens.color.interactive.primary};
  --color-interactive-primary-hover: ${tokens.color.interactive.primaryHover};
  --color-interactive-success: ${tokens.color.interactive.success};
  --color-interactive-danger: ${tokens.color.interactive.danger};
  --spacing-xs: ${tokens.spacing.xs};
  --spacing-sm: ${tokens.spacing.sm};
  --spacing-md: ${tokens.spacing.md};
  --spacing-lg: ${tokens.spacing.lg};
  --spacing-xl: ${tokens.spacing.xl};
  --font-family-sans: ${tokens.typography.fontFamily.sans};
  --font-size-sm: ${tokens.typography.fontSize.sm};
  --font-size-base: ${tokens.typography.fontSize.base};
  --font-size-lg: ${tokens.typography.fontSize.lg};
  --font-size-xl: ${tokens.typography.fontSize.xl};
  --font-size-2xl: ${tokens.typography.fontSize['2xl']};
  --border-radius-sm: ${tokens.borderRadius.sm};
  --border-radius-md: ${tokens.borderRadius.md};
  --border-radius-lg: ${tokens.borderRadius.lg};
}
`;