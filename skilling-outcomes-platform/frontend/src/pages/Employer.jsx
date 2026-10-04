import { useEffect, useState } from 'react';
import { Grid, Button, Stack, Snackbar, Tabs, Tab, Typography } from '@mui/material';
import FactCheck from '@mui/icons-material/FactCheckOutlined';
import HourglassEmpty from '@mui/icons-material/HourglassEmpty';
import People from '@mui/icons-material/PeopleOutline';
import ReportProblem from '@mui/icons-material/ReportProblemOutlined';
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined';
import AppLayout from '../layouts/AppLayout.jsx';
import DataTable from '../components/DataTable.jsx';
import { Panel, StatCard, PageSkeleton, ErrorState, PageHeader, EmptyState, StatusChip, NameAvatar } from '../components/ui.jsx';
import { api, errMsg, inr } from '../services/api';

export default function Employer() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState(''); const [toast, setToast] = useState(''); const [tab, setTab] = useState(0);
  const load = () => { setErr(''); api.get('/placements').then((r) => setRows(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(load, []);
  const act = (id, action) => api.put(`/placements/${id}/verify`, { action }).then(() => { setToast('Verification response saved.'); load(); }).catch((e) => setToast(errMsg(e)));
  const cand = { key: 'candidate', label: 'Candidate', render: (r) => <Stack direction="row" spacing={1.25} alignItems="center"><NameAvatar name={r.candidate} /><div><Typography variant="body2" fontWeight={500}>{r.candidate}</Typography><Typography variant="caption">{r.course}</Typography></div></Stack> };
  const base = [cand, { key: 'title', label: 'Role' }, { key: 'salary', label: 'Salary', render: (r) => inr(r.salary) }, { key: 'join_date', label: 'Joining date' }, { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> }];
  const nav = [{ label: 'Dashboard', to: '/employer/dashboard', icon: <DashboardIcon /> }];
  let body;
  if (err) body = <ErrorState message={err} onRetry={load} />;
  else if (!rows) body = <PageSkeleton />;
  else {
    const open = rows.filter((r) => r.status === 'pending' || r.status === 'correction'); const ver = rows.filter((r) => r.status === 'verified');
    body = (<>
      <PageHeader title="Employer Portal" text="Confirm placements so trainee outcomes stay accurate." />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><StatCard label="Verification requests" value={rows.length} icon={<FactCheck />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Pending requests" value={open.length} icon={<HourglassEmpty />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Verified employees" value={ver.length} icon={<People />} /></Grid>
        <Grid item xs={6} md={3}><StatCard label="Rejected" value={rows.filter((r) => r.status === 'rejected').length} icon={<ReportProblem />} /></Grid>
      </Grid>
      <Panel pad={0}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2, borderBottom: '1px solid #E4E7EC' }}><Tab label={`Requests (${open.length})`} /><Tab label={`Employees (${ver.length})`} /></Tabs>
        <div style={{ padding: 16 }}>
          {tab === 0 && (open.length === 0 ? <EmptyState title="No verification requests" text="New placement verification requests will appear here." /> :
            <DataTable rows={open} searchable={false} columns={[...base, { key: 'a', label: 'Action', sortable: false, render: (r) => <Stack direction="row" spacing={0.5}>
              <Button size="small" variant="contained" color="success" onClick={() => act(r.id, 'verify')}>Verify</Button><Button size="small" color="error" onClick={() => act(r.id, 'reject')}>Reject</Button>
              <Button size="small" onClick={() => act(r.id, 'correction')}>Request correction</Button></Stack> }]} />)}
          {tab === 1 && (ver.length === 0 ? <EmptyState title="No verified employees yet" text="Verified placements will be listed here." /> : <DataTable rows={ver} columns={base} />)}
        </div>
      </Panel></>);
  }
  return <AppLayout nav={nav}>{body}<Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast('')} message={toast} /></AppLayout>;
}
