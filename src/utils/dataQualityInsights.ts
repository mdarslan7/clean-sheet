import { Client, Worker, Task } from '../types';
import { DataQualityInsight } from './smartRuleSuggestions';

// Analyze data quality and generate insights
export function analyzeDataQuality(clients: Client[], workers: Worker[], tasks: Task[]): DataQualityInsight[] {
  const insights: DataQualityInsight[] = [];

  // 1. Worker-Task Imbalance Analysis
  const workerCount = workers.length;
  const taskCount = tasks.length;
  const activeTasks = tasks.filter(t => t.Status !== 'completed' && t.Status !== 'closed');
  
  if (workerCount > 0 && taskCount > 0) {
    const tasksPerWorker = taskCount / workerCount;
    const activeTasksPerWorker = activeTasks.length / workerCount;
    
    if (activeTasksPerWorker > 5) {
      insights.push({
        id: 'worker-task-imbalance',
        type: 'capacity',
        title: 'High Task Load per Worker',
        description: `You have ${workerCount} workers but ${activeTasks.length} active tasks (${activeTasksPerWorker.toFixed(1)} tasks per worker).`,
        severity: 'critical',
        impact: 'Workers may be overwhelmed, leading to missed deadlines and reduced quality.',
        recommendation: 'Consider hiring additional workers or redistributing tasks to balance the workload.',
        metrics: {
          current: activeTasksPerWorker,
          expected: 3,
          percentage: Math.round((activeTasksPerWorker / 3) * 100)
        },
        affectedEntities: ['workers', 'tasks']
      });
    } else if (activeTasksPerWorker < 1) {
      insights.push({
        id: 'underutilized-workers',
        type: 'efficiency',
        title: 'Underutilized Workers',
        description: `You have ${workerCount} workers but only ${activeTasks.length} active tasks (${activeTasksPerWorker.toFixed(1)} tasks per worker).`,
        severity: 'warning',
        impact: 'Workers may be idle, leading to increased costs and reduced productivity.',
        recommendation: 'Consider taking on more projects or reassigning workers to other departments.',
        metrics: {
          current: activeTasksPerWorker,
          expected: 2,
          percentage: Math.round((activeTasksPerWorker / 2) * 100)
        },
        affectedEntities: ['workers', 'tasks']
      });
    }
  }

  // 2. Missing Critical Data Analysis
  const missingEmailClients = clients.filter(c => !c.Email || c.Email.trim() === '').length;
  const missingPhoneClients = clients.filter(c => !c.Phone || c.Phone.trim() === '').length;
  const missingSkillsWorkers = workers.filter(w => !w.Skills || w.Skills.trim() === '').length;
  const missingDueDateTasks = tasks.filter(t => !t.DueDate || t.DueDate.trim() === '').length;

  if (missingEmailClients > 0) {
    insights.push({
      id: 'missing-client-emails',
      type: 'missing',
      title: 'Missing Client Email Addresses',
      description: `${missingEmailClients} out of ${clients.length} clients are missing email addresses.`,
      severity: missingEmailClients > clients.length * 0.3 ? 'critical' : 'warning',
      impact: 'Missing emails can cause communication issues and delays in project delivery.',
      recommendation: 'Contact clients to collect missing email addresses or mark them as optional if not critical.',
      metrics: {
        current: missingEmailClients,
        expected: 0,
        percentage: Math.round((missingEmailClients / clients.length) * 100)
      },
      affectedEntities: ['clients']
    });
  }

  if (missingSkillsWorkers > 0) {
    insights.push({
      id: 'missing-worker-skills',
      type: 'missing',
      title: 'Missing Worker Skills Information',
      description: `${missingSkillsWorkers} out of ${workers.length} workers are missing skills information.`,
      severity: missingSkillsWorkers > workers.length * 0.5 ? 'critical' : 'warning',
      impact: 'Missing skills data makes it difficult to assign appropriate tasks to workers.',
      recommendation: 'Update worker profiles with their skills and expertise areas.',
      metrics: {
        current: missingSkillsWorkers,
        expected: 0,
        percentage: Math.round((missingSkillsWorkers / workers.length) * 100)
      },
      affectedEntities: ['workers']
    });
  }

  // 3. Priority Distribution Analysis
  const highPriorityTasks = tasks.filter(t => t.Priority === 'high');
  const mediumPriorityTasks = tasks.filter(t => t.Priority === 'medium');
  const lowPriorityTasks = tasks.filter(t => t.Priority === 'low');
  
  if (taskCount > 0) {
    const highPriorityPercentage = (highPriorityTasks.length / taskCount) * 100;
    const lowPriorityPercentage = (lowPriorityTasks.length / taskCount) * 100;
    
    if (highPriorityPercentage > 50) {
      insights.push({
        id: 'too-many-high-priority',
        type: 'outlier',
        title: 'Too Many High Priority Tasks',
        description: `${highPriorityPercentage.toFixed(1)}% of tasks are marked as high priority (${highPriorityTasks.length} out of ${taskCount}).`,
        severity: 'warning',
        impact: 'When everything is high priority, nothing is truly prioritized, leading to confusion and delays.',
        recommendation: 'Review and re-prioritize tasks. Consider using a more granular priority system.',
        metrics: {
          current: highPriorityPercentage,
          expected: 20,
          percentage: Math.round(highPriorityPercentage)
        },
        affectedEntities: ['tasks']
      });
    }
    
    if (lowPriorityPercentage > 70) {
      insights.push({
        id: 'too-many-low-priority',
        type: 'outlier',
        title: 'Too Many Low Priority Tasks',
        description: `${lowPriorityPercentage.toFixed(1)}% of tasks are marked as low priority (${lowPriorityTasks.length} out of ${taskCount}).`,
        severity: 'info',
        impact: 'Low priority tasks may be neglected or delayed indefinitely.',
        recommendation: 'Review if these tasks are truly necessary or if they can be automated or eliminated.',
        metrics: {
          current: lowPriorityPercentage,
          expected: 30,
          percentage: Math.round(lowPriorityPercentage)
        },
        affectedEntities: ['tasks']
      });
    }
  }

  // 4. Due Date Analysis
  const tasksWithDueDates = tasks.filter(t => t.DueDate && t.DueDate.trim() !== '');
  const overdueTasks = tasksWithDueDates.filter(t => {
    const dueDate = new Date(t.DueDate);
    const today = new Date();
    return dueDate < today && t.Status !== 'completed';
  });
  
  if (overdueTasks.length > 0) {
    insights.push({
      id: 'overdue-tasks',
      type: 'outlier',
      title: 'Overdue Tasks Detected',
      description: `${overdueTasks.length} tasks are overdue and not yet completed.`,
      severity: 'critical',
      impact: 'Overdue tasks can damage client relationships and affect project timelines.',
      recommendation: 'Review overdue tasks immediately. Consider extending deadlines or reassigning resources.',
      metrics: {
        current: overdueTasks.length,
        expected: 0,
        percentage: Math.round((overdueTasks.length / tasksWithDueDates.length) * 100)
      },
      affectedEntities: ['tasks']
    });
  }

  // 5. Client-Task Distribution Analysis
  const clientsWithTasks = new Set(tasks.map(t => t.ClientID).filter(Boolean));
  const clientsWithoutTasks = clients.filter(c => !clientsWithTasks.has(c.ClientID));
  
  if (clientsWithoutTasks.length > 0 && clients.length > 0) {
    const inactiveClientPercentage = (clientsWithoutTasks.length / clients.length) * 100;
    
    if (inactiveClientPercentage > 30) {
      insights.push({
        id: 'inactive-clients',
        type: 'efficiency',
        title: 'Many Inactive Clients',
        description: `${inactiveClientPercentage.toFixed(1)}% of clients (${clientsWithoutTasks.length} out of ${clients.length}) have no active tasks.`,
        severity: 'warning',
        impact: 'Inactive clients may indicate lost business opportunities or poor client retention.',
        recommendation: 'Reach out to inactive clients to understand their needs and generate new business.',
        metrics: {
          current: inactiveClientPercentage,
          expected: 10,
          percentage: Math.round(inactiveClientPercentage)
        },
        affectedEntities: ['clients', 'tasks']
      });
    }
  }

  // 6. Department Capacity Analysis
  const departmentWorkers = new Map<string, number>();
  const departmentTasks = new Map<string, number>();
  
  workers.forEach(worker => {
    if (worker.Department) {
      departmentWorkers.set(worker.Department, (departmentWorkers.get(worker.Department) || 0) + 1);
    }
  });
  
  tasks.forEach(task => {
    if (task.Department) {
      departmentTasks.set(task.Department, (departmentTasks.get(task.Department) || 0) + 1);
    }
  });
  
  departmentWorkers.forEach((workerCount, dept) => {
    const taskCount = departmentTasks.get(dept) || 0;
    const tasksPerWorker = taskCount / workerCount;
    
    if (tasksPerWorker > 8) {
      insights.push({
        id: `department-overload-${dept}`,
        type: 'capacity',
        title: `${dept} Department Overloaded`,
        description: `${dept} department has ${workerCount} workers but ${taskCount} tasks (${tasksPerWorker.toFixed(1)} tasks per worker).`,
        severity: 'critical',
        impact: 'Department may struggle to meet deadlines and maintain quality.',
        recommendation: `Consider adding more workers to the ${dept} department or redistributing tasks.`,
        metrics: {
          current: tasksPerWorker,
          expected: 4,
          percentage: Math.round((tasksPerWorker / 4) * 100)
        },
        affectedEntities: ['workers', 'tasks']
      });
    }
  });

  return insights;
}

// Get AI-enhanced data quality insights
export async function getDataQualityInsights(
  clients: Client[], 
  workers: Worker[], 
  tasks: Task[]
): Promise<DataQualityInsight[]> {
  try {
    // Get basic insights
    const insights = analyzeDataQuality(clients, workers, tasks);
    
    // If we have AI available, enhance insights
    if (process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      return await enhanceInsightsWithAI(insights, clients, workers, tasks);
    }
    
    return insights;
  } catch (error) {
    console.error('Error generating data quality insights:', error);
    return [];
  }
}

// Enhance insights with AI analysis
async function enhanceInsightsWithAI(
  insights: DataQualityInsight[],
  clients: Client[],
  workers: Worker[],
  tasks: Task[]
): Promise<DataQualityInsight[]> {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  
  if (!apiKey) return insights;

  try {
    const prompt = `Analyze this business data and provide additional data quality insights:

CLIENTS (${clients.length} records):
${JSON.stringify(clients.slice(0, 3), null, 2)}

WORKERS (${workers.length} records):
${JSON.stringify(workers.slice(0, 3), null, 2)}

TASKS (${tasks.length} records):
${JSON.stringify(tasks.slice(0, 3), null, 2)}

EXISTING INSIGHTS:
${JSON.stringify(insights, null, 2)}

Provide 2-3 additional data quality insights focusing on:
1. Business efficiency and productivity
2. Resource allocation and capacity planning
3. Data completeness and accuracy
4. Process optimization opportunities

Respond with JSON array of insights in this format:
[{
  "id": "ai-insight-1",
  "type": "imbalance|missing|duplicate|outlier|efficiency|capacity",
  "title": "Insight Title",
  "description": "Detailed description of the insight",
  "severity": "critical|warning|info",
  "impact": "Business impact of this issue",
  "recommendation": "Actionable recommendation",
  "metrics": {
    "current": 5,
    "expected": 3,
    "percentage": 167
  },
  "affectedEntities": ["clients", "workers", "tasks"]
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
          const aiInsights = JSON.parse(jsonMatch[0]);
          return [...insights, ...aiInsights];
        }
      } catch (parseError) {
        console.error('Error parsing AI insights:', parseError);
      }
    }
  } catch (error) {
    console.error('Error calling AI for data quality insights:', error);
  }

  return insights;
} 