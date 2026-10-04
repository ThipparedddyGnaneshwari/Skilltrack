import { useState } from 'react';
import { Typography, TextField, Button, Stack, ToggleButtonGroup, ToggleButton, MenuItem, Checkbox, FormControlLabel, FormHelperText, Snackbar, Alert, Link as MLink } from '@mui/material';
import { Link, useNavigate } from 'react-router-dom';
import { api, errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { PasswordField } from '../components/ui.jsx';
import { AuthShell } from './Login.jsx';

const DISTRICTS = ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Chhatrapati Sambhajinagar', 'Kolhapur', 'Thane', 'Solapur', 'Satara', 'Sangli', 'Ahilyanagar', 'Amravati', 'Nanded', 'Jalgaon', 'Ratnagiri'];
const EDU = ['10th pass', '12th pass', 'ITI / Diploma', 'Graduate', 'Postgraduate'];
const SECTORS = ['IT & Software', 'Manufacturing', 'Healthcare', 'Retail', 'Hospitality', 'Automotive', 'Renewable Energy'];
const FIELDS = {
  trainee: [['name', 'Full name'], ['email', 'Email'], ['phone', 'Phone number'], ['dob', 'Date of birth'], ['gender', 'Gender'], ['district', 'District'], ['education', 'Education'], ['sector', 'Preferred sector']],
  employer: [['company', 'Company name'], ['contact', 'Contact person'], ['email', 'Email'], ['phone', 'Phone number'], ['industry', 'Industry'], ['district', 'District']],
};
const OPTS = { gender: ['Male', 'Female', 'Other'], district: DISTRICTS, education: EDU, sector: SECTORS, industry: SECTORS };

export default function Signup() {
  const [role, setRole] = useState('trainee'); const [v, setV] = useState({}); const [errs, setErrs] = useState({}); const [consent, setConsent] = useState(false);
  const [toast, setToast] = useState(null); const [busy, setBusy] = useState(false);
  const { signIn } = useAuth(); const nav = useNavigate();
  const set = (k) => (e) => setV({ ...v, [k]: e.target.value });
  const validate = () => {
    const e = {};
    FIELDS[role].forEach(([k, l]) => { if (!String(v[k] || '').trim()) e[k] = `${l} is required.`; });
    if (v.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v.email)) e.email = 'Enter a valid email address.';
    if (v.phone && !/^\d{10}$/.test(v.phone)) e.phone = 'Enter a 10-digit phone number.';
    if (!v.password || v.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (v.confirm !== v.password) e.confirm = 'Passwords do not match.';
    if (role === 'trainee' && !consent) e.consent = 'Consent is required to create a trainee account.';
    return e;
  };
  const submit = async (ev) => {
    ev.preventDefault(); const e = validate(); setErrs(e); if (Object.keys(e).length) return;
    setBusy(true);
    try {
      const { data } = await api.post('/auth/signup', { ...v, role, consent, email: v.email.trim() });
      setToast({ s: 'success', m: data.accountStatus === 'Pending Verification' ? 'Account created successfully. Status: Pending Verification.' : 'Account created successfully.' });
      signIn(data, true); setTimeout(() => nav(`/${data.role}/dashboard`, { replace: true }), 900);
    } catch (x) { setToast({ s: 'error', m: errMsg(x) }); setBusy(false); }
  };
  return (
    <AuthShell>
      <Typography variant="h4">Create your account</Typography>
      <Typography color="text.secondary" sx={{ mb: 2.5, mt: 0.5 }}>Join SkillTrack to track your skilling journey</Typography>
      <ToggleButtonGroup exclusive fullWidth size="small" value={role} onChange={(_, r) => { if (r) { setRole(r); setErrs({}); } }} sx={{ mb: 2.5 }}>
        <ToggleButton value="trainee">Trainee</ToggleButton><ToggleButton value="employer">Employer</ToggleButton></ToggleButtonGroup>
      <Stack component="form" spacing={2} onSubmit={submit} noValidate>
        {FIELDS[role].map(([k, l]) => OPTS[k]
          ? <TextField key={k} select size="medium" label={l} value={v[k] || ''} onChange={set(k)} error={!!errs[k]} helperText={errs[k]}>{OPTS[k].map((o) => <MenuItem key={o} value={o}>{o}</MenuItem>)}</TextField>
          : <TextField key={k} size="medium" label={l} type={k === 'dob' ? 'date' : 'text'} InputLabelProps={k === 'dob' ? { shrink: true } : undefined} value={v[k] || ''} onChange={set(k)} error={!!errs[k]} helperText={errs[k]} />)}
        <PasswordField label="Password" value={v.password || ''} onChange={set('password')} error={errs.password} helperText="At least 8 characters" autoComplete="new-password" />
        <PasswordField label="Confirm password" value={v.confirm || ''} onChange={set('confirm')} error={errs.confirm} autoComplete="new-password" />
        {role === 'trainee' && <div><FormControlLabel control={<Checkbox checked={consent} onChange={(e) => setConsent(e.target.checked)} />} label={<Typography variant="body2">I consent to the use of my information for skilling outcome tracking.</Typography>} />
          {errs.consent && <FormHelperText error>{errs.consent}</FormHelperText>}</div>}
        <Button type="submit" variant="contained" size="large" disabled={busy}>{busy ? 'Creating account…' : 'Create account'}</Button>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mt: 3, textAlign: 'center' }}>Already have an account? <MLink component={Link} to="/login" fontWeight={600}>Sign in</MLink></Typography>
      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}><Alert severity={toast?.s} variant="filled">{toast?.m}</Alert></Snackbar>
    </AuthShell>
  );
}
