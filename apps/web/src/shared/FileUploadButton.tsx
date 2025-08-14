import { useRef } from 'react';
import { Button, Box, Typography } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

export function FileUploadButton() {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      console.log('Selected files:', Array.from(files).map(f => f.name));
      // Here you would typically upload the files
      alert(`Selected ${files.length} file(s): ${Array.from(files).map(f => f.name).join(', ')}`);
    }
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        multiple
        accept=".pdf,.txt,.csv,.json,.mp3,.mp4,.wav"
      />
      <Button
        variant="contained"
        onClick={handleClick}
        startIcon={<CloudUpload />}
        sx={{ mb: 1 }}
      >
        Choose Files
      </Button>
      <Typography variant="body2" color="textSecondary">
        Supported formats: PDF, TXT, CSV, JSON, MP3, MP4, WAV
      </Typography>
    </Box>
  );
}