import { useEffect, useState, useMemo } from 'react';
import { useParams, useSearchParams, Navigate } from 'react-router-dom';
import { Grid, Typography, Stack, Box, TextField, MenuItem, Button, Alert, LinearProgress, Chip } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, ResponsiveContainer } from 'recharts';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import Dashboard from '@mui/icons-material/SpaceDashboardOutlined';
import People from '@mui/icons-material/PeopleOutline';
import Work from '@mui/icons-material/WorkOutline';
import Business from '@mui/icons-material/BusinessOutlined';
import MenuBook from '@mui/icons-material/MenuBookOutlined';
import Insights from '@mui/icons-material/Insights';
import Warning from '@mui/icons-material/WarningAmberOutlined';
import Map from '@mui/icons-material/MapOutlined';
import Description from '@mui/icons-material/DescriptionOutlined';
import Payments from '@mui/icons-material/PaymentsOutlined';
import Autorenew from '@mui/icons-material/Autorenew';
import TrendingUp from '@mui/icons-material/TrendingUp';
import AppLayout from '../layouts/AppLayout.jsx';
import DataTable from '../components/DataTable.jsx';
import TraineeProfile from '../components/TraineeProfile.jsx';
import { Panel, StatCard, PageSkeleton, ErrorState, PageHeader, StatusChip, NameAvatar, EmptyState } from '../components/ui.jsx';
import { OUTCOME_COLORS, tokens } from '../theme/theme.js';
import { api, errMsg, inr, traineeCode } from '../services/api';

const NAV = [['dashboard', 'Dashboard', <Dashboard />], ['trainees', 'Trainees', <People />], ['placements', 'Placements', <Work />], ['providers', 'Providers', <Business />], ['courses', 'Courses', <MenuBook />],
  ['skills', 'Skill Gaps', <Insights />], ['risk', 'Risk Analysis', <Warning />], ['districts', 'Districts', <Map />], ['reports', 'Reports', <Description />]].map(([k, label, icon]) => ({ to: `/admin/${k}`, label, icon }));
const TITLES = { trainees: ['Trainees', 'Search and open any trainee’s full journey.'], placements: ['Placements', 'Employer verification status for every reported placement.'],
  providers: ['Training providers', 'Compare outcomes across providers.'], courses: ['Courses', 'Enrolment, certification and placement by course.'], skills: ['Skill gaps', 'Where trainees fall short, and what to do about it.'],
  risk: ['Risk analysis', 'Trainees most likely to miss placement.'], districts: ['Districts', 'Employment outcomes across Maharashtra.'], reports: ['Reports', 'Export data as CSV or print.'] };
const DELTAS = { t: 8.4, e: 4.2, p: 3.8, s: 7.1, r: 2.6 };
const greet = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
const axis = { tick: { fontSize: 11, fill: tokens.muted }, axisLine: false, tickLine: false };
const tip = { contentStyle: { borderRadius: 8, border: '1px solid #E4E7EC', boxShadow: 'none', fontSize: 12 } };
const Pct = ({ v }) => <Typography variant="body2">{v}%</Typography>;

function csv(rows, name) {
  if (!rows.length) return;
  const h = Object.keys(rows[0]).filter((k) => typeof rows[0][k] !== 'object');
  const b = [h.join(','), ...rows.map((r) => h.map((k) => JSON.stringify(r[k] ?? '')).join(','))].join('\n');
  const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([b], { type: 'text/csv' })); a.download = name + '.csv'; a.click();
}

function Filters({ filter, setFilter, districts, courses }) {
  const sel = (k, label, opts) => <TextField select label={label} value={filter[k]} onChange={(e) => setFilter({ ...filter, [k]: e.target.value })} sx={{ minWidth: 140 }}><MenuItem value="">All</MenuItem>{opts.map(([v, l]) => <MenuItem key={v} value={v}>{l}</MenuItem>)}</TextField>;
  return <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>{sel('district', 'District', districts.map((d) => [d.district, d.district]))}{sel('course_id', 'Course', courses.map((c) => [c.cid, c.course]))}{sel('gender', 'Gender', [['Male', 'Male'], ['Female', 'Female']])}</Stack>;
}

function Donut({ data }) {
  const total = data.reduce((a, b) => a + b.value, 0);
  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} alignItems="center" spacing={3}>
      <Box sx={{ position: 'relative', width: 240, height: 240, flexShrink: 0 }}>
        <ResponsiveContainer><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={108} paddingAngle={2} stroke="none">{data.map((d) => <Cell key={d.name} fill={OUTCOME_COLORS[d.name]} />)}</Pie><Tooltip {...tip} /></PieChart></ResponsiveContainer>
        <Box sx={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', pointerEvents: 'none', textAlign: 'center' }}><div><Typography sx={{ fontSize: 28, fontWeight: 600 }}>{total}</Typography><Typography variant="caption">completed trainees</Typography></div></Box>
      </Box>
      <Stack spacing={1.25} sx={{ flexGrow: 1, width: '100%' }}>{data.map((d) => <Stack key={d.name} direction="row" alignItems="center" spacing={1.25}><Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: OUTCOME_COLORS[d.name] }} />
        <Typography variant="body2" sx={{ flexGrow: 1 }}>{d.name}</Typography><Typography variant="body2" fontWeight={600}>{d.value}</Typography><Typography variant="caption" sx={{ width: 44, textAlign: 'right' }}>{total ? Math.round(100 * d.value / total) : 0}%</Typography></Stack>)}</Stack>
    </Stack>
  );
}

function Ranking({ rows, n = 8 }) {
  const top = [...rows].sort((a, b) => b.employment - a.employment).slice(0, n);
  return <Stack spacing={1.75}>{top.map((r, i) => <Box key={r.district}><Stack direction="row" justifyContent="space-between"><Typography variant="body2"><b>{i + 1}.</b> {r.district}</Typography><Typography variant="body2" fontWeight={600}>{r.employment}%</Typography></Stack>
    <LinearProgress variant="determinate" value={r.employment} sx={{ height: 6, borderRadius: 3, bgcolor: '#EEF0F4', '& .MuiLinearProgress-bar': { bgcolor: i < 3 ? 'secondary.main' : '#8FA3C0' } }} /></Box>)}</Stack>;
}

function DistrictMap({ rows, height = 360 }) {
  return (
    <MapContainer center={[19.2, 76.0]} zoom={6} style={{ height, width: '100%', borderRadius: 8 }} scrollWheelZoom={false}>
      <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {rows.map((x) => <CircleMarker key={x.district} center={[x.lat, x.lng]} radius={7 + x.trainees / 4} pathOptions={{ color: tokens.navy, weight: 1, fillColor: x.employment >= 65 ? tokens.teal : '#D98A1D', fillOpacity: 0.65 }}>
        <Popup><b>{x.district}</b><br />Trainees: {x.trainees}<br />Placement rate: {x.placement}%<br />Employment rate: {x.employment}%<br />Average salary: {inr(x.salary)}</Popup></CircleMarker>)}
    </MapContainer>
  );
}

const courseCols = [{ key: 'course', label: 'Course' }, { key: 'enrolled', label: 'Enrolled' }, { key: 'completed', label: 'Completed' }, { key: 'certified', label: 'Certified' }, { key: 'placed', label: 'Placed' },
  { key: 'employment', label: 'Employment', render: (r) => <Pct v={r.employment} /> }, { key: 'salary', label: 'Avg salary', render: (r) => inr(r.salary) }, { key: 'retention', label: 'Retention', render: (r) => <Pct v={r.retention} /> }];
const providerCols = [{ key: 'provider', label: 'Provider' }, { key: 'trainees', label: 'Trainees' }, { key: 'completion', label: 'Completion', render: (r) => <Pct v={r.completion} /> }, { key: 'placement', label: 'Placement', render: (r) => <Pct v={r.placement} /> },
  { key: 'employment', label: 'Employment', render: (r) => <Pct v={r.employment} /> }, { key: 'salary', label: 'Avg salary', render: (r) => inr(r.salary) }, { key: 'retention', label: 'Retention', render: (r) => <Pct v={r.retention} /> }, { key: 'gap', label: 'Skill gap', render: (r) => <Pct v={r.gap} /> }];

function DashboardView({ ov, d, filter, setFilter, user }) {
  const k = ov.kpis;
  return (<>
    <PageHeader title={`${greet()}, ${user}`} text="Here's how your skilling ecosystem is performing today." right={<Stack alignItems={{ sm: 'flex-end' }} spacing={1}><Filters filter={filter} setFilter={setFilter} districts={d.districts} courses={d.courses} /><Typography variant="caption">Updated just now</Typography></Stack>} />
    <Grid container spacing={2}>
      {[['Total trainees', k.trainees.toLocaleString('en-IN'), DELTAS.t, <People />], ['Employment rate', k.employmentRate + '%', DELTAS.e, <Work />], ['Placement rate', k.placementRate + '%', DELTAS.p, <TrendingUp />],
        ['Avg monthly salary', inr(k.avgSalary), DELTAS.s, <Payments />], ['Retention rate', k.retentionRate + '%', DELTAS.r, <Autorenew />]].map(([l, v, dl, ic]) => <Grid item xs={6} md={4} lg key={l}><StatCard label={l} value={v} delta={dl} icon={ic} /></Grid>)}
      <Grid item xs={12} lg={8}><Panel title="Employment outcomes" subtitle="Status of trainees who completed training"><Donut data={ov.outcomes} /></Panel></Grid>
      <Grid item xs={12} lg={4}><Panel title="Outcome summary">
        <Stack divider={<Box sx={{ borderTop: '1px solid #EEF0F4' }} />} spacing={1.25}>{[['Self-employment', k.selfEmploymentRate], ['Apprenticeship', k.apprenticeshipRate], ['Unemployment', k.unemploymentRate], ['Dropout', k.dropoutRate], ['Skill-gap risk', k.skillGapRisk], ['Follow-up completion', k.followupRate], ['Employer verification', k.verificationRate]].map(([l, v]) =>
          <Stack key={l} direction="row" justifyContent="space-between"><Typography variant="body2" color="text.secondary">{l}</Typography><Typography variant="body2" fontWeight={600}>{v}%</Typography></Stack>)}</Stack></Panel></Grid>
      <Grid item xs={12} md={6}><Panel title="Placement trend" subtitle="Placement rate by completion year (%)"><ResponsiveContainer width="100%" height={240}><LineChart data={ov.trend}><CartesianGrid stroke="#EEF0F4" vertical={false} /><XAxis dataKey="year" {...axis} /><YAxis {...axis} width={32} /><Tooltip {...tip} /><Line dataKey="placementRate" name="Placement %" stroke={tokens.navy} strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></Panel></Grid>
      <Grid item xs={12} md={6}><Panel title="Salary progression" subtitle="Average monthly salary (simulated)"><ResponsiveContainer width="100%" height={240}><LineChart data={ov.salaryProgression}><CartesianGrid stroke="#EEF0F4" vertical={false} /><XAxis dataKey="stage" {...axis} /><YAxis {...axis} width={44} /><Tooltip {...tip} formatter={inr} /><Line dataKey="salary" name="Salary" stroke={tokens.teal} strokeWidth={2.5} dot={{ r: 3 }} /></LineChart></ResponsiveContainer></Panel></Grid>
      <Grid item xs={12}><Panel title="Course performance"><DataTable rows={d.courses} columns={courseCols} pageSize={5} searchable={false} /></Panel></Grid>
      <Grid item xs={12} md={4}><Panel title="District performance" subtitle="Top districts by employment rate"><Ranking rows={d.districts} n={6} /></Panel></Grid>
      <Grid item xs={12} md={8}><Panel title="District map"><DistrictMap rows={d.districts} height={300} /></Panel></Grid>
    </Grid>
    <Typography variant="caption" sx={{ display: 'block', mt: 2 }}>Quarter-on-quarter changes and salary progression are illustrative demo values; all other figures come from the seeded database.</Typography>
  </>);
}

function TraineesView({ openProfile }) {
  const [sp] = useSearchParams(); const [rows, setRows] = useState(null); const [err, setErr] = useState('');
  const load = () => { setErr(''); api.get('/trainees').then((r) => setRows(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(load, []);
  if (err) return <ErrorState message={err} onRetry={load} />;
  if (!rows) return <PageSkeleton />;
  return <Panel pad={2}><DataTable rows={rows} onRowClick={(r) => openProfile(r.id)} initialQuery={sp.get('q') || ''} columns={[
    { key: 'name', label: 'Trainee', render: (r) => <Stack direction="row" spacing={1.25} alignItems="center"><NameAvatar name={r.name} /><div><Typography variant="body2" fontWeight={500}>{r.name}</Typography><Typography variant="caption">{traineeCode(r.id)} · {r.course}</Typography></div></Stack> },
    { key: 'district', label: 'District' }, { key: 'salary', label: 'Salary', render: (r) => (r.salary ? inr(r.salary) : '—') },
    { key: 'status', label: 'Status', render: (r) => <StatusChip value={r.status} /> }, { key: 'verification', label: 'Verification', render: (r) => (r.verification === '-' ? '—' : <StatusChip value={r.verification} />) }]} /></Panel>;
}

function PlacementsView() {
  const [rows, setRows] = useState(null); const [err, setErr] = useState('');
  const load = () => { setErr(''); api.get('/placements').then((r) => setRows(r.data)).catch((e) => setErr(errMsg(e))); };
  useEffect(load, []);
  if (err) return <ErrorState message={err} onRetry={load} />;
  if (!rows) return <PageSkeleton />;
  return <Panel><DataTable rows={rows} columns={[{ key: 'candidate', label: 'Candidate' }, { key: 'company', label: 'Employer' }, { key: 'title', label: 'Role' }, { key: 'salary', label: 'Salary', render: (r) => inr(r.salary) },
    { key: 'join_date', label: 'Joined' }, { key: 'status', label: 'Verification', render: (r) => <StatusChip value={r.status} /> }]} /></Panel>;
}

function SkillsView({ skills }) {
  return (<Grid container spacing={2}>
    <Grid item xs={12} md={5}><Panel title="Skill gap distribution" subtitle="% of trainees by detected gap"><ResponsiveContainer width="100%" height={300}><BarChart data={skills} layout="vertical" margin={{ left: 20 }}><CartesianGrid stroke="#EEF0F4" horizontal={false} /><XAxis type="number" {...axis} /><YAxis type="category" dataKey="skill" width={110} {...axis} /><Tooltip {...tip} /><Bar dataKey="percent" name="%" fill={tokens.navy} radius={[0, 4, 4, 0]} barSize={16} /></BarChart></ResponsiveContainer></Panel></Grid>
    <Grid item xs={12} md={7}><Panel title="Recommended interventions"><Stack divider={<Box sx={{ borderTop: '1px solid #EEF0F4' }} />} spacing={1.5}>{skills.map((s) => <Stack key={s.skill} direction="row" justifyContent="space-between" alignItems="center" spacing={2}>
      <div><Typography variant="body2" fontWeight={500}>{s.skill} · {s.percent}%</Typography><Typography variant="caption">{s.recommendation}</Typography></div><StatusChip value={s.priority} /></Stack>)}</Stack></Panel></Grid></Grid>);
}

function RiskView({ risk, openProfile }) {
  return (<Stack spacing={2}>
    <Alert severity="info" icon={<Insights />}><b>AI insight.</b> {risk.insight}</Alert>
    <Stack direction="row" spacing={1}>{Object.entries(risk.counts).map(([k, v]) => <Chip key={k} label={`${k} risk · ${v}`} variant="outlined" />)}</Stack>
    <Panel title="Highest-risk trainees" subtitle={risk.disclaimer}><DataTable rows={risk.highRisk.map((r) => ({ id: r.id, name: r.name, district: r.district, score: r.score, level: r.level, factors: r.factors.join(', ') }))} onRowClick={(r) => openProfile(r.id)} columns={[
      { key: 'name', label: 'Trainee' }, { key: 'district', label: 'District' }, { key: 'score', label: 'Risk score', render: (r) => r.score + '%' }, { key: 'level', label: 'Level', render: (r) => <StatusChip value={r.level} /> }, { key: 'factors', label: 'Main factors' }]} /></Panel></Stack>);
}

function ReportsView({ d }) {
  const items = [['District report', d.districts, 'district-report'], ['Provider report', d.providers, 'provider-report'], ['Course report', d.courses, 'course-report'], ['Skill-gap report', d.skills, 'skill-gap-report']];
  return (<Grid container spacing={2}>{items.map(([t, rows, f]) => <Grid item xs={12} sm={6} md={3} key={t}><Panel title={t} subtitle={`${rows.length} rows`}><Stack direction="row" spacing={1} sx={{ mt: 1 }}>
    <Button variant="contained" size="small" onClick={() => csv(rows, f)}>Export CSV</Button><Button variant="outlined" size="small" onClick={() => window.print()}>Print</Button></Stack></Panel></Grid>)}</Grid>);
}

export default function Admin() {
  const { section } = useParams(); const [d, setD] = useState(null); const [ov, setOv] = useState(null); const [err, setErr] = useState(''); const [profile, setProfile] = useState(null);
  const [filter, setFilter] = useState({ district: '', course_id: '', gender: '' });
  const load = () => {
    setErr(''); setD(null);
    Promise.all(['/analytics/districts', '/analytics/providers', '/analytics/courses', '/skill-gaps', '/risk-analysis'].map((u) => api.get(u)))
      .then(([di, pr, co, sk, ri]) => setD({ districts: di.data, providers: pr.data, courses: co.data, skills: sk.data, risk: ri.data })).catch((e) => setErr(errMsg(e)));
  };
  useEffect(load, []);
  useEffect(() => { api.get('/analytics/overview', { params: filter }).then((r) => setOv(r.data)).catch((e) => setErr(errMsg(e))); }, [filter]);
  const openProfile = (id) => api.get('/trainees/' + id).then((r) => setProfile(r.data)).catch((e) => setErr(errMsg(e)));
  if (section !== 'dashboard' && !TITLES[section]) return <Navigate to="/admin/dashboard" replace />;
  let body;
  if (err) body = <ErrorState message={err} onRetry={() => { load(); setFilter({ ...filter }); }} />;
  else if (!d || !ov) body = <PageSkeleton />;
  else {
    const t = TITLES[section];
    body = (<>
      {section !== 'dashboard' && <PageHeader title={t[0]} text={t[1]} />}
      {section === 'dashboard' && <DashboardView ov={ov} d={d} filter={filter} setFilter={setFilter} user="Admin" />}
      {section === 'trainees' && <TraineesView openProfile={openProfile} />}
      {section === 'placements' && <PlacementsView />}
      {section === 'providers' && <Panel><DataTable rows={d.providers} columns={providerCols} /></Panel>}
      {section === 'courses' && <Panel><DataTable rows={d.courses} columns={courseCols} /></Panel>}
      {section === 'skills' && <SkillsView skills={d.skills} />}
      {section === 'risk' && <RiskView risk={d.risk} openProfile={openProfile} />}
      {section === 'districts' && <Grid container spacing={2}><Grid item xs={12} md={4}><Panel title="Top performing districts" subtitle="By employment rate"><Ranking rows={d.districts} n={15} /></Panel></Grid>
        <Grid item xs={12} md={8}><Panel title="District map"><DistrictMap rows={d.districts} height={420} /></Panel></Grid></Grid>}
      {section === 'reports' && <ReportsView d={d} />}
    </>);
  }
  return <AppLayout nav={NAV}>{body}<TraineeProfile t={profile} onClose={() => setProfile(null)} /></AppLayout>;
}
