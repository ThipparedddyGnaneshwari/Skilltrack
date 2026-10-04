import { Box, Container, Typography, Button, Stack, Grid } from '@mui/material';
import { Link } from 'react-router-dom';

const features = [['Follow every trainee', 'Automated 3, 6 and 12-month follow-ups over SMS, WhatsApp and email.'], ['Verified placements', 'Employers confirm role, salary and joining date before a placement counts.'],
  ['See the skill gaps', 'Find which skills are missing by district, course and provider.'], ['Act on risk', 'Flag trainees likely to miss placement and recommend the next step.']];

export default function Landing() {
  return (
    <Box>
      <Container maxWidth="lg">
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ py: 2.5 }}>
          <Stack direction="row" spacing={1.25} alignItems="center"><Box sx={{ width: 32, height: 32, borderRadius: 2, bgcolor: 'primary.main', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>S</Box><Typography variant="h6">SkillTrack</Typography></Stack>
          <Stack direction="row" spacing={1}><Button component={Link} to="/login">Sign in</Button><Button component={Link} to="/signup" variant="contained">Create account</Button></Stack>
        </Stack>
        <Box sx={{ py: { xs: 7, md: 12 }, maxWidth: 720 }}>
          <Typography sx={{ fontSize: { xs: 34, md: 52 }, fontWeight: 600, letterSpacing: -1.5, lineHeight: 1.1 }}>From training to employment — track the complete journey.</Typography>
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2.5, fontWeight: 400, lineHeight: 1.5 }}>SkillTrack is the skilling outcomes & impact platform: measure placements, salaries and retention, and see exactly where programmes need to improve.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 4 }}><Button component={Link} to="/login" variant="contained" size="large">Sign in</Button><Button component={Link} to="/signup" variant="outlined" size="large">Create account</Button></Stack>
        </Box>
        <Grid container spacing={4} sx={{ pb: 10 }}>{features.map(([t, d]) => <Grid item xs={12} sm={6} md={3} key={t}><Typography variant="subtitle1">{t}</Typography><Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{d}</Typography></Grid>)}</Grid>
      </Container>
      <Box sx={{ borderTop: '1px solid #E4E7EC', py: 3 }}><Container maxWidth="lg"><Typography variant="caption">Built for longitudinal skilling outcome tracking. Prototype developed for Smart India Hackathon — problem statement SIH26135.</Typography></Container></Box>
    </Box>
  );
}
