import { Box, Typography, Paper, IconButton } from '@mui/material';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

export function CallsPage() {
  const navigate = useNavigate();

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 90 },
    {
      field: 'title',
      headerName: 'Call Title',
      width: 200,
      editable: false,
    },
    {
      field: 'duration',
      headerName: 'Duration (min)',
      type: 'number',
      width: 130,
      editable: false,
    },
    {
      field: 'sentiment',
      headerName: 'Sentiment',
      width: 120,
      editable: false,
      renderCell: (params) => {
        const value = params.value as string;
        const color = 
          value === 'positive' ? 'success.main' : 
          value === 'negative' ? 'error.main' : 
          'warning.main';
        
        return (
          <Box sx={{ color, fontWeight: 'medium', textTransform: 'capitalize' }}>
            {value}
          </Box>
        );
      },
    },
    {
      field: 'date',
      headerName: 'Date',
      type: 'date',
      width: 130,
      editable: false,
    },
    {
      field: 'participant',
      headerName: 'Participant',
      width: 150,
      editable: false,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => navigate(`/calls/${params.row.id}`)}
          title="Open Dashboard"
          size="small"
        >
          <DashboardIcon />
        </IconButton>
      ),
    },
  ];

  const rows = [
    { 
      id: 1, 
      title: 'Discovery Call - Acme Corp', 
      duration: 23, 
      sentiment: 'positive',
      date: new Date('2024-01-15'),
      participant: 'John Smith'
    },
    { 
      id: 2, 
      title: 'Demo Call - TechStart', 
      duration: 45, 
      sentiment: 'neutral',
      date: new Date('2024-01-14'),
      participant: 'Sarah Johnson'
    },
    { 
      id: 3, 
      title: 'Follow-up - Global Inc', 
      duration: 18, 
      sentiment: 'positive',
      date: new Date('2024-01-13'),
      participant: 'Mike Wilson'
    },
    { 
      id: 4, 
      title: 'Pricing Discussion - StartupXYZ', 
      duration: 31, 
      sentiment: 'negative',
      date: new Date('2024-01-12'),
      participant: 'Lisa Chen'
    },
    { 
      id: 5, 
      title: 'Technical Review - Enterprise Co', 
      duration: 52, 
      sentiment: 'positive',
      date: new Date('2024-01-11'),
      participant: 'David Brown'
    },
    { 
      id: 6, 
      title: 'Initial Contact - Innovation Ltd', 
      duration: 12, 
      sentiment: 'neutral',
      date: new Date('2024-01-10'),
      participant: 'Emma Davis'
    },
    { 
      id: 7, 
      title: 'Contract Discussion - MegaCorp', 
      duration: 38, 
      sentiment: 'positive',
      date: new Date('2024-01-09'),
      participant: 'Robert Taylor'
    },
    { 
      id: 8, 
      title: 'Support Call - Current Customer', 
      duration: 25, 
      sentiment: 'neutral',
      date: new Date('2024-01-08'),
      participant: 'Jennifer Lee'
    },
  ];
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Calls
      </Typography>
      <Typography variant="body1" color="textSecondary" gutterBottom>
        Manage and analyze your sales call data
      </Typography>
      
      <Paper sx={{ mt: 3, height: 600 }}>
        <DataGrid
          rows={rows}
          columns={columns}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 10,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25]}
          checkboxSelection
          disableRowSelectionOnClick
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          sx={{
            border: 0,
            '& .MuiDataGrid-toolbarContainer': {
              padding: 2,
            },
          }}
        />
      </Paper>
    </Box>
  );
}