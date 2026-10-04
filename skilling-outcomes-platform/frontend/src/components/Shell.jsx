import { AppBar, Toolbar, Typography, Button, Container, Box, Tabs, Tab, Alert, CircularProgress, Card, CardContent } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export function Shell({ title, tabs, tab, setTab, children }) {
  const nav = useNavigate();
  const logout = () => { localStorage.clear(); nav('/'); };
  return (
    <Box>
      <AppBar position="sticky" elevation={0}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontSize: { xs: 15, sm: 20 } }}>{title}</Typography>
          <Button color="inherit" onClick={logout}>Sign out</Button>
        </Toolbar>
        {tabs && (
          <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" scrollButtons="auto" textColor="inherit"
            TabIndicatorProps={{ style: { background: '#FFB300' } }} sx={{ bgcolor: 'primary.dark' }}>
            {tabs.map((t) => <Tab key={t} label={t} />)}
          </Tabs>
        )}
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>{children}</Container>
    </Box>
  );
}

export const Loading = () => <Box sx={{ textAlign: 'center', p: 6 }}><CircularProgress /></Box>;
export const ErrorBox = ({ msg }) => <Alert severity="error" sx={{ my: 2 }}>{msg}</Alert>;

export function Kpi({ label, value, hint, color = 'primary.main' }) {
  return (
    <Card variant="outlined" sx={{ borderLeft: 4, borderLeftColor: color, height: '100%' }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        <Typography variant="h5">{value}</Typography>
        {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
      </CardContent>
    </Card>
  );
}

export const Panel = ({ title, children }) => (
  <Card variant="outlined" sx={{ height: '100%' }}>
    <CardContent><Typography variant="subtitle1" fontWeight={700} gutterBottom>{title}</Typography>{children}</CardContent>
  </Card>
);
