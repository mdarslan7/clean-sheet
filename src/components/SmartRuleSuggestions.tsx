'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  CircularProgress,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  Divider,
  LinearProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Lightbulb,
  AutoFixHigh,
  CheckCircle,
  Error,
  Warning,
  Info,
  ExpandMore,
  PlayArrow,
  TrendingUp,
  Rule,
  Business,
  Undo
} from '@mui/icons-material';
import { Client, Worker, Task } from '../types';
import { RuleSuggestion, getSmartRuleSuggestions } from '../utils/smartRuleSuggestions';

interface SmartRuleSuggestionsProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onApplyRule?: (suggestion: RuleSuggestion) => void;
  onUnapplyRule?: (suggestionId: string) => void;
  appliedRules?: Set<string>;
}

export default function SmartRuleSuggestions({
  clients,
  workers,
  tasks,
  onApplyRule,
  onUnapplyRule,
  appliedRules = new Set()
}: SmartRuleSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<RuleSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load suggestions when data changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      loadSuggestions();
    }
  }, [clients, workers, tasks]);

  const loadSuggestions = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const ruleSuggestions = await getSmartRuleSuggestions(clients, workers, tasks);
      setSuggestions(ruleSuggestions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rule suggestions');
    } finally {
      setLoading(false);
    }
  };

  const handleApplyRule = (suggestion: RuleSuggestion) => {
    if (onApplyRule) {
      onApplyRule(suggestion);
    }
  };

  const handleUnapplyRule = (suggestionId: string) => {
    if (onUnapplyRule) {
      onUnapplyRule(suggestionId);
    }
  };

  const getRuleTypeIcon = (ruleType: string) => {
    switch (ruleType) {
      case 'validation':
        return <CheckCircle color="primary" />;
      case 'relationship':
        return <TrendingUp color="secondary" />;
      case 'business':
        return <Business color="success" />;
      case 'quality':
        return <AutoFixHigh color="warning" />;
      default:
        return <Rule />;
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'validation':
        return 'primary';
      case 'relationship':
        return 'secondary';
      case 'business':
        return 'success';
      case 'quality':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'error':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'success';
    if (confidence >= 60) return 'warning';
    return 'error';
  };

  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.ruleType]) {
      acc[suggestion.ruleType] = [];
    }
    acc[suggestion.ruleType].push(suggestion);
    return acc;
  }, {} as Record<string, RuleSuggestion[]>);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
          <Lightbulb color="primary" />
          Smart Rule Suggestions
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI analyzes your data patterns and suggests business rules to improve data quality and efficiency
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {suggestions.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Rule Suggestions Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload some data to get AI-powered rule suggestions based on your patterns.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {/* Summary */}
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="h6">
                Found {suggestions.length} Rule Suggestions
              </Typography>
              <Chip 
                label={`${appliedRules.size} Applied`} 
                color="success" 
                variant="outlined"
              />
            </Box>
          </Paper>

          {/* Grouped Suggestions */}
          {Object.entries(groupedSuggestions).map(([ruleType, ruleSuggestions]) => (
            <Accordion key={ruleType} defaultExpanded sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                  {getRuleTypeIcon(ruleType)}
                  <Typography variant="h6">
                    {ruleType.charAt(0).toUpperCase() + ruleType.slice(1)} Rules
                  </Typography>
                  <Chip 
                    label={ruleSuggestions.length} 
                    color={getRuleTypeColor(ruleType) as any}
                    size="small"
                  />
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {ruleSuggestions.map((suggestion) => (
                    <Card key={suggestion.id} sx={{ border: 1, borderColor: 'divider' }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                              {suggestion.title}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {suggestion.description}
                            </Typography>
                            
                            <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                              <Chip 
                                label={suggestion.entityType} 
                                size="small" 
                                variant="outlined"
                              />
                              <Chip 
                                label={`${suggestion.confidence}% confidence`}
                                color={getConfidenceColor(suggestion.confidence) as any}
                                size="small"
                              />
                              <Chip 
                                icon={getSeverityIcon(suggestion.suggestedRule.severity)}
                                label={suggestion.suggestedRule.severity}
                                size="small"
                                color={suggestion.suggestedRule.severity === 'error' ? 'error' : 
                                       suggestion.suggestedRule.severity === 'warning' ? 'warning' : 'info'}
                              />
                            </Box>

                            <Typography variant="subtitle2" gutterBottom>
                              Reasoning:
                            </Typography>
                            <Typography variant="body2" sx={{ mb: 2 }}>
                              {suggestion.reasoning}
                            </Typography>

                            {suggestion.examples.length > 0 && (
                              <>
                                <Typography variant="subtitle2" gutterBottom>
                                  Examples:
                                </Typography>
                                <List dense>
                                  {suggestion.examples.map((example, index) => (
                                    <ListItem key={index} sx={{ py: 0 }}>
                                      <ListItemText 
                                        primary={example}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                      />
                                    </ListItem>
                                  ))}
                                </List>
                              </>
                            )}
                          </Box>
                        </Box>

                        <LinearProgress 
                          variant="determinate" 
                          value={suggestion.confidence}
                          color={getConfidenceColor(suggestion.confidence) as any}
                          sx={{ height: 6, borderRadius: 3, mb: 2 }}
                        />
                      </CardContent>
                      
                      <CardActions>
                        {appliedRules.has(suggestion.id) ? (
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <Chip 
                              icon={<CheckCircle />}
                              label="Applied" 
                              color="success" 
                              variant="outlined"
                            />
                            <Button
                              variant="outlined"
                              color="warning"
                              startIcon={<Undo />}
                              onClick={() => handleUnapplyRule(suggestion.id)}
                              size="small"
                            >
                              Unapply
                            </Button>
                          </Box>
                        ) : (
                          <Button
                            variant="contained"
                            startIcon={<PlayArrow />}
                            onClick={() => handleApplyRule(suggestion)}
                            disabled={!onApplyRule}
                          >
                            Apply Rule
                          </Button>
                        )}
                      </CardActions>
                    </Card>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      )}
    </Box>
  );
} 