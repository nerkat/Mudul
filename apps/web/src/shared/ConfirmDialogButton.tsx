import { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import { Warning } from '@mui/icons-material';

export function ConfirmDialogButton() {
  const [open, setOpen] = useState(false);

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    console.log('User confirmed the action');
    alert('Action confirmed!');
    setOpen(false);
  };

  return (
    <>
      <Button
        variant="outlined"
        color="warning"
        onClick={handleClickOpen}
        startIcon={<Warning />}
      >
        Clear Cache
      </Button>

      <Dialog
        open={open}
        onClose={handleClose}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title">
          Confirm Action
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description">
            Are you sure you want to clear the application cache? This action
            cannot be undone and may require you to re-configure some settings.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleConfirm} color="warning" variant="contained">
            Clear Cache
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}