'use client';

import * as React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#176B6B', // deep teal
    },
    secondary: {
      main: '#10b981', // soft green
    },
    background: {
      default: '#f7f8fa', // off-white
      paper: '#fff',
    },
    text: {
      primary: '#222',
      secondary: '#6b7280',
      disabled: '#b0b3b8',
    },
    divider: '#e5e7eb',
    error: {
      main: '#ef4444',
    },
    warning: {
      main: '#f59e42',
    },
    info: {
      main: '#3b82f6',
    },
    success: {
      main: '#10b981',
    },
  },
  typography: {
    fontFamily: 'Inter, Roboto, "Helvetica Neue", Arial, sans-serif',
    h1: { fontWeight: 700, fontSize: '2.2rem', letterSpacing: -1 },
    h2: { fontWeight: 600, fontSize: '1.7rem', letterSpacing: -0.5 },
    h3: { fontWeight: 600, fontSize: '1.3rem' },
    h4: { fontWeight: 600, fontSize: '1.1rem' },
    h5: { fontWeight: 500 },
    h6: { fontWeight: 500 },
    body1: { fontSize: '1rem' },
    body2: { fontSize: '0.95rem', color: '#6b7280' },
    subtitle1: { fontWeight: 500, color: '#374151' },
    subtitle2: { fontWeight: 500, color: '#6b7280' },
    button: { textTransform: 'none', fontWeight: 500 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)',
          borderRadius: 10,
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontWeight: 500,
        },
      },
      defaultProps: {
        disableElevation: true,
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
          fontSize: '0.85rem',
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 6,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          background: '#f4f5f7',
          borderRight: '1px solid #e5e7eb',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#fff',
          color: '#222',
          boxShadow: '0 1px 4px 0 rgba(0,0,0,0.04)',
        },
      },
    },
    MuiToolbar: {
      styleOverrides: {
        root: {
          minHeight: 56,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          '&:hover': {
            background: '#f3f4f6',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #e5e7eb',
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
  },
});

export default function CustomThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
} 