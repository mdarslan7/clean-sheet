'use client';

import { useState } from 'react';
import { Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton, ListItemIcon, ListItemText, CssBaseline } from '@mui/material';
import { Upload, TableChart, Rule, Download } from '@mui/icons-material';
import UploadSection from '../components/UploadSection';
import TablesSection from '../components/TablesSection';
import RulesSection from '../components/RulesSection';
import ExportSection from '../components/ExportSection';
import { Client, Worker, Task } from '../types';

const drawerWidth = 240;

type Section = 'upload' | 'tables' | 'rules' | 'export';

export default function Home() {
  const [currentSection, setCurrentSection] = useState<Section>('upload');
  const [clients, setClients] = useState<Client[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);

  const handleDataUpdate = (type: 'clients' | 'workers' | 'tasks', newData: any[]) => {
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

  const renderSection = () => {
    switch (currentSection) {
      case 'upload':
        return <UploadSection onDataUpdate={handleDataUpdate} />;
      case 'tables':
        return <TablesSection clients={clients} workers={workers} tasks={tasks} onDataUpdate={handleDataUpdate} />;
      case 'rules':
        return <RulesSection />;
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
        <Toolbar>
          <Typography variant="h6" noWrap component="div">
            Clean Sheet - Data Management
          </Typography>
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
