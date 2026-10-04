/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  DUMMY_USERS, 
  DUMMY_PROJECTS, 
  DUMMY_TASKS, 
  DUMMY_COMMENTS,
  DUMMY_ACTIVITY_LOGS,
  generateDeadlineNotifications,
  INITIAL_USER_NOTIFICATION_SETTINGS,
  DEFAULT_NOTIFICATION_SETTINGS
} from './data/dummy';
import { User, Project, Task, Comment, ActivityLog, Notification, NotificationSettings, CommentAttachment } from './types';
import { ChevronDown, User as UserIcon, AtSign, X, ArrowRight, Bell, RotateCcw, CheckCircle, LogOut } from 'lucide-react';
import { formatDate } from './utils/dateFormat';

// Component imports
import SandboxController from './components/SandboxController';
import Sidebar from './components/Sidebar';
import ProjectFormModal from './components/ProjectFormModal';
import TaskFormModal from './components/TaskFormModal';
import TaskDetailPage from './pages/TaskDetailPage';

// Pages imports
import AuthPages from './pages/AuthPages';
import DashboardPages from './pages/DashboardPages';
import ProjectListPage from './pages/ProjectListPage';
import KanbanPages from './pages/KanbanPages';
import NotificationPages from './pages/NotificationPages';
import CalendarPages from './pages/CalendarPages';
import SettingsPages from './pages/SettingsPages';
import TugasPages from './pages/TugasPages';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CreateProjectPage from './pages/CreateProjectPage';
import NotificationPopover from './components/NotificationPopover';
import { initializeCountersFromData } from './utils/codeGenerator';
import { generateTaskDiffLogs, STATUS_LABELS } from './utils/activityLogger';

const DATA_VERSION = 'v9_comment_log_orphan_cleanup';

// Migration sanitizers to guarantee no stale localStorage keeps old names or avatars
const sanitizeUser = (u: User): User => {
  const dummyMatch = DUMMY_USERS.find(du => du.id === u.id);
  const avatar = dummyMatch ? dummyMatch.avatar : u.avatar;

  if (u.id === 'USR04' || u.name === 'Rian Hidayat' || u.username === 'rian.hidayat') {
    return {
      ...u,
      name: 'Hamzah Ali Umar',
      username: 'hamzah.ali.umar',
      email: 'hamzah.ux@morkhestudio.com',
      position: 'Photographer',
      avatar
    };
  }
  if (u.id === 'USR03' || u.name === 'Fitri Lestari' || u.name === 'Raditya Lacavi' || u.username === 'fitri.lestari' || u.username === 'raditya.lacavi') {
    return {
      ...u,
      name: 'Amir Salim',
      username: 'amir.salim',
      email: 'amir.media@morkhestudio.com',
      position: 'Videographer',
      avatar
    };
  }
  return {
    ...u,
    avatar
  };
};

/**
 * Single Source of Truth helper to purge orphaned comments and activity logs
 * whose associated task or project no longer exists in state.
 */
export const cleanOrphanedRecords = (
  validProjects: Project[],
  validTasks: Task[],
  rawComments: Comment[],
  rawActivityLogs: ActivityLog[]
): {
  cleanedComments: Comment[];
  cleanedActivityLogs: ActivityLog[];
  purgedCommentsCount: number;
  purgedLogsCount: number;
} => {
  const validProjectIds = new Set(validProjects.map(p => p.id));
  const validTaskIds = new Set(validTasks.map(t => t.id));

  const cleanedComments = rawComments.filter(c => {
    // 1. Task-level comment: task must exist in active tasks
    if (c.taskId) {
      return validTaskIds.has(c.taskId);
    }
    // 2. Project-level comment: project must exist in active projects
    if (c.projectId) {
      return validProjectIds.has(c.projectId);
    }
    return false;
  });

  const cleanedActivityLogs = rawActivityLogs.filter(l => {
    // Log attached to task: task must exist in active tasks
    if (l.taskId) {
      return validTaskIds.has(l.taskId);
    }
    return true;
  });

  return {
    cleanedComments,
    cleanedActivityLogs,
    purgedCommentsCount: rawComments.length - cleanedComments.length,
    purgedLogsCount: rawActivityLogs.length - cleanedActivityLogs.length
  };
};

export default function App() {
  
  // Base State Engine with Data Versioning
  const [users, setUsers] = useState<User[]>(() => {
    const version = localStorage.getItem('morkhe_data_version');
    if (version !== DATA_VERSION) {
      localStorage.setItem('morkhe_data_version', DATA_VERSION);
      localStorage.removeItem('morkhe_users');
      localStorage.removeItem('morkhe_current_user');
      localStorage.removeItem('morkhe_projects');
      localStorage.removeItem('morkhe_tasks');
      localStorage.removeItem('morkhe_comments');
      localStorage.removeItem('morkhe_activity_logs');
      localStorage.removeItem('morkhe_notifications');
      return DUMMY_USERS;
    }
    const saved = localStorage.getItem('morkhe_users');
    if (saved) {
      try {
        const parsed: User[] = JSON.parse(saved);
        return parsed.map(sanitizeUser);
      } catch (e) {
        return DUMMY_USERS;
      }
    }
    return DUMMY_USERS;
  });

  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('morkhe_current_user');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return sanitizeUser(parsed);
      } catch (e) {
        return DUMMY_USERS[0];
      }
    }
    return DUMMY_USERS[0];
  });

  // Sandbox / Dev Mode detection:
  // Default is FALSE (hidden from normal testers / thesis defense examiners).
  // Activated by URL query param (?dev=true or ?sandbox=true) or flag in localStorage.
  // Deactivated by passing ?dev=false or ?sandbox=false.
  const [isSandboxMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryParam = params.get('dev') || params.get('sandbox');
      if (queryParam === 'true' || queryParam === '1') {
        localStorage.setItem('morkhe_sandbox_mode', 'true');
        return true;
      }
      if (queryParam === 'false' || queryParam === '0') {
        localStorage.removeItem('morkhe_sandbox_mode');
        return false;
      }
      return localStorage.getItem('morkhe_sandbox_mode') === 'true';
    }
    return false;
  });

  const [currentPage, setCurrentPage] = useState<string>(() => {
    const isAuth = localStorage.getItem('morkhe_is_authenticated') === 'true';
    const savedUser = localStorage.getItem('morkhe_current_user');
    if (isAuth && savedUser) {
      try {
        const parsed = JSON.parse(savedUser);
        return parsed.role === 'PM' ? 'P04' : 'P05';
      } catch (e) {
        return 'P02';
      }
    }
    return 'P02';
  });
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('morkhe_tasks');
    return saved ? JSON.parse(saved) : DUMMY_TASKS;
  });

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('morkhe_projects');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DUMMY_PROJECTS;
      }
    }
    return DUMMY_PROJECTS;
  });

  const [comments, setComments] = useState<Comment[]>(() => {
    const saved = localStorage.getItem('morkhe_comments');
    let loadedComments = DUMMY_COMMENTS;
    if (saved) {
      try {
        const parsed: Comment[] = JSON.parse(saved);
        loadedComments = parsed.map(c => {
          if (c.authorId === 'USR04' || c.authorName === 'Rian Hidayat') {
            return { ...c, authorName: 'Hamzah Ali Umar' };
          }
          if (c.authorId === 'USR03' || c.authorName === 'Fitri Lestari' || c.authorName === 'Raditya Lacavi') {
            return { ...c, authorName: 'Amir Salim' };
          }
          return c;
        });
      } catch (e) {
        loadedComments = DUMMY_COMMENTS;
      }
    }
    const savedProjectsStr = localStorage.getItem('morkhe_projects');
    const savedTasksStr = localStorage.getItem('morkhe_tasks');
    let initialProjects: Project[] = DUMMY_PROJECTS;
    let initialTasks: Task[] = DUMMY_TASKS;
    try {
      if (savedProjectsStr) initialProjects = JSON.parse(savedProjectsStr);
      if (savedTasksStr) initialTasks = JSON.parse(savedTasksStr);
    } catch {}
    const { cleanedComments } = cleanOrphanedRecords(initialProjects, initialTasks, loadedComments, []);
    return cleanedComments;
  });

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem('morkhe_activity_logs');
    let loadedLogs = DUMMY_ACTIVITY_LOGS;
    if (saved) {
      try {
        const parsed: ActivityLog[] = JSON.parse(saved);
        loadedLogs = parsed.map(log => {
          let content = log.content;
          if (content.includes('Rian Hidayat')) content = content.replace(/Rian Hidayat/g, 'Hamzah Ali Umar');
          if (content.includes('Fitri Lestari')) content = content.replace(/Fitri Lestari/g, 'Amir Salim');
          if (content.includes('Raditya Lacavi')) content = content.replace(/Raditya Lacavi/g, 'Amir Salim');
          let authorName = log.authorName;
          if (log.authorId === 'USR04' || authorName === 'Rian Hidayat') authorName = 'Hamzah Ali Umar';
          if (log.authorId === 'USR03' || authorName === 'Fitri Lestari' || authorName === 'Raditya Lacavi') authorName = 'Amir Salim';
          return { ...log, content, authorName };
        });
      } catch (e) {
        loadedLogs = DUMMY_ACTIVITY_LOGS;
      }
    }
    const savedProjectsStr = localStorage.getItem('morkhe_projects');
    const savedTasksStr = localStorage.getItem('morkhe_tasks');
    let initialProjects: Project[] = DUMMY_PROJECTS;
    let initialTasks: Task[] = DUMMY_TASKS;
    try {
      if (savedProjectsStr) initialProjects = JSON.parse(savedProjectsStr);
      if (savedTasksStr) initialTasks = JSON.parse(savedTasksStr);
    } catch {}
    const { cleanedActivityLogs } = cleanOrphanedRecords(initialProjects, initialTasks, [], loadedLogs);
    return cleanedActivityLogs;
  });

  const [notifications, setNotifications] = useState<Notification[]>(() => {
    const saved = localStorage.getItem('morkhe_notifications');
    return saved ? JSON.parse(saved) : generateDeadlineNotifications(DUMMY_TASKS, DUMMY_PROJECTS);
  });

  // Real-time toast notification state (Mentions & Status Change with Undo)
  interface AppToastNotification {
    id: string;
    type: 'mention' | 'status_change';
    title: string;
    message: string;
    authorName?: string;
    authorAvatar?: string;
    task?: Task;
    statusInfo?: {
      taskId: string;
      prevStatus: Task['status'];
      newStatus: Task['status'];
      logId?: string;
      notifId?: string;
    };
  }
  const [appToast, setAppToast] = useState<AppToastNotification | null>(null);

  useEffect(() => {
    if (appToast) {
      const timer = setTimeout(() => {
        setAppToast(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [appToast]);

  useEffect(() => {
    localStorage.setItem('morkhe_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    if (localStorage.getItem('morkhe_is_authenticated') === 'true') {
      localStorage.setItem('morkhe_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser]);

  // Route protection when sandbox mode is disabled:
  // If not authenticated, ensure user cannot access internal pages without logging in
  useEffect(() => {
    if (!isSandboxMode) {
      const isAuth = localStorage.getItem('morkhe_is_authenticated') === 'true';
      if (!isAuth && !['P01', 'P02', 'P03'].includes(currentPage)) {
        setCurrentPage('P02');
      }
    }
  }, [currentPage, isSandboxMode]);

  // Sync project memberIds whenever tasks or projects change
  useEffect(() => {
    setProjects(prevProjects => {
      let hasChange = false;
      const updated = prevProjects.map(p => {
        const pTasks = tasks.filter(t => t.projectId === p.id);
        const taskAssignees = pTasks.flatMap(t => [t.assigneeId, ...(t.assigneeIds || [])].filter(Boolean));
        const currentMembers = p.memberIds || [];
        const merged = Array.from(new Set([...currentMembers, ...taskAssignees]));
        if (merged.length !== currentMembers.length || !merged.every(id => currentMembers.includes(id))) {
          hasChange = true;
          return { ...p, memberIds: merged };
        }
        return p;
      });
      return hasChange ? updated : prevProjects;
    });
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('morkhe_projects', JSON.stringify(projects));
    initializeCountersFromData(projects, tasks);
  }, [projects, tasks]);

  useEffect(() => {
    localStorage.setItem('morkhe_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('morkhe_comments', JSON.stringify(comments));
  }, [comments]);

  useEffect(() => {
    localStorage.setItem('morkhe_activity_logs', JSON.stringify(activityLogs));
  }, [activityLogs]);

  useEffect(() => {
    localStorage.setItem('morkhe_notifications', JSON.stringify(notifications));
  }, [notifications]);

  const handleUpdateUserLimit = (userId: string, newLimit: number) => {
    const targetUser = users.find(u => u.id === userId);
    const oldLimit = targetUser ? (targetUser.overloadLimit || (targetUser.role === 'PM' ? 2 : 3)) : 3;

    setUsers(prev => prev.map(u => u.id === userId ? { ...u, overloadLimit: newLimit } : u));
    setCurrentUser(prev => prev.id === userId ? { ...prev, overloadLimit: newLimit } : prev);

    // Auto-generate notification to the staff (Notifikasi ke Staff)
    if (targetUser && targetUser.role === 'Staff') {
      const capNotif: Notification = {
        id: `NTF-CAP-${Date.now()}-${userId}`,
        title: 'Batas Kapasitas Diperbarui',
        message: `Batas maksimal kapasitas tugas Anda diubah oleh ${currentUser.name} dari ${oldLimit} menjadi ${newLimit} tugas.`,
        type: 'system',
        timestamp: new Date().toISOString(),
        isRead: false,
        mentionedUserId: userId
      };

      setNotifications(prev => [capNotif, ...prev]);
    }
  };
  
  const [userNotificationSettings, setUserNotificationSettings] = useState<Record<string, NotificationSettings>>(() => {
    try {
      const saved = localStorage.getItem('morkhe_user_notification_settings');
      return saved ? JSON.parse(saved) : INITIAL_USER_NOTIFICATION_SETTINGS;
    } catch {
      return INITIAL_USER_NOTIFICATION_SETTINGS;
    }
  });

  useEffect(() => {
    localStorage.setItem('morkhe_user_notification_settings', JSON.stringify(userNotificationSettings));
  }, [userNotificationSettings]);

  // Active notification settings for current persona
  const currentNotificationSettings: NotificationSettings = userNotificationSettings[currentUser.id] || {
    taskReminders: [
      { id: `rem-3d-${currentUser.id}`, daysBefore: 3 },
      { id: `rem-due-${currentUser.id}`, daysBefore: 0 }
    ]
  };

  const handleSaveNotificationSettings = (newSettings: NotificationSettings) => {
    setUserNotificationSettings(prev => ({
      ...prev,
      [currentUser.id]: newSettings
    }));
  };

  // Account Settings Panel visibility
  const [isAccountOpen, setIsAccountOpen] = useState<boolean>(false);

  // Task Navigation & Detail Triggers
  const [selectedTaskForDetail, setSelectedTaskForDetail] = useState<Task | null>(null);
  const [taskDetailInitialTab, setTaskDetailInitialTab] = useState<'subtasks' | 'comments' | 'logs'>('subtasks');
  const [selectedProjectForDetail, setSelectedProjectForDetail] = useState<Project | null>(null);
  const [isAddProjectOpen, setIsAddProjectOpen] = useState<boolean>(false);
  const [addTaskInitialStatus, setAddTaskInitialStatus] = useState<Task['status']>('todo');
  const [addTaskInitialProjectId, setAddTaskInitialProjectId] = useState<string>('');

  const handleOpenAddTaskModal = (initialStatus?: Task['status'], targetProjectId?: string) => {
    const validStatus = (typeof initialStatus === 'string' && ['todo', 'in_progress', 'review', 'done', 'canceled_on_hold'].includes(initialStatus)) 
      ? (initialStatus as Task['status'])
      : 'todo';
    setAddTaskInitialStatus(validStatus);
    setAddTaskInitialProjectId(targetProjectId || '');
    setCurrentPage('P11');
  };

  const handleOpenTaskDetail = (task: Task, initialTab: 'subtasks' | 'comments' | 'logs' = 'subtasks') => {
    setSelectedTaskForDetail(task);
    setTaskDetailInitialTab(initialTab);
    setCurrentPage(currentUser.role === 'PM' ? 'P09' : 'P10');
  };

  const handleOpenProjectDetail = (project: Project) => {
    setSelectedProjectForDetail(project);
    const url = new URL(window.location.href);
    url.searchParams.set('project_id', project.id);
    window.history.pushState({}, '', url);
    setCurrentPage('P19');
  };

  // Sync selected task with current active state modifications so edits are reactive
  useEffect(() => {
    if (selectedTaskForDetail) {
      const refreshed = tasks.find(t => t.id === selectedTaskForDetail.id);
      if (refreshed) {
        setSelectedTaskForDetail(refreshed);
      }
    }
  }, [tasks]);

  // Sync selected project with updated project state
  useEffect(() => {
    if (selectedProjectForDetail) {
      const refreshed = projects.find(p => p.id === selectedProjectForDetail.id);
      if (refreshed) {
        setSelectedProjectForDetail(refreshed);
      }
    }
  }, [projects]);

  // Project addition handler
  const handleAddProject = (newProj: Project) => {
    setProjects([newProj, ...projects]);
    
    // Auto-generate notification alerting team of new project kickoff!
    const alertNotif: Notification = {
      id: `NTF-PRJ-${Date.now()}`,
      title: 'Proyek Desain Baru Ditugaskan',
      message: `PM Hafidz S. memulai portofolio "${newProj.name}" untuk klien "${newProj.client}". Periksa kalender!`,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'system'
    };
    setNotifications([alertNotif, ...notifications]);
  };

  const handleUpdateProject = (updatedProj: Project) => {
    setProjects(projects.map(p => p.id === updatedProj.id ? updatedProj : p));
  };

  const handleDeleteProject = (projectId: string) => {
    const nextProjects = projects.filter(p => p.id !== projectId);
    const nextTasks = tasks.filter(t => t.projectId !== projectId);
    const { cleanedComments, cleanedActivityLogs } = cleanOrphanedRecords(
      nextProjects,
      nextTasks,
      comments,
      activityLogs
    );

    setProjects(nextProjects);
    setTasks(nextTasks);
    setComments(cleanedComments);
    setActivityLogs(cleanedActivityLogs);

    if (selectedProjectForDetail && selectedProjectForDetail.id === projectId) {
      setSelectedProjectForDetail(null);
    }
  };

  // Task addition handler
  const handleAddTask = (newTask: Task) => {
    setTasks([newTask, ...tasks]);

    // Send a real-time notification to the assignee!
    const alertNotif: Notification = {
      id: `NTF-TSK-${Date.now()}`,
      title: 'Tugas Kreatif Baru',
      message: `Anda telah dialokasikan tugas baru: "${newTask.title}" dengan target tanggal tenggat ${formatDate(newTask.deadline)}.`,
      timestamp: new Date().toISOString(),
      isRead: false,
      type: 'system',
      taskId: newTask.id
    };
    setNotifications([alertNotif, ...notifications]);
  };

  // Re-assign task assignee handler (Triggered by AI workload auditor re-allocation)
  const handleReassignTask = (taskId: string, assigneeId: string) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (targetTask) {
      const updatedTask: Task = { ...targetTask, assigneeId, assigneeIds: [assigneeId] };
      const logs = generateTaskDiffLogs(targetTask, updatedTask, currentUser, users);
      if (logs.length > 0) {
        setActivityLogs(prev => [...logs, ...prev]);
      }
      const assignedUser = users.find(u => u.id === assigneeId);
      const uniqueSuffix = Math.random().toString(36).substring(2, 9);
      const shiftNotif: Notification = {
        id: `NTF-RE-${Date.now()}-${uniqueSuffix}`,
        title: 'Tugas Beban Kerja Dialokasikan Kembali',
        message: `Pekerjaan "${targetTask.title}" dialokasikan kembali kepada ${assignedUser ? assignedUser.name : 'anggota lain'} untuk keseimbangan kapasitas studio.`,
        timestamp: new Date().toISOString(),
        isRead: false,
        type: 'system',
        taskId: targetTask.id
      };
      setNotifications(n => [shiftNotif, ...n]);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    }
  };

  // Trigger Status Change Toast with Undo capability
  const triggerStatusChangeToast = (
    targetTask: Task,
    prevStatus: Task['status'],
    newStatus: Task['status'],
    logId?: string,
    notifId?: string
  ) => {
    const newLabel = STATUS_LABELS[newStatus] || newStatus;

    setAppToast({
      id: `toast-status-${Date.now()}`,
      type: 'status_change',
      title: 'Status Tugas Diperbarui',
      message: `"${targetTask.title}" diubah ke ${newLabel}`,
      statusInfo: {
        taskId: targetTask.id,
        prevStatus,
        newStatus,
        logId,
        notifId
      }
    });
  };

  // Revert status change (Undo / Ctrl+Z action)
  const handleUndoStatusChange = (statusInfo: {
    taskId: string;
    prevStatus: Task['status'];
    newStatus: Task['status'];
    logId?: string;
    notifId?: string;
  }) => {
    const { taskId, prevStatus, logId, notifId } = statusInfo;
    
    // a. Revert task status
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: prevStatus } : t));
    setSelectedTaskForDetail(prev => prev && prev.id === taskId ? { ...prev, status: prevStatus } : prev);

    // b. Remove the generated activity log entry (splice/filter) - NO new log created
    if (logId) {
      setActivityLogs(prev => prev.filter(l => l.id !== logId));
    }

    // c. Remove completion notification if generated
    if (notifId) {
      setNotifications(prev => prev.filter(n => n.id !== notifId));
    }

    // d. Dismiss toast immediately
    setAppToast(null);
  };

  // Global Ctrl+Z / Cmd+Z Keyboard Shortcut Listener for Undo Status Change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Check if (Ctrl or Cmd) + 'z' is pressed (case-insensitive, no shift)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        // 2. Guard: do not intercept if the active focused element is editable (input, textarea, contenteditable)
        const activeEl = document.activeElement;
        const isEditable = activeEl && (
          activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          (activeEl as HTMLElement).isContentEditable ||
          activeEl.getAttribute('contenteditable') === 'true'
        );
        if (isEditable) return;

        // 3. Trigger only if toast/undo status change is currently active
        if (appToast && appToast.type === 'status_change' && appToast.statusInfo) {
          e.preventDefault();
          handleUndoStatusChange(appToast.statusInfo);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [appToast]);

  // Move task status lanes on Kanban board (Drag and Drop trigger)
  const handleUpdateTaskStatus = (
    taskId: string, 
    newStatus: Task['status'],
    targetNeighborTaskId?: string,
    insertBefore: boolean = true
  ) => {
    const targetTask = tasks.find(t => t.id === taskId);
    if (!targetTask) return;

    const prevStatus = targetTask.status;
    const isStatusChanged = prevStatus !== newStatus;
    const updatedTask: Task = { ...targetTask, status: newStatus };

    let createdLogId: string | undefined;
    let doneNotifId: string | undefined;

    // Only generate activity logs, notifications, and undo toast when column status actually changes
    if (isStatusChanged) {
      const logs = generateTaskDiffLogs(targetTask, updatedTask, currentUser, users);
      
      if (logs.length > 0) {
        const statusLog = logs.find(l => l.type === 'status');
        createdLogId = statusLog?.id || logs[0].id;
        setActivityLogs(prev => [...logs, ...prev]);
      }

      if (newStatus === 'done' && prevStatus !== 'done') {
        const uniqueSuffix = Math.random().toString(36).substring(2, 9);
        doneNotifId = `NTF-DONE-${Date.now()}-${uniqueSuffix}`;
        const alertNotif: Notification = {
          id: doneNotifId,
          title: 'Pekerjaan Selesai',
          message: `Tugas "${targetTask.title}" telah selesai dan dipindahkan ke jalur Selesai. Siap untuk ditinjau.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'system',
          taskId: targetTask.id
        };
        setNotifications(n => [alertNotif, ...n]);
      }

      // Trigger Status Change Toast with Undo capability
      triggerStatusChangeToast(targetTask, prevStatus, newStatus, createdLogId, doneNotifId);
    }

    // Atomic array repositioning and status mutation in a single setTasks call
    setTasks(prev => {
      // 1. Remove dragged task from its existing position
      const filtered = prev.filter(t => t.id !== taskId);

      // 2. If target neighbor task is specified and exists, splice relative to it
      if (targetNeighborTaskId && targetNeighborTaskId !== taskId) {
        const neighborIdx = filtered.findIndex(t => t.id === targetNeighborTaskId);
        if (neighborIdx !== -1) {
          const insertIdx = insertBefore ? neighborIdx : neighborIdx + 1;
          const nextTasks = [...filtered];
          nextTasks.splice(insertIdx, 0, updatedTask);
          return nextTasks;
        }
      }

      // 3. Fallback: if dropped into a column with tasks of that status, insert after the last task with newStatus
      if (isStatusChanged) {
        const lastStatusIdx = filtered.reduce((lastIdx, t, idx) => {
          return t.status === newStatus ? idx : lastIdx;
        }, -1);

        if (lastStatusIdx !== -1) {
          const nextTasks = [...filtered];
          nextTasks.splice(lastStatusIdx + 1, 0, updatedTask);
          return nextTasks;
        }
      }

      // Default: append to tasks array
      return [...filtered, updatedTask];
    });

    setSelectedTaskForDetail(prev => prev && prev.id === taskId ? updatedTask : prev);
  };

  // Full Task Spec editing/updating
  const handleUpdateTaskDetails = (updatedTask: Task) => {
    const targetTask = tasks.find(t => t.id === updatedTask.id);
    if (targetTask) {
      const isStatusChanged = targetTask.status !== updatedTask.status;
      const prevStatus = targetTask.status;
      const newStatus = updatedTask.status;

      const logs = generateTaskDiffLogs(targetTask, updatedTask, currentUser, users);
      let createdLogId: string | undefined;
      if (logs.length > 0) {
        const statusLog = logs.find(l => l.type === 'status');
        createdLogId = statusLog?.id;
        setActivityLogs(prev => [...logs, ...prev]);
      }

      let doneNotifId: string | undefined;
      if (isStatusChanged && newStatus === 'done' && prevStatus !== 'done') {
        const uniqueSuffix = Math.random().toString(36).substring(2, 9);
        doneNotifId = `NTF-DONE-${Date.now()}-${uniqueSuffix}`;
        const alertNotif: Notification = {
          id: doneNotifId,
          title: 'Pekerjaan Selesai',
          message: `Tugas "${targetTask.title}" telah selesai dan dipindahkan ke jalur Selesai. Siap untuk ditinjau.`,
          timestamp: new Date().toISOString(),
          isRead: false,
          type: 'system',
          taskId: targetTask.id
        };
        setNotifications(n => [alertNotif, ...n]);
      }

      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
      setSelectedTaskForDetail(prev => prev && prev.id === updatedTask.id ? updatedTask : prev);

      // If status was changed (e.g. from Status Dropdown in Task Control Panel), trigger toast + undo
      if (isStatusChanged) {
        triggerStatusChangeToast(targetTask, prevStatus, newStatus, createdLogId, doneNotifId);
      }
    } else {
      setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t));
    }
  };

  // Task deletion
  const handleDeleteTask = (taskId: string) => {
    const nextTasks = tasks.filter(t => t.id !== taskId);
    const { cleanedComments, cleanedActivityLogs } = cleanOrphanedRecords(
      projects,
      nextTasks,
      comments,
      activityLogs
    );

    setTasks(nextTasks);
    setComments(cleanedComments);
    setActivityLogs(cleanedActivityLogs);
    setSelectedTaskForDetail(null);
  };

  // Add Comment thread inside Task detail or Project detail
  const handleAddComment = (
    targetId: string, 
    commentText: string, 
    attachments?: CommentAttachment[], 
    isProjectComment?: boolean
  ) => {
    if (!commentText.trim() && (!attachments || attachments.length === 0)) return;

    const newComment: Comment = {
      id: `CMT-${Date.now()}`,
      taskId: isProjectComment ? undefined : targetId,
      projectId: isProjectComment ? targetId : undefined,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorAvatar: currentUser.avatar,
      authorRole: currentUser.role,
      content: commentText.trim(),
      createdAt: new Date().toISOString(),
      attachments: attachments || []
    };

    setComments(prev => [newComment, ...prev]);

    // Parse @mentions in comment text
    const lowerText = commentText.toLowerCase();
    const mentionedUsers = users.filter(u => {
      const uHandle = u.username ? `@${u.username.toLowerCase()}` : '';
      const uFirst = `@${u.name.toLowerCase().split(' ')[0]}`;
      const uFull = `@${u.name.toLowerCase().replace(/\s+/g, '')}`;
      return (uHandle && lowerText.includes(uHandle)) || 
             lowerText.includes(uFirst) || 
             lowerText.includes(uFull) ||
             (lowerText.includes('@hafidz') && u.id === 'USR01') ||
             (lowerText.includes('@aditya') && u.id === 'USR02') ||
             ((lowerText.includes('@fitri') || lowerText.includes('@raditya') || lowerText.includes('@amir')) && u.id === 'USR03') ||
             ((lowerText.includes('@rian') || lowerText.includes('@hamzah')) && u.id === 'USR04');
    });

    const linkedTask = !isProjectComment ? tasks.find(t => t.id === targetId) : undefined;
    const linkedProject = isProjectComment ? projects.find(p => p.id === targetId) : undefined;

    if (mentionedUsers.length > 0) {
      const mentionNotifs: Notification[] = mentionedUsers.map(u => ({
        id: `NTF-MEN-${Date.now()}-${u.id}`,
        title: `${currentUser.name} menyebut ${u.id === currentUser.id ? 'Anda' : u.name} dalam komentar ${isProjectComment ? 'proyek' : 'tugas'}`,
        message: commentText.trim(),
        type: 'mention',
        timestamp: new Date().toISOString(),
        taskId: isProjectComment ? undefined : targetId,
        projectId: isProjectComment ? targetId : undefined,
        isRead: false,
        mentionedUserId: u.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        commentId: newComment.id
      }));

      setNotifications(prev => [...mentionNotifs, ...prev]);

      // Trigger real-time floating Toast notification
      setAppToast({
        id: `toast-${Date.now()}`,
        type: 'mention',
        title: `${currentUser.name} menandai Anda di komentar ${isProjectComment ? (linkedProject?.name || 'proyek') : (linkedTask?.title || 'tugas')}`,
        message: commentText.trim(),
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        task: linkedTask
      });
    } else if (lowerText.includes('@')) {
      // Generic mention fallback when @ was typed
      const alertNotif: Notification = {
        id: `NTF-MEN-${Date.now()}`,
        title: `${currentUser.name} menambahkan sebutan komentar`,
        message: commentText.trim(),
        type: 'mention',
        timestamp: new Date().toISOString(),
        taskId: isProjectComment ? undefined : targetId,
        projectId: isProjectComment ? targetId : undefined,
        isRead: false,
        mentionedUserId: currentUser.id,
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        commentId: newComment.id
      };
      setNotifications(prev => [alertNotif, ...prev]);

      setAppToast({
        id: `toast-${Date.now()}`,
        type: 'mention',
        title: `${currentUser.name} menyebut Anda`,
        message: commentText.trim(),
        authorName: currentUser.name,
        authorAvatar: currentUser.avatar,
        task: linkedTask
      });
    } else {
      // Standard notification for PM (Arah 2: Notifikasi balik ke PM saat Staff memberi tanggapan/komentar)
      const pmUser = users.find(u => u.role === 'PM') || users[0];
      const targetUserToNotify = currentUser.role === 'Staff'
        ? pmUser
        : (linkedTask ? users.find(u => u.id === linkedTask.assigneeId) : undefined);

      if (targetUserToNotify && targetUserToNotify.id !== currentUser.id) {
        const commentNotif: Notification = {
          id: `NTF-CMT-${Date.now()}`,
          title: `Komentar Baru dari ${currentUser.name}`,
          message: `"${commentText.trim()}" pada ${isProjectComment ? (linkedProject?.name || 'proyek') : (linkedTask?.title || 'tugas')}`,
          type: 'system',
          timestamp: new Date().toISOString(),
          taskId: isProjectComment ? undefined : targetId,
          projectId: isProjectComment ? targetId : undefined,
          isRead: false,
          mentionedUserId: targetUserToNotify.id,
          authorName: currentUser.name,
          authorAvatar: currentUser.avatar,
          commentId: newComment.id
        };
        setNotifications(prev => [commentNotif, ...prev]);
      }
    }
  };

  // Edit Comment
  const handleEditComment = (commentId: string, newContent: string) => {
    if (!newContent.trim()) return;
    setComments(prev => prev.map(c => c.id === commentId ? { ...c, content: newContent.trim() } : c));
  };

  // Delete Comment
  const handleDeleteComment = (commentId: string) => {
    setComments(prev => prev.filter(c => c.id !== commentId));
  };

  // Mark specific notification as read
  const handleMarkNotifRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  // Mark all notifications as read
  const handleMarkAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  // Clear all notifications
  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Edit / update profile details (P18)
  const handleUpdateCurrentUser = (updatedUser: User) => {
    setCurrentUser(updatedUser);
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  };

  // Handle user logout (redirect to P02 Login Portal, reset session)
  const handleLogout = () => {
    setIsAccountOpen(false);
    localStorage.removeItem('morkhe_is_authenticated');
    localStorage.removeItem('morkhe_current_user');
    setCurrentUser(DUMMY_USERS[0]);
    setCurrentPage('P02');
  };

  // Reset all data to initial baseline
  const handleResetBaselineData = () => {
    localStorage.removeItem('morkhe_users');
    localStorage.removeItem('morkhe_current_user');
    localStorage.removeItem('morkhe_is_authenticated');
    localStorage.removeItem('morkhe_projects');
    localStorage.removeItem('morkhe_tasks');
    localStorage.removeItem('morkhe_comments');
    localStorage.removeItem('morkhe_activity_logs');
    localStorage.removeItem('morkhe_notifications');
    localStorage.removeItem('morkhe_user_notification_settings');
    setUsers(DUMMY_USERS);
    setCurrentUser(DUMMY_USERS[0]);
    setProjects(DUMMY_PROJECTS);
    setTasks(DUMMY_TASKS);
    setComments(DUMMY_COMMENTS);
    setActivityLogs(DUMMY_ACTIVITY_LOGS);
    setNotifications(generateDeadlineNotifications(DUMMY_TASKS, DUMMY_PROJECTS));
    setUserNotificationSettings(INITIAL_USER_NOTIFICATION_SETTINGS);
    setCurrentPage('P04');
  };

  // Determine if active page is inside an auth screen (which hides headers/sidebars)
  const isAuthPage = ['P01', 'P02', 'P03'].includes(currentPage);
  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="h-screen bg-morkhe-white flex flex-col text-morkhe-black overflow-hidden relative">

      {isAuthPage ? (
        // Simple auth viewport without sidebars
        <div className="flex-1 overflow-y-auto relative">
          {isSandboxMode && (
            <div className="absolute top-4 right-4 z-50">
              <SandboxController 
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
                currentUser={currentUser}
                setCurrentUser={setCurrentUser}
                users={users}
                onResetData={handleResetBaselineData}
              />
            </div>
          )}
          <AuthPages 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            users={users}
            setCurrentUser={setCurrentUser}
            isSandboxMode={isSandboxMode}
          />
        </div>
      ) : (
        // High fidelity sidebar + content layout
        <div className="flex-1 flex overflow-hidden relative">
          
          {/* Role-Adaptive Sidebar Navigation */}
          <Sidebar 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            currentUser={currentUser}
            tasks={tasks}
            users={users}
            notificationsCount={unreadNotificationsCount}
          />

          {/* Main workspace container */}
          <main className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Elegant Global Top Header Bar */}
            <header className="h-14 border-b border-gray-200 bg-morkhe-white px-6 flex items-center justify-between shrink-0 select-none">
              <div className="text-xs font-bold text-morkhe-black uppercase tracking-wider">
                {currentPage === 'P04' || currentPage === 'P05' ? 'Dasbor' :
                 currentPage === 'P06' ? 'Proyek' :
                 ['P07', 'P08', 'P09', 'P10', 'P11', 'P15', 'P16', 'P20'].includes(currentPage) ? 'Ruang Kerja' :
                 currentPage === 'P13' || currentPage === 'P14' ? 'Pusat Notifikasi' :
                 currentPage === 'P18' ? 'Pengaturan Akun' : 'Ruang Kerja'}
              </div>
              <div className="flex items-center gap-3">
                {/* Prototype Control Trigger (Shield Button) - Only visible in Dev / Sandbox mode */}
                {isSandboxMode && (
                  <SandboxController 
                    currentPage={currentPage}
                    setCurrentPage={setCurrentPage}
                    currentUser={currentUser}
                    setCurrentUser={setCurrentUser}
                    users={users}
                    onResetData={handleResetBaselineData}
                  />
                )}

                <NotificationPopover 
                  notifications={notifications}
                  notificationSettings={currentNotificationSettings}
                  tasks={tasks}
                  currentUser={currentUser}
                  onMarkAsRead={handleMarkNotifRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClearAll={handleClearNotifications}
                  onSaveSettings={handleSaveNotificationSettings}
                  onOpenTaskDetail={handleOpenTaskDetail}
                  onNavigateToPage={setCurrentPage}
                />
                
                {/* Profile Compact Button */}
                <div className="relative border-l border-gray-200 pl-3">
                  <button
                    id="btn-profile-card-topbar"
                    onClick={() => setIsAccountOpen(!isAccountOpen)}
                    className="flex items-center gap-2 p-1 pr-2 hover:bg-gray-100 rounded-full transition-all focus:outline-none cursor-pointer"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      className="w-7 h-7 rounded-full border border-gray-200 object-cover"
                    />
                    <div className="hidden md:flex flex-col items-start gap-0.5">
                      <span className="text-xs font-bold text-morkhe-black leading-none">{currentUser.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold leading-tight ${
                        currentUser.role === 'PM'
                          ? 'bg-morkhe-black text-morkhe-green'
                          : 'bg-morkhe-dark-purple text-morkhe-white'
                      }`}>
                        [{currentUser.role === 'PM' ? 'PM' : 'Staf'}] {currentUser.position.replace(' (Project Manager)', '')}
                      </span>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>

                  {isAccountOpen && (
                    <>
                      <div 
                        className="fixed inset-0 z-40 cursor-default bg-transparent" 
                        onClick={() => setIsAccountOpen(false)} 
                      />
                      <div className="absolute right-0 mt-3 w-56 bg-morkhe-black border border-gray-800 rounded-xl shadow-lg z-50 p-2.5 space-y-1 font-sans text-morkhe-white">
                        <div className="px-2 py-1.5 border-b border-gray-800 flex items-center gap-2">
                          <img
                            src={currentUser.avatar}
                            alt={currentUser.name}
                            className="w-8 h-8 rounded-full border border-gray-700 object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <h3 className="text-xs font-bold text-morkhe-white truncate">{currentUser.name}</h3>
                            <p className="text-[9px] text-gray-400 truncate font-medium">{currentUser.email || 'hafidz@morkhe.studio'}</p>
                          </div>
                        </div>

                        <div className="pt-1.5 space-y-0.5">
                          <button
                            id="btn-profile-edit"
                            onClick={() => {
                              setCurrentPage('P18');
                              setIsAccountOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:text-morkhe-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer font-medium text-left"
                          >
                            <UserIcon className="h-4 w-4 text-gray-400" />
                            <span>Pengaturan Akun</span>
                          </button>
                          <button
                            id="btn-profile-notif-settings"
                            onClick={() => {
                              setCurrentPage('P14');
                              setIsAccountOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:text-morkhe-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer font-medium text-left"
                          >
                            <Bell className="h-4 w-4 text-gray-400" />
                            <span>Pengaturan Notifikasi</span>
                          </button>
                        </div>

                        {/* Divider & Keluar Item */}
                        <div className="pt-1 border-t border-gray-800">
                          <button
                            id="btn-profile-logout"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-2.5 py-1.5 text-xs text-gray-300 hover:text-morkhe-white hover:bg-gray-800 rounded-lg transition-all cursor-pointer font-medium text-left"
                          >
                            <LogOut className="h-4 w-4 text-gray-400" />
                            <span>Keluar</span>
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </header>

            {/* Scrollable Sub-View Area */}
            <div className="flex-1 overflow-y-auto">
              
              {/* Dashboard pages */}
              {(currentPage === 'P04' || currentPage === 'P05') && (
                <DashboardPages 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  currentUser={currentUser}
                  users={users}
                  projects={projects}
                  tasks={tasks}
                  comments={comments}
                  onOpenTaskDetail={handleOpenTaskDetail}
                  onUpdateUserLimit={handleUpdateUserLimit}
                />
              )}

              {/* Projects Directory (P06) */}
              {currentPage === 'P06' && (
                <ProjectListPage 
                  currentUser={currentUser}
                  projects={projects}
                  users={users}
                  tasks={tasks}
                  comments={comments}
                  onOpenAddProjectModal={() => setCurrentPage('P12')}
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  onOpenProjectDetail={handleOpenProjectDetail}
                  setCurrentPage={setCurrentPage}
                />
              )}

              {/* Create Project Page (P12) */}
              {currentPage === 'P12' && (
                <CreateProjectPage 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  currentUser={currentUser}
                  users={users}
                  tasks={tasks}
                  onAddProject={handleAddProject}
                />
              )}

              {/* Project Detail Page (P19) */}
              {currentPage === 'P19' && (
                <ProjectDetailPage 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  currentUser={currentUser}
                  users={users}
                  projects={projects}
                  tasks={tasks}
                  comments={comments}
                  project={
                    selectedProjectForDetail || 
                    projects.find(p => p.id === new URLSearchParams(window.location.search).get('project_id')) || 
                    projects[0]
                  }
                  onUpdateProject={handleUpdateProject}
                  onDeleteProject={handleDeleteProject}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              )}

              {/* Merged "Tugas" containing both Kanban Board and Calendar view */}
              {['P07', 'P08', 'P15', 'P16', 'P20'].includes(currentPage) && (
                <TugasPages 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  currentUser={currentUser}
                  users={users}
                  projects={projects}
                  tasks={tasks}
                  comments={comments}
                  onOpenAddTaskModal={handleOpenAddTaskModal}
                  onUpdateTaskStatus={handleUpdateTaskStatus}
                  onOpenTaskDetail={handleOpenTaskDetail}
                />
              )}

              {/* Notification Center / Settings (P13 & P14) - Kept for sandbox direct navigation compatibility */}
              {(currentPage === 'P13' || currentPage === 'P14') && (
                <NotificationPages 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  notifications={notifications}
                  notificationSettings={currentNotificationSettings}
                  tasks={tasks}
                  currentUser={currentUser}
                  onMarkAsRead={handleMarkNotifRead}
                  onMarkAllAsRead={handleMarkAllAsRead}
                  onClearAll={handleClearNotifications}
                  onSaveSettings={handleSaveNotificationSettings}
                  onOpenTaskDetail={handleOpenTaskDetail}
                />
              )}

              {/* Full-Page Task View / Create / Edit (P09, P10, P11) */}
              {['P09', 'P10', 'P11'].includes(currentPage) && (
                <TaskDetailPage 
                  currentPage={currentPage}
                  setCurrentPage={setCurrentPage}
                  currentUser={currentUser}
                  users={users}
                  projects={projects}
                  tasks={tasks}
                  task={currentPage === 'P11' ? null : (selectedTaskForDetail || tasks[0])}
                  initialStatus={addTaskInitialStatus}
                  initialProjectId={addTaskInitialProjectId}
                  initialTab={taskDetailInitialTab}
                  comments={currentPage === 'P11' ? [] : comments.filter(c => c.taskId === (selectedTaskForDetail?.id || tasks[0]?.id))}
                  activityLogs={currentPage === 'P11' ? [] : activityLogs.filter(l => l.taskId === (selectedTaskForDetail?.id || tasks[0]?.id))}
                  onAddTask={handleAddTask}
                  onUpdateTask={handleUpdateTaskDetails}
                  onDeleteTask={handleDeleteTask}
                  onAddComment={handleAddComment}
                  onEditComment={handleEditComment}
                  onDeleteComment={handleDeleteComment}
                />
              )}

              {/* Edit Profile Page (P18) */}
              {currentPage === 'P18' && (
                <SettingsPages 
                  currentPage={currentPage}
                  currentUser={currentUser}
                  onUpdateCurrentUser={handleUpdateCurrentUser}
                />
              )}

            </div>

          </main>

        </div>
      )}

      {/* Real-Time Toast Notification (Mentions & Status Change with Undo) */}
      {appToast && (
        <div
          id="toast-notification-banner"
          className="fixed bottom-6 right-6 z-50 max-w-sm w-[350px] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 flex gap-3.5 items-start select-none transition-all duration-300 transform translate-y-0"
        >
          {appToast.type === 'mention' ? (
            <>
              <div className="relative shrink-0 mt-0.5">
                <img
                  src={appToast.authorAvatar}
                  alt={appToast.authorName || 'User'}
                  className="w-10 h-10 rounded-full object-cover border border-purple-200"
                />
                <div className="absolute -bottom-1 -right-1 bg-morkhe-purple text-white rounded-full p-0.5 ring-1 ring-white">
                  <AtSign className="h-2.5 w-2.5" />
                </div>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-morkhe-purple bg-purple-50 px-1.5 py-0.5 rounded">
                    Sebutan Baru
                  </span>
                  <button
                    id="btn-close-toast"
                    onClick={() => setAppToast(null)}
                    className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer rounded hover:bg-gray-100 transition-colors"
                    title="Tutup Notifikasi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <h4 className="text-xs font-bold text-gray-900 leading-tight">
                  {appToast.title}
                </h4>
                <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed">
                  "{appToast.message}"
                </p>
                {appToast.task && (
                  <div className="pt-1">
                    <button
                      onClick={() => {
                        if (appToast.task) {
                          handleOpenTaskDetail(appToast.task);
                          setAppToast(null);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-bold text-morkhe-purple hover:text-purple-800 hover:underline cursor-pointer"
                    >
                      <span>Buka Konteks Tugas</span>
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="shrink-0 mt-0.5 p-2 bg-purple-50 text-morkhe-purple rounded-xl border border-purple-100">
                <CheckCircle className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded">
                    Perubahan Status
                  </span>
                  <button
                    id="btn-close-toast"
                    onClick={() => setAppToast(null)}
                    className="text-gray-400 hover:text-gray-700 p-0.5 cursor-pointer rounded hover:bg-gray-100 transition-colors"
                    title="Tutup Notifikasi"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-gray-900 leading-tight">
                    {appToast.title}
                  </h4>
                  <p className="text-[11px] text-gray-600 line-clamp-2 leading-relaxed mt-0.5">
                    {appToast.message}
                  </p>
                </div>
                {appToast.statusInfo && (
                  <div className="pt-1">
                    <button
                      id="btn-undo-status-change"
                      onClick={() => appToast.statusInfo && handleUndoStatusChange(appToast.statusInfo)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-morkhe-black hover:bg-gray-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      title="Urungkan perubahan status (Ctrl+Z)"
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Urungkan</span>
                      <kbd className="hidden sm:inline-block text-[10px] bg-white/20 px-1 py-0.2 rounded text-gray-200 font-sans font-normal ml-0.5">
                        Ctrl+Z
                      </kbd>
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

    </div>
  );
}
