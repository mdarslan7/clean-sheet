'use client';

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
  Tooltip
} from '@mui/material';
import { 
  ExpandMore, 
  Error, 
  Warning, 
  Close,
  CheckCircle
} from '@mui/icons-material';
import { ValidationError } from '../utils/validation';

interface ValidationSummaryProps {
  open: boolean;
  onClose: () => void;
  errors: ValidationError[];
  onNavigateToError?: (error: ValidationError) => void;
  onFixError?: (error: ValidationError) => void;
}

export default function ValidationSummary({ 
  open, 
  onClose, 
  errors, 
  onNavigateToError,
  onFixError
}: ValidationSummaryProps) {
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

  return (
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
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Found {totalCount} validation issue{totalCount !== 1 ? 's' : ''} across your data.
            </Typography>

            {Object.entries(groupedErrors).map(([entityType, entityErrors]) => {
              const { errors, warnings } = getGroupedBySeverity(entityErrors);
              const entityTotal = entityErrors.length;

              return (
                <Accordion key={entityType} defaultExpanded>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Typography variant="subtitle1">
                        {getEntityDisplayName(entityType)}
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {errors.length > 0 && (
                          <Chip 
                            label={errors.length} 
                            color="error" 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                        {warnings.length > 0 && (
                          <Chip 
                            label={warnings.length} 
                            color="warning" 
                            size="small" 
                            variant="outlined"
                          />
                        )}
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {/* Errors */}
                      {errors.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="error" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Error fontSize="small" />
                            Errors ({errors.length})
                          </Typography>
                          <List dense>
                            {errors.map((error, index) => (
                              <ListItem 
                                key={getErrorKey(error, index)}
                                sx={{ 
                                  border: 1, 
                                  borderColor: 'error.light', 
                                  borderRadius: 1, 
                                  mb: 1,
                                  backgroundColor: 'error.light',
                                  '&:hover': { backgroundColor: 'error.main', color: 'white' }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" fontWeight="bold">
                                        {error.field}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        (Row: {error.rowId})
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={error.message}
                                />
                                {onFixError && (
                                  <Button 
                                    size="small" 
                                    variant="contained"
                                    color="primary"
                                    onClick={() => onFixError(error)}
                                    sx={{ ml: 1 }}
                                  >
                                    Fix
                                  </Button>
                                )}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}

                      {/* Warnings */}
                      {warnings.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" color="warning.main" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Warning fontSize="small" />
                            Warnings ({warnings.length})
                          </Typography>
                          <List dense>
                            {warnings.map((warning, index) => (
                              <ListItem 
                                key={getErrorKey(warning, index)}
                                sx={{ 
                                  border: 1, 
                                  borderColor: 'warning.light', 
                                  borderRadius: 1, 
                                  mb: 1,
                                  backgroundColor: 'warning.light',
                                  '&:hover': { backgroundColor: 'warning.main', color: 'white' }
                                }}
                              >
                                <ListItemText
                                  primary={
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" fontWeight="bold">
                                        {warning.field}
                                      </Typography>
                                      <Typography variant="body2" color="text.secondary">
                                        (Row: {warning.rowId})
                                      </Typography>
                                    </Box>
                                  }
                                  secondary={warning.message}
                                />
                                {onFixError && (
                                  <Button 
                                    size="small" 
                                    variant="contained"
                                    color="warning"
                                    onClick={() => onFixError(warning)}
                                    sx={{ ml: 1 }}
                                  >
                                    Fix
                                  </Button>
                                )}
                              </ListItem>
                            ))}
                          </List>
                        </Box>
                      )}
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
} 