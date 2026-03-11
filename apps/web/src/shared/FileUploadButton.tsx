import { useRef } from 'react';
import { Button, Box } from '@mui/material';
import { CloudUpload } from '@mui/icons-material';

interface FileUploadButtonProps {
  onFileSelect?: (file: File) => void;
  accept?: string;
  multiple?: boolean;
}

export function FileUploadButton({ 
  onFileSelect, 
  accept = "*/*", 
  multiple = false 
}: FileUploadButtonProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && onFileSelect) {
      onFileSelect(file);
      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);
    }
  };

  return (
    <Box>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        multiple={multiple}
        style={{ display: 'none' }}
      />
      <Button
        variant="contained"
        startIcon={<CloudUpload />}
        onClick={handleClick}
      >
        Upload File
      </Button>
    </Box>
  );
}