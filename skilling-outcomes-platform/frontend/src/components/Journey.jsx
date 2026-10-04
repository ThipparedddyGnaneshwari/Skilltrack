import { Stepper, Step, StepLabel, Typography } from '@mui/material';

export const journeySteps = (t) => {
  const p = t.placements?.[0]; const f = t.followups || [];
  return [
    { label: 'Training', done: t.completed, note: t.completed ? 'Completed' : 'In progress' },
    { label: 'Certified', done: t.certified, note: t.certified ? 'Certified' : 'Not yet' },
    { label: 'Placed', done: p?.status === 'verified', note: p ? (p.status === 'verified' ? 'Verified' : 'Verification ' + p.status) : 'No placement' },
    ...f.map((x) => ({ label: `${x.month} Month`, done: x.status === 'Completed', note: x.status })),
  ];
};

export default function Journey({ t, orientation = 'horizontal' }) {
  const steps = journeySteps(t); const firstOpen = steps.findIndex((s) => !s.done);
  return (
    <Stepper orientation={orientation} activeStep={firstOpen === -1 ? steps.length : firstOpen} alternativeLabel={orientation === 'horizontal'} sx={{ overflowX: 'auto', py: 1 }}>
      {steps.map((s) => <Step key={s.label} completed={s.done}><StepLabel optional={<Typography variant="caption">{s.note}</Typography>}>{s.label}</StepLabel></Step>)}
    </Stepper>
  );
}
