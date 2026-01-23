
export enum Priority {
  URGENT = 'URGENT',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW'
}

export enum Status {
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  REVIEW = 'REVIEW',
  DONE = 'DONE',
  CANCELLED = 'CANCELLED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  CONTRIBUTOR = 'CONTRIBUTOR'
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  name: string; // Display name
  username: string;
  email: string;
  phone: string;
  password?: string;
  avatar: string;
  role: UserRole;
  department?: string;
}

export interface AuthSession {
  token: string;
  user: User;
  expiresAt: number;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  userId: string;
  text: string;
  createdAt: string;
  attachments?: Attachment[];
}

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  attachments?: Attachment[];
}

export interface Task {
  id: string;
  title: string;
  description: string;
  status: Status;
  priority: Priority;
  assignee: User;
  dueDate: string;
  subtasks: SubTask[];
  projectId: string;
  createdAt: string;
  attachments: Attachment[];
  comments: Comment[];
}

export interface Project {
  id: string;
  name: string;
  color: string;
  ownerId: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

export interface EmailLog {
  id: string;
  to: string;
  subject: string;
  body: string;
  sentAt: string;
  status: 'sent' | 'failed';
}

export type ViewType = 'board' | 'list';
export type AppView = 'dashboard' | 'project' | 'my-tasks' | 'calendar' | 'filtered-list' | 'user-management' | 'email-logs';
