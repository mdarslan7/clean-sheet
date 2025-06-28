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

interface UploadSectionProps {
  onDataUpdate: (type: 'clients' | 'workers' | 'tasks', data: any[]) => void;
}

export default function UploadSection({ onDataUpdate }: UploadSectionProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<FileData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

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
    <Box>
      <Typography variant="h4" gutterBottom>
        Upload Files
      </Typography>
      
      <Paper
        sx={{
          p: 4,
          textAlign: 'center',
          border: '2px dashed #ccc',
          borderColor: 'primary.main',
          backgroundColor: 'grey.50',
          cursor: 'pointer',
          '&:hover': {
            borderColor: 'primary.dark',
            backgroundColor: 'grey.100',
          }
        }}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          type="file"
          multiple
          accept=".xlsx,.xls,.csv"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
          id="file-upload"
        />
        <label htmlFor="file-upload">
          <Button
            component="span"
            variant="contained"
            size="large"
            startIcon={isUploading ? <CircularProgress size={20} /> : <CloudUpload />}
            disabled={isUploading}
            sx={{ mb: 2 }}
          >
            {isUploading ? 'Uploading...' : 'Choose Files or Drag & Drop'}
          </Button>
        </label>
        
        <Typography variant="body1" color="text.secondary">
          Supported formats: .xlsx, .xls, .csv
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Files will be automatically categorized as Clients, Workers, or Tasks based on column headers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Multi-sheet Excel files are supported - each sheet will be processed separately
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Data will be validated automatically after upload
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