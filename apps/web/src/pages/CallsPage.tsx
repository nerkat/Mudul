import { useState, useEffect } from 'react';
import { Box, Typography, Paper, IconButton, CircularProgress, Alert } from '@mui/material';
import { DataGrid, GridToolbar, type GridColDef } from '@mui/x-data-grid';
import { Dashboard as DashboardIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRepo } from '../hooks/useRepo';
import type { NodeBase } from '../core/types';

export function CallsPage() {
  const navigate = useNavigate();
  const repo = useRepo();
  const [allCalls, setAllCalls] = useState<NodeBase[]>([]);
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadCallsAndData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const callsResult = repo.getAllCalls();
        
        const resolvedCalls = repo.isAsync ? await callsResult : callsResult as NodeBase[];
        
        if (!isMounted) return;
        setAllCalls(resolvedCalls);

        // Transform call nodes into table rows
        const tableRows = await Promise.all(
          resolvedCalls.map(async (call) => {
            const clientResult = repo.getNode(call.parentId || "");
            const callDataResult = repo.getCallByNode(call.id);
            
            const client = repo.isAsync ? await clientResult : clientResult;
            const callData = repo.isAsync ? await callDataResult : callDataResult;
            
            return {
              id: call.id,
              title: call.name,
              clientName: client?.name || "Unknown",
              date: new Date(call.createdAt),
              sentiment: callData?.sentiment?.overall || "unknown"
            };
          })
        );

        if (isMounted) {
          setRows(tableRows);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load calls');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCallsAndData();

    return () => {
      isMounted = false;
    };
  }, [repo]);

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

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 400 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Typography variant="h4" component="h1" gutterBottom>
          Sales Calls
        </Typography>
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

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