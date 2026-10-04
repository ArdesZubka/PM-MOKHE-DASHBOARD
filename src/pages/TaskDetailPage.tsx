/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ChevronRight, 
  Calendar, 
  User as UserIcon, 
  CheckSquare, 
  MessageSquare, 
  History,
  AlertTriangle, 
  ShieldCheck, 
  Trash2, 
  Edit3, 
  Save, 
  X, 
  Plus, 
  Lock,
  ArrowLeft,
  FileText,
  UserCheck,
  CornerUpLeft,
  Paperclip,
  Upload,
  Link2,
  ExternalLink,
  Download,
  Eye
} from 'lucide-react';
import { User, Project, Task, Comment, ActivityLog, Subtask, TaskAttachment, CommentAttachment } from '../types';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { generateTaskCode } from '../utils/codeGenerator';
import { formatDate } from '../utils/dateFormat';
import { getWorkloadInfo } from '../utils/taskUtils';
import { formatLogDateTime } from '../utils/activityLogger';

interface TaskDetailPageProps {
  currentPage: string; // 'P09' | 'P10' | 'P11'
  setCurrentPage: (page: string) => void;
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  task: Task | null; // Null if P11 (CREATE mode)
  initialStatus?: Task['status'];
  initialProjectId?: string;
  initialTab?: 'subtasks' | 'comments' | 'logs';
  comments: Comment[];
  activityLogs?: ActivityLog[];
  onAddTask: (newTask: Task) => void;
  onUpdateTask: (updatedTask: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onAddComment: (taskId: string, content: string, attachments?: CommentAttachment[]) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export default function TaskDetailPage({
  currentPage,
  setCurrentPage,
  currentUser,
  users,
  projects,
  tasks,
  task,
  initialStatus = 'todo',
  initialProjectId = '',
  initialTab = 'subtasks',
  comments,
  activityLogs = [],
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onAddComment,
  onEditComment,
  onDeleteComment
}: TaskDetailPageProps) {
  const isPM = currentUser.role === 'PM';
  const isCreateMode = currentPage === 'P11';

  // State for view / edit mode on detail pages
  const [isEditing, setIsEditing] = useState<boolean>(isCreateMode);

  // Form states
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [selectedAssigneeIds, setSelectedAssigneeIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Task['status']>('todo');
  const [priority, setPriority] = useState<Task['priority']>('Medium');
  const [startDate, setStartDate] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [subtasks, setSubtasks] = useState<Subtask[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState<string>('');
  const [editingSubtaskId, setEditingSubtaskId] = useState<string | null>(null);
  const [editingSubtaskTitle, setEditingSubtaskTitle] = useState<string>('');
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState<string>('');

  // Task Attachments state (Level Tugas)
  const [taskAttachments, setTaskAttachments] = useState<TaskAttachment[]>([]);
  const [showAddLinkForm, setShowAddLinkForm] = useState<boolean>(false);
  const [linkUrlInput, setLinkUrlInput] = useState<string>('');
  const [linkTextInput, setLinkTextInput] = useState<string>('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const descriptionRef = React.useRef<HTMLTextAreaElement>(null);

  // Comment Attachments state (Level Komentar)
  const [pendingCommentAttachments, setPendingCommentAttachments] = useState<CommentAttachment[]>([]);
  const [showCommentAttachMenu, setShowCommentAttachMenu] = useState<boolean>(false);
  const [showCommentLinkForm, setShowCommentLinkForm] = useState<boolean>(false);
  const [commentLinkUrl, setCommentLinkUrl] = useState<string>('');
  const [commentLinkText, setCommentLinkText] = useState<string>('');
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);

  // Delete modal confirmation
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<boolean>(false);

  // Active tab inside left column ('subtasks' | 'comments' | 'logs')
  const [activeTab, setActiveTab] = useState<'subtasks' | 'comments' | 'logs'>(initialTab || 'subtasks');

  // Synchronize activeTab if initialTab changes (e.g. redirected from capacity notification)
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, task?.id]);

  // Determine who assigned this task
  const assignedByUserId = task?.assignedBy || (task ? 'USR01' : currentUser.id);
  const assignerUser = users.find(u => u.id === assignedByUserId);
  const pmName = assignerUser ? assignerUser.name.replace(/\.$/, '') : 'PM';

  // RBAC checks for Staff
  // Staff can ONLY edit full details / delete if assignedBy === staff.id (or if PM)
  const canEditFullDetails = isPM || (assignedByUserId === currentUser.id);
  const canDeleteTask = isPM || (assignedByUserId === currentUser.id);

  // Sync form state when task or mode changes
  useEffect(() => {
    if (isCreateMode) {
      setIsEditing(true);
      setTitle('');
      setDescription('');

      // Determine prefilled project context if available from Kanban filter or props
      let prefilledProj = '';
      if (initialProjectId && projects.some(p => p.id === initialProjectId)) {
        if (isPM || projects.find(p => p.id === initialProjectId)?.memberIds?.includes(currentUser.id)) {
          prefilledProj = initialProjectId;
        }
      } else {
        const searchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
        const urlProj = searchParams?.get('project_id');
        if (urlProj && urlProj !== 'all' && projects.some(p => p.id === urlProj)) {
          if (isPM || projects.find(p => p.id === urlProj)?.memberIds?.includes(currentUser.id)) {
            prefilledProj = urlProj;
          }
        }
      }

      setProjectId(prefilledProj);

      // If prefilledProj is set and user is Staff, auto-assign to self if member of project
      if (prefilledProj) {
        const projObj = projects.find(p => p.id === prefilledProj);
        if (!isPM) {
          if (projObj?.memberIds?.includes(currentUser.id)) {
            setSelectedAssigneeIds([currentUser.id]);
          } else {
            setSelectedAssigneeIds([]);
          }
        } else {
          setSelectedAssigneeIds([]);
        }
      } else {
        setSelectedAssigneeIds([]);
      }

      const validInitialStatus = (typeof initialStatus === 'string' && ['todo', 'in_progress', 'review', 'done', 'canceled_on_hold'].includes(initialStatus))
        ? (initialStatus as Task['status'])
        : 'todo';
      setStatus(validInitialStatus);
      setPriority('Medium');
      // Default dates: today and +7 days
      const todayStr = '2026-07-06';
      setStartDate(todayStr);
      setDeadline('2026-07-13');
      setSubtasks([]);
      setTaskAttachments([]);
    } else if (task) {
      setIsEditing(false);
      setTitle(task.title);
      setDescription(task.description);
      setProjectId(task.projectId);
      const assignees = task.assigneeIds && task.assigneeIds.length > 0 
        ? task.assigneeIds 
        : [task.assigneeId];
      setSelectedAssigneeIds(assignees);
      setStatus(task.status);
      setPriority(task.priority);
      setStartDate(task.startDate);
      setDeadline(task.deadline);
      setSubtasks(task.subtasks || []);
      setTaskAttachments(task.attachments || []);
    }
  }, [task, currentPage, isCreateMode, initialStatus, initialProjectId]);

  // Auto-grow logic for description textarea (starting at min 3 rows, max 12 rows with internal scroll)
  React.useEffect(() => {
    if (isEditing && descriptionRef.current) {
      const textarea = descriptionRef.current;
      textarea.style.height = 'auto';
      const minHeight = 72; // ~3 rows
      const maxHeight = 280; // ~12 rows
      const targetHeight = Math.min(Math.max(textarea.scrollHeight, minHeight), maxHeight);
      textarea.style.height = `${targetHeight}px`;
      
      if (textarea.scrollHeight > maxHeight) {
        textarea.style.overflowY = 'auto';
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [description, isEditing]);

  // Handle navigating back to Kanban
  const handleNavigateToKanban = (filterProjId?: string) => {
    const targetPage = isPM ? 'P07' : 'P08';
    if (filterProjId && filterProjId !== 'all') {
      const url = new URL(window.location.href);
      url.searchParams.set('project_id', filterProjId);
      window.history.pushState({}, '', url);
    }
    setCurrentPage(targetPage);
  };

  // Helper to compute active task count for a user
  const getUserActiveTaskCount = (userId: string) => {
    return tasks.filter(t => {
      if (task && t.id === task.id) return false; // Exclude current task when updating
      const isAssigned = t.assigneeIds ? t.assigneeIds.includes(userId) : t.assigneeId === userId;
      return isAssigned && t.status !== 'done' && t.status !== 'canceled_on_hold';
    }).length;
  };

  // Check overload warnings for selected assignees
  const overloadedUsers = selectedAssigneeIds
    .map(uid => {
      const u = users.find(usr => usr.id === uid);
      if (!u) return null;
      const currentActive = getUserActiveTaskCount(uid);
      // In create mode or adding task, add 1 for preview
      const projectedActive = (isCreateMode || (task && !task.assigneeIds?.includes(uid)))
        ? currentActive + 1 
        : currentActive;
      if (projectedActive > u.overloadLimit) {
        return { user: u, current: projectedActive, limit: u.overloadLimit };
      }
      return null;
    })
    .filter((item): item is { user: User; current: number; limit: number } => item !== null);

  // Subtask checkbox toggling (works in BOTH view and edit mode)
  const handleToggleSubtask = (subtaskId: string) => {
    const updatedSubtasks = subtasks.map(s => 
      s.id === subtaskId ? { ...s, isCompleted: !s.isCompleted } : s
    );
    setSubtasks(updatedSubtasks);

    // If viewing existing task, sync to global state immediately
    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        subtasks: updatedSubtasks
      });
    }
  };

  // Status dropdown change in VIEW mode
  const handleViewModeStatusChange = (newStatus: Task['status']) => {
    setStatus(newStatus);
    if (task) {
      onUpdateTask({
        ...task,
        status: newStatus
      });
    }
  };

  // Add new subtask item
  const handleAddSubtaskItem = () => {
    if (!newSubtaskTitle.trim()) return;
    const newSub: Subtask = {
      id: `sub-${Date.now()}`,
      title: newSubtaskTitle.trim(),
      isCompleted: false
    };
    const updated = [...subtasks, newSub];
    setSubtasks(updated);
    setNewSubtaskTitle('');
    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        subtasks: updated
      });
    }
  };

  // Save edited subtask title
  const handleSaveEditSubtask = (subtaskId: string) => {
    if (!editingSubtaskTitle.trim()) return;
    const updated = subtasks.map(s => s.id === subtaskId ? { ...s, title: editingSubtaskTitle.trim() } : s);
    setSubtasks(updated);
    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        subtasks: updated
      });
    }
    setEditingSubtaskId(null);
    setEditingSubtaskTitle('');
  };

  // Remove subtask item
  const handleRemoveSubtaskItem = (subtaskId: string) => {
    const updated = subtasks.filter(s => s.id !== subtaskId);
    setSubtasks(updated);
    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        subtasks: updated
      });
    }
  };

  // Helper: Download attachment file or generate simulated download
  const handleDownloadAttachment = (name: string, url?: string) => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      // Create simulated file blob for dummy files
      const content = `[MORKHE STUDIO - DOKUMEN LAMPIRAN]\n\nNama File: ${name}\nStatus: Dokumen Valid / Siap Diunduh\nWaktu Unduh: ${new Date().toLocaleString('id-ID')}\n\nProject Management System - Morkhe Studio`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = name.endsWith('.pdf') || name.endsWith('.png') || name.endsWith('.jpg') || name.endsWith('.docx') ? name : `${name}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    }
  };

  // Helper: Open attachment in new tab or trigger download
  const handleOpenAttachment = (att: { type: 'file' | 'link'; name: string; url?: string }) => {
    if (att.type === 'link' && att.url) {
      window.open(att.url, '_blank', 'noopener,noreferrer');
    } else if (att.type === 'file' && att.url) {
      window.open(att.url, '_blank');
    } else {
      handleDownloadAttachment(att.name, att.url);
    }
  };

  // Upload file for task attachment (Task Level)
  const handleTaskFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: TaskAttachment[] = Array.from(files).map((file: File) => ({
      id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      addedByRole: currentUser.role,
      createdAt: new Date().toISOString()
    }));

    const updated = [...taskAttachments, ...newAttachments];
    setTaskAttachments(updated);

    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        attachments: updated
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add link for task attachment (Task Level)
  const handleAddTaskLink = () => {
    if (!linkUrlInput.trim()) return;
    const displayName = linkTextInput.trim() || linkUrlInput.trim();
    const formattedUrl = linkUrlInput.trim().startsWith('http') ? linkUrlInput.trim() : `https://${linkUrlInput.trim()}`;

    const newLinkAtt: TaskAttachment = {
      id: `att-${Date.now()}`,
      type: 'link',
      name: displayName,
      url: formattedUrl,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      addedByRole: currentUser.role,
      createdAt: new Date().toISOString()
    };

    const updated = [...taskAttachments, newLinkAtt];
    setTaskAttachments(updated);

    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        attachments: updated
      });
    }

    setLinkUrlInput('');
    setLinkTextInput('');
    setShowAddLinkForm(false);
  };

  // Remove task attachment
  const handleRemoveTaskAttachment = (attId: string) => {
    const updated = taskAttachments.filter(a => a.id !== attId);
    setTaskAttachments(updated);

    if (task && !isCreateMode) {
      onUpdateTask({
        ...task,
        attachments: updated
      });
    }
  };

  // Permission check: Can current user delete this task attachment?
  const canDeleteAttachment = (att: TaskAttachment) => {
    if (isPM) return true;
    if (att.addedBy === currentUser.id) return true;
    if (att.addedByRole === 'PM') return false;
    return true;
  };

  // Upload file for comment attachment
  const handleCommentFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newCommentAtts: CommentAttachment[] = Array.from(files).map((file: File) => ({
      id: `catt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`
    }));

    setPendingCommentAttachments(prev => [...prev, ...newCommentAtts]);
    setShowCommentAttachMenu(false);

    if (commentFileInputRef.current) {
      commentFileInputRef.current.value = '';
    }
  };

  // Add link for comment attachment
  const handleAddCommentLinkAttachment = () => {
    if (!commentLinkUrl.trim()) return;
    const displayName = commentLinkText.trim() || commentLinkUrl.trim();
    const formattedUrl = commentLinkUrl.trim().startsWith('http') ? commentLinkUrl.trim() : `https://${commentLinkUrl.trim()}`;

    const newLink: CommentAttachment = {
      id: `catt-${Date.now()}`,
      type: 'link',
      name: displayName,
      url: formattedUrl
    };

    setPendingCommentAttachments(prev => [...prev, newLink]);
    setCommentLinkUrl('');
    setCommentLinkText('');
    setShowCommentLinkForm(false);
    setShowCommentAttachMenu(false);
  };

  // Remove pending comment attachment
  const handleRemovePendingCommentAttachment = (attId: string) => {
    setPendingCommentAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Post comment
  const handlePostComment = () => {
    if ((!newCommentText.trim() && pendingCommentAttachments.length === 0) || !task) return;
    onAddComment(task.id, newCommentText.trim(), pendingCommentAttachments);
    setNewCommentText('');
    setPendingCommentAttachments([]);
    setShowCommentAttachMenu(false);
    setShowCommentLinkForm(false);
  };

  // Start editing a comment
  const handleStartEditComment = (cmt: Comment) => {
    setEditingCommentId(cmt.id);
    setEditingCommentText(cmt.content);
  };

  // Save edited comment
  const handleSaveEditComment = (commentId: string) => {
    if (!editingCommentText.trim()) return;
    if (onEditComment) {
      onEditComment(commentId, editingCommentText.trim());
    }
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  // Cancel comment editing
  const handleCancelEditComment = () => {
    setEditingCommentId(null);
    setEditingCommentText('');
  };

  // Comment input ref & reply handler
  const commentInputRef = React.useRef<HTMLInputElement>(null);

  const handleReplyComment = (cmt: Comment) => {
    setActiveTab('comments');
    const authorUser = users.find(u => 
      (cmt.authorId && u.id === cmt.authorId) || 
      (cmt.authorName && u.name.toLowerCase() === cmt.authorName.toLowerCase())
    );
    const mentionUsername = authorUser?.username || cmt.authorName.replace(/\s+/g, '').toLowerCase();
    const replyText = `@${mentionUsername} `;
    setNewCommentText(replyText);
    setTimeout(() => {
      if (commentInputRef.current) {
        commentInputRef.current.focus();
        const len = replyText.length;
        commentInputRef.current.setSelectionRange(len, len);
      }
    }, 50);
  };

  // Delete a comment
  const handleDeleteCommentItem = (commentId: string) => {
    if (onDeleteComment) {
      onDeleteComment(commentId);
    }
  };

  // Save Task (Create or Edit)
  const handleSave = () => {
    if (!title.trim() || !projectId || selectedAssigneeIds.length === 0) return;

    if (isCreateMode) {
      const newCode = generateTaskCode();
      const primaryAssignee = selectedAssigneeIds[0] || currentUser.id;
      const newTask: Task = {
        id: `TSK-${Date.now()}`,
        code: newCode,
        projectId,
        title: title.trim(),
        description: description.trim() || 'Tidak ada deskripsi detail.',
        status,
        priority,
        assigneeId: primaryAssignee,
        assigneeIds: selectedAssigneeIds,
        assignedBy: currentUser.id,
        startDate,
        deadline,
        subtasks,
        attachments: taskAttachments
      };
      onAddTask(newTask);
      handleNavigateToKanban(projectId);
    } else if (task) {
      const primaryAssignee = selectedAssigneeIds[0] || task.assigneeId;
      const updated: Task = {
        ...task,
        title: title.trim(),
        description: description.trim(),
        projectId,
        assigneeId: primaryAssignee,
        assigneeIds: selectedAssigneeIds,
        status,
        priority,
        startDate,
        deadline,
        subtasks,
        attachments: taskAttachments
      };
      onUpdateTask(updated);
      setIsEditing(false);
    }
  };

  // Current project details & member filtering for task assignment
  const targetProject = projects.find(p => p.id === projectId);
  const availableProjectMembers = targetProject ? users.filter(u => targetProject.memberIds?.includes(u.id)) : [];

  // Filter projects available in Target Proyek dropdown:
  // PM can see and assign to all projects; Staff can only see & assign to projects where they are team members
  const availableProjects = isPM 
    ? projects 
    : projects.filter(p => p.memberIds && p.memberIds.includes(currentUser.id));

  return (
    <div className="min-h-full bg-morkhe-white p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-gray-900 select-none">
      
      {/* 1. BREADCRUMB NAVIGATION (P09, P10, P11 ONLY) - STICKY HEADER */}
      <div className="sticky top-0 z-20 bg-morkhe-white -mx-6 md:-mx-8 px-6 md:px-8 pt-4 pb-3 -mt-6 md:-mt-8 mb-2 border-b border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-2xs">
          <button
            onClick={() => handleNavigateToKanban('all')}
            className="hover:text-morkhe-purple transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-400" />
            <span>Tugas</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
          
          {targetProject ? (
            <button
              onClick={() => handleNavigateToKanban(targetProject.id)}
              className="hover:text-morkhe-purple transition-colors cursor-pointer font-bold text-gray-700"
            >
              {targetProject.code}: {targetProject.name}
            </button>
          ) : (
            <span className="font-semibold text-gray-400">
              {isCreateMode ? 'Pilih Proyek' : 'Proyek'}
            </span>
          )}
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />

          <span className="text-gray-900 font-bold truncate max-w-[250px] sm:max-w-md">
            {isCreateMode ? 'Buat Tugas Baru' : (task?.title || 'Detail Tugas')}
          </span>
        </div>
      </div>

      {isCreateMode && availableProjects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-8 sm:p-12 text-center max-w-xl mx-auto space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
            <AlertTriangle className="w-7 h-7" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-gray-900">Belum Ada Proyek yang Bisa Dipilih</h3>
            <p className="text-xs text-gray-600 max-w-md mx-auto leading-relaxed">
              {isPM 
                ? 'Tugas harus dikaitkan ke sebuah proyek. Silakan buat proyek terlebih dahulu sebelum menambahkan tugas.' 
                : 'Kamu belum terdaftar sebagai anggota di proyek mana pun. Tunggu Project Manager mengikutsertakanmu ke sebuah proyek.'}
            </p>
          </div>
          <div className="pt-3 flex items-center justify-center gap-3">
            {isPM ? (
              <button
                type="button"
                onClick={() => setCurrentPage('P12')}
                className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm border border-morkhe-purple"
              >
                <Plus className="w-4 h-4" />
                <span>+ Buat Proyek</span>
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => handleNavigateToKanban('all')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all cursor-pointer border border-gray-200"
            >
              Kembali ke Papan Kerja
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Main 2-Column Responsive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        
        {/* ================= LEFT / MIDDLE COLUMN (~65%) ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* TASK TITLE & SPECIFICATION SECTION */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-2xs">
            
            {/* Title Block */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                NAMA TUGAS
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Contoh: Finalisasi Logo Mockup & Panduan Kemasan..."
                  className="w-full font-bold text-xl md:text-2xl text-gray-950 border border-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:border-black transition-all"
                />
              ) : (
                <h1 className="text-xl md:text-2xl font-bold text-gray-950 tracking-tight leading-snug">
                  {task?.title}
                </h1>
              )}
            </div>

            {/* Task Description / Specification */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-gray-400" /> SPESIFIKASI TUGAS & PANDUAN
              </label>
              {isEditing ? (
                <textarea
                  ref={descriptionRef}
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tuliskan petunjuk teknis, standar aset, dan panduan untuk anggota staf..."
                  className="w-full text-xs md:text-sm text-gray-800 border border-gray-300 rounded-xl p-3.5 focus:outline-none focus:border-black transition-all leading-relaxed"
                />
              ) : (
                <div className="bg-gray-50 border border-gray-200 p-4 rounded-xl text-xs md:text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {task?.description || 'Tidak ada deskripsi detail.'}
                </div>
              )}
            </div>

            {/* LAMPIRAN FILE & TAUTAN SECTION (BAGIAN A & BAGIAN B POINT 1) */}
            <div className="space-y-3 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400" /> {isCreateMode ? 'LAMPIRAN FILE & TAUTAN (OPSIONAL)' : 'LAMPIRAN TUGAS'}
                </label>
                <span className="text-[10px] font-mono text-gray-400 font-semibold">
                  {taskAttachments.length} item
                </span>
              </div>

              {/* Action Buttons: + Upload File & + Tambah Link */}
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleTaskFileUpload} 
                  multiple 
                  accept=".pdf,.png,.jpg,.jpeg,.fig,.zip,.docx,.xlsx" 
                  className="hidden" 
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Upload className="h-3.5 w-3.5 text-morkhe-purple" />
                  <span>+ Upload File</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowAddLinkForm(!showAddLinkForm)}
                  className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <Link2 className="h-3.5 w-3.5 text-morkhe-purple" />
                  <span>+ Tambah Link</span>
                </button>
              </div>

              {/* Inline Add Link Form */}
              {showAddLinkForm && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-morkhe-purple" />
                    <span>Tambah Tautan / Link</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">URL (Wajib)</label>
                      <input
                        type="url"
                        value={linkUrlInput}
                        onChange={(e) => setLinkUrlInput(e.target.value)}
                        placeholder="https://figma.com/file/..."
                        className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Teks Tampilan (Opsional)</label>
                      <input
                        type="text"
                        value={linkTextInput}
                        onChange={(e) => setLinkTextInput(e.target.value)}
                        placeholder="Contoh: Referensi Figma Brand Kit"
                        className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black"
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddLinkForm(false);
                        setLinkUrlInput('');
                        setLinkTextInput('');
                      }}
                      className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
                    >
                      Batal
                    </button>
                    <button
                      type="button"
                      onClick={handleAddTaskLink}
                      className="px-3 py-1 text-xs font-bold bg-morkhe-purple text-white rounded-lg hover:opacity-90 transition-all cursor-pointer"
                    >
                      Simpan Link
                    </button>
                  </div>
                </div>
              )}

              {/* Attachment List Display */}
              {taskAttachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {taskAttachments.map((att) => {
                    const isDeletable = canDeleteAttachment(att);
                    return (
                      <div
                        key={att.id}
                        className="flex flex-col sm:flex-row sm:items-center justify-between p-2.5 bg-gray-50 hover:bg-gray-100/80 border border-gray-200 rounded-xl transition-all gap-2.5"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 font-bold">
                            {att.type === 'file' ? (
                              <FileText className="h-4 w-4 text-blue-600" />
                            ) : (
                              <Link2 className="h-4 w-4 text-purple-600" />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span 
                                onClick={() => handleOpenAttachment(att)}
                                className="text-xs font-bold text-gray-900 truncate block hover:text-morkhe-purple hover:underline cursor-pointer"
                                title="Klik untuk membuka/mengunduh"
                              >
                                {att.name}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                              <span>{att.type === 'file' ? (att.size || 'Dokumen File') : 'Tautan Web'}</span>
                              <span>•</span>
                              <span>Oleh {att.addedByName || (att.addedByRole === 'PM' ? 'PM' : 'Staf')}</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons: Unduh / Buka Link & Delete */}
                        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                          {att.type === 'link' ? (
                            att.url && (
                              <a
                                href={att.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-morkhe-purple border border-purple-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                                title="Buka Link di Tab Baru"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>Buka Link</span>
                              </a>
                            )
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleDownloadAttachment(att.name, att.url)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs"
                              title="Unduh File Ke Perangkat"
                            >
                              <Download className="h-3 w-3 text-blue-600" />
                              <span>Unduh</span>
                            </button>
                          )}

                          {/* Delete Button with RBAC logic */}
                          {isDeletable ? (
                            <button
                              type="button"
                              onClick={() => handleRemoveTaskAttachment(att.id)}
                              className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-1"
                              title="Hapus Lampiran"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          ) : (
                            <span 
                              className="p-1 text-gray-300 cursor-not-allowed ml-1" 
                              title="Ditambahkan oleh PM — Staf tidak dapat menghapus lampiran ini."
                            >
                              <X className="h-4 w-4" />
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* SUBTUGAS & KOMENTAR TABS */}
          <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5 shadow-2xs">
            
            {/* Tab Buttons Header */}
            <div className="flex border-b border-gray-200">
              <button
                type="button"
                onClick={() => setActiveTab('subtasks')}
                className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer mr-6 ${
                  activeTab === 'subtasks'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-900'
                }`}
              >
                <CheckSquare className="h-4 w-4" />
                <span>Subtugas ({subtasks.filter(s => s.isCompleted).length}/{subtasks.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('comments')}
                className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer mr-6 ${
                  activeTab === 'comments'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-900'
                }`}
              >
                <MessageSquare className="h-4 w-4" />
                <span>Diskusi & Komentar ({isCreateMode ? 0 : comments.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('logs')}
                className={`pb-3 text-xs md:text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
                  activeTab === 'logs'
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-400 hover:text-gray-900'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Log Aktivitas ({isCreateMode ? 0 : activityLogs.length})</span>
              </button>
            </div>

            {/* TAB CONTENT 1: SUBTUGAS */}
            {activeTab === 'subtasks' && (
              <div className="space-y-4">
                {subtasks.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">Belum ada item subtugas.</p>
                ) : (
                  <div className="space-y-2">
                    {subtasks.map((st) => (
                      <div 
                        key={st.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:border-gray-200 bg-gray-50/50 transition-all gap-2"
                      >
                        {editingSubtaskId === st.id ? (
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="checkbox"
                              checked={st.isCompleted}
                              onChange={() => handleToggleSubtask(st.id)}
                              className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                            />
                            <input
                              type="text"
                              value={editingSubtaskTitle}
                              onChange={(e) => setEditingSubtaskTitle(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveEditSubtask(st.id))}
                              className="flex-1 text-xs text-gray-800 bg-white border border-gray-300 rounded px-2 py-1 focus:outline-none focus:border-black"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditSubtask(st.id)}
                              className="px-2.5 py-1 text-[11px] font-bold bg-morkhe-purple text-white rounded hover:opacity-90 transition-all cursor-pointer"
                            >
                              Simpan
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubtaskId(null);
                                setEditingSubtaskTitle('');
                              }}
                              className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 bg-gray-200 hover:bg-gray-300 rounded transition-all cursor-pointer"
                            >
                              Batal
                            </button>
                          </div>
                        ) : (
                          <>
                            <label className="flex items-center gap-3 cursor-pointer flex-1">
                              <input
                                type="checkbox"
                                checked={st.isCompleted}
                                onChange={() => handleToggleSubtask(st.id)}
                                className="w-4 h-4 rounded text-black focus:ring-0 cursor-pointer accent-black"
                              />
                              <span className={`text-xs font-medium ${st.isCompleted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                                {st.title}
                              </span>
                            </label>

                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubtaskId(st.id);
                                  setEditingSubtaskTitle(st.title);
                                }}
                                className="text-gray-400 hover:text-morkhe-purple hover:bg-purple-50 p-1 rounded transition-colors cursor-pointer"
                                title="Edit Subtugas"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleRemoveSubtaskItem(st.id)}
                                className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer"
                                title="Hapus Subtugas"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Add Subtask Input (Always visible for PM & Staff) */}
                <div className="pt-2 flex gap-2 border-t border-gray-100 mt-2">
                  <input
                    type="text"
                    value={newSubtaskTitle}
                    onChange={(e) => setNewSubtaskTitle(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSubtaskItem())}
                    placeholder="Tulis item subtugas baru..."
                    className="flex-1 text-xs text-gray-800 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-morkhe-purple focus:ring-1 focus:ring-morkhe-purple bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddSubtaskItem}
                    className="px-4 py-2.5 bg-morkhe-purple hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0"
                  >
                    <Plus className="h-3.5 w-3.5" /> Tambah
                  </button>
                </div>
              </div>
            )}

            {/* TAB CONTENT 2: KOMENTAR */}
            {activeTab === 'comments' && (
              <div className="space-y-4">
                {isCreateMode ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Fitur diskusi & komentar akan aktif setelah tugas resmi dibuat.
                  </div>
                ) : (
                  <>
                    {/* Comments Feed */}
                    <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                      {comments.length === 0 ? (
                        <p className="text-xs text-gray-400 italic py-2">Belum ada komentar untuk tugas ini.</p>
                      ) : (
                        [...comments]
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((cmt) => {
                            const isMyComment = (cmt.authorId && cmt.authorId === currentUser.id) || (cmt.authorName && cmt.authorName === currentUser.name);
                            const authorUser = users.find(u => 
                              (cmt.authorId && u.id === cmt.authorId) || 
                              (cmt.authorName && u.name.toLowerCase() === cmt.authorName.toLowerCase())
                            );
                            const isPM = authorUser ? authorUser.role === 'PM' : cmt.authorRole === 'PM';
                            const rolePrefix = isPM ? 'PM' : 'Staf';
                            const positionTitle = authorUser ? authorUser.position.replace(' (Project Manager)', '') : (isPM ? 'Founder & CEO' : 'Graphic Designer');
                            const badgeText = `[${rolePrefix}] ${positionTitle}`;
                            const badgeClasses = isPM ? 'bg-morkhe-black text-morkhe-green' : 'bg-morkhe-dark-purple text-morkhe-white';

                            return (
                            <div key={cmt.id} className="p-3.5 rounded-xl border border-gray-100 bg-gray-50 space-y-1.5 transition-all">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <img 
                                    src={cmt.authorAvatar} 
                                    alt={cmt.authorName} 
                                    className="w-6 h-6 rounded-full border border-gray-200 object-cover" 
                                  />
                                  <span className="text-xs font-bold text-gray-900">{cmt.authorName}</span>
                                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeClasses}`}>
                                    {badgeText}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] text-gray-400 font-mono">
                                    {formatLogDateTime(cmt.createdAt)}
                                  </span>
                                  {/* Action buttons ONLY for current user's own comments */}
                                  {isMyComment ? (
                                    <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                                      <button
                                        type="button"
                                        onClick={() => handleStartEditComment(cmt)}
                                        title="Edit Komentar"
                                        className="p-1 text-gray-400 hover:text-morkhe-purple hover:bg-purple-50 rounded transition-all cursor-pointer"
                                      >
                                        <Edit3 className="h-3 w-3" />
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleDeleteCommentItem(cmt.id)}
                                        title="Hapus Komentar"
                                        className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-all cursor-pointer"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-1 border-l border-gray-200 pl-2">
                                      <button
                                        type="button"
                                        onClick={() => handleReplyComment(cmt)}
                                        title="Balas Komentar"
                                        className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-morkhe-purple hover:bg-purple-50 px-1.5 py-0.5 rounded transition-all cursor-pointer font-medium"
                                      >
                                        <CornerUpLeft className="h-3 w-3" /> Balas
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                              {editingCommentId === cmt.id ? (
                                <div className="pl-8 space-y-2 pt-1">
                                  <input
                                    type="text"
                                    value={editingCommentText}
                                    onChange={(e) => setEditingCommentText(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSaveEditComment(cmt.id))}
                                    className="w-full text-xs text-gray-900 bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:border-black"
                                    autoFocus
                                  />
                                  <div className="flex items-center gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={handleCancelEditComment}
                                      className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-200 rounded transition-all cursor-pointer"
                                    >
                                      Batal
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEditComment(cmt.id)}
                                      className="px-2.5 py-1 text-[11px] font-bold bg-morkhe-purple text-white rounded hover:opacity-90 transition-all cursor-pointer"
                                    >
                                      Simpan
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div className="pl-8 space-y-2">
                                  <p className="text-xs text-gray-700 leading-relaxed">
                                    {cmt.content.split(/(@[a-zA-Z0-9_\.-]+)/g).map((part, idx) => {
                                      if (part.startsWith('@')) {
                                        return (
                                          <span key={idx} className="inline-flex items-center px-1.5 py-0.5 rounded bg-gray-200 text-gray-800 font-semibold text-[11px] mr-1 my-0.5 border border-gray-300">
                                            {part}
                                          </span>
                                        );
                                      }
                                      return part;
                                    })}
                                  </p>

                                  {/* Comment Attachments Display */}
                                  {cmt.attachments && cmt.attachments.length > 0 && (
                                    <div className="flex flex-wrap gap-2 pt-1">
                                      {cmt.attachments.map((cAtt) => (
                                        <div
                                          key={cAtt.id}
                                          className="inline-flex items-center gap-2 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg shadow-2xs text-xs text-gray-800 hover:border-gray-400 transition-all"
                                        >
                                          {cAtt.type === 'file' ? (
                                            <FileText className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                                          ) : (
                                            <Link2 className="h-3.5 w-3.5 text-purple-600 shrink-0" />
                                          )}
                                          <span 
                                            onClick={() => handleOpenAttachment(cAtt)}
                                            className="font-bold text-gray-900 hover:text-morkhe-purple hover:underline cursor-pointer"
                                            title="Klik untuk membuka/mengunduh"
                                          >
                                            {cAtt.name}
                                          </span>
                                          {cAtt.type === 'link' ? (
                                            cAtt.url && (
                                              <a
                                                href={cAtt.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-morkhe-purple hover:underline text-[10px] ml-0.5 flex items-center gap-0.5 shrink-0"
                                                title={cAtt.url}
                                              >
                                                <ExternalLink className="h-3 w-3" />
                                              </a>
                                            )
                                          ) : (
                                            <button
                                              type="button"
                                              onClick={() => handleDownloadAttachment(cAtt.name, cAtt.url)}
                                              className="text-blue-600 hover:text-blue-800 text-[10px] ml-0.5 flex items-center gap-0.5 shrink-0 cursor-pointer"
                                              title="Unduh File"
                                            >
                                              <Download className="h-3 w-3" />
                                            </button>
                                          )}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* New Comment Input Box with Paperclip Attachment Feature */}
                    <div className="pt-3 border-t border-gray-100 space-y-2.5">
                      
                      {/* Pending Attachments Preview List */}
                      {pendingCommentAttachments.length > 0 && (
                        <div className="flex flex-wrap gap-2 pb-1">
                          {pendingCommentAttachments.map((pAtt) => (
                            <div key={pAtt.id} className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 border border-purple-200 text-purple-900 rounded-lg text-xs font-medium">
                              {pAtt.type === 'file' ? <FileText className="h-3.5 w-3.5 text-morkhe-purple" /> : <Link2 className="h-3.5 w-3.5 text-morkhe-purple" />}
                              <span className="truncate max-w-[180px] font-bold">{pAtt.name}</span>
                              <button
                                type="button"
                                onClick={() => handleRemovePendingCommentAttachment(pAtt.id)}
                                className="text-purple-400 hover:text-purple-700 p-0.5 rounded cursor-pointer"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Main Input Row */}
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1 flex items-center">
                          <input
                            ref={commentInputRef}
                            type="text"
                            value={newCommentText}
                            onChange={(e) => setNewCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handlePostComment())}
                            placeholder="Tulis tanggapan atau pembaruan status..."
                            className="w-full text-xs text-gray-800 border border-gray-300 rounded-lg pl-3.5 pr-10 py-2 focus:outline-none focus:border-black"
                          />
                          
                          {/* Paperclip Button inside Input */}
                          <button
                            type="button"
                            onClick={() => setShowCommentAttachMenu(!showCommentAttachMenu)}
                            className="absolute right-2 p-1.5 text-gray-400 hover:text-morkhe-purple hover:bg-gray-100 rounded-md transition-all cursor-pointer"
                            title="Lampirkan File atau Link ke Komentar"
                          >
                            <Paperclip className="h-4 w-4" />
                          </button>

                          {/* Hidden File Input for Comment */}
                          <input
                            type="file"
                            ref={commentFileInputRef}
                            onChange={handleCommentFileUpload}
                            className="hidden"
                            accept=".pdf,.png,.jpg,.jpeg,.fig,.zip,.docx,.xlsx"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={handlePostComment}
                          className="px-4 py-2 bg-morkhe-purple text-white text-xs font-bold rounded-lg hover:opacity-90 transition-all cursor-pointer shrink-0"
                        >
                          Kirim
                        </button>
                      </div>

                      {/* Popover Attachment Menu */}
                      {showCommentAttachMenu && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs">
                          <div className="flex items-center justify-between text-gray-700 font-bold">
                            <span>Lampirkan ke Komentar</span>
                            <button type="button" onClick={() => setShowCommentAttachMenu(false)} className="text-gray-400 hover:text-gray-600">
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCommentAttachMenu(false);
                                commentFileInputRef.current?.click();
                              }}
                              className="flex-1 py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-bold text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Upload className="h-3.5 w-3.5 text-morkhe-purple" /> Upload File
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setShowCommentAttachMenu(false);
                                setShowCommentLinkForm(true);
                              }}
                              className="flex-1 py-1.5 px-3 bg-white border border-gray-300 hover:bg-gray-100 rounded-lg font-bold text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Link2 className="h-3.5 w-3.5 text-morkhe-purple" /> Tempel Link
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Comment Link Input Form */}
                      {showCommentLinkForm && (
                        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2">
                          <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                            <Link2 className="h-3.5 w-3.5 text-morkhe-purple" /> Lampirkan Link ke Komentar
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            <input
                              type="url"
                              value={commentLinkUrl}
                              onChange={(e) => setCommentLinkUrl(e.target.value)}
                              placeholder="URL (https://...)"
                              className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black"
                            />
                            <input
                              type="text"
                              value={commentLinkText}
                              onChange={(e) => setCommentLinkText(e.target.value)}
                              placeholder="Teks Tampilan (Opsional)"
                              className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black"
                            />
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                setShowCommentLinkForm(false);
                                setCommentLinkUrl('');
                                setCommentLinkText('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg cursor-pointer"
                            >
                              Batal
                            </button>
                            <button
                              type="button"
                              onClick={handleAddCommentLinkAttachment}
                              className="px-3 py-1 text-xs font-bold bg-morkhe-purple text-white rounded-lg hover:opacity-90 cursor-pointer"
                            >
                              Sematkan Link
                            </button>
                          </div>
                        </div>
                      )}

                    </div>
                  </>
                )}
              </div>
            )}

            {/* TAB CONTENT 3: LOG AKTIVITAS */}
            {activeTab === 'logs' && (
              <div className="space-y-4">
                {isCreateMode ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    Log aktivitas akan tercatat secara otomatis setelah tugas resmi dibuat.
                  </div>
                ) : (
                  <>
                    {activityLogs.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        Belum ada log aktivitas untuk tugas ini.
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                        {[...activityLogs]
                          .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                          .map((log) => (
                            <div 
                              key={log.id} 
                              id={`activity-log-${log.id}`}
                              className="flex items-center gap-2 py-2 px-3 text-xs text-gray-600 bg-gray-50/70 hover:bg-gray-100/70 border border-gray-100 rounded-lg transition-colors"
                            >
                              <span className="text-gray-400 font-bold shrink-0 select-none">→</span>
                              <span className="text-xs text-gray-700 font-medium leading-relaxed">
                                {log.content} <span className="text-gray-400 font-normal">· {formatLogDateTime(log.createdAt)}</span>
                              </span>
                            </div>
                          ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

          </div>

        </div>

        {/* ================= RIGHT COLUMN (~35%, STICKY PANEL) ================= */}
        <div className="lg:col-span-4 sticky top-20 space-y-4">
          
          <div className="bg-white border border-gray-200 rounded-xl p-4.5 space-y-3.5 shadow-2xs">
            
            <h2 className="text-xs font-bold text-gray-900 uppercase tracking-wider border-b border-gray-100 pb-2.5">
              PANEL KONTROL TUGAS
            </h2>

            {/* 1. DITUGASKAN OLEH (assignedBy) - Hidden in P11 Create Mode, Compact 1-line in P09 View Mode */}
            {!isCreateMode && (
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  DITUGASKAN OLEH
                </label>
                <div className="flex items-center gap-2 py-0.5">
                  <img 
                    src={assignerUser?.avatar || currentUser.avatar} 
                    alt={assignerUser?.name || currentUser.name} 
                    className="w-6 h-6 rounded-full border border-gray-200 object-cover shrink-0" 
                  />
                  <span className="text-xs font-bold text-gray-900 truncate">
                    {assignerUser ? assignerUser.name : currentUser.name}
                  </span>
                </div>
              </div>
            )}

            {/* 2. TARGET PROYEK */}
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                TARGET PROYEK <span className="text-red-500">*</span>
              </label>
              {isEditing ? (
                <div>
                  <select
                    value={projectId}
                    onChange={(e) => {
                      const newProjId = e.target.value;
                      setProjectId(newProjId);
                      const newProj = projects.find(p => p.id === newProjId);
                      if (!isPM) {
                        if (newProj?.memberIds?.includes(currentUser.id)) {
                          setSelectedAssigneeIds([currentUser.id]);
                        } else {
                          setSelectedAssigneeIds([]);
                        }
                      } else {
                        setSelectedAssigneeIds(prev => prev.filter(id => newProj?.memberIds?.includes(id)));
                      }
                    }}
                    className={`w-full text-xs font-semibold border rounded-lg p-2 bg-white focus:outline-none focus:border-black cursor-pointer ${
                      !projectId ? 'text-gray-400 border-amber-300 bg-amber-50/20' : 'text-gray-900 border-gray-300'
                    }`}
                    required
                  >
                    <option value="" disabled hidden>-- Pilih Target Proyek (Wajib) --</option>
                    {availableProjects.map(p => (
                      <option key={p.id} value={p.id} className="text-gray-900">
                        {p.code}: {p.name}
                      </option>
                    ))}
                  </select>
                  {!projectId && (
                    <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                      <span>Wajib memilih target proyek untuk tugas baru.</span>
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200 truncate">
                  {targetProject ? `${targetProject.code}: ${targetProject.name}` : 'Proyek'}
                </div>
              )}
            </div>

            {/* 3. PENUGASAN ANGGOTA (2-COLUMN COMPACT GRID & RBAC STAFF RESTRICTION) */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center justify-between">
                <span>PENUGASAN ANGGOTA</span>
                <span className="text-[9px] font-mono font-normal text-gray-400">({selectedAssigneeIds.length} Anggota)</span>
              </label>

              {isEditing ? (
                !isPM ? (
                  /* Staff editing / creating */
                  <div className="space-y-1.5">
                    {!projectId ? (
                      <div className="text-[10px] text-gray-500 bg-gray-50 border border-dashed border-gray-300 p-2.5 rounded-lg text-center font-medium">
                        Silakan pilih target proyek terlebih dahulu.
                      </div>
                    ) : (
                      <>
                        <div className="grid grid-cols-2 gap-1.5">
                          {selectedAssigneeIds.map(uid => {
                            const u = users.find(usr => usr.id === uid);
                            if (!u) return null;
                            const activeCount = getUserActiveTaskCount(u.id);
                            const workload = getWorkloadInfo(activeCount, u.overloadLimit);
                            return (
                              <div key={uid} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-200 min-w-0">
                                <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                                <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                                  <span className="text-xs font-semibold text-gray-900 truncate" title={u.name}>{u.name}</span>
                                  <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                    workload.isOverloaded 
                                      ? 'bg-red-100 text-red-700' 
                                      : workload.isFull
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {activeCount}/{u.overloadLimit}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        {selectedAssigneeIds.length === 0 ? (
                          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                            <span>Anda bukan anggota resmi dari proyek ini.</span>
                          </div>
                        ) : (
                          <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-1.5 rounded-lg flex items-center gap-1.5 font-medium">
                            <Lock className="h-3 w-3 text-amber-600 shrink-0" />
                            <span>Akun Staf hanya dapat menugaskan pekerjaan kepada diri sendiri.</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  /* PM multi-assignee selector - 2-COLUMN GRID */
                  <div className="space-y-1.5">
                    {!projectId ? (
                      <div className="text-[10px] text-gray-500 bg-gray-50 border border-dashed border-gray-300 p-2.5 rounded-lg text-center font-medium">
                        Silakan pilih target proyek terlebih dahulu untuk melihat daftar anggota tim.
                      </div>
                    ) : availableProjectMembers.length === 0 ? (
                      <div className="text-[10px] text-gray-500 bg-gray-50 border border-dashed border-gray-300 p-2.5 rounded-lg text-center font-medium">
                        Belum ada anggota resmi pada proyek ini. Tambahkan anggota melalui Edit Proyek.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-1.5">
                        {availableProjectMembers.map((u) => {
                          const isChecked = selectedAssigneeIds.includes(u.id);
                          const activeCount = getUserActiveTaskCount(u.id);
                          const workload = getWorkloadInfo(activeCount, u.overloadLimit);

                          return (
                            <label
                              key={u.id}
                              className={`flex items-center gap-1.5 p-1.5 rounded-lg border cursor-pointer transition-all min-w-0 ${
                                isChecked ? 'bg-purple-50/60 border-morkhe-purple' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedAssigneeIds([...selectedAssigneeIds, u.id]);
                                  } else {
                                    setSelectedAssigneeIds(selectedAssigneeIds.filter(id => id !== u.id));
                                  }
                                }}
                                className="w-3.5 h-3.5 rounded text-morkhe-purple accent-morkhe-purple cursor-pointer shrink-0"
                              />
                              <img src={u.avatar} alt={u.name} className="w-4.5 h-4.5 rounded-full object-cover shrink-0" />
                              <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                                <span className="text-xs font-semibold text-gray-900 truncate" title={u.name}>{u.name}</span>
                                <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                                  workload.isOverloaded 
                                    ? 'bg-red-100 text-red-700' 
                                    : workload.isFull
                                    ? 'bg-amber-100 text-amber-800'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                  {activeCount}/{u.overloadLimit}
                                </span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {projectId && selectedAssigneeIds.length === 0 && (
                      <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5 font-medium mt-1">
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                        <span>Wajib menugaskan minimal 1 anggota tim sebelum membuat/menyimpan tugas.</span>
                      </div>
                    )}
                  </div>
                )
              ) : (
                /* View Mode Assigned Members Display (2-COLUMN GRID) */
                <div className="grid grid-cols-2 gap-1.5">
                  {selectedAssigneeIds.map(uid => {
                    const u = users.find(usr => usr.id === uid);
                    if (!u) return null;
                    const activeCount = getUserActiveTaskCount(u.id);
                    const workload = getWorkloadInfo(activeCount, u.overloadLimit);
                    return (
                      <div key={uid} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-lg border border-gray-200 min-w-0">
                        <img src={u.avatar} alt={u.name} className="w-5 h-5 rounded-full object-cover shrink-0" />
                        <div className="min-w-0 flex-1 flex items-center justify-between gap-1">
                          <span className="text-xs font-semibold text-gray-900 truncate" title={u.name}>{u.name}</span>
                          <span className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            workload.isOverloaded 
                              ? 'bg-red-100 text-red-700' 
                              : workload.isFull
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {activeCount}/{u.overloadLimit}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* OVERLOAD WARNING (Single-line compact when overloaded; Safe capacity box completely removed) */}
              {overloadedUsers.length > 0 && (
                <div className="p-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 text-[10px] text-red-700 font-medium">
                  <AlertTriangle className="h-3.5 w-3.5 text-red-600 shrink-0" />
                  <span className="truncate">
                    <strong>Overload:</strong> {overloadedUsers.map(o => `${o.user.name} (${o.current}/${o.limit})`).join(', ')}
                  </span>
                </div>
              )}
            </div>

            {/* 4. TANGGAL MULAI & TENGGAT WAKTU (2-KOLOM) */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  TANGGAL MULAI
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:border-black cursor-pointer"
                  />
                ) : (
                  <div className="text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {formatDate(startDate)}
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  TENGGAT WAKTU
                </label>
                {isEditing ? (
                  <input
                    type="date"
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                    className="w-full text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:border-black cursor-pointer"
                  />
                ) : (
                  <div className="text-xs font-bold text-gray-800 bg-gray-50 p-2 rounded-lg border border-gray-200">
                    {formatDate(deadline)}
                  </div>
                )}
              </div>
            </div>

            {/* 5. PRIORITAS & STATUS TUGAS (2-KOLOM SIDE-BY-SIDE) */}
            <div className="grid grid-cols-2 gap-3">
              {/* Prioritas */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  PRIORITAS
                </label>
                {isEditing ? (
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as Task['priority'])}
                    className="w-full text-xs font-semibold text-gray-900 border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:border-black cursor-pointer"
                  >
                    <option value="Low">Rendah (Low)</option>
                    <option value="Medium">Menengah (Medium)</option>
                    <option value="High">Tinggi (High)</option>
                    <option value="Critical">Kritis (Critical)</option>
                  </select>
                ) : (
                  <div className={`text-xs font-bold px-2 py-2 rounded-lg uppercase text-center truncate ${
                    priority === 'Critical' ? 'bg-red-50 text-red-700 border border-red-200' :
                    priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                    priority === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                    'bg-gray-100 text-gray-700 border border-gray-200'
                  }`}>
                    {priority}
                  </div>
                )}
              </div>

              {/* Status Tugas */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  STATUS TUGAS
                </label>
                <select
                  value={status}
                  onChange={(e) => {
                    const newSt = e.target.value as Task['status'];
                    if (isEditing) {
                      setStatus(newSt);
                    } else {
                      handleViewModeStatusChange(newSt);
                    }
                  }}
                  className="w-full text-xs font-bold text-gray-900 border border-gray-300 rounded-lg p-2 bg-white focus:outline-none focus:border-black cursor-pointer"
                >
                  <option value="todo">Perlu Dikerjakan</option>
                  <option value="in_progress">Sedang Berjalan</option>
                  <option value="review">Dalam Review</option>
                  <option value="done">Selesai</option>
                  <option value="canceled_on_hold">Batal/Tunda</option>
                </select>
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ================= STICKY BOTTOM ACTION BAR ================= */}
      <div className="sticky bottom-0 -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-8 bg-white border-t border-gray-200 py-3.5 px-6 md:px-8 z-30 shadow-lg">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Left Status Info / Notice */}
          <div className="text-xs text-gray-500 font-medium hidden sm:block">
            {isCreateMode ? (
              <span>Form Pembuatan Tugas Baru (Mode Tambah)</span>
            ) : isEditing ? (
              <span>Mode Pengeditan Detail Tugas Aktiv</span>
            ) : !isPM ? (
              assignedByUserId === currentUser.id ? (
                <span className="text-emerald-800 font-semibold bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 inline-block">
                  <strong className="font-bold">[Tugas Anda Sendiri — Akses Penuh]</strong> Anda membuat tugas ini, sehingga dapat mengedit seluruh detail dan menghapusnya jika diperlukan.
                </span>
              ) : (
                <span className="text-amber-800 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 inline-block">
                  <strong className="font-bold">[Akses Terbatas - ditugaskan oleh PM]</strong> Tugas ini ditugaskan oleh {pmName}. Anda dapat memperbarui Status, Subtugas, Komentar, dan Lampiran Tugas. Detail utama seperti Judul, Deskripsi, dan Tenggat Waktu hanya dapat diubah oleh PM.
                </span>
              )
            ) : (
              <span>Mode Tampilan Tugas (Dapat Diedit)</span>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 ml-auto">
            
            {/* 1. CREATE MODE ACTIONS (P11) */}
            {isCreateMode && (
              <>
                <button
                  type="button"
                  onClick={() => handleNavigateToKanban('all')}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!title.trim() || !projectId || selectedAssigneeIds.length === 0}
                  onClick={handleSave}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm ${
                    !title.trim() || !projectId || selectedAssigneeIds.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-morkhe-purple hover:opacity-90 text-white cursor-pointer'
                  }`}
                >
                  <Plus className="h-4 w-4" />
                  <span>Buat Tugas Baru</span>
                </button>
              </>
            )}

            {/* 2. EDIT MODE ACTIONS */}
            {!isCreateMode && isEditing && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    // Revert to original
                    if (task) {
                      setTitle(task.title);
                      setDescription(task.description);
                      setStatus(task.status);
                      const assignees = task.assigneeIds && task.assigneeIds.length > 0 ? task.assigneeIds : [task.assigneeId];
                      setSelectedAssigneeIds(assignees);
                    }
                  }}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-all cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={!title.trim() || !projectId || selectedAssigneeIds.length === 0}
                  onClick={handleSave}
                  className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 shadow-sm ${
                    !title.trim() || !projectId || selectedAssigneeIds.length === 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed border border-gray-200'
                      : 'bg-morkhe-black hover:opacity-90 text-white cursor-pointer'
                  }`}
                >
                  <Save className="h-4 w-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </>
            )}

            {/* 3. VIEW MODE ACTIONS */}
            {!isCreateMode && !isEditing && (
              <>
                {/* Delete button (Active for PM/Creator, Disabled with tooltip for Staff on PM-assigned tasks) */}
                {canDeleteTask ? (
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-full transition-all cursor-pointer border border-red-200 flex items-center gap-1.5"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Tugas</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled
                    title="Hanya PM yang dapat menghapus tugas ini."
                    className="px-4 py-2 bg-gray-100 text-gray-400 text-xs font-bold rounded-full border border-gray-200 cursor-not-allowed flex items-center gap-1.5 opacity-70"
                  >
                    <Trash2 className="h-3.5 w-3.5 text-gray-400" />
                    <span>Hapus Tugas</span>
                  </button>
                )}

                {/* Edit button (Guarded by RBAC) */}
                {canEditFullDetails && (
                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2 bg-morkhe-purple hover:opacity-90 text-white text-xs font-bold rounded-full transition-all cursor-pointer shadow-sm flex items-center gap-1.5"
                  >
                    <Edit3 className="h-3.5 w-3.5" />
                    <span>Edit Detail Tugas</span>
                  </button>
                )}
              </>
            )}

          </div>

        </div>
      </div>
        </>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Hapus Tugas Kreatif?"
        message={`Anda yakin ingin menghapus tugas "${task?.title || ''}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={() => {
          if (task) {
            onDeleteTask(task.id);
            handleNavigateToKanban('all');
          }
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

    </div>
  );
}
