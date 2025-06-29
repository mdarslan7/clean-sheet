'use client';

import { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline, Button } from '@mui/material';
import { Upload, TableChart, Rule, Download } from '@mui/icons-material';
import UploadSection from '../components/UploadSection';
import TablesSection from '../components/TablesSection';
import RulesSection from '../components/RulesSection';
import ExportSection from '../components/ExportSection';
import { Client, Worker, Task, RulesConfig } from '../types';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const drawerWidth = 240;

type Section = 'upload' | 'tables' | 'rules' | 'export';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>('upload');
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rulesConfig, setRulesConfig] = useState<RulesConfig | null>(null);

  const handleDataUpdate = (type: 'clients' | 'workers' | 'tasks', newData: any[]) => {
    console.log(`Data update for ${type}:`, {
      count: newData.length,
      sampleData: newData[0],
      allData: newData
    });
    
    switch (type) {
      case 'clients':
        setClients(newData);
        break;
      case 'workers':
        setWorkers(newData);
        break;
      case 'tasks':
        setTasks(newData);
        break;
    }
  };

  const handleRulesChange = (rules: RulesConfig) => {
    setRulesConfig(rules);
  };

  const handleExportAll = () => {
    // Create a timestamp for the export
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    
    // Export cleaned CSVs
    if (clients.length > 0) {
      const clientsWorkbook = XLSX.utils.book_new();
      const clientsWorksheet = XLSX.utils.json_to_sheet(clients);
      XLSX.utils.book_append_sheet(clientsWorkbook, clientsWorksheet, 'Clients');
      const clientsBuffer = XLSX.write(clientsWorkbook, { bookType: 'csv', type: 'array' });
      const clientsBlob = new Blob([clientsBuffer], { type: 'text/csv;charset=utf-8' });
      saveAs(clientsBlob, `clients_cleaned_${timestamp}.csv`);
    }

    if (workers.length > 0) {
      const workersWorkbook = XLSX.utils.book_new();
      const workersWorksheet = XLSX.utils.json_to_sheet(workers);
      XLSX.utils.book_append_sheet(workersWorkbook, workersWorksheet, 'Workers');
      const workersBuffer = XLSX.write(workersWorkbook, { bookType: 'csv', type: 'array' });
      const workersBlob = new Blob([workersBuffer], { type: 'text/csv;charset=utf-8' });
      saveAs(workersBlob, `workers_cleaned_${timestamp}.csv`);
    }

    if (tasks.length > 0) {
      const tasksWorkbook = XLSX.utils.book_new();
      const tasksWorksheet = XLSX.utils.json_to_sheet(tasks);
      XLSX.utils.book_append_sheet(tasksWorkbook, tasksWorksheet, 'Tasks');
      const tasksBuffer = XLSX.write(tasksWorkbook, { bookType: 'csv', type: 'array' });
      const tasksBlob = new Blob([tasksBuffer], { type: 'text/csv;charset=utf-8' });
      saveAs(tasksBlob, `tasks_cleaned_${timestamp}.csv`);
    }

    // Export rules.json
    if (rulesConfig) {
      const rulesJson = JSON.stringify(rulesConfig, null, 2);
      const rulesBlob = new Blob([rulesJson], { type: 'application/json' });
      saveAs(rulesBlob, `rules_${timestamp}.json`);
    }
  };

  const renderSection = () => {
    switch (currentSection) {
      case 'upload':
        return <UploadSection onDataUpdate={handleDataUpdate} />;
      case 'tables':
        return <TablesSection clients={clients} workers={workers} tasks={tasks} onDataUpdate={handleDataUpdate} />;
      case 'rules':
        return <RulesSection clients={clients} workers={workers} tasks={tasks} onRulesChange={handleRulesChange} />;
      case 'export':
        return <ExportSection clients={clients} workers={workers} tasks={tasks} />;
      default:
        return <UploadSection onDataUpdate={handleDataUpdate} />;
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="h6" noWrap component="div">
            Clean Sheet - Data Management
          </Typography>
          {(clients.length > 0 || workers.length > 0 || tasks.length > 0) && (
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={handleExportAll}
              sx={{ ml: 2 }}
            >
              Export All
            </Button>
          )}
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
        }}
      >
        <Toolbar />
        <Box sx={{ overflow: 'auto' }}>
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setCurrentSection('upload')}>
                <ListItemIcon>
                  <Upload />
                </ListItemIcon>
                <ListItemText primary="Upload" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setCurrentSection('tables')}>
                <ListItemIcon>
                  <TableChart />
                </ListItemIcon>
                <ListItemText primary="Tables" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setCurrentSection('rules')}>
                <ListItemIcon>
                  <Rule />
                </ListItemIcon>
                <ListItemText primary="Rules" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton onClick={() => setCurrentSection('export')}>
                <ListItemIcon>
                  <Download />
                </ListItemIcon>
                <ListItemText primary="Export" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        {renderSection()}
      </Box>
    </Box>
  );
}
