import {
  Box,
  Typography,
  Paper,
} from '@mui/material';
import { DataGrid, type GridColDef, GridToolbar } from '@mui/x-data-grid';

interface CallData {
  id: number;
  title: string;
  duration: string;
  sentiment: string;
  date: string;
  bookingLikelihood: number;
}

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  {
    field: 'title',
    headerName: 'Call Title',
    width: 250,
    editable: false,
  },
  {
    field: 'duration',
    headerName: 'Duration',
    width: 120,
    editable: false,
  },
  {
    field: 'sentiment',
    headerName: 'Sentiment',
    width: 130,
    editable: false,
  },
  {
    field: 'date',
    headerName: 'Date',
    width: 140,
    editable: false,
  },
  {
    field: 'bookingLikelihood',
    headerName: 'Booking %',
    type: 'number',
    width: 120,
    editable: false,
    renderCell: (params) => `${params.value}%`,
  },
];

const demoRows: CallData[] = [
  {
    id: 1,
    title: 'Discovery Call - Acme Corp',
    duration: '32m 15s',
    sentiment: 'Positive',
    date: '2024-01-15',
    bookingLikelihood: 85,
  },
  {
    id: 2,
    title: 'Demo Call - TechStart Inc',
    duration: '45m 30s',
    sentiment: 'Neutral',
    date: '2024-01-14',
    bookingLikelihood: 62,
  },
  {
    id: 3,
    title: 'Follow-up - Beta Solutions',
    duration: '18m 45s',
    sentiment: 'Positive',
    date: '2024-01-14',
    bookingLikelihood: 91,
  },
  {
    id: 4,
    title: 'Initial Outreach - Global Co',
    duration: '25m 10s',
    sentiment: 'Negative',
    date: '2024-01-13',
    bookingLikelihood: 23,
  },
  {
    id: 5,
    title: 'Pricing Discussion - StartUp XYZ',
    duration: '38m 20s',
    sentiment: 'Positive',
    date: '2024-01-12',
    bookingLikelihood: 78,
  },
];

export function CallsPage() {
  return (
    <Box>
      <Typography variant="h4" component="h1" gutterBottom>
        Sales Calls
      </Typography>
      <Typography variant="body1" color="textSecondary" paragraph>
        View and analyze your sales call data with sorting and filtering capabilities.
      </Typography>

      <Paper sx={{ width: '100%' }}>
        <Box sx={{ height: 600, width: '100%' }}>
          <DataGrid
            rows={demoRows}
            columns={columns}
            initialState={{
              pagination: {
                paginationModel: {
                  pageSize: 10,
                },
              },
              sorting: {
                sortModel: [{ field: 'date', sort: 'desc' }],
              },
            }}
            pageSizeOptions={[5, 10, 25]}
            checkboxSelection
            disableRowSelectionOnClick
            slots={{
              toolbar: GridToolbar,
            }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
  );
}