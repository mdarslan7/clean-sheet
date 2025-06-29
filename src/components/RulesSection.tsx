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
  Assignment,
  Lightbulb
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
import { useTheme } from '@mui/material/styles';

interface RulesSectionProps {
  clients: Client[];
  workers: Worker[];
  tasks: Task[];
  validationRules: RulesConfig['validationRules'];
  onRulesChange?: (rules: RulesConfig) => void;
  aiValidationDescriptions?: Record<string, string>;
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

export default function RulesSection({ clients, workers, tasks, validationRules, onRulesChange, aiValidationDescriptions = {} }: RulesSectionProps) {
  const theme = useTheme();
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

    // Check if this rule came from an AI suggestion
    const isAISuggested = rule.id.startsWith('applied-');

    return (
      <Card key={rule.id} sx={{ mb: 2, border: isAISuggested ? 2 : 1, borderColor: isAISuggested ? 'primary.main' : 'divider' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {getRuleIcon(rule.type)}
              <Typography variant="subtitle1" sx={{ textTransform: 'capitalize' }}>
                {rule.type.replace('-', ' ')}
              </Typography>
              {isAISuggested && (
                <Chip 
                  icon={<Lightbulb />}
                  label="AI Suggested" 
                  color="primary" 
                  size="small"
                  variant="outlined"
                />
              )}
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
          {isAISuggested && rule.description && (
            <Typography variant="caption" color="primary.main" sx={{ mt: 1, display: 'block' }}>
              AI Reasoning: {rule.description}
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderValidationRule = (entity: 'clients' | 'workers' | 'tasks', rule: string, value: boolean) => {
    const isAISuggested = aiValidationDescriptions[rule];
    return (
      <ListItem key={rule} sx={{ pl: 2 }}>
        <ListItemText
          primary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{rule}</Typography>
              {isAISuggested && (
                <Chip icon={<Lightbulb />} label="AI Suggested" color="primary" size="small" variant="outlined" />
              )}
            </Box>
          }
          secondary={isAISuggested ? aiValidationDescriptions[rule] : undefined}
        />
      </ListItem>
    );
  };

  return (
    <Box sx={{ maxWidth: 1200, mx: 'auto', py: 2 }}>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 700, letterSpacing: -1 }}>
        Rules & Configuration
      </Typography>
      {/* Business Rules Section */}
      <Paper sx={{ p: { xs: 1, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Business Rules
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<Add />} 
            onClick={() => setShowAddRuleDialog(true)}
            sx={{ borderRadius: 2, fontWeight: 500 }}
          >
            Add Rule
          </Button>
        </Box>
        {businessRules.length === 0 ? (
          <Alert severity="info" sx={{ borderRadius: 2, background: theme.palette.background.default, color: theme.palette.text.secondary }}>
            No business rules defined. Click "Add Rule" to create your first rule.
          </Alert>
        ) : (
          <List sx={{ mt: 1 }}>{businessRules.map(renderRuleCard)}</List>
        )}
        {/* Data Availability Indicator */}
        <Box sx={{ mt: 2, p: 2, bgcolor: theme.palette.background.default, borderRadius: 2 }}>
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
      {/* Validation Rules Section */}
      <Paper sx={{ p: { xs: 1, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Validation Rules
        </Typography>
        <List>
          {Object.entries(validationRules).map(([entity, rules]) => (
            <Box key={entity} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ textTransform: 'capitalize', mb: 1 }}>{entity}</Typography>
              <List disablePadding>
                {Object.entries(rules).map(([rule, value]) =>
                  value ? renderValidationRule(entity as any, rule, value) : null
                )}
              </List>
            </Box>
          ))}
        </List>
      </Paper>
      {/* Prioritization Section */}
      <Paper sx={{ p: { xs: 1, sm: 3 }, mb: 3, borderRadius: 3, boxShadow: '0 1px 4px 0 rgba(0,0,0,0.03)', background: theme.palette.background.paper }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Prioritization Weights
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Adjust the importance of different criteria for task scheduling and resource allocation.
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Box>
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
              sx={{ mb: 3 }}
            />
          </Box>
          <Box>
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
              sx={{ mb: 3 }}
            />
          </Box>
          <Box>
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
              sx={{ mb: 3 }}
            />
          </Box>
          <Box>
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
              sx={{ mb: 3 }}
            />
          </Box>
          <Box>
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
              sx={{ mb: 3 }}
            />
          </Box>
          <Box>
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
              sx={{ mb: 3 }}
            />
          </Box>
          <Box>
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
              sx={{ mb: 1 }}
            />
          </Box>
        </Box>
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