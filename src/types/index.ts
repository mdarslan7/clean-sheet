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