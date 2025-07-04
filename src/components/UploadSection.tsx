'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  Alert, 
  CircularProgress,
  Chip,
  Stack
} from '@mui/material';
import { CloudUpload, CheckCircle, Error, Warning } from '@mui/icons-material';
import { parseFile } from '../utils/fileParser';
import { FileData } from '../types';
import { useTheme } from '@mui/material/styles';

interface UploadSectionProps {
  onDataUpdate: (type: 'clients' | 'workers' | 'tasks', data: any[]) => void;
}

export default function UploadSection({ onDataUpdate }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const theme = useTheme();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      let totalProcessed = 0;
      let totalRecords = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ];
        
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Please upload .xlsx, .xls, or .csv files.`);
        }

        const fileDataArray = await parseFile(file);
        
        // Process each sheet's data
        fileDataArray.forEach(fileData => {
          // Update the corresponding data state
          onDataUpdate(fileData.type, fileData.data);
          
          // Add to uploaded files list
          setUploadedFiles(prev => [...prev, fileData]);
          
          totalProcessed++;
          totalRecords += fileData.data.length;
        });
      }

      setUploadSuccess(`Successfully processed ${totalProcessed} sheet${totalProcessed !== 1 ? 's' : ''} with ${totalRecords} total records. Check the Tables section for validation status.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
  };

  const handleDrop = async (event: React.DragEvent) => {
    event.preventDefault();
    const files = event.dataTransfer.files;
    if (files.length === 0) return;

    setIsUploading(true);
    setError(null);
    setUploadSuccess(null);

    try {
      let totalProcessed = 0;
      let totalRecords = 0;

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file type
        const validTypes = [
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
          'text/csv'
        ];
        
        if (!validTypes.includes(file.type)) {
          throw new Error(`Invalid file type: ${file.name}. Please upload .xlsx, .xls, or .csv files.`);
        }

        const fileDataArray = await parseFile(file);
        
        // Process each sheet's data
        fileDataArray.forEach(fileData => {
          // Update the corresponding data state
          onDataUpdate(fileData.type, fileData.data);
          
          // Add to uploaded files list
          setUploadedFiles(prev => [...prev, fileData]);
          
          totalProcessed++;
          totalRecords += fileData.data.length;
        });
      }

      setUploadSuccess(`Successfully processed ${totalProcessed} sheet${totalProcessed !== 1 ? 's' : ''} with ${totalRecords} total records. Check the Tables section for validation status.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while uploading files');
    } finally {
      setIsUploading(false);
    }
  };

  const getEntityTypeColor = (type: string) => {
    switch (type) {
      case 'clients': return 'primary';
      case 'workers': return 'secondary';
      case 'tasks': return 'success';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, letterSpacing: -1 }}>
          Upload Files
        </Typography>
        <Box sx={{ my: 3 }}>
          <Button
            variant="outlined"
            color="primary"
            component="label"
            sx={{ borderRadius: 2, fontWeight: 500, px: 4, py: 1.5, fontSize: 18 }}
          >
            CHOOSE FILES OR DRAG & DROP
            <input type="file" hidden multiple onChange={handleFileUpload} />
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Supported formats: <b>.xlsx, .xls, .csv</b>
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Files will be automatically categorized as Clients, Workers, or Tasks based on column headers.<br />
          Multi-sheet Excel files are supported - each sheet will be processed separately.<br />
          Data will be validated automatically after upload.
        </Typography>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      )}

      {uploadSuccess && (
        <Alert severity="success" sx={{ mt: 2 }}>
          {uploadSuccess}
        </Alert>
      )}

      {uploadedFiles.length > 0 && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Uploaded Files & Sheets
          </Typography>
          <Stack spacing={1}>
            {uploadedFiles.map((file, index) => (
              <Paper key={index} sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                <CheckCircle color="success" />
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="body1">
                    {file.fileName}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {file.data.length} records detected
                  </Typography>
                </Box>
                <Chip 
                  label={file.type.charAt(0).toUpperCase() + file.type.slice(1)} 
                  color={getEntityTypeColor(file.type) as any}
                  size="small"
                />
              </Paper>
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
} 