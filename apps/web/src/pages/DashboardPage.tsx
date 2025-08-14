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
  Schedule, 
  Assessment 
} from '@mui/icons-material';

export function DashboardPage() {
  const stats = [
    {
      title: 'Total Calls',
      value: '247',
      change: '+12%',
      icon: <Phone />,
      color: '#1976d2',
    },
    {
      title: 'Call Duration',
      value: '18.5 min',
      change: '+5%',
      icon: <Schedule />,
      color: '#2e7d32',
    },
    {
      title: 'Conversion Rate',
      value: '68%',
      change: '+8%',
      icon: <TrendingUp />,
      color: '#ed6c02',
    },
    {
      title: 'Sentiment Score',
      value: '7.8/10',
      change: '+2%',
      icon: <Assessment />,
      color: '#9c27b0',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Welcome to your sales call analytics dashboard
      </Typography>
      
      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' },
          gap: 3,
          mt: 2 
        }}
      >
        {stats.map((stat, index) => (
          <Card key={index} sx={{ height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Box 
                  sx={{ 
                    backgroundColor: stat.color,
                    color: 'white',
                    borderRadius: 1,
                    p: 1,
                    display: 'flex',
                    mr: 2,
                  }}
                >
                  {stat.icon}
                </Box>
                <Typography variant="h6" component="h2">
                  {stat.title}
                </Typography>
              </Box>
              <Typography variant="h4" component="div" gutterBottom>
                {stat.value}
              </Typography>
              <Typography 
                variant="body2" 
                color="success.main"
                sx={{ fontWeight: 'medium' }}
              >
                {stat.change} from last month
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <Box 
        sx={{ 
          display: 'grid', 
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3,
          mt: 3 
        }}
      >
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Recent Activity
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Call analytics and insights will be displayed here. This is a placeholder for the upcoming analytics features.
          </Typography>
        </Paper>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Quick Actions
          </Typography>
          <Typography variant="body2" color="textSecondary">
            Quick access to common tasks and shortcuts will be available here.
          </Typography>
        </Paper>
      </Box>
    </Box>
  );
}