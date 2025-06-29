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
  CircularProgress,
  Alert,
  Chip,
  LinearProgress
} from '@mui/material';
import { 
  AutoFixHigh, 
  CheckCircle, 
  Error as ErrorIcon,
  Warning as WarningIcon
} from '@mui/icons-material';
import { ValidationError } from '../utils/validation';
import { AIErrorFix, getErrorFixSuggestion } from '../utils/aiService';

interface ErrorFixDialogProps {
  open: boolean;
  onClose: () => void;
  error: ValidationError;
  currentData: any;
  allData: {
    clients: any[];
    workers: any[];
    tasks: any[];
  };
  onApplyFix: (error: ValidationError, suggestedValue: string) => void;
}

export default function ErrorFixDialog({
  open,
  onClose,
  error,
  currentData,
  allData,
  onApplyFix
}: ErrorFixDialogProps) {
  const [aiSuggestion, setAiSuggestion] = useState<AIErrorFix | null>(null);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const handleGetSuggestion = async () => {
    setLoading(true);
    setApiError(null);
    
    try {
      const suggestion = await getErrorFixSuggestion({
        error,
        currentData,
        allData
      });
      setAiSuggestion(suggestion);
    } catch (err) {
      setApiError(err instanceof Error ? err.message : 'Failed to get AI suggestion');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFix = () => {
    if (aiSuggestion) {
      onApplyFix(error, aiSuggestion.suggestedValue);
      onClose();
    }
  };

  const getSeverityIcon = (severity: 'error' | 'warning') => {
    return severity === 'error' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <AutoFixHigh color="primary" />
        <Typography variant="h6">
          AI Error Fix Suggestion
        </Typography>
      </DialogTitle>

      <DialogContent>
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" gutterBottom>
            Validation Error Details
          </Typography>
          <Box sx={{ 
            p: 2, 
            border: 1, 
            borderColor: error.severity === 'error' ? 'error.light' : 'warning.light',
            borderRadius: 1,
            backgroundColor: error.severity === 'error' ? 'error.light' : 'warning.light'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
              {getSeverityIcon(error.severity)}
              <Typography variant="body2" fontWeight="bold">
                {error.field} (Row: {error.rowId})
              </Typography>
            </Box>
            <Typography variant="body2">
              {error.message}
            </Typography>
          </Box>
        </Box>

        {apiError && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {apiError}
          </Alert>
        )}

        {!aiSuggestion && !loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <Typography variant="body1" gutterBottom>
              Get AI-powered suggestions to fix this validation error
            </Typography>
            <Button
              variant="contained"
              startIcon={<AutoFixHigh />}
              onClick={handleGetSuggestion}
              sx={{ mt: 2 }}
            >
              Get AI Suggestion
            </Button>
          </Box>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', py: 3 }}>
            <CircularProgress sx={{ mb: 2 }} />
            <Typography variant="body2" color="text.secondary">
              Analyzing error and generating suggestion...
            </Typography>
          </Box>
        )}

        {aiSuggestion && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              AI Suggestion
            </Typography>
            
            <Box sx={{ 
              p: 2, 
              border: 1, 
              borderColor: 'primary.light',
              borderRadius: 1,
              backgroundColor: 'primary.light'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="body1" fontWeight="bold">
                  Suggested Value:
                </Typography>
                <Chip 
                  label={aiSuggestion.suggestedValue} 
                  color="primary" 
                  variant="outlined"
                />
                <Chip 
                  label={`${aiSuggestion.confidence}% confidence`}
                  color={getConfidenceColor(aiSuggestion.confidence)}
                  size="small"
                />
              </Box>
              
              <Typography variant="body2" gutterBottom>
                <strong>Explanation:</strong>
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {aiSuggestion.explanation}
              </Typography>
              
              <LinearProgress 
                variant="determinate" 
                value={aiSuggestion.confidence}
                color={getConfidenceColor(aiSuggestion.confidence)}
                sx={{ height: 8, borderRadius: 4 }}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>
          Cancel
        </Button>
        {aiSuggestion && (
          <Button
            variant="contained"
            startIcon={<CheckCircle />}
            onClick={handleApplyFix}
            disabled={aiSuggestion.confidence < 30}
          >
            Apply Fix
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
} 