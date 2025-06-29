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
import { Client, Worker, Task, RulesConfig } from '../types';
import { useTheme } from '@mui/material/styles';

interface ExportSectionProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  rules?: RulesConfig;
}

export default function ExportSection({ clients, workers, tasks, rules }: ExportSectionProps) {
  const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [selectedData, setSelectedData] = useState<('clients' | 'workers' | 'tasks')[]>(['clients']);
  const theme = useTheme();

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

  const exportAllData = () => {
    if (clients.length === 0 && workers.length === 0 && tasks.length === 0) {
      alert('No data available to export');
      return;
    }
    const workbook = XLSX.utils.book_new();
    const allData = [
      { data: clients, name: 'Clients' },
      { data: workers, name: 'Workers' },
      { data: tasks, name: 'Tasks' }
    ];
    allData.forEach(({ data, name }) => {
      if (data.length > 0) {
        const worksheet = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(workbook, worksheet, name);
      }
    });
    const timestamp = new Date().toISOString().split('T')[0];
    if (selectedFormat === 'xlsx') {
      const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `clean-sheet-all-data-${timestamp}.xlsx`);
    } else {
      // For CSV, export each sheet separately
      allData.forEach(({ data, name }) => {
        if (data.length > 0) {
          const worksheet = XLSX.utils.json_to_sheet(data);
          const csvContent = XLSX.utils.sheet_to_csv(worksheet);
          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
          saveAs(blob, `${name.toLowerCase()}-${timestamp}.csv`);
        }
      });
    }
  };

  const exportRules = () => {
    if (!rules) {
      alert('No rules available to export');
      return;
    }
    const dataString = JSON.stringify(rules, null, 2);
    const timestamp = new Date().toISOString().split('T')[0];
    const blob = new Blob([dataString], { type: 'application/json' });
    saveAs(blob, `rules-${timestamp}.json`);
  };

  return (
    <Box sx={{ maxWidth: 700, mx: 'auto', py: 4 }}>
      <Paper sx={{ p: { xs: 2, sm: 4 }, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper, textAlign: 'center' }}>
        <Typography variant="h4" sx={{ mb: 2, fontWeight: 700, letterSpacing: -1 }}>
          Export Data
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Download your cleaned data and rules for use in other systems or for backup.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3, justifyContent: 'center', mb: 3 }}>
          <FormControlLabel
            control={<Checkbox checked={selectedData.includes('clients')} onChange={() => handleDataSelection('clients')} color="primary" />}
            label={<Typography variant="body2">Clients</Typography>}
          />
          <FormControlLabel
            control={<Checkbox checked={selectedData.includes('workers')} onChange={() => handleDataSelection('workers')} color="primary" />}
            label={<Typography variant="body2">Workers</Typography>}
          />
          <FormControlLabel
            control={<Checkbox checked={selectedData.includes('tasks')} onChange={() => handleDataSelection('tasks')} color="primary" />}
            label={<Typography variant="body2">Tasks</Typography>}
          />
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'center', mb: 2 }}>
          <Button
            variant="contained"
            startIcon={<Download />}
            onClick={exportData}
            disabled={selectedData.length === 0}
          >
            Export Selected Data
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Exports include: Cleaned CSVs for Clients, Workers, Tasks, and a rules.json file.
        </Typography>
      </Paper>
    </Box>
  );
} 