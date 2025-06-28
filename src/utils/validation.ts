import { Client, Worker, Task } from '../types';

export interface ValidationError {
  entityType: 'clients' | 'workers' | 'tasks';
  rowId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  errors: ValidationError[];
  isValid: boolean;
}

// Helper function to safely get string value
function getStringValue(value: any): string {
  if (value === null || value === undefined) return '';
  return String(value).trim();
}

// Helper function to safely parse JSON
function safeJsonParse(value: any): any {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

// Helper function to validate array structure
function validateArrayStructure(arr: any[], expectedType: 'object' | 'number' | 'string', validator?: (item: any) => boolean): boolean {
  if (!Array.isArray(arr)) return false;
  return arr.every(item => {
    if (expectedType === 'object') {
      return typeof item === 'object' && item !== null;
    } else if (expectedType === 'number') {
      return typeof item === 'number';
    } else if (expectedType === 'string') {
      return typeof item === 'string';
    }
    return validator ? validator(item) : true;
  });
}

// Helper function to check for circular dependencies
function detectCircularDependencies(tasks: Task[]): string[][] {
  const graph = new Map<string, string[]>();
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  const cycles: string[][] = [];

  // Build dependency graph
  tasks.forEach(task => {
    if (task.TaskID && task.Dependencies) {
      const dependencies = Array.isArray(task.Dependencies) 
        ? task.Dependencies 
        : getStringValue(task.Dependencies).split(',').map(d => d.trim()).filter(d => d);
      graph.set(task.TaskID, dependencies);
    } else {
      graph.set(task.TaskID || '', []);
    }
  });

  function dfs(node: string, path: string[]): void {
    if (recursionStack.has(node)) {
      const cycleStart = path.indexOf(node);
      cycles.push(path.slice(cycleStart));
      return;
    }
    
    if (visited.has(node)) return;
    
    visited.add(node);
    recursionStack.add(node);
    path.push(node);
    
    const neighbors = graph.get(node) || [];
    neighbors.forEach(neighbor => {
      if (graph.has(neighbor)) {
        dfs(neighbor, [...path]);
      }
    });
    
    recursionStack.delete(node);
  }

  graph.forEach((_, node) => {
    if (!visited.has(node)) {
      dfs(node, []);
    }
  });

  return cycles;
}

// Client Validation Functions
export function validateClient(client: Client, allTasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const clientId = getStringValue(client.ClientID);

  // Check missing required columns
  const name = getStringValue(client.Name);
  if (!name) {
    errors.push({
      entityType: 'clients',
      rowId: clientId,
      field: 'Name',
      message: 'Name is required',
      severity: 'error'
    });
  }

  // Check duplicate ClientIDs (this will be handled at the data level)
  if (!clientId) {
    errors.push({
      entityType: 'clients',
      rowId: clientId,
      field: 'ClientID',
      message: 'ClientID is required',
      severity: 'error'
    });
  }

  // Check invalid JSON in AttributesJSON
  if (client.AttributesJSON) {
    const parsed = safeJsonParse(client.AttributesJSON);
    if (parsed === null) {
      errors.push({
        entityType: 'clients',
        rowId: clientId,
        field: 'AttributesJSON',
        message: 'Invalid JSON format',
        severity: 'error'
      });
    } else if (typeof parsed !== 'object') {
      errors.push({
        entityType: 'clients',
        rowId: clientId,
        field: 'AttributesJSON',
        message: 'AttributesJSON must be a JSON object',
        severity: 'error'
      });
    }
  }

  // Check missing RequestedTaskIDs from tasks
  if (client.RequestedTaskIDs) {
    const requestedTaskIds = Array.isArray(client.RequestedTaskIDs) 
      ? client.RequestedTaskIDs 
      : getStringValue(client.RequestedTaskIDs).split(',').map(id => id.trim()).filter(id => id);
    
    const existingTaskIds = new Set(allTasks.map(task => task.TaskID).filter(Boolean));
    const missingTaskIds = requestedTaskIds.filter(taskId => !existingTaskIds.has(taskId));
    
    if (missingTaskIds.length > 0) {
      errors.push({
        entityType: 'clients',
        rowId: clientId,
        field: 'RequestedTaskIDs',
        message: `Referenced tasks not found: ${missingTaskIds.join(', ')}`,
        severity: 'warning'
      });
    }
  }

  return errors;
}

// Worker Validation Functions
export function validateWorker(worker: Worker): ValidationError[] {
  const errors: ValidationError[] = [];
  const workerId = getStringValue(worker.WorkerID);

  // Check duplicate WorkerIDs (this will be handled at the data level)
  if (!workerId) {
    errors.push({
      entityType: 'workers',
      rowId: workerId,
      field: 'WorkerID',
      message: 'WorkerID is required',
      severity: 'error'
    });
  }

  // Check malformed AvailableSlots array
  if (worker.AvailableSlots) {
    const slots = Array.isArray(worker.AvailableSlots) 
      ? worker.AvailableSlots 
      : safeJsonParse(worker.AvailableSlots);
    
    if (!validateArrayStructure(slots, 'object', (slot) => 
      typeof slot === 'object' && slot !== null && 
      typeof slot.start === 'string' && typeof slot.end === 'string'
    )) {
      errors.push({
        entityType: 'workers',
        rowId: workerId,
        field: 'AvailableSlots',
        message: 'AvailableSlots must be an array of objects with start/end properties',
        severity: 'error'
      });
    } else {
      // Check slot count vs MaxLoadPerPhase
      const maxLoad = Number(worker.MaxLoadPerPhase);
      if (!isNaN(maxLoad) && maxLoad > 0 && slots.length < maxLoad) {
        errors.push({
          entityType: 'workers',
          rowId: workerId,
          field: 'AvailableSlots',
          message: `Worker has ${slots.length} slots but MaxLoadPerPhase is ${maxLoad} (potential overload)`,
          severity: 'warning'
        });
      }
    }
  }

  // Check MaxLoadPerPhase non-integer or ≤ 0
  if (worker.MaxLoadPerPhase !== undefined && worker.MaxLoadPerPhase !== null) {
    const maxLoad = Number(worker.MaxLoadPerPhase);
    if (isNaN(maxLoad) || !Number.isInteger(maxLoad) || maxLoad <= 0) {
      errors.push({
        entityType: 'workers',
        rowId: workerId,
        field: 'MaxLoadPerPhase',
        message: 'MaxLoadPerPhase must be a positive integer',
        severity: 'error'
      });
    }
  }

  // Check missing required Skills
  const skills = getStringValue(worker.Skills);
  if (!skills) {
    errors.push({
      entityType: 'workers',
      rowId: workerId,
      field: 'Skills',
      message: 'Skills are required',
      severity: 'error'
    });
  }

  return errors;
}

// Task Validation Functions
export function validateTask(task: Task, allWorkers: Worker[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const taskId = getStringValue(task.TaskID);

  // Check invalid Duration (<1)
  if (task.Duration !== undefined && task.Duration !== null) {
    const duration = Number(task.Duration);
    if (isNaN(duration) || duration < 1) {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'Duration',
        message: 'Duration must be at least 1',
        severity: 'error'
      });
    }
  }

  // Check PriorityLevel range (if present)
  if (task.PriorityLevel !== undefined && task.PriorityLevel !== null) {
    const priority = Number(task.PriorityLevel);
    if (isNaN(priority) || priority < 1 || priority > 5) {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'PriorityLevel',
        message: 'PriorityLevel must be between 1 and 5',
        severity: 'error'
      });
    }
  }

  // Check malformed PreferredPhases list or range
  if (task.PreferredPhases) {
    const phases = Array.isArray(task.PreferredPhases) 
      ? task.PreferredPhases 
      : safeJsonParse(task.PreferredPhases);
    
    if (!validateArrayStructure(phases, 'number')) {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'PreferredPhases',
        message: 'PreferredPhases must be an array of numbers',
        severity: 'error'
      });
    }
  }

  // Check RequiredSkills not matched by any worker
  if (task.RequiredSkills) {
    const requiredSkills = Array.isArray(task.RequiredSkills) 
      ? task.RequiredSkills 
      : getStringValue(task.RequiredSkills).split(',').map(skill => skill.trim()).filter(skill => skill);
    
    const allWorkerSkills = new Set<string>();
    allWorkers.forEach(worker => {
      if (worker.Skills) {
        const workerSkills = Array.isArray(worker.Skills) 
          ? worker.Skills 
          : getStringValue(worker.Skills).split(',').map(skill => skill.trim()).filter(skill => skill);
        workerSkills.forEach(skill => allWorkerSkills.add(skill));
      }
    });
    
    const unmatchedSkills = requiredSkills.filter(skill => !allWorkerSkills.has(skill));
    if (unmatchedSkills.length > 0) {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'RequiredSkills',
        message: `No worker has skills: ${unmatchedSkills.join(', ')}`,
        severity: 'warning'
      });
    }

    // Check MaxConcurrent feasibility
    const qualifiedWorkers = allWorkers.filter(worker => {
      if (!worker.Skills) return false;
      const workerSkills = Array.isArray(worker.Skills) 
        ? worker.Skills 
        : getStringValue(worker.Skills).split(',').map(skill => skill.trim()).filter(skill => skill);
      return requiredSkills.every(skill => workerSkills.includes(skill));
    });

    if (qualifiedWorkers.length === 0) {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'RequiredSkills',
        message: 'No workers match all required skills',
        severity: 'error'
      });
    } else if (task.MaxConcurrent !== undefined && task.MaxConcurrent !== null) {
      const maxConcurrent = Number(task.MaxConcurrent);
      if (!isNaN(maxConcurrent) && maxConcurrent > qualifiedWorkers.length) {
        errors.push({
          entityType: 'tasks',
          rowId: taskId,
          field: 'MaxConcurrent',
          message: `MaxConcurrent (${maxConcurrent}) exceeds qualified workers (${qualifiedWorkers.length})`,
          severity: 'warning'
        });
      }
    }
  }

  // Check MaxConcurrent ≤ 0
  if (task.MaxConcurrent !== undefined && task.MaxConcurrent !== null) {
    const maxConcurrent = Number(task.MaxConcurrent);
    if (isNaN(maxConcurrent) || maxConcurrent <= 0) {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'MaxConcurrent',
        message: 'MaxConcurrent must be greater than 0',
        severity: 'error'
      });
    }
  }

  return errors;
}

// Cross-entity validation
export function validateDuplicateIds(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check duplicate ClientIDs
  const clientIds = new Map<string, string[]>();
  clients.forEach((client, index) => {
    const id = getStringValue(client.ClientID);
    if (id) {
      if (!clientIds.has(id)) {
        clientIds.set(id, []);
      }
      clientIds.get(id)!.push(`Row ${index + 1}`);
    }
  });

  clientIds.forEach((rows, id) => {
    if (rows.length > 1) {
      errors.push({
        entityType: 'clients',
        rowId: id,
        field: 'ClientID',
        message: `Duplicate ClientID found in rows: ${rows.join(', ')}`,
        severity: 'error'
      });
    }
  });

  // Check duplicate WorkerIDs
  const workerIds = new Map<string, string[]>();
  workers.forEach((worker, index) => {
    const id = getStringValue(worker.WorkerID);
    if (id) {
      if (!workerIds.has(id)) {
        workerIds.set(id, []);
      }
      workerIds.get(id)!.push(`Row ${index + 1}`);
    }
  });

  workerIds.forEach((rows, id) => {
    if (rows.length > 1) {
      errors.push({
        entityType: 'workers',
        rowId: id,
        field: 'WorkerID',
        message: `Duplicate WorkerID found in rows: ${rows.join(', ')}`,
        severity: 'error'
      });
    }
  });

  // Check duplicate TaskIDs
  const taskIds = new Map<string, string[]>();
  tasks.forEach((task, index) => {
    const id = getStringValue(task.TaskID);
    if (id) {
      if (!taskIds.has(id)) {
        taskIds.set(id, []);
      }
      taskIds.get(id)!.push(`Row ${index + 1}`);
    }
  });

  taskIds.forEach((rows, id) => {
    if (rows.length > 1) {
      errors.push({
        entityType: 'tasks',
        rowId: id,
        field: 'TaskID',
        message: `Duplicate TaskID found in rows: ${rows.join(', ')}`,
        severity: 'error'
      });
    }
  });

  return errors;
}

// Advanced validation functions
export function validateSchedulingFeasibility(clients: Client[], workers: Worker[], tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check phase-slot saturation
  const phaseDemand = new Map<number, number>();
  const phaseCapacity = new Map<number, number>();

  // Calculate task demand by phase
  tasks.forEach(task => {
    if (task.PreferredPhases && task.Duration) {
      const phases = Array.isArray(task.PreferredPhases) 
        ? task.PreferredPhases 
        : safeJsonParse(task.PreferredPhases);
      
      if (Array.isArray(phases)) {
        const duration = Number(task.Duration);
        phases.forEach(phase => {
          const current = phaseDemand.get(phase) || 0;
          phaseDemand.set(phase, current + duration);
        });
      }
    }
  });

  // Calculate worker capacity by phase
  workers.forEach(worker => {
    if (worker.AvailableSlots) {
      const slots = Array.isArray(worker.AvailableSlots) 
        ? worker.AvailableSlots 
        : safeJsonParse(worker.AvailableSlots);
      
      if (Array.isArray(slots)) {
        const maxLoad = Number(worker.MaxLoadPerPhase) || 1;
        slots.forEach(slot => {
          // This is a simplified check - in reality you'd need to parse time ranges
          const phase = 1; // Placeholder - would need actual phase calculation
          const current = phaseCapacity.get(phase) || 0;
          phaseCapacity.set(phase, current + maxLoad);
        });
      }
    }
  });

  // Check for phase saturation
  phaseDemand.forEach((demand, phase) => {
    const capacity = phaseCapacity.get(phase) || 0;
    if (demand > capacity) {
      errors.push({
        entityType: 'tasks',
        rowId: `phase-${phase}`,
        field: 'Scheduling',
        message: `Phase ${phase} demand (${demand}) exceeds capacity (${capacity})`,
        severity: 'warning'
      });
    }
  });

  return errors;
}

export function validateCircularDependencies(tasks: Task[]): ValidationError[] {
  const errors: ValidationError[] = [];
  const cycles = detectCircularDependencies(tasks);

  cycles.forEach(cycle => {
    const cycleTasks = cycle.join(' → ');
    cycle.forEach(taskId => {
      errors.push({
        entityType: 'tasks',
        rowId: taskId,
        field: 'Dependencies',
        message: `Circular dependency detected: ${cycleTasks}`,
        severity: 'error'
      });
    });
  });

  return errors;
}

// Main validation function
export function validateAllData(clients: Client[], workers: Worker[], tasks: Task[]): ValidationResult {
  const errors: ValidationError[] = [];

  // Validate individual entities
  clients.forEach(client => {
    errors.push(...validateClient(client, tasks));
  });

  workers.forEach(worker => {
    errors.push(...validateWorker(worker));
  });

  tasks.forEach(task => {
    errors.push(...validateTask(task, workers));
  });

  // Validate cross-entity issues
  errors.push(...validateDuplicateIds(clients, workers, tasks));
  errors.push(...validateSchedulingFeasibility(clients, workers, tasks));
  errors.push(...validateCircularDependencies(tasks));

  return {
    errors,
    isValid: errors.length === 0
  };
}

// Get cell className for validation styling
export function getCellClassName(field: string, errors: ValidationError[], rowId: string): string {
  // Extract the original ID from the prefixed rowId (e.g., "client-CLIENT001-0" -> "CLIENT001")
  let originalId = rowId;
  if (rowId.startsWith('client-')) {
    const parts = rowId.substring(7).split('-');
    originalId = parts[0]; // Take the first part as the original ID
  } else if (rowId.startsWith('worker-')) {
    const parts = rowId.substring(7).split('-');
    originalId = parts[0]; // Take the first part as the original ID
  } else if (rowId.startsWith('task-')) {
    const parts = rowId.substring(5).split('-');
    originalId = parts[0]; // Take the first part as the original ID
  }
  
  const fieldErrors = errors.filter(error => {
    return error.field === field && error.rowId === originalId;
  });
  
  if (fieldErrors.length > 0) {
    const hasError = fieldErrors.some(error => error.severity === 'error');
    return hasError ? 'validation-error' : 'validation-warning';
  }
  
  return '';
} 