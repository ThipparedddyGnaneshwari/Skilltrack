import { useState } from 'react';
import { Box, Typography, TextField, Button, Checkbox, FormControlLabel, Divider, Stack, Snackbar, Alert, Link as MLink, Paper } from '@mui/material';
import Check from '@mui/icons-material/CheckCircleOutline';
import { Link, useNavigate } from 'react-router-dom';
import { api, errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordField } from '../components/ui.jsx';

export const DEMOS = [['Admin', 'admin@skilltrack.demo', 'Admin@123'], ['Trainee', 'trainee@skilltrack.demo', 'Trainee@123'], ['Employer', 'employer@skilltrack.demo', 'Employer@123']];
const mailOk = (e) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);

export function AuthShell({ children }) {
  return (
    <Box sx={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: { xs: '1fr', md: '5fr 6fr' } }}>
      <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', justifyContent: 'space-between', bgcolor: 'primary.main', color: '#fff', p: 7 }}>
        <Stack direction="row" spacing={1.5} alignItems="center"><Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#fff', color: 'primary.main', display: 'grid', placeItems: 'center', fontWeight: 700 }}>S</Box><Typography variant="h6">SkillTrack</Typography></Stack>
        <Box>
          <Typography sx={{ fontSize: 34, fontWeight: 600, letterSpacing: -0.8, lineHeight: 1.2, maxWidth: 420 }}>From training to employment — track the complete journey.</Typography>
          <Stack spacing={1.5} sx={{ mt: 4 }}>{['Employment tracking', 'Outcome analytics', 'Skill-gap intelligence'].map((t) => <Stack key={t} direction="row" spacing={1.5} alignItems="center"><Check sx={{ color: '#5EE0D8' }} /><Typography sx={{ opacity: .9 }}>{t}</Typography></Stack>)}</Stack>
        </Box>
        <Typography variant="caption" sx={{ color: 'rgba(255,255,255,.6)' }}>Skilling Outcomes & Impact Platform</Typography>
      </Box>
      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: 2.5, sm: 4 }, bgcolor: '#fff' }}>
        <Box sx={{ width: '100%', maxWidth: 420 }}>
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ display: { md: 'none' }, mb: 3 }}><Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>S</Box><Typography variant="h6">SkillTrack</Typography></Stack>
          {children}
        </Box>
      </Box>
    </Box>
  );
}

export default function Login() {
  const [f, setF] = useState({ email: '', password: '' }); const [remember, setRemember] = useState(true);
  const [errs, setErrs] = useState({}); const [toast, setToast] = useState(null); const [busy, setBusy] = useState(false);
  const { signIn } = useAuth(); const nav = useNavigate();
  const submit = async (e) => {
    e.preventDefault();
    const v = {}; if (!mailOk(f.email)) v.email = 'Enter a valid email address.'; if (!f.password) v.password = 'Enter your password.';
    setErrs(v); if (Object.keys(v).length) return;
    setBusy(true);
    try { const { data } = await api.post('/auth/login', { email: f.email.trim(), password: f.password }); signIn(data, remember); nav(`/${data.role}/dashboard`, { replace: true }); }
    catch (x) { setToast(x.response?.status === 401 ? 'Invalid email or password.' : errMsg(x)); } finally { setBusy(false); }
  };
  return (
    <AuthShell>
      <Typography variant="h4">Welcome back</Typography>
      <Typography color="text.secondary" sx={{ mb: 3, mt: 0.5 }}>Sign in to continue to SkillTrack</Typography>
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        <TextField label="Email" type="email" size="medium" fullWidth value={f.email} error={!!errs.email} helperText={errs.email} onChange={(e) => setF({ ...f, email: e.target.value })} autoComplete="username" />
        <PasswordField label="Password" value={f.password} error={errs.password} onChange={(e) => setF({ ...f, password: e.target.value })} autoComplete="current-password" />
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <FormControlLabel control={<Checkbox size="small" checked={remember} onChange={(e) => setRemember(e.target.checked)} />} label={<Typography variant="body2">Remember me</Typography>} />
          <MLink component="button" type="button" variant="body2" underline="hover" onClick={() => setToast('Password reset is not available in this prototype. Use a demo account below.')}>Forgot password?</MLink>
        </Stack>
        <Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? 'Signing in…' : 'Sign In'}</Button>
      </Stack>
      <Divider sx={{ my: 3 }}><Typography variant="caption">or continue with a demo account</Typography></Divider>
      <Stack direction="row" spacing={1}>{DEMOS.map(([r, e, p]) => <Button key={r} fullWidth variant="outlined" size="small" onClick={() => { setF({ email: e, password: p }); setErrs({}); }}>Use {r} Demo</Button>)}</Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>Don't have an account? <MLink component={Link} to="/signup" fontWeight={600}>Create one</MLink></Typography>
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity={toast?.startsWith('Password') ? 'info' : 'error'} variant="filled" onClose={() => setToast(null)}>{toast}</Alert></Snackbar>
    </AuthShell>
  );
}
