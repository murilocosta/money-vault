import { Typography } from '@mui/material';

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-2">
      <Typography variant="h5" sx={{ fontWeight: 700 }}>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Welcome back. Your financial overview will appear here.
      </Typography>
    </div>
  );
}
