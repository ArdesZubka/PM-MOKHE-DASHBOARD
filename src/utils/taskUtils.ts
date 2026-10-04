import { Task } from '../types';

/**
 * Calculates active tasks for a specific user (assignee).
 * A task is active if:
 * 1. The user is assigned via assigneeIds array (if present) OR assigneeId string match.
 * 2. Task status is NOT 'done' and NOT 'canceled_on_hold' (i.e. Perlu Dikerjakan, Sedang Berjalan, Dalam Review).
 */
export const getActiveTasksForUser = (tasks: Task[], userId: string): Task[] => {
  if (!tasks || !userId) return [];
  return tasks.filter(t => 
    (t.assigneeIds && t.assigneeIds.length > 0 
      ? t.assigneeIds.includes(userId) 
      : t.assigneeId === userId) && 
    t.status !== 'done' && 
    t.status !== 'canceled_on_hold'
  );
};

export type WorkloadState = 'safe' | 'full' | 'overloaded';

export interface WorkloadInfo {
  state: WorkloadState;
  activeCount: number;
  limit: number;
  isSafe: boolean;
  isFull: boolean;
  isOverloaded: boolean;
}

export const getWorkloadInfo = (activeCount: number, limit: number): WorkloadInfo => {
  const safeLimit = limit > 0 ? limit : 1;
  let state: WorkloadState = 'safe';
  if (activeCount > safeLimit) {
    state = 'overloaded';
  } else if (activeCount === safeLimit) {
    state = 'full';
  } else {
    state = 'safe';
  }

  return {
    state,
    activeCount,
    limit: safeLimit,
    isSafe: state === 'safe',
    isFull: state === 'full',
    isOverloaded: state === 'overloaded'
  };
};
