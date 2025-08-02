export enum TaskStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Done = 'Done',
}

export enum TaskPriority {
  Low = 'Low',
  Medium = 'Medium',
  High = 'High',
}

export enum ProjectRole {
  Owner = 'Owner',
  Collaborator = 'Collaborator',
  Viewer = 'Viewer',
}

export interface Task {
  id: string;
  projectId: string;
  parentId: string | null;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  startDate: string | null;
  dueDate: string | null;
  tags: string[];
  isFocused: boolean;
  createdAt: string;
  order: number;
}

export interface Member {
  id: string;
  name:string;
  role: ProjectRole;
  avatarUrl: string; // URL to an avatar image
}

export interface Goal {
    id: string;
    title: string;
    targetValue: number;
    currentValue: number;
    unit: string; // e.g., '%' or 'tasks'
}

export interface Link {
    id: string;
    title: string;
    url: string;
}

export interface Comment {
    id: string;
    projectId: string;
    authorName: string; // Simulated member name
    authorAvatarUrl: string;
    content: string;
    createdAt: string;
}

export interface ActivityLog {
    id: string;
    timestamp: string;
    author: string; // Simulated
    action: string;
}

export interface Project {
  id:string;
  name: string;
  description: string;
  createdAt: string;
  tags: string[];
  order: number;
  priority: TaskPriority;
  isArchived: boolean;
  color: string; // Hex color code
  members: Member[];
  goals: Goal[];
  links: Link[];
}

export interface AppState {
    projects: Project[];
    tasks: Task[];
    comments: Record<string, Comment[]>; // Keyed by projectId
    activityLog: Record<string, ActivityLog[]>; // Keyed by projectId
}