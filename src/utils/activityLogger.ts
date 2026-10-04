/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Task, ActivityLog, User } from '../types';
import { formatDate } from './dateFormat';

export const STATUS_LABELS: Record<Task['status'], string> = {
  todo: 'Perlu Dikerjakan',
  in_progress: 'Sedang Berjalan',
  review: 'Dalam Review',
  done: 'Selesai',
  canceled_on_hold: 'Batal/Tunda'
};

export const PRIORITY_LABELS: Record<Task['priority'], string> = {
  Low: 'Rendah',
  Medium: 'Sedang',
  High: 'Tinggi',
  Critical: 'Kritis'
};

/**
 * Format timestamp for activity log entries.
 * Example: '2026-07-07T11:40:00Z' -> '7 Jul 2026, 11:40'
 */
export function formatLogDateTime(dateInput?: string | Date | null): string {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return '-';
  
  const datePart = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${datePart}, ${hours}:${minutes}`;
}

/**
 * Single source of truth diff analyzer for auto-generating Task Activity Logs.
 * Triggered whenever task status, priority, assignee, start date, or deadline changes.
 */
export function generateTaskDiffLogs(
  oldTask: Task,
  newTask: Task,
  currentUser: User,
  allUsers: User[]
): ActivityLog[] {
  const logs: ActivityLog[] = [];
  const now = new Date().toISOString();
  const userName = currentUser?.name || 'Pengguna';

  // 1. Status change
  if (oldTask.status !== newTask.status) {
    const oldVal = STATUS_LABELS[oldTask.status] || oldTask.status;
    const newVal = STATUS_LABELS[newTask.status] || newTask.status;
    logs.push({
      id: `LOG-ST-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: newTask.id,
      authorId: currentUser.id,
      authorName: userName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: `${userName} mengubah status dari ${oldVal} → ${newVal}`,
      createdAt: now,
      type: 'status'
    });
  }

  // 2. Priority change
  if (oldTask.priority !== newTask.priority) {
    const oldVal = PRIORITY_LABELS[oldTask.priority] || oldTask.priority;
    const newVal = PRIORITY_LABELS[newTask.priority] || newTask.priority;
    logs.push({
      id: `LOG-PR-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: newTask.id,
      authorId: currentUser.id,
      authorName: userName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: `${userName} mengubah prioritas dari ${oldVal} → ${newVal}`,
      createdAt: now,
      type: 'priority'
    });
  }

  // 3. Assignee change (compares assigneeIds array or assigneeId fallback)
  const oldAssigneeIds = (oldTask.assigneeIds && oldTask.assigneeIds.length > 0)
    ? oldTask.assigneeIds
    : (oldTask.assigneeId ? [oldTask.assigneeId] : []);
  const newAssigneeIds = (newTask.assigneeIds && newTask.assigneeIds.length > 0)
    ? newTask.assigneeIds
    : (newTask.assigneeId ? [newTask.assigneeId] : []);

  const isAssigneeDifferent =
    oldAssigneeIds.length !== newAssigneeIds.length ||
    oldAssigneeIds.some(id => !newAssigneeIds.includes(id)) ||
    newAssigneeIds.some(id => !oldAssigneeIds.includes(id));

  if (isAssigneeDifferent) {
    const getNames = (ids: string[]) => {
      if (ids.length === 0) return 'Belum ditugaskan';
      return ids.map(id => allUsers.find(u => u.id === id)?.name || id).join(', ');
    };
    const oldNames = getNames(oldAssigneeIds);
    const newNames = getNames(newAssigneeIds);
    logs.push({
      id: `LOG-AS-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: newTask.id,
      authorId: currentUser.id,
      authorName: userName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: `${userName} mengubah penugasan dari ${oldNames} → ${newNames}`,
      createdAt: now,
      type: 'assignee'
    });
  }

  // 4. Start date change
  if (oldTask.startDate && newTask.startDate && oldTask.startDate !== newTask.startDate) {
    const oldVal = formatDate(oldTask.startDate);
    const newVal = formatDate(newTask.startDate);
    logs.push({
      id: `LOG-SD-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: newTask.id,
      authorId: currentUser.id,
      authorName: userName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: `${userName} mengubah tanggal mulai dari ${oldVal} → ${newVal}`,
      createdAt: now,
      type: 'date'
    });
  }

  // 5. Deadline change
  if (oldTask.deadline && newTask.deadline && oldTask.deadline !== newTask.deadline) {
    const oldVal = formatDate(oldTask.deadline);
    const newVal = formatDate(newTask.deadline);
    logs.push({
      id: `LOG-DL-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      taskId: newTask.id,
      authorId: currentUser.id,
      authorName: userName,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: `${userName} mengubah tenggat waktu dari ${oldVal} → ${newVal}`,
      createdAt: now,
      type: 'date'
    });
  }

  return logs;
}
