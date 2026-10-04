import { useState } from 'react';
import { Dialog, Box, Stack, Typography, Tabs, Tab, Alert, Grid, IconButton, useMediaQuery } from '@mui/material';
import Close from '@mui/icons-material/Close';
import { NameAvatar, StatusChip } from './ui.jsx';
import Journey from './Journey.jsx';
import { inr, traineeCode } from '../services/api';

const Row = ({ k, v }) => <Box><Typography variant="caption">{k}</Typography><Typography variant="body2">{v}</Typography></Box>;

export default function TraineeProfile({ t, onClose }) {
  const [tab, setTab] = useState(0); const mobile = useMediaQuery('(max-width:600px)');
  if (!t) return null;
  const p = t.placements[0];
  return (
    <Dialog open onClose={onClose} fullWidth maxWidth="md" fullScreen={mobile}>
      <Stack direction="row" spacing={2} alignItems="center" sx={{ p: 3, pb: 2 }}>
        <NameAvatar name={t.name} size={56} />
        <Box sx={{ flexGrow: 1 }}><Typography variant="h5">{t.name}</Typography><Typography variant="body2" color="text.secondary">Trainee ID: {traineeCode(t.id)} · {t.district}, Maharashtra</Typography></Box>
        <StatusChip value={t.status} /><IconButton onClick={onClose} aria-label="Close"><Close /></IconButton>
      </Stack>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" sx={{ px: 2, borderBottom: '1px solid #E4E7EC' }}>{['Overview', 'Training', 'Employment', 'Salary', 'Follow-ups', 'Skill Gaps'].map((l) => <Tab key={l} label={l} />)}</Tabs>
      <Box sx={{ p: 3, minHeight: 320 }}>
        {tab === 0 && (<><Typography variant="subtitle2" sx={{ mb: 1 }}>Employment journey</Typography><Journey t={t} />
          <Grid container spacing={2} sx={{ mt: 2 }}>{[['Phone', t.phone], ['Age / gender', `${t.age} · ${t.gender}`], ['Course', t.course], ['Provider', t.provider]].map(([k, v]) => <Grid item xs={6} key={k}><Row k={k} v={v} /></Grid>)}</Grid>
          {t.risk && <Alert severity={{ High: 'error', Medium: 'warning', Low: 'success' }[t.risk.level]} sx={{ mt: 3 }}>Placement risk {t.risk.score}% ({t.risk.level}). {t.risk.factors.join(', ')}. {t.risk.note}</Alert>}</>)}
        {tab === 1 && <Grid container spacing={2}>{[['Course', t.course], ['Provider', t.provider], ['Attendance', t.attendance + '%'], ['Assessment score', t.assessment + '/100'], ['Certification', t.certified ? 'Certified' : 'Not certified'], ['Duration', t.duration + ' days']].map(([k, v]) => <Grid item xs={6} key={k}><Row k={k} v={v} /></Grid>)}</Grid>}
        {tab === 2 && (p ? <Grid container spacing={2}>{[['Role', p.title], ['Monthly salary', inr(p.salary)], ['Joining date', p.join_date], ['Employer verification', <StatusChip key="s" value={p.status} />], ['Retained', t.retained ? 'Yes' : 'No']].map(([k, v]) => <Grid item xs={6} key={k}><Row k={k} v={v} /></Grid>)}</Grid>
          : <Typography color="text.secondary">Status: {t.status}. No employer placement on record.</Typography>)}
        {tab === 3 && <><Row k="Current monthly salary" v={inr(t.salary)} /><Typography variant="caption" sx={{ mt: 2, display: 'block' }}>Salary history is not seeded in this prototype; only the latest value is recorded.</Typography></>}
        {tab === 4 && <Stack spacing={1.5}>{t.followups.map((f) => <Stack key={f.month} direction="row" justifyContent="space-between" alignItems="center"><Box><Typography variant="body2">{f.month}-month follow-up</Typography><Typography variant="caption">Due {f.due} via {f.channel}</Typography></Box><StatusChip value={f.status} /></Stack>)}</Stack>}
        {tab === 5 && <Stack spacing={2}><Row k="Detected skill gap" v={t.gap} /><Row k="Recommended intervention" v={t.recommendation} /></Stack>}
      </Box>
    </Dialog>
  );
}
