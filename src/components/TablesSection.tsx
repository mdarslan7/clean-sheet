'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Tabs, 
  Tab, 
  Paper,
  Chip,
  Button,
  Badge,
  Snackbar,
  Alert
} from '@mui/material';
import { DataGrid, GridColDef, GridApi } from '@mui/x-data-grid';
import { Error, Warning } from '@mui/icons-material';
import { Client, Worker, Task } from '../types';
import { ValidationError, validateAllData, getCellClassName } from '../utils/validation';
import ValidationSummary from './ValidationSummary';
import { useTheme } from '@mui/material/styles';

interface TablesSectionProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onDataUpdate: (type: 'clients' | 'workers' | 'tasks', data: any[]) => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export default function TablesSection({ clients, workers, tasks, onDataUpdate }: TablesSectionProps) {
  const [tabValue, setTabValue] = useState(0);
  const [showValidationSummary, setShowValidationSummary] = useState(false);
  const [navigationMessage, setNavigationMessage] = useState<string | null>(null);
  const [validationTrigger, setValidationTrigger] = useState(0); // Force re-validation
  
  // Grid API references
  const clientGridRef = useRef<GridApi | null>(null);
  const workerGridRef = useRef<GridApi | null>(null);
  const taskGridRef = useRef<GridApi | null>(null);

  // Run validation on current state (including any edits)
  const validationErrors = useMemo(() => {
    console.log('Running validation on current state:', {
      clients: clients.length,
      workers: workers.length,
      tasks: tasks.length,
      validationTrigger
    });
    
    // Log sample data to see what we're validating
    if (clients.length > 0) {
      console.log('Sample client data for validation:', clients[0]);
    }
    if (workers.length > 0) {
      console.log('Sample worker data for validation:', workers[0]);
    }
    if (tasks.length > 0) {
      console.log('Sample task data for validation:', tasks[0]);
    }
    
    const result = validateAllData(clients, workers, tasks);
    console.log('Validation result:', {
      errors: result.errors.length,
      isValid: result.isValid,
      errorsList: result.errors
    });
    
    // Log the first few errors to see what's failing
    if (result.errors.length > 0) {
      console.log('First 5 validation errors:', result.errors.slice(0, 5).map(error => ({
        entityType: error.entityType,
        rowId: error.rowId,
        field: error.field,
        message: error.message,
        severity: error.severity
      })));
    }
    
    return result.errors;
  }, [clients, workers, tasks, validationTrigger]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProcessRowUpdate = (newRow: any, oldRow: any, type: 'clients' | 'workers' | 'tasks') => {
    let updatedData: any[];
    switch (type) {
      case 'clients':
        updatedData = clients.map(row =>
          row.ClientID === oldRow.ClientID ? { ...row, ...newRow } : row
        );
        onDataUpdate('clients', updatedData);
        break;
      case 'workers':
        updatedData = workers.map(row =>
          row.WorkerID === oldRow.WorkerID ? { ...row, ...newRow } : row
        );
        onDataUpdate('workers', updatedData);
        break;
      case 'tasks':
        updatedData = tasks.map(row =>
          row.TaskID === oldRow.TaskID ? { ...row, ...newRow } : row
        );
        onDataUpdate('tasks', updatedData);
        break;
    }
    setValidationTrigger(prev => prev + 1);
    return { ...oldRow, ...newRow };
  };

  const handleNavigateToError = (error: ValidationError) => {
    // Switch to the correct tab first
    const tabMap = { clients: 0, workers: 1, tasks: 2 };
    const targetTab = tabMap[error.entityType];
    if (targetTab !== undefined && targetTab !== tabValue) {
      setTabValue(targetTab);
    }

    // Wait for tab switch and grid to be ready
    setTimeout(() => {
      const gridApi = error.entityType === 'clients' ? clientGridRef.current 
                   : error.entityType === 'workers' ? workerGridRef.current 
                   : taskGridRef.current;

      if (gridApi) {
        try {
          // Get all row IDs to debug
          const allRowIds = gridApi.getAllRowIds();
          
          // Try to find the row with the prefixed ID format
          const prefixedRowId = `${error.entityType}-${error.rowId}`;
          
          // Check if the prefixed row exists
          const rowExists = allRowIds.includes(prefixedRowId);
          
          if (rowExists) {
            // Get the row node
            const rowNode = gridApi.getRowNode(prefixedRowId);
            
            if (rowNode) {
              // Scroll to the row
              gridApi.scrollToIndexes({ rowIndex: rowNode.index });
              
              // Focus on the specific cell
              gridApi.setCellFocus(prefixedRowId, error.field);
              
              // Highlight the cell briefly
              setNavigationMessage(`Navigated to ${error.entityType} - ${error.field} in row ${error.rowId}`);
            } else {
              setNavigationMessage(`Row node not found for ${prefixedRowId} in ${error.entityType}`);
            }
          } else {
            // Try to find by searching through the data
            const data = error.entityType === 'clients' ? clients 
                       : error.entityType === 'workers' ? workers 
                       : tasks;
            
            const matchingRow = data.find(row => {
              const idField = error.entityType === 'clients' ? 'ClientID' 
                           : error.entityType === 'workers' ? 'WorkerID' 
                           : 'TaskID';
              return row[idField] === error.rowId;
            });
            
            if (matchingRow) {
              const actualRowId = matchingRow.id;
              
              if (allRowIds.includes(actualRowId)) {
                const rowNode = gridApi.getRowNode(actualRowId);
                if (rowNode) {
                  gridApi.scrollToIndexes({ rowIndex: rowNode.index });
                  gridApi.setCellFocus(actualRowId, error.field);
                  setNavigationMessage(`Navigated to ${error.entityType} - ${error.field} in row ${error.rowId}`);
                } else {
                  setNavigationMessage(`Row node not found for ${actualRowId} in ${error.entityType}`);
                }
              } else {
                setNavigationMessage(`Row ID ${actualRowId} not found in ${error.entityType} grid. Available: ${allRowIds.join(', ')}`);
              }
            } else {
              // Try to find by index if we can't find by ID
              const data = error.entityType === 'clients' ? clients 
                         : error.entityType === 'workers' ? workers 
                         : tasks;
              
              // Find the row index by matching the original data
              const rowIndex = data.findIndex(row => {
                const idField = error.entityType === 'clients' ? 'ClientID' 
                             : error.entityType === 'workers' ? 'WorkerID' 
                             : 'TaskID';
                return row[idField] === error.rowId;
              });
              
              if (rowIndex !== -1) {
                // Try to navigate by index
                try {
                  gridApi.scrollToIndexes({ rowIndex });
                  // Get the actual row ID at this index
                  const rowIds = gridApi.getAllRowIds();
                  if (rowIds[rowIndex]) {
                    gridApi.setCellFocus(rowIds[rowIndex], error.field);
                    setNavigationMessage(`Navigated to ${error.entityType} - ${error.field} at row ${rowIndex + 1}`);
                  } else {
                    setNavigationMessage(`Could not find row ID at index ${rowIndex}`);
                  }
                } catch (scrollErr) {
                  console.error('Scroll error:', scrollErr);
                  setNavigationMessage(`Could not scroll to row ${rowIndex + 1} in ${error.entityType}`);
                }
              } else {
                setNavigationMessage(`Row with ${error.entityType === 'clients' ? 'ClientID' : error.entityType === 'workers' ? 'WorkerID' : 'TaskID'} ${error.rowId} not found in ${error.entityType} data`);
              }
            }
          }
        } catch (err) {
          console.error('Navigation error:', err);
          setNavigationMessage(`Could not navigate to ${error.field} in ${error.entityType}: ${err}`);
        }
      } else {
        setNavigationMessage(`Grid API not available for ${error.entityType}`);
      }
    }, 200);
  };

  const handleManualEdit = (entityType: 'clients' | 'workers' | 'tasks', rowIndex: number, field: string) => {
    const newValue = prompt(`Enter new value for ${field}:`);
    if (newValue === null) return; // User cancelled
    
    console.log('Manual edit:', { entityType, rowIndex, field, newValue });
    
    let updatedData: any[];
    switch (entityType) {
      case 'clients':
        updatedData = [...clients];
        if (updatedData[rowIndex]) {
          updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: newValue };
          onDataUpdate('clients', updatedData);
          console.log('Client manually updated:', updatedData[rowIndex]);
        }
        break;
      case 'workers':
        updatedData = [...workers];
        if (updatedData[rowIndex]) {
          updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: newValue };
          onDataUpdate('workers', updatedData);
          console.log('Worker manually updated:', updatedData[rowIndex]);
        }
        break;
      case 'tasks':
        updatedData = [...tasks];
        if (updatedData[rowIndex]) {
          updatedData[rowIndex] = { ...updatedData[rowIndex], [field]: newValue };
          onDataUpdate('tasks', updatedData);
          console.log('Task manually updated:', updatedData[rowIndex]);
        }
        break;
    }
  };

  const handleFixError = (error: ValidationError, suggestedValue?: string) => {
    console.log('Fixing error:', error, 'with suggested value:', suggestedValue);
    
    // Find the row index for this error
    let data: any[] = [];
    let entityType: 'clients' | 'workers' | 'tasks' = 'clients';
    
    switch (error.entityType) {
      case 'clients':
        data = clients;
        entityType = 'clients';
        break;
      case 'workers':
        data = workers;
        entityType = 'workers';
        break;
      case 'tasks':
        data = tasks;
        entityType = 'tasks';
        break;
    }
    
    // Find the row by ID
    const rowIndex = data.findIndex(row => {
      const idField = error.entityType === 'clients' ? 'ClientID' 
                   : error.entityType === 'workers' ? 'WorkerID' 
                   : 'TaskID';
      return String(row[idField]) === error.rowId;
    });
    
    if (rowIndex !== -1) {
      console.log(`Found row at index ${rowIndex} for ${error.entityType} ${error.rowId}`);
      
      if (suggestedValue !== undefined) {
        // Apply the AI-suggested fix
        const updatedData = [...data];
        updatedData[rowIndex] = { ...updatedData[rowIndex], [error.field]: suggestedValue };
        
        console.log(`Applied AI fix: ${error.field} = ${suggestedValue}`);
        onDataUpdate(entityType, updatedData);
        
        // Trigger re-validation
        setValidationTrigger(prev => prev + 1);
      } else {
        // Fall back to manual edit mode
        handleManualEdit(entityType, rowIndex, error.field);
      }
    } else {
      console.log(`Could not find row for ${error.entityType} ${error.rowId}`);
      alert(`Could not find the row to fix. Please check the data.`);
    }
  };

  // Dynamically generate columns based on actual data
  const generateColumns = (data: any[], entityType: 'clients' | 'workers' | 'tasks'): GridColDef[] => {
    if (data.length === 0) return [];
    
    // Get all unique column names from the data
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        if (key !== 'id') { // Exclude the id field we added
          allKeys.add(key);
        }
      });
    });
    
    // Convert to column definitions
    const columns: GridColDef[] = Array.from(allKeys).map(key => {
      // Determine column width based on content type
      let width = 150;
      if (key.toLowerCase().includes('email')) width = 250;
      if (key.toLowerCase().includes('name') || key.toLowerCase().includes('title')) width = 200;
      if (key.toLowerCase().includes('description') || key.toLowerCase().includes('address')) width = 300;
      if (key.toLowerCase().includes('id')) width = 130;
      if (key.toLowerCase().includes('phone')) width = 150;
      if (key.toLowerCase().includes('date')) width = 130;
      if (key.toLowerCase().includes('json') || key.toLowerCase().includes('slots') || key.toLowerCase().includes('phases')) width = 200;
      
      return {
        field: key,
        headerName: key,
        width: width,
        editable: true,
        flex: key.toLowerCase().includes('description') || key.toLowerCase().includes('address') ? 1 : undefined,
        cellClassName: (params) => {
          const rowId = params.row.id;
          const className = getCellClassName(key, validationErrors, rowId);
          return className;
        }
      };
    });
    
    // Sort columns to put IDs first, then common fields
    const priorityFields = ['ClientID', 'WorkerID', 'TaskID', 'Name', 'Title', 'Email', 'Phone'];
    columns.sort((a, b) => {
      const aIndex = priorityFields.indexOf(a.field);
      const bIndex = priorityFields.indexOf(b.field);
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      
      return aIndex - bIndex;
    });
    
    return columns;
  };

  const clientColumns = generateColumns(clients, 'clients');
  const workerColumns = generateColumns(workers, 'workers');
  const taskColumns = generateColumns(tasks, 'tasks');

  // Ensure each row has a unique ID for DataGrid
  const clientsWithIds = clients.map((client, index) => ({
    ...client,
    id: client.ClientID ? `client-${client.ClientID}-${index}` : `client-${index}` // Ensure unique with index
  }));

  const workersWithIds = workers.map((worker, index) => ({
    ...worker,
    id: worker.WorkerID ? `worker-${worker.WorkerID}-${index}` : `worker-${index}` // Ensure unique with index
  }));

  const tasksWithIds = tasks.map((task, index) => ({
    ...task,
    id: task.TaskID ? `task-${task.TaskID}-${index}` : `task-${index}` // Ensure unique with index
  }));

  const errorCount = validationErrors.filter(e => e.severity === 'error').length;
  const warningCount = validationErrors.filter(e => e.severity === 'warning').length;

  const theme = useTheme();

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, letterSpacing: -1 }}>
        Data Tables
      </Typography>
      <Paper sx={{ p: { xs: 1, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            Data Tables
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            {(errorCount > 0 || warningCount > 0) && (
              <Button
                variant="outlined"
                color={errorCount > 0 ? "error" : "warning"}
                startIcon={errorCount > 0 ? <Error /> : <Warning />}
                onClick={() => setShowValidationSummary(true)}
                sx={{ minWidth: 200 }}
              >
                <Badge badgeContent={errorCount + warningCount} color={errorCount > 0 ? "error" : "warning"}>
                  <span>Validation Issues</span>
                </Badge>
              </Button>
            )}
          </Box>
        </Box>
        
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="data tables">
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Clients
                  <Chip label={clients.length} size="small" color="primary" />
                  {(() => {
                    const clientErrors = validationErrors.filter(e => e.entityType === 'clients');
                    const clientErrorCount = clientErrors.filter(e => e.severity === 'error').length;
                    const clientWarningCount = clientErrors.filter(e => e.severity === 'warning').length;
                    if (clientErrorCount > 0) {
                      return <Chip label={clientErrorCount} size="small" color="error" />;
                    } else if (clientWarningCount > 0) {
                      return <Chip label={clientWarningCount} size="small" color="warning" />;
                    }
                    return null;
                  })()}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Workers
                  <Chip label={workers.length} size="small" color="secondary" />
                  {(() => {
                    const workerErrors = validationErrors.filter(e => e.entityType === 'workers');
                    const workerErrorCount = workerErrors.filter(e => e.severity === 'error').length;
                    const workerWarningCount = workerErrors.filter(e => e.severity === 'warning').length;
                    if (workerErrorCount > 0) {
                      return <Chip label={workerErrorCount} size="small" color="error" />;
                    } else if (workerWarningCount > 0) {
                      return <Chip label={workerWarningCount} size="small" color="warning" />;
                    }
                    return null;
                  })()}
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  Tasks
                  <Chip label={tasks.length} size="small" color="success" />
                  {(() => {
                    const taskErrors = validationErrors.filter(e => e.entityType === 'tasks');
                    const taskErrorCount = taskErrors.filter(e => e.severity === 'error').length;
                    const taskWarningCount = taskErrors.filter(e => e.severity === 'warning').length;
                    if (taskErrorCount > 0) {
                      return <Chip label={taskErrorCount} size="small" color="error" />;
                    } else if (taskWarningCount > 0) {
                      return <Chip label={taskWarningCount} size="small" color="warning" />;
                    }
                    return null;
                  })()}
                </Box>
              } 
            />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ height: 400, width: '100%' }}>
            {clients.length > 0 ? (
              <DataGrid
                rows={clientsWithIds}
                columns={clientColumns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                disableRowSelectionOnClick
                editMode="cell"
                onGridReady={(params) => {
                  clientGridRef.current = params.api;
                  console.log('Client grid API captured:', params.api);
                }}
                processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'clients')}
                sx={{
                  background: theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '& .MuiDataGrid-row:hover': {
                    background: '#f3f4f6',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  '& .MuiDataGrid-cell--error': {
                    background: '#fef2f2',
                    color: theme.palette.error.main,
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    background: '#f7f8fa',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: theme.palette.text.primary,
                  },
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No client data available. Upload a file with client data to see it here.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ height: 400, width: '100%' }}>
            {workers.length > 0 ? (
              <DataGrid
                rows={workersWithIds}
                columns={workerColumns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                disableRowSelectionOnClick
                editMode="cell"
                onGridReady={(params) => {
                  workerGridRef.current = params.api;
                  console.log('Worker grid API captured:', params.api);
                }}
                processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'workers')}
                sx={{
                  background: theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '& .MuiDataGrid-row:hover': {
                    background: '#f3f4f6',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  '& .MuiDataGrid-cell--error': {
                    background: '#fef2f2',
                    color: theme.palette.error.main,
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    background: '#f7f8fa',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: theme.palette.text.primary,
                  },
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No worker data available. Upload a file with worker data to see it here.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ height: 400, width: '100%' }}>
            {tasks.length > 0 ? (
              <DataGrid
                rows={tasksWithIds}
                columns={taskColumns}
                pageSizeOptions={[5, 10, 25]}
                initialState={{
                  pagination: {
                    paginationModel: { page: 0, pageSize: 10 },
                  },
                }}
                disableRowSelectionOnClick
                editMode="cell"
                onGridReady={(params) => {
                  taskGridRef.current = params.api;
                  console.log('Task grid API captured:', params.api);
                }}
                processRowUpdate={(newRow, oldRow) => handleProcessRowUpdate(newRow, oldRow, 'tasks')}
                sx={{
                  background: theme.palette.background.paper,
                  borderRadius: 2,
                  boxShadow: 'none',
                  '& .MuiDataGrid-row:hover': {
                    background: '#f3f4f6',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: `1px solid ${theme.palette.divider}`,
                  },
                  '& .MuiDataGrid-cell--error': {
                    background: '#fef2f2',
                    color: theme.palette.error.main,
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    background: '#f7f8fa',
                    fontWeight: 600,
                    fontSize: '1rem',
                    color: theme.palette.text.primary,
                  },
                }}
              />
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No task data available. Upload a file with task data to see it here.
                </Typography>
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      <ValidationSummary
        open={showValidationSummary}
        onClose={() => setShowValidationSummary(false)}
        errors={validationErrors}
        onNavigateToError={handleNavigateToError}
        onFixError={handleFixError}
        allData={{
          clients,
          workers,
          tasks
        }}
      />

      <Snackbar
        open={!!navigationMessage}
        autoHideDuration={3000}
        onClose={() => setNavigationMessage(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setNavigationMessage(null)} 
          severity="info" 
          sx={{ width: '100%' }}
        >
          {navigationMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
} 