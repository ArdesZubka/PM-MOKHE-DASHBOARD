/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Role = 'PM' | 'Staff';

export interface User {
  id: string;
  name: string;
  username?: string;
  email: string;
  avatar: string;
  role: Role;
  position: string;
  overloadLimit: number; // Max active tasks before marked as overloaded (e.g. 3 or 4)
}

export interface Project {
  id: string;
  code: string;
  name: string;
  description: string;
  status: 'Planning' | 'Ongoing' | 'Review' | 'Completed';
  client: string;
  managerId: string;
  startDate: string;
  endDate: string;
  progress: number; // percentage 0-100
  memberIds?: string[];
  attachments?: TaskAttachment[];
}

export interface Subtask {
  id: string;
  title: string;
  isCompleted: boolean;
}

export interface TaskAttachment {
  id: string;
  type: 'file' | 'link';
  name: string;
  url?: string;
  size?: string;
  addedBy: string;
  addedByName?: string;
  addedByRole: Role;
  createdAt: string;
}

export interface CommentAttachment {
  id: string;
  type: 'file' | 'link';
  name: string;
  url?: string;
  size?: string;
}

export interface Comment {
  id: string;
  taskId?: string;
  projectId?: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorRole: Role;
  content: string;
  createdAt: string;
  attachments?: CommentAttachment[];
}

export interface ActivityLog {
  id: string;
  taskId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorRole?: Role;
  content: string;
  createdAt: string;
  type?: 'status' | 'priority' | 'assignee' | 'date' | 'general';
}

export interface Task {
  id: string;
  code: string;
  projectId: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'canceled_on_hold';
  priority: 'Low' | 'Medium' | 'High' | 'Critical';
  assigneeId: string;
  assigneeIds?: string[];
  assignedBy?: string; // User ID of creator/assigner (e.g., 'USR01' for PM or 'USR02' for Staff)
  startDate: string; // ISO date string (YYYY-MM-DD)
  deadline: string; // ISO date string (YYYY-MM-DD)
  subtasks: Subtask[];
  attachments?: TaskAttachment[];
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'deadline_3d' | 'deadline_1d' | 'deadline_due' | 'system' | 'mention';
  timestamp: string;
  taskId?: string;
  projectId?: string;
  isRead: boolean;
  mentionedUserId?: string;
  authorName?: string;
  authorAvatar?: string;
  commentId?: string;
}

export interface TaskReminderRule {
  id: string;
  daysBefore: number; // 0 = Hari-H, >0 = H-N (e.g., 3 means H-3)
}

export interface NotificationSettings {
  taskReminders: TaskReminderRule[];
  alert3Days?: boolean;
  alert1Day?: boolean;
  alertDueDay?: boolean;
  emailAlerts?: boolean;
  pushAlerts?: boolean;
}
