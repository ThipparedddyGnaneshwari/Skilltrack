import { Box, Card, Typography, Stack, Chip, Skeleton, Button, Avatar, TextField, InputAdornment, IconButton } from '@mui/material';
import { useState } from 'react';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InboxOutlined from '@mui/icons-material/InboxOutlined';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import ArrowUpward from '@mui/icons-material/ArrowUpward';

export function Panel({ title, subtitle, action, children, sx, pad = 2.5 }) {
  return (
    <Card sx={{ height: '100%', ...sx }}>
      {(title || action) && (
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ px: pad, pt: 2.25 }}>
          <Box><Typography variant="subtitle1">{title}</Typography>{subtitle && <Typography variant="caption">{subtitle}</Typography>}</Box>{action}
        </Stack>
      )}
      <Box sx={{ p: pad, pt: title ? 1.5 : pad }}>{children}</Box>
    </Card>
  );
}

export function StatCard({ label, value, delta, icon, hint }) {
  return (
    <Card sx={{ p: 2, height: '100%', transition: 'border-color .15s', '&:hover': { borderColor: '#C3CCD9' } }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="body2" color="text.secondary">{label}</Typography>
        {icon && <Box sx={{ color: 'secondary.main', display: 'flex', '& svg': { fontSize: 20 } }}>{icon}</Box>}
      </Stack>
      <Typography sx={{ fontSize: 26, fontWeight: 600, letterSpacing: -0.5, mt: 0.5, lineHeight: 1.2 }}>{value}</Typography>
      {delta != null && <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
        <ArrowUpward sx={{ fontSize: 14, color: 'success.main' }} /><Typography variant="caption" sx={{ color: 'success.main', fontWeight: 600 }}>{delta}%</Typography>
        <Typography variant="caption">vs last quarter</Typography></Stack>}
      {hint && <Typography variant="caption">{hint}</Typography>}
    </Card>
  );
}

const TONES = { good: ['#E7F6EE', '#17754A'], warn: ['#FDF3E1', '#9A5F0B'], bad: ['#FCEAEA', '#B42318'], info: ['#E6F4F3', '#0B6F6B'], neutral: ['#F2F4F7', '#475467'] };
const MAP = { Employed: 'good', verified: 'good', Completed: 'good', Low: 'good', Certified: 'good', 'Self-employed': 'info', Apprenticeship: 'info', Sent: 'info',
  pending: 'warn', Pending: 'warn', Medium: 'warn', correction: 'warn', Unemployed: 'bad', rejected: 'bad', Overdue: 'bad', High: 'bad' };
export function StatusChip({ value }) {
  const [bg, fg] = TONES[MAP[value] || 'neutral'];
  const label = { verified: 'Verified', pending: 'Pending', rejected: 'Rejected', correction: 'Correction requested' }[value] || value;
  return <Chip size="small" label={label} sx={{ bgcolor: bg, color: fg, height: 22, fontSize: 12 }} />;
}

export const initials = (n = '') => n.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const NameAvatar = ({ name, size = 32 }) => <Avatar sx={{ width: size, height: size, fontSize: size * 0.4, bgcolor: '#E6ECF5', color: 'primary.main', fontWeight: 600 }}>{initials(name)}</Avatar>;

export function EmptyState({ icon, title, text, action }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 6, px: 2, textAlign: 'center' }}>
      <Box sx={{ color: 'text.secondary', '& svg': { fontSize: 40 } }}>{icon || <InboxOutlined />}</Box>
      <Typography variant="subtitle1">{title}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 320 }}>{text}</Typography>
      {action}
    </Stack>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <Stack alignItems="center" spacing={1} sx={{ py: 8, textAlign: 'center' }}>
      <ErrorOutline color="error" sx={{ fontSize: 40 }} />
      <Typography variant="subtitle1">Something went wrong</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 420 }}>{message || "We couldn't load this information."}</Typography>
      {onRetry && <Button variant="outlined" onClick={onRetry}>Retry</Button>}
    </Stack>
  );
}

export const PageSkeleton = () => (
  <Box>
    <Skeleton width={260} height={36} /><Skeleton width={360} height={20} sx={{ mb: 2 }} />
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2,1fr)', lg: 'repeat(6,1fr)' }, gap: 2, mb: 2 }}>{[...Array(6)].map((_, i) => <Skeleton key={i} variant="rounded" height={96} />)}</Box>
    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 2 }}><Skeleton variant="rounded" height={300} /><Skeleton variant="rounded" height={300} /></Box>
  </Box>
);

export function PasswordField({ label, error, helperText, ...p }) {
  const [show, setShow] = useState(false);
  return (
    <TextField {...p} label={label} type={show ? 'text' : 'password'} error={!!error} helperText={error || helperText} fullWidth size="medium"
      InputProps={{ endAdornment: <InputAdornment position="end"><IconButton aria-label={show ? 'Hide password' : 'Show password'} onClick={() => setShow(!show)} edge="end">{show ? <VisibilityOff /> : <Visibility />}</IconButton></InputAdornment> }} />
  );
}

export const PageHeader = ({ title, text, right }) => (
  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'flex-end' }} spacing={1.5} sx={{ mb: 3 }}>
    <Box><Typography variant="h4">{title}</Typography>{text && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{text}</Typography>}</Box>{right}
  </Stack>
);
