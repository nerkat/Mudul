import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
} from '@mui/material';
import {
  TrendingUp,
  Phone,
  CheckCircle,
  Schedule,
} from '@mui/icons-material';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'primary' | 'secondary' | 'success' | 'info';
}

function MetricCard({ title, value, icon, color }: MetricCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography color="textSecondary" gutterBottom variant="body2">
              {title}
            </Typography>
            <Typography variant="h4" component="div">
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              p: 1,
              borderRadius: 1,
              backgroundColor: `${color}.light`,
              color: `${color}.contrastText`,
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

export function DashboardPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        Welcome to your sales call analytics dashboard.
      </Typography>

      <Box sx={{ 
        display: 'grid', 
        gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
        gap: 3,
        mb: 4
      }}>
        <MetricCard
          title="Total Calls"
          value={247}
          icon={<Phone />}
          color="primary"
        />
        <MetricCard
          title="Conversion Rate"
          value="23.4%"
          icon={<TrendingUp />}
          color="success"
        />
        <MetricCard
          title="Bookings This Month"
          value={58}
          icon={<CheckCircle />}
          color="secondary"
        />
        <MetricCard
          title="Avg Call Duration"
          value="24m"
          icon={<Schedule />}
          color="info"
        />
      </Box>

      <Box mt={4}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Call analytics and insights will appear here. Connect your sales calls
            to start seeing detailed analytics, sentiment analysis, and booking
            likelihood predictions.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}