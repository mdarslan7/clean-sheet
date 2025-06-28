'use client';

import { useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Button, 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem,
  Checkbox,
  FormControlLabel,
  Chip,
  Stack,
  Alert
} from '@mui/material';
import { Download, FileDownload } from '@mui/icons-material';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { Client, Worker, Task } from '../types';

interface ExportSectionProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}

export default function ExportSection({ clients, workers, tasks }: ExportSectionProps) {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedData, setSelectedData] = useState<('clients' | 'workers' | 'tasks')[]>(['clients']);

  const handleDataSelection = (dataType: 'clients' | 'workers' | 'tasks') => {
    setSelectedData(prev => 
      prev.includes(dataType) 
        ? prev.filter(item => item !== dataType)
        : [...prev, dataType]
    );
  };

  const exportData = () => {
    if (selectedData.length === 0) {
      alert('Please select at least one dataset to export');
      return;
    }

    const workbook = XLSX.utils.book_new();

    // Add each selected dataset as a separate sheet
    selectedData.forEach(dataType => {
      let data: any[] = [];
      let sheetName = '';

      switch (dataType) {
        case 'clients':
          data = clients;
          sheetName = 'Clients';
          break;
        case 'workers':
          data = workers;
          sheetName = 'Workers';
          break;
        case 'tasks':
          data = tasks;
          sheetName = 'Tasks';
          break;
      }

      if (data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }
    });

    // Generate filename
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `clean-sheet-export-${timestamp}.${selectedFormat}`;

    // Export based on format
    if (selectedFormat === 'xlsx') {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, filename);
    } else {
      // For CSV, export each sheet separately
      selectedData.forEach(dataType => {
        let data: any[] = [];
        let sheetName = '';

        switch (dataType) {
          case 'clients':
            data = clients;
            sheetName = 'clients';
            break;
          case 'workers':
            data = workers;
            sheetName = 'workers';
            break;
          case 'tasks':
            data = tasks;
            sheetName = 'tasks';
            break;
        }

        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          saveAs(blob, `${sheetName}-${timestamp}.csv`);
        }
      });
    }
  };

  const exportAllAsOne = () => {
    if (clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      alert('No data available to export');
      return;
    }

    const allData = {
      clients,
      workers,
      tasks
    };

    const dataString = JSON.stringify(allData, null, 2);
    const blob = new Blob([dataString], { type: 'application/json' });
    const timestamp = new Date().toISOString().split('T')[0];
    saveAs(blob, `clean-sheet-all-data-${timestamp}.json`);
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Export Data
      </Typography>
      
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Export Options
        </Typography>
        
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Format Selection */}
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Export Format</InputLabel>
            <Select
              value={selectedFormat}
              label="Export Format"
              onChange={(e) => setSelectedFormat(e.target.value as 'xlsx' | 'csv')}
            >
              <MenuItem value="xlsx">Excel (.xlsx)</MenuItem>
              <MenuItem value="csv">CSV (.csv)</MenuItem>
            </Select>
          </FormControl>

          {/* Data Selection */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Select Data to Export
            </Typography>
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.includes('clients')}
                    onChange={() => handleDataSelection('clients')}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Clients
                    <Chip label={clients.length} size="small" color="primary" />
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.includes('workers')}
                    onChange={() => handleDataSelection('workers')}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Workers
                    <Chip label={workers.length} size="small" color="secondary" />
                  </Box>
                }
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedData.includes('tasks')}
                    onChange={() => handleDataSelection('tasks')}
                  />
                }
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    Tasks
                    <Chip label={tasks.length} size="small" color="success" />
                  </Box>
                }
              />
            </Stack>
          </Box>

          {/* Export Buttons */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Button
              variant="contained"
              startIcon={<Download />}
              onClick={exportData}
              disabled={selectedData.length === 0}
            >
              Export Selected Data
            </Button>
            <Button
              variant="outlined"
              startIcon={<FileDownload />}
              onClick={exportAllAsOne}
              disabled={clients.length === 0 && workers.length === 0 && tasks.length === 0}
            >
              Export All as JSON
            </Button>
          </Box>

          {/* Info */}
          <Alert severity="info">
            <Typography variant="body2">
              {selectedFormat === 'xlsx' 
                ? 'Excel files will contain all selected datasets as separate sheets in a single file.'
                : 'CSV files will be exported as separate files for each selected dataset.'
              }
            </Typography>
          </Alert>

          {/* Data Summary */}
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Data Summary
            </Typography>
            <Stack direction="row" spacing={2}>
              <Chip 
                label={`${clients.length} Clients`} 
                color="primary" 
                variant="outlined" 
              />
              <Chip 
                label={`${workers.length} Workers`} 
                color="secondary" 
                variant="outlined" 
              />
              <Chip 
                label={`${tasks.length} Tasks`} 
                color="success" 
                variant="outlined" 
              />
            </Stack>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
} 