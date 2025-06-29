'use client';

import { useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails, 
  Chip, 
  List, 
  ListItem, 
  ListItemText, 
  IconButton,
  Tooltip,
  Paper,
  ListItemIcon
} from '@mui/material';
import { 
  ExpandMore, 
  Error, 
  Warning, 
  Close,
  CheckCircle,
  AutoFixHigh
} from '@mui/icons-material';
import { ValidationError } from '../utils/validation';
import ErrorFixDialog from './ErrorFixDialog';
import { useTheme } from '@mui/material/styles';

interface ValidationSummaryProps {
  open: boolean;
  onClose: () => void;
  errors: ValidationError[];
  onNavigateToError?: (error: ValidationError) => void;
  onFixError?: (error: ValidationError, suggestedValue?: string) => void;
  allData: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
}

export default function ValidationSummary({ 
  open, 
  onClose, 
  errors, 
  onNavigateToError,
  onFixError,
  allData
}: ValidationSummaryProps) {
  const [selectedError, setSelectedError] = useState<ValidationError | null>(null);
  const [showErrorFixDialog, setShowErrorFixDialog] = useState(false);
  
  const errorCount = errors.filter(e => e.severity === 'error').length;
  const warningCount = errors.filter(e => e.severity === 'warning').length;
  const totalCount = errors.length;

  // Group errors by entity type
  const groupedErrors = errors.reduce((acc, error) => {
    if (!acc[error.entityType]) {
      acc[error.entityType] = [];
    }
    acc[error.entityType].push(error);
    return acc;
  }, {} as Record<string, ValidationError[]>);

  // Group by severity within each entity
  const getGroupedBySeverity = (entityErrors: ValidationError[]) => {
    const errors = entityErrors.filter(e => e.severity === 'error');
    const warnings = entityErrors.filter(e => e.severity === 'warning');
    return { errors, warnings };
  };

  const getEntityDisplayName = (entityType: string) => {
    switch (entityType) {
      case 'clients': return 'Clients';
      case 'workers': return 'Workers';
      case 'tasks': return 'Tasks';
      default: return entityType;
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? <Error color="error" /> : <Warning color="warning" />;
  };

  const getSeverityColor = (severity: 'error' | 'warning') => {
    return severity === 'error' ? 'error' : 'warning';
  };

  // Generate unique key for each error
  const getErrorKey = (error: ValidationError, index: number) => {
    return `${error.entityType}-${error.rowId}-${error.field}-${index}`;
  };

  const handleFixError = (error: ValidationError) => {
    setSelectedError(error);
    setShowErrorFixDialog(true);
  };

  const handleApplyFix = (error: ValidationError, suggestedValue: string) => {
    if (onFixError) {
      onFixError(error, suggestedValue);
    }
  };

  const getCurrentDataForError = (error: ValidationError) => {
    let data: any[] = [];
    
    switch (error.entityType) {
      case 'clients':
        data = allData.clients;
        break;
      case 'workers':
        data = allData.workers;
        break;
      case 'tasks':
        data = allData.tasks;
        break;
    }
    
    // Find the specific row data
    const rowData = data.find(row => {
      const idField = error.entityType === 'clients' ? 'ClientID' 
                   : error.entityType === 'workers' ? 'WorkerID' 
                   : 'TaskID';
      return String(row[idField]) === error.rowId;
    });
    
    return rowData || {};
  };

  const theme = useTheme();

  return (
    <>
      <Dialog 
        open={open} 
        onClose={onClose} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' }
        }}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="h6">
              Validation Summary
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              {errorCount > 0 && (
                <Chip 
                  icon={<Error />} 
                  label={`${errorCount} Errors`} 
                  color="error" 
                  size="small" 
                />
              )}
              {warningCount > 0 && (
                <Chip 
                  icon={<Warning />} 
                  label={`${warningCount} Warnings`} 
                  color="warning" 
                  size="small" 
                />
              )}
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <Close />
          </IconButton>
        </DialogTitle>

        <DialogContent>
          {totalCount === 0 ? (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center', 
              py: 4,
              gap: 2
            }}>
              <CheckCircle color="success" sx={{ fontSize: 48 }} />
              <Typography variant="h6" color="success.main">
                All data is valid!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                No validation errors or warnings found.
              </Typography>
            </Box>
          ) : (
            <Paper sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Error color="error" />
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                  Validation Issues
                </Typography>
                <Chip label={`${errors.length} Errors`} color="error" variant="outlined" size="small" />
                <Chip label={`${warningCount} Warnings`} color="warning" variant="outlined" size="small" />
              </Box>
              {Object.entries(groupedErrors).map(([entityType, entityErrors]) => {
                const { errors: entityErrorsList, warnings: entityWarningsList } = getGroupedBySeverity(entityErrors);
                if (entityErrorsList.length === 0 && entityWarningsList.length === 0) return null;
                return (
                  <Accordion key={entityType} defaultExpanded sx={{ mb: 2, borderRadius: 2, boxShadow: 'none', background: theme.palette.background.default }}>
                    <AccordionSummary expandIcon={<ExpandMore />}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>{getEntityDisplayName(entityType)}</Typography>
                        {entityErrorsList.length > 0 && <Chip label={`${entityErrorsList.length} Errors`} color="error" size="small" />}
                        {entityWarningsList.length > 0 && <Chip label={`${entityWarningsList.length} Warnings`} color="warning" size="small" />}
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <List>
                        {entityErrorsList.map((err, idx) => (
                          <ListItem key={getErrorKey(err, idx)} sx={{ color: theme.palette.error.main, fontWeight: 500 }}
                            secondaryAction={onFixError && (
                              <Tooltip title="AI Fix Suggestion">
                                <IconButton edge="end" color="primary" onClick={() => handleFixError(err)}>
                                  <AutoFixHigh />
                                </IconButton>
                              </Tooltip>
                            )}
                          >
                            <ListItemIcon sx={{ color: theme.palette.error.main }}><Error fontSize="small" /></ListItemIcon>
                            <ListItemText primary={err.message} />
                          </ListItem>
                        ))}
                        {entityWarningsList.map((warn, idx) => (
                          <ListItem key={getErrorKey(warn, idx)} sx={{ color: theme.palette.warning.main }}
                            secondaryAction={onFixError && (
                              <Tooltip title="AI Fix Suggestion">
                                <IconButton edge="end" color="primary" onClick={() => handleFixError(warn)}>
                                  <AutoFixHigh />
                                </IconButton>
                              </Tooltip>
                            )}
                          >
                            <ListItemIcon sx={{ color: theme.palette.warning.main }}><Warning fontSize="small" /></ListItemIcon>
                            <ListItemText primary={warn.message} />
                          </ListItem>
                        ))}
                      </List>
                    </AccordionDetails>
                  </Accordion>
                );
              })}
            </Paper>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={onClose}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {selectedError && (
        <ErrorFixDialog
          open={showErrorFixDialog}
          onClose={() => {
            setShowErrorFixDialog(false);
            setSelectedError(null);
          }}
          error={selectedError}
          currentData={getCurrentDataForError(selectedError)}
          allData={allData}
          onApplyFix={handleApplyFix}
        />
      )}
    </>
  );
} 