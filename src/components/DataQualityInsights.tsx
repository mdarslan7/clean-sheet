'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
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
  LinearProgress,
  IconButton,
  Tooltip,
  Grid
} from '@mui/material';
import {
  Analytics,
  TrendingUp,
  TrendingDown,
  Warning,
  Error,
  Info,
  ExpandMore,
  Business,
  People,
  Assignment,
  Speed
} from '@mui/icons-material';
import { Client, Worker, Task } from '../types';
import { DataQualityInsight, getDataQualityInsights } from '../utils/dataQualityInsights';

interface DataQualityInsightsProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
}

export default function DataQualityInsights({
  clients,
  workers,
  tasks
}: DataQualityInsightsProps) {
  const [insights, setInsights] = useState<DataQualityInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load insights when data changes
  useEffect(() => {
    if (clients.length > 0 || workers.length > 0 || tasks.length > 0) {
      loadInsights();
    }
  }, [clients, workers, tasks]);

  const loadInsights = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const qualityInsights = await getDataQualityInsights(clients, workers, tasks);
      setInsights(qualityInsights);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data quality insights');
    } finally {
      setLoading(false);
    }
  };

  const getInsightTypeIcon = (type: string) => {
    switch (type) {
      case 'imbalance':
        return <TrendingDown color="error" />;
      case 'missing':
        return <Warning color="warning" />;
      case 'duplicate':
        return <Error color="error" />;
      case 'outlier':
        return <Info color="info" />;
      case 'efficiency':
        return <Speed color="success" />;
      case 'capacity':
        return <People color="secondary" />;
      default:
        return <Analytics />;
    }
  };

  const getInsightTypeColor = (type: string) => {
    switch (type) {
      case 'imbalance':
        return 'error';
      case 'missing':
        return 'warning';
      case 'duplicate':
        return 'error';
      case 'outlier':
        return 'info';
      case 'efficiency':
        return 'success';
      case 'capacity':
        return 'secondary';
      default:
        return 'default';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Error color="error" />;
      case 'warning':
        return <Warning color="warning" />;
      case 'info':
        return <Info color="info" />;
      default:
        return <Info />;
    }
  };

  const getMetricColor = (percentage: number) => {
    if (percentage > 150) return 'error';
    if (percentage > 120) return 'warning';
    if (percentage > 80) return 'success';
    return 'info';
  };

  const groupedInsights = insights.reduce((acc, insight) => {
    if (!acc[insight.severity]) {
      acc[insight.severity] = [];
    }
    acc[insight.severity].push(insight);
    return acc;
  }, {} as Record<string, DataQualityInsight[]>);

  const severityOrder = ['critical', 'warning', 'info'];

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
          <Analytics color="primary" />
          Data Quality Insights
        </Typography>
        <Typography variant="body1" color="text.secondary">
          AI analyzes your data to identify potential issues and optimization opportunities
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {insights.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>
            No Insights Available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Upload some data to get AI-powered insights about your data quality and business efficiency.
          </Typography>
        </Paper>
      ) : (
        <Box>
          {/* Summary Cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="error">
                    {insights.filter(i => i.severity === 'critical').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Critical Issues
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="warning.main">
                    {insights.filter(i => i.severity === 'warning').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Warnings
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="info.main">
                    {insights.filter(i => i.severity === 'info').length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Information
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" color="primary">
                    {insights.length}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total Insights
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          {/* Grouped Insights by Severity */}
          {severityOrder.map(severity => {
            const severityInsights = groupedInsights[severity];
            if (!severityInsights || severityInsights.length === 0) return null;

            return (
              <Accordion key={severity} defaultExpanded sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                    {getSeverityIcon(severity)}
                    <Typography variant="h6">
                      {severity.charAt(0).toUpperCase() + severity.slice(1)} Issues
                    </Typography>
                    <Chip 
                      label={severityInsights.length} 
                      color={severity === 'critical' ? 'error' : 
                             severity === 'warning' ? 'warning' : 'info'}
                      size="small"
                    />
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {severityInsights.map((insight) => (
                      <Card key={insight.id} sx={{ border: 1, borderColor: 'divider' }}>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                {getInsightTypeIcon(insight.type)}
                                <Typography variant="h6">
                                  {insight.title}
                                </Typography>
                              </Box>
                              
                              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                {insight.description}
                              </Typography>
                              
                              <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
                                <Chip 
                                  label={insight.type} 
                                  size="small" 
                                  color={getInsightTypeColor(insight.type) as any}
                                  variant="outlined"
                                />
                                {insight.affectedEntities.map(entity => (
                                  <Chip 
                                    key={entity}
                                    label={entity} 
                                    size="small" 
                                    variant="outlined"
                                  />
                                ))}
                              </Box>

                              <Typography variant="subtitle2" gutterBottom>
                                Impact:
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                {insight.impact}
                              </Typography>

                              <Typography variant="subtitle2" gutterBottom>
                                Recommendation:
                              </Typography>
                              <Typography variant="body2" sx={{ mb: 2 }}>
                                {insight.recommendation}
                              </Typography>

                              {/* Metrics */}
                              {insight.metrics && (
                                <Box sx={{ mb: 2 }}>
                                  <Typography variant="subtitle2" gutterBottom>
                                    Metrics:
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2">
                                      Current: {insight.metrics.current}
                                    </Typography>
                                    {insight.metrics.expected && (
                                      <Typography variant="body2">
                                        Expected: {insight.metrics.expected}
                                      </Typography>
                                    )}
                                    {insight.metrics.percentage && (
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <Typography variant="body2">
                                          {insight.metrics.percentage}%
                                        </Typography>
                                        <LinearProgress 
                                          variant="determinate" 
                                          value={Math.min(insight.metrics.percentage, 100)}
                                          color={getMetricColor(insight.metrics.percentage) as any}
                                          sx={{ width: 100, height: 6, borderRadius: 3 }}
                                        />
                                      </Box>
                                    )}
                                  </Box>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}
    </Box>
  );
} 