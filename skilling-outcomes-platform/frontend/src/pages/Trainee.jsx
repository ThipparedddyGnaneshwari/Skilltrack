import { useEffect, useState } from 'react';
import { Grid, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, MenuItem, Alert, Checkbox, FormControlLabel, Snackbar, Stack, LinearProgress, Box } from '@mui/material';
import WorkOutline from '@mui/icons-material/WorkOutline';
import School from '@mui/icons-material/School';
import Verified from '@mui/icons-material/VerifiedOutlined';
import Event from '@mui/icons-material/EventAvailable';
import Insights from '@mui/icons-material/Insights';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AppLayout from '../layouts/AppLayout.jsx';
import { Panel, StatCard, PageSkeleton, ErrorState, PageHeader, StatusChip } from '../components/ui.jsx';
import Journey from '../components/Journey.jsx';
import { api, errMsg, inr } from '../services/api';

const STATUSES = ['Employed', 'Self-employed', 'Apprenticeship', 'Unemployed', 'Further education', 'Other'];
const REASONS = ['Lack of relevant skills', 'Low salary expectations', 'Lack of local opportunities', 'Location constraints', 'Communication skills', 'Interview performance', 'Personal/family reasons', 'Lack of experience'];

function UpdateDialog({ open, onClose, onSaved }) {
  const [f, setF] = useState({ status: 'Employed' }); const [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const save = async () => { try { const { data } = await api.put('/trainees/me/status', f); onSaved(data); onClose(); } catch (x) { setErr(errMsg(x)); } };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>Update employment status</DialogTitle>
      <DialogContent><Stack spacing={2} sx={{ pt: 1 }}>
        {err && <Alert severity="error">{err}</Alert>}
        <TextField select label="What is your current status?" value={f.status} onChange={set('status')}>{STATUSES.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>
        {f.status === 'Employed' && <><TextField label="Employer name" onChange={set('employer')} /><TextField label="Job title" onChange={set('title')} />
          <TextField label="Joining date" type="date" InputLabelProps={{ shrink: true }} onChange={set('join_date')} /><TextField label="Monthly salary (₹)" type="number" onChange={set('salary')} /></>}
        {f.status === 'Unemployed' && <TextField select label="Main reason" value={f.reason || ''} onChange={set('reason')}>{REASONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}</TextField>}
      </Stack></DialogContent>
      <DialogActions sx={{ p: 2 }}><Button onClick={onClose}>Cancel</Button><Button variant="contained" onClick={save}>Save update</Button></DialogActions>
    </Dialog>
  );
}

export default function Trainee() {
  const [t, setT] = useState(null); const [err, setErr] = useState(''); const [dlg, setDlg] = useState(false); const [agree, setAgree] = useState(false); const [toast, setToast] = useState('');
  const load = () => { setErr(''); api.get('/trainees/me').then((r) => setT(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(load, []);
  const consent = () => api.post('/consent', { agree }).then((r) => { setT({ ...t, consent_at: r.data.consent_at }); setToast('Consent recorded.'); }).catch((e) => setErr(errMsg(e)));
  const nav = [{ label: 'Dashboard', to: '/trainee/dashboard', icon: <DashboardIcon /> }];
  let body;
  if (err) body = <ErrorState message={err} onRetry={load} />;
  else if (!t) body = <PageSkeleton />;
  else {
    const p = t.placements[0]; const next = t.followups.find((f) => f.status !== 'Completed');
    const actions = [];
    if (next) actions.push([`Complete your ${next.month}-month employment update`, 'Update status', () => setDlg(true)]);
    if (!p || p.status !== 'verified') actions.push(['Confirm your employment details', 'Update status', () => setDlg(true)]);
    if (t.assessment < 70) actions.push([`Improve ${t.gap}: ${t.recommendation}`, null]);
    if (!t.consent_at) actions.push(['Give consent to continue outcome tracking', null]);
    body = (<>
      <PageHeader title={`Welcome back, ${t.name.split(' ')[0]}`} text="Here's your skilling journey" />
      <Grid container spacing={2}>
        <Grid item xs={6} md={4} lg><StatCard label="Employment status" value={t.status} icon={<WorkOutline />} hint={p ? (p.status === 'verified' ? 'Verified by employer' : 'Verification ' + p.status) : ''} /></Grid>
        <Grid item xs={6} md={4} lg><StatCard label="Training progress" value={(t.completed ? 100 : t.attendance) + '%'} icon={<School />} /></Grid>
        <Grid item xs={6} md={4} lg><StatCard label="Certification" value={t.certified ? 'Certified' : 'Pending'} icon={<Verified />} hint={`Assessment ${t.assessment}/100`} /></Grid>
        <Grid item xs={6} md={4} lg><StatCard label="Next follow-up" value={next ? `${next.month} months` : 'None due'} icon={<Event />} hint={next ? 'Due ' + next.due : ''} /></Grid>
        <Grid item xs={12} md={4} lg><StatCard label="Skill gap" value={t.gap} icon={<Insights />} hint={`Salary ${inr(t.salary)}/month`} /></Grid>
        <Grid item xs={12}><Panel title="Your journey" subtitle="Training → Certification → Placement → Follow-ups"><Journey t={t} /></Panel></Grid>
        <Grid item xs={12} md={7}><Panel title="Recommended actions">
          {actions.length === 0 ? <Typography color="text.secondary">You're all caught up.</Typography> :
            <Stack divider={<Box sx={{ borderTop: '1px solid #EEF0F4' }} />} spacing={1.5}>{actions.map(([text, label, fn]) => <Stack key={text} direction="row" justifyContent="space-between" alignItems="center" spacing={2}><Typography variant="body2">{text}</Typography>{label && <Button size="small" variant="outlined" onClick={fn}>{label}</Button>}</Stack>)}</Stack>}</Panel></Grid>
        <Grid item xs={12} md={5}><Panel title="Consent & privacy">
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>Your information is used to track employment outcomes, measure training effectiveness and identify skill gaps, in line with applicable data protection requirements.</Typography>
          {t.consent_at ? <Alert severity="success">Consent given on {new Date(t.consent_at).toLocaleDateString('en-IN', { dateStyle: 'long' })}</Alert> : <Stack>
            <FormControlLabel control={<Checkbox checked={agree} onChange={(e) => setAgree(e.target.checked)} />} label={<Typography variant="body2">I consent to the collection and use of my information for skilling outcome tracking.</Typography>} />
            <Button variant="contained" disabled={!agree} onClick={consent}>Give consent</Button></Stack>}</Panel></Grid>
      </Grid>
      <UpdateDialog open={dlg} onClose={() => setDlg(false)} onSaved={(n) => { setT(n); setToast('Employment status updated. Employer verification requested.'); }} />
    </>);
  }
  return <AppLayout nav={nav}>{body}<Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast('')} message={toast} /></AppLayout>;
}
