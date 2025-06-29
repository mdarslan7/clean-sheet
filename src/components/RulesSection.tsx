'use client';

import { useState, useMemo } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Accordion, 
  AccordionSummary, 
  AccordionDetails,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Chip,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Slider,
  Grid,
  Card,
  CardContent,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Autocomplete,
  OutlinedInput
} from '@mui/material';
import { 
  ExpandMore, 
  Add, 
  Delete, 
  Edit,
  Settings,
  Business,
  Timeline,
  Group,
  Assignment
} from '@mui/icons-material';
import { 
  BusinessRule, 
  CoRunRule, 
  SlotRestrictionRule, 
  LoadLimitRule, 
  PhaseWindowRule,
  PrioritizationConfig,
  RulesConfig,
  Client,
  Worker,
  Task
} from '../types';

interface RulesSectionProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  onRulesChange?: (rules: RulesConfig) => void;
}

const defaultPrioritization: PrioritizationConfig = {
  priorityLevel: 50,
  requestedTaskFulfillment: 50,
  fairness: 50,
  efficiency: 50,
  deadlineAdherence: 50,
  skillMatch: 50,
  workloadBalance: 50
};

export default function RulesSection({ clients, workers, tasks, onRulesChange }: RulesSectionProps) {
  // Debug logging to see what data we're receiving
  console.log('RulesSection received data:', {
    clientsCount: clients.length,
    workersCount: workers.length,
    tasksCount: tasks.length,
    sampleClient: clients[0],
    sampleWorker: workers[0],
    sampleTask: tasks[0]
  });

  const [businessRules, setBusinessRules] = useState<BusinessRule[]>([]);
  const [prioritization, setPrioritization] = useState<PrioritizationConfig>(defaultPrioritization);
  const [validationRules, setValidationRules] = useState({
    clients: {
      requireUniqueID: true,
      requireName: true,
      validateEmail: false,
      validatePhone: false
    },
    workers: {
      requireUniqueID: true,
      requireName: true,
      validateEmail: false,
      requireDepartment: false
    },
    tasks: {
      requireUniqueID: true,
      requireTitle: true,
      validateClientID: false,
      validateWorkerID: false,
      validateDueDate: false
    }
  });

  const [showAddRuleDialog, setShowAddRuleDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<BusinessRule | null>(null);
  const [newRuleType, setNewRuleType] = useState<'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window'>('co-run');

  // Available options for rule building
  const availableTaskIDs = useMemo(() => {
    const taskIds = tasks.map(task => {
      // Handle all possible TaskID formats
      const taskId = task.TaskID;
      if (taskId !== undefined && taskId !== null) {
        return String(taskId);
      }
      return null;
    }).filter(Boolean);
    console.log('Available Task IDs for rules:', taskIds);
    return taskIds;
  }, [tasks]);
  
  const availableClientGroups = useMemo(() => {
    const allValues = new Set<string>();
    
    clients.forEach(client => {
      // Add all possible client identifiers
      if (client.ClientID) allValues.add(String(client.ClientID));
      if (client.Name) allValues.add(String(client.Name));
      if (client.Department) allValues.add(String(client.Department));
      if (client.Email) allValues.add(String(client.Email));
    });
    
    const allOptions = ['All Clients', ...Array.from(allValues)];
    console.log('Available Client Groups for rules:', allOptions);
    return allOptions;
  }, [clients]);
  
  const availableWorkerGroups = useMemo(() => {
    const allValues = new Set<string>();
    
    workers.forEach(worker => {
      // Add all possible worker identifiers
      if (worker.WorkerID) allValues.add(String(worker.WorkerID));
      if (worker.Name) allValues.add(String(worker.Name));
      if (worker.Department) allValues.add(String(worker.Department));
      if (worker.Position) allValues.add(String(worker.Position));
      if (worker.Email) allValues.add(String(worker.Email));
    });
    
    const allOptions = ['All Workers', ...Array.from(allValues)];
    console.log('Available Worker Groups for rules:', allOptions);
    return allOptions;
  }, [workers]);

  // Notify parent component of rules changes
  const notifyRulesChange = (newRules: Partial<RulesConfig>) => {
    const updatedRules: RulesConfig = {
      businessRules,
      prioritization,
      validationRules,
      ...newRules
    };
    onRulesChange?.(updatedRules);
  };

  const handleAddRule = (rule: BusinessRule) => {
    const updatedRules = [...businessRules, rule];
    setBusinessRules(updatedRules);
    notifyRulesChange({ businessRules: updatedRules });
    setShowAddRuleDialog(false);
    setEditingRule(null);
  };

  const handleEditRule = (rule: BusinessRule) => {
    setEditingRule(rule);
    setNewRuleType(rule.type);
    setShowAddRuleDialog(true);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = businessRules.filter(rule => rule.id !== ruleId);
    setBusinessRules(updatedRules);
    notifyRulesChange({ businessRules: updatedRules });
  };

  const handlePrioritizationChange = (field: keyof PrioritizationConfig, value: number) => {
    const updatedPrioritization = { ...prioritization, [field]: value };
    setPrioritization(updatedPrioritization);
    notifyRulesChange({ prioritization: updatedPrioritization });
  };

  const handleValidationRuleChange = (entity: 'clients' | 'workers' | 'tasks', rule: string, value: boolean) => {
    const updatedValidationRules = {
      ...validationRules,
      [entity]: {
        ...validationRules[entity],
        [rule]: value
      }
    };
    setValidationRules(updatedValidationRules);
    notifyRulesChange({ validationRules: updatedValidationRules });
  };

  const renderRuleCard = (rule: BusinessRule) => {
    const getRuleIcon = (type: string) => {
      switch (type) {
        case 'co-run': return <Assignment />;
        case 'slot-restriction': return <Group />;
        case 'load-limit': return <Timeline />;
        case 'phase-window': return <Business />;
        default: return <Settings />;
      }
    };

    const getRuleDescription = (rule: BusinessRule) => {
      switch (rule.type) {
        case 'co-run':
          return `Tasks ${rule.taskIDs.join(', ')} must run together`;
        case 'slot-restriction':
          return `${rule.groupType === 'client' ? 'Client' : 'Worker'} group "${rule.groupName}" requires minimum ${rule.minCommonSlots} common slots`;
        case 'load-limit':
          return `Worker group "${rule.workerGroup}" limited to ${rule.maxSlotsPerPhase} slots per phase`;
        case 'phase-window':
          return `Task ${rule.taskID} allowed in phases: ${rule.allowedPhases.join(', ')}`;
        default:
          return rule.description || 'Custom rule';
      }
    };

    return (
      <Card key={rule.id} sx={{ mb: 2 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getRuleIcon(rule.type)}
              <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                {rule.type.replace('-', ' ')}
              </Typography>
            </Box>
            <Box>
              <IconButton size="small" onClick={() => handleEditRule(rule)}>
                <Edit />
              </IconButton>
              <IconButton size="small" onClick={() => handleDeleteRule(rule.id)} color="error">
                <Delete />
              </IconButton>
            </Box>
          </Box>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {getRuleDescription(rule)}
          </Typography>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Rules & Configuration
      </Typography>
      
      {/* Business Rules Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6">
            Business Rules
          </Typography>
          <Button 
            variant="contained" 
            startIcon={<Add />}
            onClick={() => setShowAddRuleDialog(true)}
          >
            Add Rule
          </Button>
        </Box>
        
        {businessRules.length === 0 ? (
          <Alert severity="info">
            No business rules defined. Click "Add Rule" to create your first rule.
          </Alert>
        ) : (
          <List>
            {businessRules.map(renderRuleCard)}
          </List>
        )}
        
        {/* Data Availability Indicator */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="subtitle2" gutterBottom>
            Available Data for Rules:
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Chip 
              label={`${availableTaskIDs.length} Tasks`} 
              color={availableTaskIDs.length > 0 ? "success" : "default"}
              size="small"
            />
            <Chip 
              label={`${availableClientGroups.length - 1} Client Groups`} 
              color={availableClientGroups.length > 1 ? "success" : "default"}
              size="small"
            />
            <Chip 
              label={`${availableWorkerGroups.length - 1} Worker Groups`} 
              color={availableWorkerGroups.length > 1 ? "success" : "default"}
              size="small"
            />
          </Box>
          {availableTaskIDs.length === 0 && (
            <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
              No tasks available. Upload task data first to create task-related rules.
            </Typography>
          )}
          
          {/* Debug Information */}
          <Box sx={{ mt: 2, p: 1, bgcolor: 'white', borderRadius: 1, fontSize: '0.8rem' }}>
            <Typography variant="caption" color="text.secondary">
              Debug Info:
            </Typography>
            <Box sx={{ mt: 0.5 }}>
              <Typography variant="caption" display="block">
                Tasks: {availableTaskIDs.slice(0, 5).join(', ')}{availableTaskIDs.length > 5 ? '...' : ''}
              </Typography>
              <Typography variant="caption" display="block">
                Client Groups: {availableClientGroups.slice(1, 6).join(', ')}{availableClientGroups.length > 6 ? '...' : ''}
              </Typography>
              <Typography variant="caption" display="block">
                Worker Groups: {availableWorkerGroups.slice(1, 6).join(', ')}{availableWorkerGroups.length > 6 ? '...' : ''}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Paper>

      {/* Prioritization Section */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Prioritization Weights
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Adjust the importance of different criteria for task scheduling and resource allocation.
        </Typography>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Priority Level</Typography>
            <Slider
              value={prioritization.priorityLevel}
              onChange={(_, value) => handlePrioritizationChange('priorityLevel', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Requested Task Fulfillment</Typography>
            <Slider
              value={prioritization.requestedTaskFulfillment}
              onChange={(_, value) => handlePrioritizationChange('requestedTaskFulfillment', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Fairness</Typography>
            <Slider
              value={prioritization.fairness}
              onChange={(_, value) => handlePrioritizationChange('fairness', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Efficiency</Typography>
            <Slider
              value={prioritization.efficiency}
              onChange={(_, value) => handlePrioritizationChange('efficiency', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Deadline Adherence</Typography>
            <Slider
              value={prioritization.deadlineAdherence}
              onChange={(_, value) => handlePrioritizationChange('deadlineAdherence', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <Typography gutterBottom>Skill Match</Typography>
            <Slider
              value={prioritization.skillMatch}
              onChange={(_, value) => handlePrioritizationChange('skillMatch', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
          <Grid item xs={12}>
            <Typography gutterBottom>Workload Balance</Typography>
            <Slider
              value={prioritization.workloadBalance}
              onChange={(_, value) => handlePrioritizationChange('workloadBalance', value as number)}
              valueLabelDisplay="auto"
              marks={[
                { value: 0, label: 'Low' },
                { value: 50, label: 'Medium' },
                { value: 100, label: 'High' }
              ]}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Validation Rules Section */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Data Validation Rules
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Configure validation rules to ensure data quality and consistency across your datasets.
        </Typography>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Client Validation Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.clients.requireUniqueID}
                    onChange={(e) => handleValidationRuleChange('clients', 'requireUniqueID', e.target.checked)}
                  />
                }
                label="Require Client ID to be unique"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.clients.requireName}
                    onChange={(e) => handleValidationRuleChange('clients', 'requireName', e.target.checked)}
                  />
                }
                label="Require Name field"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.clients.validateEmail}
                    onChange={(e) => handleValidationRuleChange('clients', 'validateEmail', e.target.checked)}
                  />
                }
                label="Validate email format"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.clients.validatePhone}
                    onChange={(e) => handleValidationRuleChange('clients', 'validatePhone', e.target.checked)}
                  />
                }
                label="Validate phone number format"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Worker Validation Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.workers.requireUniqueID}
                    onChange={(e) => handleValidationRuleChange('workers', 'requireUniqueID', e.target.checked)}
                  />
                }
                label="Require Worker ID to be unique"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.workers.requireName}
                    onChange={(e) => handleValidationRuleChange('workers', 'requireName', e.target.checked)}
                  />
                }
                label="Require Name field"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.workers.validateEmail}
                    onChange={(e) => handleValidationRuleChange('workers', 'validateEmail', e.target.checked)}
                  />
                }
                label="Validate email format"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.workers.requireDepartment}
                    onChange={(e) => handleValidationRuleChange('workers', 'requireDepartment', e.target.checked)}
                  />
                }
                label="Require Department field"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
        
        <Accordion>
          <AccordionSummary expandIcon={<ExpandMore />}>
            <Typography variant="subtitle1">Task Validation Rules</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.tasks.requireUniqueID}
                    onChange={(e) => handleValidationRuleChange('tasks', 'requireUniqueID', e.target.checked)}
                  />
                }
                label="Require Task ID to be unique"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.tasks.requireTitle}
                    onChange={(e) => handleValidationRuleChange('tasks', 'requireTitle', e.target.checked)}
                  />
                }
                label="Require Title field"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.tasks.validateClientID}
                    onChange={(e) => handleValidationRuleChange('tasks', 'validateClientID', e.target.checked)}
                  />
                }
                label="Validate Client ID exists in Clients table"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.tasks.validateWorkerID}
                    onChange={(e) => handleValidationRuleChange('tasks', 'validateWorkerID', e.target.checked)}
                  />
                }
                label="Validate Worker ID exists in Workers table"
              />
              <FormControlLabel
                control={
                  <Switch 
                    checked={validationRules.tasks.validateDueDate}
                    onChange={(e) => handleValidationRuleChange('tasks', 'validateDueDate', e.target.checked)}
                  />
                }
                label="Validate Due Date format"
              />
            </Box>
          </AccordionDetails>
        </Accordion>
      </Paper>

      {/* Add/Edit Rule Dialog */}
      <AddRuleDialog
        open={showAddRuleDialog}
        onClose={() => {
          setShowAddRuleDialog(false);
          setEditingRule(null);
        }}
        onAdd={handleAddRule}
        ruleType={newRuleType}
        onRuleTypeChange={setNewRuleType}
        availableTaskIDs={availableTaskIDs}
        availableClientGroups={availableClientGroups}
        availableWorkerGroups={availableWorkerGroups}
        editingRule={editingRule}
      />
    </Box>
  );
}

// Add Rule Dialog Component
interface AddRuleDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (rule: BusinessRule) => void;
  ruleType: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window';
  onRuleTypeChange: (type: 'co-run' | 'slot-restriction' | 'load-limit' | 'phase-window') => void;
  availableTaskIDs: string[];
  availableClientGroups: string[];
  availableWorkerGroups: string[];
  editingRule: BusinessRule | null;
}

function AddRuleDialog({
  open,
  onClose,
  onAdd,
  ruleType,
  onRuleTypeChange,
  availableTaskIDs,
  availableClientGroups,
  availableWorkerGroups,
  editingRule
}: AddRuleDialogProps) {
  const [formData, setFormData] = useState<any>({});
  const [description, setDescription] = useState('');

  const handleSubmit = () => {
    const ruleId = editingRule?.id || `rule_${Date.now()}`;
    
    let newRule: BusinessRule;
    
    switch (ruleType) {
      case 'co-run':
        newRule = {
          id: ruleId,
          type: 'co-run',
          taskIDs: formData.taskIDs || [],
          description
        } as CoRunRule;
        break;
      case 'slot-restriction':
        newRule = {
          id: ruleId,
          type: 'slot-restriction',
          groupType: formData.groupType || 'client',
          groupName: formData.groupName || '',
          minCommonSlots: formData.minCommonSlots || 1,
          description
        } as SlotRestrictionRule;
        break;
      case 'load-limit':
        newRule = {
          id: ruleId,
          type: 'load-limit',
          workerGroup: formData.workerGroup || '',
          maxSlotsPerPhase: formData.maxSlotsPerPhase || 1,
          description
        } as LoadLimitRule;
        break;
      case 'phase-window':
        newRule = {
          id: ruleId,
          type: 'phase-window',
          taskID: formData.taskID || '',
          allowedPhases: formData.allowedPhases || [],
          description
        } as PhaseWindowRule;
        break;
      default:
        return;
    }
    
    onAdd(newRule);
  };

  const renderFormFields = () => {
    switch (ruleType) {
      case 'co-run':
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Select tasks that must be assigned together:
            </Typography>
            <Autocomplete
              multiple
              options={availableTaskIDs}
              value={formData.taskIDs || []}
              onChange={(_, value) => setFormData({ ...formData, taskIDs: value })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Select Task IDs"
                  placeholder={availableTaskIDs.length > 0 ? "Choose tasks that must run together" : "No tasks available"}
                  required
                  disabled={availableTaskIDs.length === 0}
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip key={key} label={option} {...chipProps} />
                  );
                })
              }
            />
            {availableTaskIDs.length === 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                Upload task data first to create co-run rules.
              </Typography>
            )}
          </Box>
        );
      
      case 'slot-restriction':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Define minimum resource requirements for groups:
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Group Type</InputLabel>
              <Select
                value={formData.groupType || 'client'}
                onChange={(e) => setFormData({ ...formData, groupType: e.target.value })}
                label="Group Type"
              >
                <MenuItem value="client">Client Group</MenuItem>
                <MenuItem value="worker">Worker Group</MenuItem>
              </Select>
            </FormControl>
            
            <FormControl fullWidth>
              <InputLabel>Group Name</InputLabel>
              <Select
                value={formData.groupName || ''}
                onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                label="Group Name"
              >
                {formData.groupType === 'client' 
                  ? availableClientGroups.map(group => (
                      <MenuItem key={group} value={group}>{group}</MenuItem>
                    ))
                  : availableWorkerGroups.map(group => (
                      <MenuItem key={group} value={group}>{group}</MenuItem>
                    ))
                }
              </Select>
            </FormControl>
            
            <TextField
              type="number"
              label="Minimum Common Slots"
              value={formData.minCommonSlots || 1}
              onChange={(e) => setFormData({ ...formData, minCommonSlots: parseInt(e.target.value) })}
              inputProps={{ min: 1 }}
              required
              helperText="Minimum number of workers/slots that must be available"
            />
          </Box>
        );
      
      case 'load-limit':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Set maximum capacity limits for worker groups:
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Worker Group</InputLabel>
              <Select
                value={formData.workerGroup || ''}
                onChange={(e) => setFormData({ ...formData, workerGroup: e.target.value })}
                label="Worker Group"
              >
                {availableWorkerGroups.map(group => (
                  <MenuItem key={group} value={group}>{group}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <TextField
              type="number"
              label="Maximum Slots Per Phase"
              value={formData.maxSlotsPerPhase || 1}
              onChange={(e) => setFormData({ ...formData, maxSlotsPerPhase: parseInt(e.target.value) })}
              inputProps={{ min: 1 }}
              required
              helperText="Maximum number of tasks this group can handle per time phase"
            />
          </Box>
        );
      
      case 'phase-window':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Define when specific tasks can be scheduled:
            </Typography>
            <FormControl fullWidth>
              <InputLabel>Task ID</InputLabel>
              <Select
                value={formData.taskID || ''}
                onChange={(e) => setFormData({ ...formData, taskID: e.target.value })}
                label="Task ID"
              >
                {availableTaskIDs.map(taskId => (
                  <MenuItem key={taskId} value={taskId}>{taskId}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Autocomplete
              multiple
              options={['Phase 1', 'Phase 2', 'Phase 3', 'Phase 4', 'Phase 5']}
              value={formData.allowedPhases || []}
              onChange={(_, value) => setFormData({ ...formData, allowedPhases: value })}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Allowed Phases"
                  placeholder="Select allowed phases"
                  required
                />
              )}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => {
                  const { key, ...chipProps } = getTagProps({ index });
                  return (
                    <Chip key={key} label={option} {...chipProps} />
                  );
                })
              }
            />
            {availableTaskIDs.length === 0 && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 1 }}>
                Upload task data first to create phase window rules.
              </Typography>
            )}
          </Box>
        );
      
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {editingRule ? 'Edit Rule' : 'Add New Rule'}
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
          <FormControl fullWidth>
            <InputLabel>Rule Type</InputLabel>
            <Select
              value={ruleType}
              onChange={(e) => onRuleTypeChange(e.target.value as any)}
              label="Rule Type"
            >
              <MenuItem value="co-run">Co-run (Tasks must run together)</MenuItem>
              <MenuItem value="slot-restriction">Slot Restriction (Group requirements)</MenuItem>
              <MenuItem value="load-limit">Load Limit (Worker capacity)</MenuItem>
              <MenuItem value="phase-window">Phase Window (Task scheduling)</MenuItem>
            </Select>
          </FormControl>
          
          {renderFormFields()}
          
          <TextField
            fullWidth
            label="Description (Optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            rows={2}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSubmit} variant="contained">
          {editingRule ? 'Update' : 'Add'} Rule
        </Button>
      </DialogActions>
    </Dialog>
  );
} 