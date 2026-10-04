/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Trello, 
  Edit2, 
  Trash2, 
  Check, 
  X, 
  Briefcase, 
  Calendar, 
  Users, 
  Building2, 
  AlignLeft,
  AlertCircle,
  AlertTriangle,
  Paperclip,
  Upload,
  Link2,
  FileText,
  Download,
  ExternalLink,
  MessageSquare,
  CornerUpLeft,
  Edit3
} from 'lucide-react';
import { User, Project, Task, Comment, TaskAttachment, CommentAttachment } from '../types';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import { formatDate } from '../utils/dateFormat';
import { formatLogDateTime } from '../utils/activityLogger';
import { getActiveTasksForUser, getWorkloadInfo } from '../utils/taskUtils';

interface ProjectDetailPageProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  project: Project;
  onUpdateProject: (updatedProject: Project) => void;
  onDeleteProject: (projectId: string) => void;
  onAddComment?: (targetId: string, content: string, attachments?: CommentAttachment[], isProjectComment?: boolean) => void;
  onEditComment?: (commentId: string, newContent: string) => void;
  onDeleteComment?: (commentId: string) => void;
}

export default function ProjectDetailPage({
  currentPage,
  setCurrentPage,
  currentUser,
  users,
  projects,
  tasks,
  comments,
  project,
  onUpdateProject,
  onDeleteProject,
  onAddComment,
  onEditComment,
  onDeleteComment
}: ProjectDetailPageProps) {
  const isPM = currentUser.role === 'PM';
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Form states for edit mode
  const [name, setName] = useState(project.name);
  const [client, setClient] = useState(project.client);
  const [status, setStatus] = useState<'Planning' | 'Ongoing' | 'Review' | 'Completed'>(project.status);
  const [description, setDescription] = useState(project.description);
  const [startDate, setStartDate] = useState(project.startDate);
  const [endDate, setEndDate] = useState(project.endDate);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(
    project.memberIds && project.memberIds.length > 0 ? project.memberIds : []
  );
  const [memberError, setMemberError] = useState(false);
  const [memberRemovalWarning, setMemberRemovalWarning] = useState<string | null>(null);

  // Project Attachments state
  const [projectAttachments, setProjectAttachments] = useState<TaskAttachment[]>(project.attachments || []);
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Project Comments state
  const projectComments = comments.filter(c => c.projectId === project.id);
  const [newCommentText, setNewCommentText] = useState('');
  const [pendingCommentAttachments, setPendingCommentAttachments] = useState<CommentAttachment[]>([]);
  const [showCommentAttachMenu, setShowCommentAttachMenu] = useState(false);
  const [showCommentLinkForm, setShowCommentLinkForm] = useState(false);
  const [commentLinkUrl, setCommentLinkUrl] = useState('');
  const [commentLinkText, setCommentLinkText] = useState('');
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState('');
  const commentInputRef = React.useRef<HTMLInputElement>(null);
  const commentFileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync state when project changes
  useEffect(() => {
    setName(project.name);
    setClient(project.client);
    setStatus(project.status);
    setDescription(project.description);
    setStartDate(project.startDate);
    setEndDate(project.endDate);
    setSelectedMemberIds(project.memberIds && project.memberIds.length > 0 ? project.memberIds : []);
    setProjectAttachments(project.attachments || []);
    setMemberRemovalWarning(null);
    setIsEditing(false);
  }, [project]);

  // Helper to determine if a task is active (bukan 'done' dan bukan 'canceled_on_hold')
  const isTaskActive = (task: Task) => task.status !== 'done' && task.status !== 'canceled_on_hold';

  // Compute assigned users for read mode (hanya tugas berstatus aktif)
  const projectTasks = tasks.filter(t => t.projectId === project.id);
  const activeProjectTasks = projectTasks.filter(isTaskActive);
  const taskAssignedUserIds = activeProjectTasks.flatMap(t => t.assigneeIds && t.assigneeIds.length > 0 ? t.assigneeIds : [t.assigneeId]);
  const assignedUserIds = Array.from(new Set([...(selectedMemberIds.length > 0 ? selectedMemberIds : project.memberIds || []), ...taskAssignedUserIds]));
  const assignedUsers = users.filter(u => assignedUserIds.includes(u.id));

  const toggleMember = (userId: string) => {
    if (selectedMemberIds.includes(userId)) {
      // Check if user still has active tasks in this project (excluding 'done' and 'canceled_on_hold')
      const activeMemberTasks = projectTasks.filter(t => {
        const isAssigned = t.assigneeIds && t.assigneeIds.length > 0
          ? t.assigneeIds.includes(userId)
          : t.assigneeId === userId;
        return isAssigned && isTaskActive(t);
      });

      if (activeMemberTasks.length > 0) {
        const memberUser = users.find(u => u.id === userId);
        const memberName = memberUser ? memberUser.name : 'Anggota';
        const taskTitles = activeMemberTasks.map(t => `"${t.title}"`).join(', ');
        setMemberRemovalWarning(
          `Tidak dapat menghapus ${memberName} dari tim karena masih memiliki tugas aktif: ${taskTitles}. Selesaikan atau pindahkan penugasan tugas terlebih dahulu.`
        );
        return;
      }

      const updated = selectedMemberIds.filter(id => id !== userId);
      setSelectedMemberIds(updated);
      setMemberRemovalWarning(null);
      if (updated.length > 0) {
        setMemberError(false);
      }
    } else {
      const updated = [...selectedMemberIds, userId];
      setSelectedMemberIds(updated);
      setMemberRemovalWarning(null);
      if (updated.length > 0) {
        setMemberError(false);
      }
    }
  };

  const handleSaveEdit = () => {
    if (selectedMemberIds.length === 0) {
      setMemberError(true);
      return;
    }

    const updated: Project = {
      ...project,
      name: name.trim() || project.name,
      client: client.trim() || project.client,
      status,
      description: description.trim() || project.description,
      startDate,
      endDate,
      memberIds: selectedMemberIds,
      attachments: projectAttachments
    };

    onUpdateProject(updated);
    setIsEditing(false);
  };

  const handleCancelEdit = () => {
    setName(project.name);
    setClient(project.client);
    setStatus(project.status);
    setDescription(project.description);
    setStartDate(project.startDate);
    setEndDate(project.endDate);
    setSelectedMemberIds(project.memberIds && project.memberIds.length > 0 ? project.memberIds : []);
    setProjectAttachments(project.attachments || []);
    setMemberError(false);
    setMemberRemovalWarning(null);
    setIsEditing(false);
  };

  // Helper: Download attachment file
  const handleDownloadAttachment = (attName: string, url?: string) => {
    if (url) {
      const a = document.createElement('a');
      a.href = url;
      a.download = attName;
      a.target = '_blank';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      const content = `[MORKHE STUDIO - DOKUMEN LAMPIRAN PROYEK]\n\nNama File: ${attName}\nProyek: ${project.name}\nStatus: Dokumen Valid / Siap Diunduh\nWaktu Unduh: ${new Date().toLocaleString('id-ID')}\n\nProject Management System - Morkhe Studio`;
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = attName.endsWith('.pdf') || attName.endsWith('.png') || attName.endsWith('.jpg') || attName.endsWith('.docx') || attName.endsWith('.zip') ? attName : `${attName}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 2000);
    }
  };

  // Helper: Open attachment
  const handleOpenAttachment = (att: { type: 'file' | 'link'; name: string; url?: string }) => {
    if (att.type === 'link' && att.url) {
      window.open(att.url, '_blank', 'noopener,noreferrer');
    } else if (att.type === 'file' && att.url) {
      window.open(att.url, '_blank');
    } else {
      handleDownloadAttachment(att.name, att.url);
    }
  };

  // Upload file for Project Attachment (PM Only)
  const handleProjectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!isPM) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newAttachments: TaskAttachment[] = Array.from(files).map((file: File) => ({
      id: `patt-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      type: 'file',
      name: file.name,
      url: URL.createObjectURL(file),
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      addedByRole: currentUser.role,
      createdAt: new Date().toISOString()
    }));

    const updated = [...projectAttachments, ...newAttachments];
    setProjectAttachments(updated);

    onUpdateProject({
      ...project,
      attachments: updated
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add Link for Project Attachment (PM Only)
  const handleAddProjectLink = () => {
    if (!isPM || !linkUrlInput.trim()) return;
    const displayName = linkTextInput.trim() || linkUrlInput.trim();
    const formattedUrl = linkUrlInput.trim().startsWith('http') ? linkUrlInput.trim() : `https://${linkUrlInput.trim()}`;

    const newLinkAtt: TaskAttachment = {
      id: `patt-${Date.now()}`,
      type: 'link',
      name: displayName,
      url: formattedUrl,
      addedBy: currentUser.id,
      addedByName: currentUser.name,
      addedByRole: currentUser.role,
      createdAt: new Date().toISOString()
    };

    const updated = [...projectAttachments, newLinkAtt];
    setProjectAttachments(updated);

    onUpdateProject({
      ...project,
      attachments: updated
    });

    setLinkUrlInput('');
    setLinkTextInput('');
    setShowAddLinkForm(false);
  };

  // Remove Project Attachment (PM Only)
  const handleRemoveProjectAttachment = (attId: string) => {
    if (!isPM) return;
    const updated = projectAttachments.filter(a => a.id !== attId);
    setProjectAttachments(updated);

    onUpdateProject({
      ...project,
      attachments: updated
    });
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

  // Post project comment
  const handlePostComment = () => {
    if (!newCommentText.trim() && pendingCommentAttachments.length === 0) return;
    if (onAddComment) {
      onAddComment(project.id, newCommentText.trim(), pendingCommentAttachments, true);
    }
    setNewCommentText('');
    setPendingCommentAttachments([]);
    setShowCommentAttachMenu(false);
    setShowCommentLinkForm(false);
  };

  // Reply to a comment
  const handleReplyComment = (cmt: Comment) => {
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

  // Delete a comment
  const handleDeleteCommentItem = (commentId: string) => {
    if (onDeleteComment) {
      onDeleteComment(commentId);
    }
  };

  return (
    <div className="min-h-full bg-morkhe-white p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-gray-900 select-none pb-24">
      
      {/* 1. BREADCRUMB NAVIGATION (P19) - STICKY HEADER */}
      <div className="sticky top-0 z-20 bg-morkhe-white -mx-6 md:-mx-8 px-6 md:px-8 pt-4 pb-3 -mt-6 md:-mt-8 mb-2 border-b border-gray-200/80 shadow-2xs">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 bg-white border border-gray-200 px-4 py-2.5 rounded-xl shadow-2xs">
          <button
            onClick={() => setCurrentPage('P06')}
            className="hover:text-morkhe-purple transition-colors flex items-center gap-1 cursor-pointer font-bold"
          >
            <ArrowLeft className="h-3.5 w-3.5 text-gray-400" />
            <span>Proyek</span>
          </button>
          <ChevronRight className="h-3.5 w-3.5 text-gray-300" />

          <span className="text-gray-900 font-bold truncate max-w-[250px] sm:max-w-md">
            {project.code ? `${project.code}: ${project.name}` : project.name}
          </span>
        </div>
      </div>

      {/* 2. HIGHLIGHTED BLOCK "BUKA RUANG KERJA" (ALWAYS AT TOP) */}
      <div className="bg-[#EEEDFE] border-2 border-[#4949E9] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-full bg-[#4949E9] text-white flex items-center justify-center shrink-0 shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-gray-950 tracking-tight">
              Ruang Kerja
            </h2>
            <p className="text-xs text-gray-600 mt-0.5">
              Kelola tugas dan progres tim di Kanban Board
            </p>
          </div>
        </div>

        <div>
          <button
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.set('project_id', project.id);
              window.history.pushState({}, '', url);
              if (currentUser.role === 'PM') {
                setCurrentPage('P07');
              } else {
                setCurrentPage('P08');
              }
            }}
            className="px-5 py-2.5 bg-[#4949E9] hover:bg-[#3b3be0] text-white rounded-full text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          >
            <Briefcase className="h-4 w-4" />
            <span>Buka Ruang Kerja</span>
          </button>
        </div>
      </div>

      {/* 3. DETAIL PROYEK CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
        
        {!isEditing ? (
          /* READ-ONLY VIEW */
          <div className="space-y-6">
            
            {/* Header / Title block */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold bg-gray-100 text-gray-700 px-2 py-0.5 rounded border border-gray-200">
                    {project.code}
                  </span>
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Detail Proyek
                  </span>
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-950">
                  {project.name}
                </h1>
              </div>

              {/* Status Badge */}
              <div className="shrink-0">
                <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase border ${
                  project.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-200' :
                  project.status === 'Review' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  project.status === 'Ongoing' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                  'bg-gray-100 text-gray-600 border-gray-200'
                }`}>
                  {project.status === 'Completed' ? 'Selesai' : project.status === 'Review' ? 'Review' : project.status === 'Ongoing' ? 'Berjalan' : 'Planning'}
                </span>
              </div>
            </div>

            {/* Metadata Grid & Progress */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-gray-50/80 rounded-xl border border-gray-200/80">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Building2 className="h-3 w-3 text-gray-400" /> Organisasi Klien
                  </span>
                  <p className="text-xs font-bold text-gray-900">{project.client}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" /> Tanggal Mulai
                  </span>
                  <p className="text-xs font-bold text-gray-900">{formatDate(project.startDate)}</p>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-400" /> Tenggat Waktu Akhir
                  </span>
                  <p className="text-xs font-bold text-gray-900">{formatDate(project.endDate)}</p>
                </div>
              </div>

              {/* Task Progress Bar */}
              {(() => {
                const completedTasks = projectTasks.filter(t => t.status === 'done').length;
                const totalTasks = projectTasks.length;
                const pct = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
                return (
                  <div className="p-4 bg-gray-50/80 rounded-xl border border-gray-200/80 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500 font-bold uppercase tracking-wider text-[10px]">Pekerjaan Selesai</span>
                      <span className="font-bold text-gray-900">{completedTasks}/{totalTasks} Tugas Selesai</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full transition-all duration-500 bg-gray-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Scope Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <AlignLeft className="h-3.5 w-3.5 text-gray-400" /> Deskripsi Ruang Lingkup
              </h3>
              <p className="text-xs md:text-sm text-gray-700 leading-relaxed bg-white p-4 rounded-xl border border-gray-200">
                {project.description || 'Tidak ada deskripsi ruang lingkup.'}
              </p>
            </div>

            {/* Assigned Members */}
            <div className="space-y-3 pt-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-gray-400" /> Tim yang Ditugaskan ({assignedUsers.length} Anggota)
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {assignedUsers.map(user => {
                  const activeTasks = getActiveTasksForUser(tasks, user.id);
                  const workload = getWorkloadInfo(activeTasks.length, user.overloadLimit);

                  return (
                    <div key={user.id} className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl">
                      <img 
                        src={user.avatar} 
                        alt={user.name} 
                        className="w-10 h-10 rounded-full object-cover border border-white shadow-xs shrink-0" 
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <p className="text-xs font-bold text-gray-950 truncate">{user.name}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                            workload.isOverloaded 
                              ? 'bg-red-100 text-red-700' 
                              : workload.isFull
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {activeTasks.length}/{user.overloadLimit}
                          </span>
                        </div>
                        <p className="text-[10px] text-gray-500 truncate font-medium">{user.position}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1. LAMPIRAN PROYEK SECTION */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400" /> LAMPIRAN PROYEK
                </label>
                <span className="text-[10px] font-mono text-gray-400 font-semibold">
                  {projectAttachments.length} item
                </span>
              </div>

              {/* Action Buttons: + Upload File & + Tambah Link (PM Only) */}
              {isPM ? (
                <div className="flex items-center gap-2">
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleProjectFileUpload} 
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
              ) : (
                <div className="text-[11px] text-gray-500 italic bg-gray-50 px-3 py-2 rounded-lg border border-gray-200/70">
                  Akses unggah lampiran proyek khusus untuk Project Manager (PM). Staf dapat mengunduh dan membuka tautan yang tersedia.
                </div>
              )}

              {/* Inline Add Link Form */}
              {showAddLinkForm && isPM && (
                <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                  <div className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                    <Link2 className="h-3.5 w-3.5 text-morkhe-purple" />
                    <span>Tambah Tautan / Link Proyek</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">URL (Wajib)</label>
                      <input
                        type="url"
                        value={linkUrlInput}
                        onChange={(e) => setLinkUrlInput(e.target.value)}
                        placeholder="https://figma.com/file/... atau https://..."
                        className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Teks Tampilan (Opsional)</label>
                      <input
                        type="text"
                        value={linkTextInput}
                        onChange={(e) => setLinkTextInput(e.target.value)}
                        placeholder="Contoh: Moodboard Referensi Umum & Konsep Visual"
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
                      onClick={handleAddProjectLink}
                      className="px-3 py-1 text-xs font-bold bg-morkhe-purple text-white rounded-lg hover:opacity-90 transition-all cursor-pointer"
                    >
                      Simpan Link
                    </button>
                  </div>
                </div>
              )}

              {/* Attachment List Display */}
              {projectAttachments.length > 0 ? (
                <div className="space-y-2 pt-1">
                  {projectAttachments.map((att) => (
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

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        {att.type === 'link' ? (
                          <a
                            href={att.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-morkhe-purple border border-purple-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1"
                          >
                            <ExternalLink className="h-3 w-3" />
                            <span>Buka Link</span>
                          </a>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDownloadAttachment(att.name, att.url)}
                            className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-[11px] font-bold rounded-lg transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <Download className="h-3 w-3 text-blue-600" />
                            <span>Unduh</span>
                          </button>
                        )}

                        {/* Delete Button (PM Only) */}
                        {isPM && (
                          <button
                            type="button"
                            onClick={() => handleRemoveProjectAttachment(att.id)}
                            className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-1"
                            title="Hapus Lampiran Proyek"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
                  <p className="text-xs text-gray-400">Belum ada lampiran dokumen atau tautan pada proyek ini.</p>
                </div>
              )}
            </div>

            {/* 2. DISKUSI & KOMENTAR SECTION */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-morkhe-purple" />
                  <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                    Diskusi & Komentar ({projectComments.length})
                  </h3>
                </div>
                <span className="text-[10px] text-gray-400 font-medium hidden sm:inline">
                  PM & Staf dapat berdiskusi di level proyek
                </span>
              </div>

              {/* Comments Feed */}
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {projectComments.length === 0 ? (
                  <p className="text-xs text-gray-400 italic py-2">Belum ada komentar untuk proyek ini.</p>
                ) : (
                  projectComments.map((cmt) => {
                    const isMyComment = (cmt.authorId && cmt.authorId === currentUser.id) || (cmt.authorName && cmt.authorName === currentUser.name);
                    const authorUser = users.find(u => 
                      (cmt.authorId && u.id === cmt.authorId) || 
                      (cmt.authorName && u.name.toLowerCase() === cmt.authorName.toLowerCase())
                    );
                    const cmtIsPM = authorUser ? authorUser.role === 'PM' : cmt.authorRole === 'PM';
                    const rolePrefix = cmtIsPM ? 'PM' : 'Staf';
                    const positionTitle = authorUser ? authorUser.position.replace(' (Project Manager)', '') : (cmtIsPM ? 'Founder & CEO' : 'Graphic Designer');
                    const badgeText = `[${rolePrefix}] ${positionTitle}`;
                    const badgeClasses = cmtIsPM ? 'bg-morkhe-black text-morkhe-green' : 'bg-morkhe-dark-purple text-morkhe-white';

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
                          onClick={() => setPendingCommentAttachments(prev => prev.filter(a => a.id !== pAtt.id))}
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
                      placeholder="Tulis pembaruan atau keputusan terkait proyek ini..."
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
                        className="px-2.5 py-1 text-xs font-semibold text-gray-600 hover:bg-gray-200 rounded-lg transition-all cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="button"
                        onClick={handleAddCommentLinkAttachment}
                        className="px-3 py-1 text-xs font-bold bg-morkhe-purple text-white rounded-lg hover:opacity-90 transition-all cursor-pointer"
                      >
                        Lampirkan
                      </button>
                    </div>
                  </div>
                )}

              </div>
            </div>

          </div>
        ) : (
          /* EDIT MODE FORM */
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
              <Edit2 className="h-4 w-4 text-morkhe-purple" /> Edit Detail Proyek
            </h2>

            {/* Name & Client Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Nama Proyek *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
                  placeholder="Masukkan nama proyek"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Organisasi Klien *</label>
                <input
                  type="text"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
                  placeholder="Masukkan organisasi klien"
                />
              </div>
            </div>

            {/* Status & Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Status Proyek</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-morkhe-purple focus:outline-none cursor-pointer"
                >
                  <option value="Planning">Planning</option>
                  <option value="Ongoing">Berjalan (Ongoing)</option>
                  <option value="Review">Dalam Review</option>
                  <option value="Completed">Selesai (Completed)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Tenggat Waktu Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Ruang Lingkup</label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
                placeholder="Jelaskan ruang lingkup dan tujuan proyek..."
              />
            </div>

            {/* Assignable Members Checkbox Grid */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-700">
                  Tim yang Ditugaskan <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] font-bold text-morkhe-purple">
                  {selectedMemberIds.length} ANGGOTA TERPILIH
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {users.map((u) => {
                  const isChecked = selectedMemberIds.includes(u.id);
                  const activeTasks = getActiveTasksForUser(tasks, u.id);
                  const workload = getWorkloadInfo(activeTasks.length, u.overloadLimit);

                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleMember(u.id)}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                        isChecked 
                          ? 'border-morkhe-purple bg-purple-50/50 shadow-2xs' 
                          : 'border-gray-200 bg-white hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1 mr-2">
                        <div className={`w-5 h-5 rounded-md border flex items-center justify-center shrink-0 transition-all ${
                          isChecked 
                            ? 'bg-morkhe-purple border-morkhe-purple text-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isChecked && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                        </div>

                        <img 
                          src={u.avatar} 
                          alt={u.name} 
                          className="w-8 h-8 rounded-full object-cover border border-white shadow-xs shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate">{u.name}</p>
                          <p className="text-[10px] text-gray-500 font-medium truncate">{u.position}</p>
                        </div>
                      </div>

                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                        workload.isOverloaded 
                          ? 'bg-red-100 text-red-700' 
                          : workload.isFull
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {activeTasks.length}/{u.overloadLimit}
                      </span>
                    </div>
                  );
                })}
              </div>

              {selectedMemberIds.length === 0 && (
                <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5 font-medium mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Wajib menugaskan minimal 1 anggota tim sebelum membuat/menyimpan proyek.</span>
                </div>
              )}

              {memberRemovalWarning && (
                <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5 font-medium mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>{memberRemovalWarning}</span>
                </div>
              )}
            </div>

            {/* LAMPIRAN PROYEK IN EDIT MODE */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Paperclip className="h-3.5 w-3.5 text-gray-400" /> LAMPIRAN PROYEK
                </label>
                <span className="text-[10px] font-mono text-gray-400 font-semibold">
                  {projectAttachments.length} item
                </span>
              </div>

              {/* Action Buttons: + Upload File & + Tambah Link */}
              <div className="flex items-center gap-2">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleProjectFileUpload} 
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
                    <span>Tambah Tautan / Link Proyek</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">URL (Wajib)</label>
                      <input
                        type="url"
                        value={linkUrlInput}
                        onChange={(e) => setLinkUrlInput(e.target.value)}
                        placeholder="https://figma.com/file/... atau https://..."
                        className="w-full text-xs text-gray-800 bg-white border border-gray-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-black"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-gray-500 uppercase block mb-1">Teks Tampilan (Opsional)</label>
                      <input
                        type="text"
                        value={linkTextInput}
                        onChange={(e) => setLinkTextInput(e.target.value)}
                        placeholder="Contoh: Moodboard Referensi Umum & Konsep Visual"
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
                      onClick={handleAddProjectLink}
                      className="px-3 py-1 text-xs font-bold bg-morkhe-purple text-white rounded-lg hover:opacity-90 transition-all cursor-pointer"
                    >
                      Simpan Link
                    </button>
                  </div>
                </div>
              )}

              {/* Attachment List Display */}
              {projectAttachments.length > 0 && (
                <div className="space-y-2 pt-1">
                  {projectAttachments.map((att) => (
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

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleRemoveProjectAttachment(att.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer ml-1"
                          title="Hapus Lampiran Proyek"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 4. FOOTER CTA (RBAC: PM ONLY) */}
      {isPM && (
        <div className="sticky bottom-0 -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-8 bg-white border-t border-gray-200 py-3.5 px-6 md:px-8 z-30 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left Status Info */}
            <div className="text-xs text-gray-500 font-medium hidden sm:block">
              {isEditing ? (
                <span>Mode Pengeditan Detail Proyek</span>
              ) : (
                <span>Mode Tampilan Proyek (Dapat Diedit)</span>
              )}
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3 ml-auto">
              {!isEditing ? (
                /* READ-ONLY FOOTER CTA */
                <>
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Hapus Proyek</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsEditing(true)}
                    className="px-5 py-2 bg-morkhe-purple hover:opacity-90 text-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-[0.98]"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                    <span>Edit Detail Proyek</span>
                  </button>
                </>
              ) : (
                /* EDIT MODE FOOTER CTA */
                <>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-all cursor-pointer"
                  >
                    Batal
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    disabled={selectedMemberIds.length === 0}
                    className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      selectedMemberIds.length === 0
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70 shadow-none'
                        : 'bg-morkhe-purple hover:opacity-90 text-white cursor-pointer active:scale-[0.98]'
                    }`}
                  >
                    <Check className="h-4 w-4" />
                    <span>Simpan Perubahan</span>
                  </button>
                </>
              )}
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      <ConfirmDeleteModal
        isOpen={isDeleteModalOpen}
        title="Hapus Proyek?"
        message={`Anda yakin ingin menghapus proyek "${project.name}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua tugas yang terkait.`}
        onConfirm={() => {
          onDeleteProject(project.id);
          setIsDeleteModalOpen(false);
          setCurrentPage('P06');
        }}
        onCancel={() => setIsDeleteModalOpen(false)}
      />

    </div>
  );
}
