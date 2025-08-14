import { Box, Typography, Paper, IconButton } from '@mui/material';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRepo } from '../hooks/useRepo';

export function CallsPage() {
  const navigate = useNavigate();
  const repo = useRepo();
  
  // Get all calls from the repo
  const allCalls = repo.getAllCalls();

  const columns: GridColDef[] = [
    { field: 'id', headerName: 'ID', width: 150 },
    {
      field: 'title',
      headerName: 'Call Title',
      width: 250,
      editable: false,
    },
    {
      field: 'clientName',
      headerName: 'Client',
      width: 150,
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
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          color="primary"
          onClick={() => navigate(`/node/${params.row.id}`)}
          title="Open Dashboard"
          size="small"
        >
          <DashboardIcon />
        </IconButton>
      ),
    },
  ];

  // Transform call nodes into table rows
  const rows = allCalls.map((call) => {
    const client = repo.getNode(call.parentId || "");
    const callData = repo.getCallByNode(call.id);
    
    return {
      id: call.id,
      title: call.name,
      clientName: client?.name || "Unknown",
      date: new Date(call.createdAt),
      sentiment: callData?.sentiment?.overall || "unknown"
    };
  });

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