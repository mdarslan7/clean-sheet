import { Client, Worker, Task } from '../types';
import { BusinessRule, CoRunRule, SlotRestrictionRule, LoadLimitRule, PhaseWindowRule } from '../types';

export interface RuleSuggestion {
  id: string;
  title: string;
  description: string;
  ruleType: 'validation' | 'relationship' | 'business' | 'quality';
  entityType: 'clients' | 'workers' | 'tasks' | 'cross-entity';
  suggestedRule: {
    type: string;
    conditions: any[];
    actions: any[];
    severity: 'error' | 'warning' | 'info';
  };
  confidence: number;
  reasoning: string;
  examples: string[];
}

export interface DataPattern {
  type: 'correlation' | 'frequency' | 'missing' | 'duplicate' | 'outlier';
  description: string;
  entities: string[];
  fields: string[];
  value?: any;
  frequency?: number;
}

export interface DataQualityInsight {
  id: string;
  type: 'imbalance' | 'missing' | 'duplicate' | 'outlier' | 'efficiency' | 'capacity';
  title: string;
  description: string;
  severity: 'critical' | 'warning' | 'info';
  impact: string;
  recommendation: string;
  metrics: {
    current: number;
    expected?: number;
    percentage?: number;
  };
  affectedEntities: string[];
}

// Result type for converting a suggestion
export type ConvertedRuleResult = {
  businessRule?: BusinessRule;
  validationRule?: { entity: 'clients' | 'workers' | 'tasks'; flag: string; value: boolean; description?: string };
};

// Convert a rule suggestion to a proper business rule or validation rule
export function convertSuggestionToBusinessRule(suggestion: RuleSuggestion): ConvertedRuleResult | null {
  try {
    switch (suggestion.suggestedRule.type) {
      case 'co-run':
        // Extract task IDs from the suggestion
        const taskIds = extractTaskIdsFromSuggestion(suggestion);
        if (taskIds.length >= 2) {
          const coRunRule: CoRunRule = {
            id: `applied-${suggestion.id}`,
            type: 'co-run',
            taskIDs: taskIds,
            description: suggestion.description
          };
          return { businessRule: coRunRule };
        }
        break;

      case 'required-field':
        // Try to extract the field name from the suggestion
        const field = suggestion.suggestedRule.conditions?.[0]?.field;
        if (field) {
          // Use a flag like validate<FieldName> (e.g., validateAttributesJSON)
          const flag = `validate${field.charAt(0).toUpperCase()}${field.slice(1)}`;
          return {
            validationRule: {
              entity: suggestion.entityType,
              flag,
              value: true,
              description: suggestion.description
            }
          };
        }
        break;

      case 'priority-due-date':
        // For business logic rules, we'll create a custom business rule
        // This would need to be handled differently in the business rules system
        return null;

      default:
        return null;
    }
  } catch (error) {
    console.error('Error converting suggestion to business/validation rule:', error);
    return null;
  }
  
  return null;
}

// Extract task IDs from a suggestion
function extractTaskIdsFromSuggestion(suggestion: RuleSuggestion): string[] {
  const taskIds: string[] = [];
  
  // Try to extract from examples
  suggestion.examples.forEach(example => {
    const matches = example.match(/T\d+/g);
    if (matches) {
      taskIds.push(...matches);
    }
  });
  
  // Try to extract from title
  const titleMatches = suggestion.title.match(/T\d+/g);
  if (titleMatches) {
    taskIds.push(...titleMatches);
  }
  
  // Try to extract from description
  const descMatches = suggestion.description.match(/T\d+/g);
  if (descMatches) {
    taskIds.push(...descMatches);
  }
  
  // Remove duplicates and return
  return [...new Set(taskIds)];
}

// Analyze data patterns to find correlations and relationships
export function analyzeDataPatterns(clients: Client[], workers: Worker[], tasks: Task[]): DataPattern[] {
  const patterns: DataPattern[] = [];

  // Analyze task dependencies and co-occurrence
  const taskDependencies = new Map<string, Set<string>>();
  const taskCoOccurrence = new Map<string, Map<string, number>>();

  tasks.forEach(task => {
    if (task.Dependencies) {
      const deps = Array.isArray(task.Dependencies) 
        ? task.Dependencies 
        : String(task.Dependencies).split(',').map(d => d.trim()).filter(d => d);
      
      deps.forEach(dep => {
        if (!taskDependencies.has(dep)) {
          taskDependencies.set(dep, new Set());
        }
        taskDependencies.get(dep)!.add(task.TaskID || '');
      });
    }
  });

  // Find frequently co-requested tasks
  clients.forEach(client => {
    if (client.RequestedTaskIDs) {
      const requestedTasks = Array.isArray(client.RequestedTaskIDs)
        ? client.RequestedTaskIDs
        : String(client.RequestedTaskIDs).split(',').map(t => t.trim()).filter(t => t);
      
      for (let i = 0; i < requestedTasks.length; i++) {
        for (let j = i + 1; j < requestedTasks.length; j++) {
          const task1 = requestedTasks[i];
          const task2 = requestedTasks[j];
          const key = `${task1}-${task2}`;
          
          if (!taskCoOccurrence.has(key)) {
            taskCoOccurrence.set(key, new Map());
          }
          taskCoOccurrence.get(key)!.set(key, (taskCoOccurrence.get(key)!.get(key) || 0) + 1);
        }
      }
    }
  });

  // Find high-frequency co-occurrences
  taskCoOccurrence.forEach((counts, taskPair) => {
    const maxCount = Math.max(...counts.values());
    if (maxCount >= 2) {
      const [task1, task2] = taskPair.split('-');
      patterns.push({
        type: 'correlation',
        description: `Tasks ${task1} and ${task2} are frequently requested together (${maxCount} times)`,
        entities: ['tasks'],
        fields: ['TaskID', 'Dependencies'],
        value: { task1, task2, frequency: maxCount }
      });
    }
  });

  // Analyze missing required fields
  const missingFields = new Map<string, Set<string>>();
  
  clients.forEach(client => {
    if (!client.Email || client.Email.trim() === '') {
      if (!missingFields.has('clients')) missingFields.set('clients', new Set());
      missingFields.get('clients')!.add('Email');
    }
    if (!client.Phone || client.Phone.trim() === '') {
      if (!missingFields.has('clients')) missingFields.set('clients', new Set());
      missingFields.get('clients')!.add('Phone');
    }
  });

  workers.forEach(worker => {
    if (!worker.Email || worker.Email.trim() === '') {
      if (!missingFields.has('workers')) missingFields.set('workers', new Set());
      missingFields.get('workers')!.add('Email');
    }
    if (!worker.Skills || worker.Skills.trim() === '') {
      if (!missingFields.has('workers')) missingFields.set('workers', new Set());
      missingFields.get('workers')!.add('Skills');
    }
  });

  tasks.forEach(task => {
    if (!task.DueDate || task.DueDate.trim() === '') {
      if (!missingFields.has('tasks')) missingFields.set('tasks', new Set());
      missingFields.get('tasks')!.add('DueDate');
    }
  });

  missingFields.forEach((fields, entity) => {
    patterns.push({
      type: 'missing',
      description: `Missing ${Array.from(fields).join(', ')} in ${entity}`,
      entities: [entity],
      fields: Array.from(fields),
      frequency: 1
    });
  });

  // Analyze priority patterns
  const priorityTasks = tasks.filter(t => t.Priority === 'high');
  const lowPriorityTasks = tasks.filter(t => t.Priority === 'low');
  
  if (priorityTasks.length > 0) {
    const avgPriorityDueDate = priorityTasks
      .filter(t => t.DueDate)
      .map(t => new Date(t.DueDate).getTime())
      .reduce((sum, time) => sum + time, 0) / priorityTasks.filter(t => t.DueDate).length;
    
    const avgLowPriorityDueDate = lowPriorityTasks
      .filter(t => t.DueDate)
      .map(t => new Date(t.DueDate).getTime())
      .reduce((sum, time) => sum + time, 0) / lowPriorityTasks.filter(t => t.DueDate).length;
    
    if (avgPriorityDueDate > avgLowPriorityDueDate) {
      patterns.push({
        type: 'outlier',
        description: 'High priority tasks have later due dates than low priority tasks',
        entities: ['tasks'],
        fields: ['Priority', 'DueDate'],
        value: { avgPriorityDueDate, avgLowPriorityDueDate }
      });
    }
  }

  return patterns;
}

// Generate rule suggestions based on data patterns
export function generateRuleSuggestions(patterns: DataPattern[]): RuleSuggestion[] {
  const suggestions: RuleSuggestion[] = [];

  patterns.forEach((pattern, index) => {
    switch (pattern.type) {
      case 'correlation':
        if (pattern.value && pattern.value.task1 && pattern.value.task2) {
          suggestions.push({
            id: `correlation-${index}`,
            title: `Co-run Rule for ${pattern.value.task1} and ${pattern.value.task2}`,
            description: `These tasks are frequently requested together. Consider creating a co-run rule.`,
            ruleType: 'relationship',
            entityType: 'tasks',
            suggestedRule: {
              type: 'co-run',
              conditions: [
                { field: 'TaskID', operator: 'equals', value: pattern.value.task1 }
              ],
              actions: [
                { action: 'auto-assign', target: pattern.value.task2 }
              ],
              severity: 'info'
            },
            confidence: Math.min(90, 60 + pattern.value.frequency * 10),
            reasoning: `Found ${pattern.value.frequency} instances where these tasks were requested together, suggesting a strong correlation.`,
            examples: [`Client requested both ${pattern.value.task1} and ${pattern.value.task2}`]
          });
        }
        break;

      case 'missing':
        pattern.fields.forEach(field => {
          suggestions.push({
            id: `missing-${pattern.entities[0]}-${field}-${index}`,
            title: `Required ${field} for ${pattern.entities[0]}`,
            description: `Many ${pattern.entities[0]} are missing ${field}. Consider making this field required.`,
            ruleType: 'validation',
            entityType: pattern.entities[0] as 'clients' | 'workers' | 'tasks',
            suggestedRule: {
              type: 'required-field',
              conditions: [
                { field, operator: 'empty', value: true }
              ],
              actions: [
                { action: 'validate', message: `${field} is required` }
              ],
              severity: 'error'
            },
            confidence: 85,
            reasoning: `Found missing ${field} values in ${pattern.entities[0]} data, indicating this field should be required.`,
            examples: [`${pattern.entities[0]} without ${field} may cause issues`]
          });
        });
        break;

      case 'outlier':
        if (pattern.description.includes('priority') && pattern.description.includes('due date')) {
          suggestions.push({
            id: `priority-due-date-${index}`,
            title: 'Priority Due Date Validation',
            description: 'High priority tasks should have earlier due dates than low priority tasks.',
            ruleType: 'business',
            entityType: 'tasks',
            suggestedRule: {
              type: 'priority-due-date',
              conditions: [
                { field: 'Priority', operator: 'equals', value: 'high' },
                { field: 'DueDate', operator: 'exists', value: true }
              ],
              actions: [
                { action: 'validate', message: 'High priority tasks should have earlier due dates' }
              ],
              severity: 'warning'
            },
            confidence: 75,
            reasoning: 'High priority tasks with later due dates than low priority tasks may indicate incorrect prioritization.',
            examples: ['High priority task due in 2 weeks, low priority task due tomorrow']
          });
        }
        break;
    }
  });

  return suggestions;
}

// Get AI-powered rule suggestions
export async function getSmartRuleSuggestions(
  clients: Client[], 
  workers: Worker[], 
  tasks: Task[]
): Promise<RuleSuggestion[]> {
  try {
    // Analyze data patterns
    const patterns = analyzeDataPatterns(clients, workers, tasks);
    
    // Generate rule suggestions
    const suggestions = generateRuleSuggestions(patterns);
    
    // If we have AI available, enhance suggestions
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return await enhanceSuggestionsWithAI(suggestions, clients, workers, tasks);
    }
    
    return suggestions;
  } catch (error) {
    console.error('Error generating rule suggestions:', error);
    return [];
  }
}

// Enhance suggestions with AI analysis
async function enhanceSuggestionsWithAI(
  suggestions: RuleSuggestion[],
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): Promise<RuleSuggestion[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) return suggestions;

  try {
    const prompt = `Analyze this business data and suggest additional smart rules:

CLIENTS (${clients.length} records):
${JSON.stringify(clients.slice(0, 3), null, 2)}

WORKERS (${workers.length} records):
${JSON.stringify(workers.slice(0, 3), null, 2)}

TASKS (${tasks.length} records):
${JSON.stringify(tasks.slice(0, 3), null, 2)}

EXISTING SUGGESTIONS:
${JSON.stringify(suggestions, null, 2)}

Suggest 2-3 additional smart business rules based on data patterns. Focus on:
1. Data quality rules (required fields, format validation)
2. Business logic rules (priority relationships, capacity planning)
3. Cross-entity rules (client-worker-task relationships)

Respond with JSON array of rule suggestions in this format:
[{
  "id": "ai-suggestion-1",
  "title": "Rule Title",
  "description": "Rule description",
  "ruleType": "validation|relationship|business|quality",
  "entityType": "clients|workers|tasks|cross-entity",
  "suggestedRule": {
    "type": "rule-type",
    "conditions": [{"field": "fieldName", "operator": "equals", "value": "value"}],
    "actions": [{"action": "validate", "message": "message"}],
    "severity": "error|warning|info"
  },
  "confidence": 85,
  "reasoning": "Why this rule makes sense",
  "examples": ["Example 1", "Example 2"]
}]`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }]
        })
      }
    );

    if (response.ok) {
      const data = await response.json();
      const aiResponse = data.candidates[0].content.parts[0].text;
      
      try {
        const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const aiSuggestions = JSON.parse(jsonMatch[0]);
          return [...suggestions, ...aiSuggestions];
        }
      } catch (parseError) {
        console.error('Error parsing AI suggestions:', parseError);
      }
    }
  } catch (error) {
    console.error('Error calling AI for rule suggestions:', error);
  }

  return suggestions;
} 