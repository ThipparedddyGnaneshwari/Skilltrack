import { createTheme } from '@mui/material';

// Design tokens: navy primary, teal secondary, colour reserved for status.
export const tokens = { navy: '#14284B', teal: '#0E8F8A', border: '#E4E7EC', muted: '#667085', bg: '#F5F7FA' };
export const OUTCOME_COLORS = { Employed: '#14284B', 'Self-employed': '#0E8F8A', Apprenticeship: '#6C8EBF', 'Further education': '#C3CCD9', Unemployed: '#D98A1D' };

export default createTheme({
  palette: {
    primary: { main: tokens.navy }, secondary: { main: tokens.teal }, success: { main: '#1E8E5A' }, warning: { main: '#D98A1D' }, error: { main: '#D14343' },
    background: { default: tokens.bg, paper: '#fff' }, text: { primary: '#101828', secondary: tokens.muted }, divider: tokens.border,
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'Inter, "Segoe UI", Roboto, sans-serif',
    h4: { fontSize: 24, fontWeight: 600, letterSpacing: -0.4 }, h5: { fontSize: 20, fontWeight: 600, letterSpacing: -0.3 },
    h6: { fontSize: 15, fontWeight: 600 }, subtitle1: { fontSize: 15, fontWeight: 600 }, subtitle2: { fontSize: 13, fontWeight: 600 },
    body2: { fontSize: 13.5 }, caption: { fontSize: 12, color: tokens.muted },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', fontWeight: 600, borderRadius: 8, transition: 'all .15s ease' } } },
    MuiCard: { defaultProps: { variant: 'outlined' }, styleOverrides: { root: { borderColor: tokens.border, boxShadow: '0 1px 2px rgba(16,24,40,.04)' } } },
    MuiTableCell: { styleOverrides: { head: { fontSize: 12, fontWeight: 600, color: tokens.muted, background: '#F9FAFB', borderBottom: `1px solid ${tokens.border}` }, root: { borderColor: '#EEF0F4' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500, borderRadius: 6 } } },
    MuiTextField: { defaultProps: { size: 'small' } },
    MuiDialog: { defaultProps: { transitionDuration: 180 } },
  },
});
