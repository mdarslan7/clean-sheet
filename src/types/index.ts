export interface Client {
  ClientID: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  [key: string]: any; // Allow additional properties
}

export interface Worker {
  WorkerID: string;
  Name: string;
  Email?: string;
  Phone?: string;
  Position?: string;
  Department?: string;
  [key: string]: any; // Allow additional properties
}

export interface Task {
  TaskID: string;
  Title: string;
  Description?: string;
  ClientID?: string;
  WorkerID?: string;
  Status?: string;
  Priority?: string;
  DueDate?: string;
  [key: string]: any; // Allow additional properties
}

export type EntityType = 'clients' | 'workers' | 'tasks';

export interface FileData {
  type: EntityType;
  data: Client[] | Worker[] | Task[];
  fileName: string;
  columns: string[];
}

// Business Rules Types
export interface CoRunRule {
  id: string;
  type: 'co-run';
  taskIDs: string[];
  description?: string;
}

export interface SlotRestrictionRule {
  id: string;
  type: 'slot-restriction';
  groupType: 'client' | 'worker';
  groupName: string;
  minCommonSlots: number;
  description?: string;
}

export interface LoadLimitRule {
  id: string;
  type: 'load-limit';
  workerGroup: string;
  maxSlotsPerPhase: number;
  description?: string;
}

export interface PhaseWindowRule {
  id: string;
  type: 'phase-window';
  taskID: string;
  allowedPhases: string[];
  description?: string;
}

export type BusinessRule = CoRunRule | SlotRestrictionRule | LoadLimitRule | PhaseWindowRule;

export interface PrioritizationConfig {
  priorityLevel: number;
  requestedTaskFulfillment: number;
  fairness: number;
  efficiency: number;
  deadlineAdherence: number;
  skillMatch: number;
  workloadBalance: number;
}

export interface RulesConfig {
  businessRules: BusinessRule[];
  prioritization: PrioritizationConfig;
  validationRules: {
    clients: Record<string, boolean>;
    workers: Record<string, boolean>;
    tasks: Record<string, boolean>;
  };
} 