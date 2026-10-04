/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Briefcase, Plus, Calendar, ShieldAlert, FolderOpen, ChevronRight, Lock, Edit2, Trash2, MessageSquare, Paperclip } from 'lucide-react';
import { User, Project, Task, Comment } from '../types';
import { DUMMY_COMMENTS } from '../data/dummy';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import EmptyState from '../components/EmptyState';
import { formatDateRange } from '../utils/dateFormat';
import assetProyek from '../../assets/assetProyek.png';

interface ProjectListPageProps {
  currentUser: User;
  projects: Project[];
  users: User[];
  tasks: Task[];
  comments?: Comment[];
  onOpenAddProjectModal: () => void;
  onUpdateProject?: (project: Project) => void;
  onDeleteProject?: (projectId: string) => void;
  onOpenProjectDetail?: (project: Project) => void;
  setCurrentPage: (page: string) => void;
}

export default function ProjectListPage({
  currentUser,
  projects,
  users,
  tasks,
  comments,
  onOpenAddProjectModal,
  onUpdateProject,
  onDeleteProject,
  onOpenProjectDetail,
  setCurrentPage
}: ProjectListPageProps) {
  const isPM = currentUser.role === 'PM';
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);

  const allComments = comments || DUMMY_COMMENTS;

  const visibleProjects = isPM 
    ? projects
    : projects.filter(p => p.memberIds && p.memberIds.includes(currentUser.id));

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans select-none text-gray-900">
      
      {/* Top action block */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div>
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-black" /> Direktori Proyek Agensi
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Mengatur pengarahan kampanye kreatif aktif, klien, tenggat waktu, dan pelacakan kemajuan.
          </p>
        </div>

        {/* Create Project Button: Guarded by RBAC */}
        {isPM ? (
          <button
            id="btn-create-project-trigger"
            onClick={() => setCurrentPage('P12')}
            className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-morkhe-purple"
          >
            <Plus className="h-4 w-4 text-morkhe-white" /> Buat Proyek
          </button>
        ) : (
          <button
            id="btn-create-project-locked"
            disabled
            className="px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-not-allowed"
            title="Pembuatan proyek desain terkunci untuk akun Staff."
          >
            <Lock className="h-3.5 w-3.5" /> Buat Proyek (Hanya PM)
          </button>
        )}
      </div>

      {/* Grid of project cards or Empty State */}
      {visibleProjects.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5 shadow-2xs">
          {isPM ? (
            <EmptyState
              imageSrc={assetProyek}
              imageAlt="Ilustrasi Belum Ada Proyek"
              headline="Belum Ada Proyek"
              subtext="Buat proyek pertama untuk mulai mengelola tim dan tugas."
              ctaLabel="+ Buat Proyek"
              onCtaClick={() => setCurrentPage('P12')}
            />
          ) : (
            <EmptyState
              imageSrc={assetProyek}
              imageAlt="Ilustrasi Belum Ada Proyek"
              headline="Belum Ada Proyek yang Ditugaskan"
              subtext="Proyek yang di-assign oleh Project Manager akan muncul di sini."
            />
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleProjects.map((p) => {
          const isCompleted = p.status === 'Completed';
          const projectTasks = tasks.filter(t => t.projectId === p.id);
          const completedTasksCount = projectTasks.filter(t => t.status === 'done').length;
          const totalTasksCount = projectTasks.length;
          const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

          // Comment count: direct project comments
          const commentCount = allComments.filter(c => c.projectId === p.id).length;

          // Attachment count: direct project attachments
          const attachmentCount = p.attachments ? p.attachments.length : 0;

          const assignedUserIds = (p.memberIds && p.memberIds.length > 0) 
            ? p.memberIds 
            : Array.from(new Set(projectTasks.flatMap(t => t.assigneeIds && t.assigneeIds.length > 0 ? t.assigneeIds : [t.assigneeId])));
          const assignedUsers = users.filter(u => assignedUserIds.includes(u.id));

          return (
            <div
              key={p.id}
              onClick={() => {
                if (onOpenProjectDetail) {
                  onOpenProjectDetail(p);
                } else {
                  const url = new URL(window.location.href);
                  url.searchParams.set('project_id', p.id);
                  window.history.pushState({}, '', url);
                  setCurrentPage('P19');
                }
              }}
              className="bg-white border border-gray-200 hover:border-gray-400 rounded-xl p-5 flex flex-col justify-between space-y-4 transition-all cursor-pointer hover:shadow-xs group"
            >
              <div className="space-y-3">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded border border-gray-200 shrink-0">
                        {p.code}
                      </span>
                      <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Klien: {p.client}</span>
                    </div>
                    <h2 className="text-base font-bold text-gray-950 mt-0.5 group-hover:text-morkhe-purple transition-colors">{p.name}</h2>
                  </div>
                  
                  {/* Status Badge */}
                  <span className={`text-[10px] font-sans font-bold px-2 py-0.5 rounded-full uppercase border shrink-0 ${
                    p.status === 'Completed' ? 'bg-green-50 text-green-700 border-green-100' :
                    p.status === 'Review' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                    p.status === 'Ongoing' ? 'bg-gray-100 text-gray-800 border-gray-200' :
                    'bg-gray-50 text-gray-500 border-gray-200'
                  }`}>
                    {p.status === 'Completed' ? 'Selesai' : p.status === 'Review' ? 'Review' : p.status === 'Ongoing' ? 'Berjalan' : p.status}
                  </span>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed line-clamp-3">
                  {p.description}
                </p>
              </div>

              {/* Progress Bar & Footer */}
              <div className="space-y-2.5 pt-2.5 border-t border-gray-100">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500 font-medium">Pekerjaan Selesai</span>
                    <span className="font-bold text-gray-850">{completedTasksCount}/{totalTasksCount} Tugas Selesai</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full transition-all duration-500 bg-gray-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs gap-1.5">
                  {/* Left: Date Range (StartDate → EndDate), Comments, Attachments */}
                  <div className="flex items-center gap-2 text-gray-500 font-medium text-[11px] min-w-0">
                    <div className="flex items-center gap-1 shrink-0" title={`Rentang Waktu: ${formatDateRange(p.startDate, p.endDate)}`}>
                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span className="whitespace-nowrap">{formatDateRange(p.startDate, p.endDate)}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" title={`${commentCount} Komentar`}>
                      <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{commentCount}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0" title={`${attachmentCount} Lampiran`}>
                      <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                      <span>{attachmentCount}</span>
                    </div>
                  </div>

                  {/* Right: Member Avatars & Workspace CTA */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {assignedUsers.length > 0 && (
                      <div className="flex -space-x-1.5 items-center shrink-0">
                        {assignedUsers.slice(0, 3).map(user => (
                          <img 
                            key={user.id} 
                            src={user.avatar} 
                            alt={user.name} 
                            title={`${user.name} (${user.position})`}
                            className="w-5.5 h-5.5 rounded-full border border-white object-cover shadow-2xs" 
                          />
                        ))}
                        {assignedUsers.length > 3 && (
                          <div className="w-5.5 h-5.5 rounded-full border border-white bg-gray-200 text-gray-700 flex items-center justify-center text-[9px] font-bold z-10 relative shadow-2xs">
                            +{assignedUsers.length - 3}
                          </div>
                        )}
                      </div>
                    )}

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        // Navigate to Kanban board with project_id filter
                        const url = new URL(window.location.href);
                        url.searchParams.set('project_id', p.id);
                        window.history.pushState({}, '', url);
                        
                        if (currentUser.role === 'PM') {
                          setCurrentPage('P07');
                        } else {
                          setCurrentPage('P08');
                        }
                      }}
                      className="px-2.5 py-1.5 bg-[#4949E9] hover:bg-[#3b3be0] text-white rounded-full text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer shadow-sm active:scale-[0.98] whitespace-nowrap shrink-0"
                    >
                      <Briefcase className="h-3.5 w-3.5 shrink-0" />
                      <span className="whitespace-nowrap">Buka Ruang Kerja</span>
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={!!projectToDelete}
        title="Hapus Proyek?"
        message={`Anda yakin ingin menghapus proyek "${projectToDelete?.name || ''}"? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua tugas yang terkait.`}
        onConfirm={() => {
          if (projectToDelete) {
            onDeleteProject?.(projectToDelete.id);
            setProjectToDelete(null);
          }
        }}
        onCancel={() => setProjectToDelete(null)}
      />
    </div>
  );
}
