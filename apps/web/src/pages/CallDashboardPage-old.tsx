import { useParams, useNavigate } from 'react-router-dom';
import { 
  Box, 
  Typography, 
  Paper, 
  Card, 
  CardContent, 
  Chip,
  IconButton,
  Divider,
  Alert
} from '@mui/material';
import { 
  ArrowBack,
  Schedule,
  Person,
  TrendingUp,
  Assessment 
} from '@mui/icons-material';

// Sample call data - in a real app this would come from an API
const callsData = [
  { 
    id: 1, 
    title: 'Discovery Call - Acme Corp', 
    duration: 23, 
    sentiment: 'positive',
    date: new Date('2024-01-15'),
    participant: 'John Smith',
    company: 'Acme Corp',
    phase: 'Discovery',
    outcome: 'Follow-up scheduled',
    notes: 'Great conversation about their current pain points. They are interested in our enterprise solution.',
    sentimentScore: 8.5,
    engagementLevel: 'High',
    nextSteps: ['Send proposal by Friday', 'Schedule technical demo', 'Connect with their CTO']
  },
  { 
    id: 2, 
    title: 'Demo Call - TechStart', 
    duration: 45, 
    sentiment: 'neutral',
    date: new Date('2024-01-14'),
    participant: 'Sarah Johnson',
    company: 'TechStart',
    phase: 'Demo',
    outcome: 'Requested pricing',
    notes: 'Showed the main features. Some concerns about integration complexity.',
    sentimentScore: 6.2,
    engagementLevel: 'Medium',
    nextSteps: ['Provide detailed pricing', 'Address integration concerns', 'Follow up next week']
  },
  { 
    id: 3, 
    title: 'Follow-up - Global Inc', 
    duration: 18, 
    sentiment: 'positive',
    date: new Date('2024-01-13'),
    participant: 'Mike Wilson',
    company: 'Global Inc',
    phase: 'Follow-up',
    outcome: 'Moving to next phase',
    notes: 'All questions answered. Ready to move forward with pilot program.',
    sentimentScore: 9.1,
    engagementLevel: 'High',
    nextSteps: ['Send pilot agreement', 'Schedule implementation kickoff', 'Introduce to success team']
  },
  { 
    id: 4, 
    title: 'Pricing Discussion - StartupXYZ', 
    duration: 31, 
    sentiment: 'negative',
    date: new Date('2024-01-12'),
    participant: 'Lisa Chen',
    company: 'StartupXYZ',
    phase: 'Negotiation',
    outcome: 'Price objections',
    notes: 'Concerns about budget. May need to explore smaller package options.',
    sentimentScore: 3.8,
    engagementLevel: 'Low',
    nextSteps: ['Prepare budget-friendly options', 'Discuss value proposition', 'Schedule follow-up in 2 weeks']
  },
  { 
    id: 5, 
    title: 'Technical Review - Enterprise Co', 
    duration: 52, 
    sentiment: 'positive',
    date: new Date('2024-01-11'),
    participant: 'David Brown',
    company: 'Enterprise Co',
    phase: 'Technical Review',
    outcome: 'Technical approval received',
    notes: 'Deep dive into technical requirements. All security and compliance questions addressed.',
    sentimentScore: 8.9,
    engagementLevel: 'High',
    nextSteps: ['Finalize contract terms', 'Schedule legal review', 'Prepare implementation plan']
  },
  { 
    id: 6, 
    title: 'Initial Contact - Innovation Ltd', 
    duration: 12, 
    sentiment: 'neutral',
    date: new Date('2024-01-10'),
    participant: 'Emma Davis',
    company: 'Innovation Ltd',
    phase: 'Initial Contact',
    outcome: 'Interest expressed',
    notes: 'Brief introduction call. They want to learn more about our solutions.',
    sentimentScore: 6.8,
    engagementLevel: 'Medium',
    nextSteps: ['Send company overview', 'Schedule discovery call', 'Research their industry needs']
  },
  { 
    id: 7, 
    title: 'Contract Discussion - MegaCorp', 
    duration: 38, 
    sentiment: 'positive',
    date: new Date('2024-01-09'),
    participant: 'Robert Taylor',
    company: 'MegaCorp',
    phase: 'Contract',
    outcome: 'Terms agreed',
    notes: 'Final contract negotiations. All terms have been agreed upon.',
    sentimentScore: 8.7,
    engagementLevel: 'High',
    nextSteps: ['Send final contract', 'Schedule signing ceremony', 'Plan onboarding']
  },
  { 
    id: 8, 
    title: 'Support Call - Current Customer', 
    duration: 25, 
    sentiment: 'neutral',
    date: new Date('2024-01-08'),
    participant: 'Jennifer Lee',
    company: 'Current Customer',
    phase: 'Support',
    outcome: 'Issue resolved',
    notes: 'Resolved technical issue with their current implementation.',
    sentimentScore: 7.2,
    engagementLevel: 'Medium',
    nextSteps: ['Follow up on resolution', 'Schedule quarterly review', 'Discuss expansion opportunities']
  },
];

export function CallDashboardPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const callId = parseInt(id || '0');
  const call = callsData.find(c => c.id === callId);

  if (!call) {
    return (
      <Box>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton onClick={() => navigate('/calls')} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4">Call Not Found</Typography>
        </Box>
        <Alert severity="error">
          Call with ID {id} was not found.
        </Alert>
      </Box>
    );
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'success';
      case 'negative': return 'error';
      default: return 'warning';
    }
  };

  const getEngagementColor = (level: string) => {
    switch (level) {
      case 'High': return 'success';
      case 'Low': return 'error';
      default: return 'info';
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/calls')} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" component="h1">
            {call.title}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            Call Dashboard - Detailed Analytics
          </Typography>
        </Box>
      </Box>

      {/* Key Metrics Cards */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(4, 1fr)' },
          gap: 3,
          mb: 4 
        }}
      >
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Schedule color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Duration</Typography>
            </Box>
            <Typography variant="h4">{call.duration} min</Typography>
            <Typography variant="body2" color="textSecondary">
              {call.date.toLocaleDateString()}
            </Typography>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <TrendingUp color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Sentiment</Typography>
            </Box>
            <Chip 
              label={call.sentiment.toUpperCase()} 
              color={getSentimentColor(call.sentiment) as any}
              sx={{ mb: 1 }}
            />
            <Typography variant="h4">{call.sentimentScore}/10</Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Person color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Participant</Typography>
            </Box>
            <Typography variant="h6">{call.participant}</Typography>
            <Typography variant="body2" color="textSecondary">
              {call.company}
            </Typography>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Assessment color="primary" sx={{ mr: 1 }} />
              <Typography variant="h6">Engagement</Typography>
            </Box>
            <Chip 
              label={call.engagementLevel} 
              color={getEngagementColor(call.engagementLevel) as any}
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="textSecondary">
              {call.phase}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      {/* Call Details */}
      <Box 
        sx={{ 
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' },
          gap: 3 
        }}
      >
        {/* Call Notes */}
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Call Notes
            </Typography>
            <Typography variant="body1" paragraph>
              {call.notes}
            </Typography>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="h6" gutterBottom>
              Outcome
            </Typography>
            <Chip label={call.outcome} color="info" />
          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Next Steps
            </Typography>
            <Box component="ul" sx={{ pl: 2 }}>
              {call.nextSteps.map((step, index) => (
                <Typography component="li" key={index} sx={{ mb: 1 }}>
                  {step}
                </Typography>
              ))}
            </Box>
          </Paper>
        </Box>

        {/* Call Information */}
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Call Information
            </Typography>
            
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Call ID
              </Typography>
              <Typography variant="body1">#{call.id}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Date & Time
              </Typography>
              <Typography variant="body1">
                {call.date.toLocaleDateString()} at {call.date.toLocaleTimeString()}
              </Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Sales Phase
              </Typography>
              <Typography variant="body1">{call.phase}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Company
              </Typography>
              <Typography variant="body1">{call.company}</Typography>
            </Box>

            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle2" color="textSecondary">
                Primary Contact
              </Typography>
              <Typography variant="body1">{call.participant}</Typography>
            </Box>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}