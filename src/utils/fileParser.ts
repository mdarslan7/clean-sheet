import * as XLSX from 'xlsx';
import { Client, Worker, Task, EntityType, FileData } from '../types';

export function detectEntityType(columns: string[]): EntityType {
  const columnSet = new Set(columns.map(col => col.toLowerCase()));
  
  if (columnSet.has('clientid') || columnSet.has('client_id')) {
    return 'clients';
  }
  
  if (columnSet.has('workerid') || columnSet.has('worker_id') || columnSet.has('employeeid')) {
    return 'workers';
  }
  
  if (columnSet.has('taskid') || columnSet.has('task_id')) {
    return 'tasks';
  }
  
  // Fallback detection based on common column patterns
  if (columnSet.has('name') && (columnSet.has('email') || columnSet.has('phone'))) {
    if (columnSet.has('position') || columnSet.has('department')) {
      return 'workers';
    }
    return 'clients';
  }
  
  // Default to tasks if no clear pattern
  return 'tasks';
}

export function parseFile(file: File): Promise<FileData[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const results: FileData[] = [];
        
        // Process each sheet in the workbook
        workbook.SheetNames.forEach(sheetName => {
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          if (jsonData.length === 0) {
            return; // Skip empty sheets
          }
          
          const headers = jsonData[0] as string[];
          const rows = jsonData.slice(1) as any[][];
          
          // Convert rows to objects
          const objects = rows.map((row, index) => {
            const obj: any = {};
            headers.forEach((header, colIndex) => {
              obj[header] = row[colIndex] || '';
            });
            return obj;
          }).filter(obj => {
            // Filter out completely empty rows
            return Object.values(obj).some(value => value !== '' && value !== null && value !== undefined);
          });
          
          if (objects.length === 0) {
            return; // Skip sheets with no valid data
          }
          
          const entityType = detectEntityType(headers);
          
          results.push({
            type: entityType,
            data: objects,
            fileName: `${file.name} - ${sheetName}`,
            columns: headers
          });
        });
        
        if (results.length === 0) {
          reject(new Error('No valid data found in the file'));
          return;
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
} 