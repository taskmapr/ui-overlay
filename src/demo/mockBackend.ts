import { Message } from '../types';

export interface DemoTask {
  id: string;
  title: string;
  status: 'Not Started' | 'In Progress' | 'Blocked' | 'Done';
  assignee: string;
  dueDate: string;
  priority: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface DemoMetric {
  id: string;
  label: string;
  value: string;
  change: number;
}

export interface DemoTeamMember {
  id: string;
  name: string;
  role: string;
  focus: string;
  email: string;
}

const tasks: DemoTask[] = [
  {
    id: 'task-1',
    title: 'Onboard new marketing hire',
    status: 'In Progress',
    assignee: 'Avery Brooks',
    dueDate: '2025-11-12',
    priority: 'High',
    description: 'Complete account provisioning, schedule intro meetings, and share onboarding checklist.',
  },
  {
    id: 'task-2',
    title: 'Ship Q4 feature review',
    status: 'Blocked',
    assignee: 'Jordan Green',
    dueDate: '2025-11-15',
    priority: 'High',
    description: 'Gather inputs from PMs, compile launch metrics, and prepare slides for exec sync.',
  },
  {
    id: 'task-3',
    title: 'Refresh support macros',
    status: 'Not Started',
    assignee: 'Morgan Lee',
    dueDate: '2025-11-20',
    priority: 'Medium',
    description: 'Audit outdated responses in Intercom and propose new tone guidelines for macros.',
  },
  {
    id: 'task-4',
    title: 'Review vendor contracts',
    status: 'Done',
    assignee: 'Samira Patel',
    dueDate: '2025-11-05',
    priority: 'Low',
    description: 'Confirm renewal terms, check SLAs, and file signed copies in the shared drive.',
  },
];

const metrics: DemoMetric[] = [
  { id: 'metric-velocity', label: 'Sprint Velocity', value: '32 pts', change: 8 },
  { id: 'metric-satisfaction', label: 'CSAT', value: '4.6 / 5', change: 0.2 },
  { id: 'metric-efficiency', label: 'Cycle Time', value: '2.8 days', change: -0.4 },
];

const team: DemoTeamMember[] = [
  {
    id: 'team-avery',
    name: 'Avery Brooks',
    role: 'Product Manager',
    focus: 'Growth experiments',
    email: 'avery@taskmapr.dev',
  },
  {
    id: 'team-jordan',
    name: 'Jordan Green',
    role: 'Engineering Lead',
    focus: 'Platform reliability',
    email: 'jordan@taskmapr.dev',
  },
  {
    id: 'team-morgan',
    name: 'Morgan Lee',
    role: 'Customer Success',
    focus: 'Enterprise onboarding',
    email: 'morgan@taskmapr.dev',
  },
  {
    id: 'team-samira',
    name: 'Samira Patel',
    role: 'Operations',
    focus: 'Vendor management',
    email: 'samira@taskmapr.dev',
  },
];

const randomDelay = () => 300 + Math.floor(Math.random() * 400);

export async function fetchDemoTasks(): Promise<DemoTask[]> {
  await new Promise((resolve) => setTimeout(resolve, randomDelay()));
  return tasks;
}

export async function fetchDemoMetrics(): Promise<DemoMetric[]> {
  await new Promise((resolve) => setTimeout(resolve, randomDelay()));
  return metrics;
}

export async function fetchDemoTeam(): Promise<DemoTeamMember[]> {
  await new Promise((resolve) => setTimeout(resolve, randomDelay()));
  return team;
}

let assistantMessageCounter = 0;

const formatTasksSummary = () => {
  const grouped = tasks.reduce<Record<string, number>>((acc, task) => {
    acc[task.status] = (acc[task.status] || 0) + 1;
    return acc;
  }, {});

  return [
    `Here is the latest task status:`,
    '',
    `• In Progress: ${grouped['In Progress'] || 0}`,
    `• Blocked: ${grouped['Blocked'] || 0}`,
    `• Not Started: ${grouped['Not Started'] || 0}`,
    `• Done: ${grouped['Done'] || 0}`,
    '',
    `Ask for a specific task if you need more detail.`,
  ].join('\n');
};

const highlightForKeyword = (keyword: string): Message['highlight'] => {
  switch (keyword) {
    case 'dashboard':
      return [{ selector: '#dashboard-metrics', duration: 4000 }];
    case 'tasks':
      return [{ selector: '#task-list', duration: 4000 }];
    case 'team':
    case 'people':
      return [{ selector: '#team-table', duration: 4000 }];
    default:
      return undefined;
  }
};

export async function getMockAssistantResponse(message: string): Promise<Message> {
  const lower = message.toLowerCase();
  await new Promise((resolve) => setTimeout(resolve, randomDelay()));

  let content = `I heard: "${message}". Try asking about the dashboard, tasks, or the team.`;
  let highlight: Message['highlight'] = undefined;

  if (lower.includes('help') || lower.includes('what can you')) {
    content = [
      'I can help you explore the TaskMapr demo:',
      '',
      '• Ask “Show me the dashboard metrics”',
      '• Ask “Which tasks are blocked?”',
      '• Ask “Tell me about the team”',
      '',
      'Try one of those prompts!',
    ].join('\n');
  } else if (lower.includes('dashboard') || lower.includes('metrics')) {
    const metricSummary = metrics
      .map((metric) => `${metric.label}: ${metric.value} (${metric.change > 0 ? '+' : ''}${metric.change})`)
      .join('\n');
    content = [
      'Here is what the dashboard is showing right now:',
      '',
      metricSummary,
      '',
      'These live metrics update as you interact with the product.',
    ].join('\n');
    highlight = highlightForKeyword('dashboard');
  } else if (lower.includes('task') || lower.includes('project')) {
    content = formatTasksSummary();
    highlight = highlightForKeyword('tasks');
  } else if (lower.includes('blocked')) {
    const blockedTasks = tasks.filter((task) => task.status === 'Blocked');
    if (blockedTasks.length > 0) {
      content = [
        'Here are the blocked tasks:',
        '',
        ...blockedTasks.map((task) => `• ${task.title} — ${task.description}`),
        '',
        'Click a card to view details.',
      ].join('\n');
    } else {
      content = 'Great news—no tasks are blocked right now!';
    }
    highlight = highlightForKeyword('tasks');
  } else if (lower.includes('team') || lower.includes('people')) {
    content = [
      'Meet the team:',
      '',
      ...team.map((member) => `• ${member.name}, ${member.role} — focus: ${member.focus}`),
      '',
      'Open the Team page to see contact details.',
    ].join('\n');
    highlight = highlightForKeyword('team');
  }

  assistantMessageCounter += 1;

  return {
    id: `mock-assistant-${assistantMessageCounter}`,
    role: 'assistant',
    content,
    timestamp: new Date(),
    highlight,
  };
}

