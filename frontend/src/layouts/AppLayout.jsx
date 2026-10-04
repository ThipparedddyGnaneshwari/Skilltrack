import { useState } from 'react';
import { Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Typography, AppBar, Toolbar, IconButton, TextField, InputAdornment, Badge, Avatar, Menu, MenuItem, Divider, Stack, useMediaQuery, Dialog, DialogTitle, DialogContent, Tabs, Tab, Switch, FormControlLabel, Snackbar, Alert } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Search from '@mui/icons-material/Search';
import NotificationsNone from '@mui/icons-material/NotificationsNone';
import SettingsOutlined from '@mui/icons-material/SettingsOutlined';
import PersonOutline from '@mui/icons-material/PersonOutline';
import Logout from '@mui/icons-material/Logout';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { initials } from '../components/ui.jsx';

const W = 244;
const ROLE_LABEL = { admin: 'Government Admin', trainee: 'Trainee', employer: 'Employer' };
const NOTES = { admin: ['6 employer verifications are pending', 'Skill-gap report refreshed', 'High-risk trainees list updated'],
  trainee: ['Your next follow-up is coming up', 'Skill-gap recommendation available', 'Employer verification status updated'],
  employer: ['New placement verification requests', 'A candidate record needs your review'] };

function Brand() {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center" sx={{ px: 2.5, py: 2.5 }}>
      <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>S</Box>
      <Box><Typography sx={{ fontWeight: 700, lineHeight: 1.1 }}>SkillTrack</Typography><Typography variant="caption">Outcome Intelligence</Typography></Box>
    </Stack>
  );
}

function AccountDialog({ open, onClose, user }) {
  const [tab, setTab] = useState(0);
  const [prefs, setPrefs] = useState(() => JSON.parse(localStorage.getItem('st_prefs') || '{"sms":true,"whatsapp":true,"email":true}'));
  const toggle = (k) => { const n = { ...prefs, [k]: !prefs[k] }; setPrefs(n); localStorage.setItem('st_prefs', JSON.stringify(n)); };
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle sx={{ pb: 0 }}>Account</DialogTitle>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ px: 2 }}><Tab label="Profile" /><Tab label="Settings" /></Tabs>
      <DialogContent>
        {tab === 0 ? (<Stack spacing={1.5}>
          <Box><Typography variant="caption">Name</Typography><Typography>{user.name}</Typography></Box>
          <Box><Typography variant="caption">Email</Typography><Typography>{user.email}</Typography></Box>
          <Box><Typography variant="caption">Role</Typography><Typography>{ROLE_LABEL[user.role]}</Typography></Box></Stack>)
          : (<Stack><Typography variant="caption" sx={{ mb: 1 }}>Follow-up channels (saved on this device)</Typography>
            {[['sms', 'SMS'], ['whatsapp', 'WhatsApp'], ['email', 'Email']].map(([k, l]) => <FormControlLabel key={k} control={<Switch checked={prefs[k]} onChange={() => toggle(k)} />} label={l} />)}</Stack>)}
      </DialogContent>
    </Dialog>
  );
}

export default function AppLayout({ nav, children }) {
  const { user, signOut } = useAuth(); const navigate = useNavigate(); const loc = useLocation();
  const desktop = useMediaQuery('(min-width:1200px)');
  const [open, setOpen] = useState(false); const [menu, setMenu] = useState(null); const [bell, setBell] = useState(null); const [acct, setAcct] = useState(false);
  const [denied, setDenied] = useState(!!loc.state?.denied);
  const logout = () => { signOut(); navigate('/login'); };
  const side = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Brand />
      <List sx={{ px: 1.5, flexGrow: 1 }}>{nav.map((n) => (
        <ListItemButton key={n.to} component={NavLink} to={n.to} onClick={() => setOpen(false)}
          sx={{ borderRadius: 2, mb: 0.25, py: 0.9, color: 'text.secondary', '&.active': { bgcolor: '#EAF0F8', color: 'primary.main', '& .MuiListItemIcon-root': { color: 'primary.main' } }, '&:hover': { bgcolor: '#F2F4F7' } }}>
          <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>{n.icon}</ListItemIcon><ListItemText primary={n.label} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} /></ListItemButton>))}</List>
      <Divider /><List sx={{ px: 1.5, py: 1 }}>
        {[['Settings', <SettingsOutlined />], ['Profile', <PersonOutline />]].map(([l, i]) => (
          <ListItemButton key={l} onClick={() => { setAcct(true); setOpen(false); }} sx={{ borderRadius: 2, py: 0.8, color: 'text.secondary' }}>
            <ListItemIcon sx={{ minWidth: 34, color: 'inherit' }}>{i}</ListItemIcon><ListItemText primary={l} primaryTypographyProps={{ fontSize: 14, fontWeight: 500 }} /></ListItemButton>))}</List>
    </Box>
  );
  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <Drawer variant={desktop ? 'permanent' : 'temporary'} open={desktop || open} onClose={() => setOpen(false)} ModalProps={{ keepMounted: true }}
        sx={{ width: desktop ? W : 0, flexShrink: 0, '& .MuiDrawer-paper': { width: W, borderRight: '1px solid #E4E7EC', bgcolor: '#fff' } }}>{side}</Drawer>
      <Box sx={{ flexGrow: 1, minWidth: 0 }}>
        <AppBar position="sticky" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #E4E7EC', bgcolor: 'rgba(255,255,255,.92)', backdropFilter: 'blur(6px)' }}>
          <Toolbar sx={{ gap: 1.5 }}>
            {!desktop && <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open menu"><MenuIcon /></IconButton>}
            {user.role === 'admin' ? (
              <TextField placeholder="Search trainees, providers, courses..." sx={{ flexGrow: 1, maxWidth: 440 }} onKeyDown={(e) => e.key === 'Enter' && navigate(`/admin/trainees?q=${encodeURIComponent(e.target.value)}`)}
                InputProps={{ startAdornment: <InputAdornment position="start"><Search fontSize="small" /></InputAdornment>, sx: { bgcolor: '#F5F7FA' } }} />) : <Box sx={{ flexGrow: 1 }} />}
            <Box sx={{ flexGrow: 1 }} />
            <IconButton onClick={(e) => setBell(e.currentTarget)} aria-label="Notifications"><Badge color="error" variant="dot"><NotificationsNone /></Badge></IconButton>
            <Stack direction="row" spacing={1.25} alignItems="center" onClick={(e) => setMenu(e.currentTarget)} sx={{ cursor: 'pointer', pl: 1 }}>
              <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13 }}>{initials(user.name)}</Avatar>
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Typography variant="subtitle2" sx={{ lineHeight: 1.2 }}>{user.name}</Typography><Typography variant="caption">{ROLE_LABEL[user.role]}</Typography></Box>
            </Stack>
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ p: { xs: 2, md: 3.5 }, maxWidth: 1400, mx: 'auto' }}>{children}</Box>
      </Box>
      <Menu anchorEl={bell} open={!!bell} onClose={() => setBell(null)}>{NOTES[user.role].map((n) => <MenuItem key={n} onClick={() => setBell(null)} sx={{ fontSize: 13.5 }}>{n}</MenuItem>)}</Menu>
      <Menu anchorEl={menu} open={!!menu} onClose={() => setMenu(null)}>
        <MenuItem onClick={() => { setMenu(null); setAcct(true); }}>Profile</MenuItem><MenuItem onClick={() => { setMenu(null); setAcct(true); }}>Settings</MenuItem>
        <Divider /><MenuItem onClick={logout}><Logout fontSize="small" sx={{ mr: 1 }} />Logout</MenuItem></Menu>
      <AccountDialog open={acct} onClose={() => setAcct(false)} user={user} />
      <Snackbar open={denied} autoHideDuration={4000} onClose={() => setDenied(false)}><Alert severity="warning" variant="filled">Access denied. You were redirected to your dashboard.</Alert></Snackbar>
    </Box>
  );
}
