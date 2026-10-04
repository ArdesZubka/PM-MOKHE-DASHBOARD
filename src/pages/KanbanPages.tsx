/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Trello, 
  Plus, 
  CheckSquare, 
  Calendar, 
  Lock, 
  Users,
  Grid,
  Briefcase,
  ChevronDown,
  Info,
  MessageSquare,
  Paperclip
} from 'lucide-react';
import { User, Task, Project, Comment } from '../types';
import { getStatusColor } from '../utils/statusColors';
import { formatDate } from '../utils/dateFormat';
import EmptyState from '../components/EmptyState';
import assetKanban from '../../assets/assetKanban.png';
import assetProyek from '../../assets/assetProyek.png';

interface KanbanPagesProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments?: Comment[];
  onOpenAddTaskModal: (initialStatus?: Task['status'], targetProjectId?: string) => void;
  onUpdateTaskStatus: (
    taskId: string, 
    newStatus: Task['status'],
    targetNeighborTaskId?: string,
    insertBefore?: boolean
  ) => void;
  onOpenTaskDetail: (task: Task) => void;
  isNested?: boolean;
  setCurrentPage?: (page: string) => void;
}

export default function KanbanPages({
  currentUser,
  users,
  projects,
  tasks,
  comments,
  onOpenAddTaskModal,
  onUpdateTaskStatus,
  onOpenTaskDetail,
  isNested,
  setCurrentPage
}: KanbanPagesProps) {
  const isPM = currentUser.role === 'PM';

  // Allowed tasks based on role: PM sees all, Staff sees only assigned tasks
  const allowedTasks = isPM 
    ? tasks 
    : tasks.filter(t => t.assigneeIds ? t.assigneeIds.includes(currentUser.id) : t.assigneeId === currentUser.id);

  // Visible projects: PM sees all, Staff sees projects where they are assigned members
  const visibleProjects = isPM 
    ? projects
    : projects.filter(p => p.memberIds && p.memberIds.includes(currentUser.id));

  // Gate utama: apakah user memiliki proyek yang bisa diakses
  const hasAccessibleProject = visibleProjects.length > 0;

  const [filterProjectId, setFilterProjectId] = useState<string>('all');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);

  // Drag & Drop UX state: active drag task, target column, target insertion index
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<Task['status'] | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Auto-scroll references
  const boardScrollRef = useRef<HTMLDivElement>(null);
  const scrollSpeedRef = useRef<number>(0);
  const scrollAnimRef = useRef<number | null>(null);

  // Synchronize initial filter with URL search param
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const projectIdParam = searchParams.get('project_id');
    if (projectIdParam) {
      if (isPM || visibleProjects.some(p => p.id === projectIdParam)) {
        setFilterProjectId(projectIdParam);
      } else {
        setFilterProjectId('all');
      }
    }
  }, [isPM, visibleProjects]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProjectId = e.target.value;
    setFilterProjectId(newProjectId);
    
    // Update URL to reflect the new filter
    const url = new URL(window.location.href);
    if (newProjectId === 'all') {
      url.searchParams.delete('project_id');
    } else {
      url.searchParams.set('project_id', newProjectId);
    }
    window.history.replaceState({}, '', url);
  };

  const filteredTasksByProject = filterProjectId === 'all' 
    ? allowedTasks 
    : allowedTasks.filter(t => t.projectId === filterProjectId);

  const filteredTasks = filteredTasksByProject;

  const assignedUserIds = Array.from(new Set(filteredTasks.map(t => t.assigneeId)));
  const assignedUsers = users.filter(u => assignedUserIds.includes(u.id));

  const columns: { id: Task['status']; name: string; color: string; border: string }[] = [
    { id: 'todo', name: 'Perlu Dikerjakan', color: 'bg-gray-100 text-gray-700', border: 'border-t-2 border-gray-300' },
    { id: 'in_progress', name: 'Sedang Berjalan', color: 'bg-gray-50 text-gray-800', border: 'border-t-2 border-morkhe-purple' },
    { id: 'review', name: 'Dalam Review', color: 'bg-gray-50 text-gray-800', border: 'border-t-2 border-amber-500' },
    { id: 'done', name: 'Selesai', color: 'bg-gray-50 text-gray-800', border: 'border-t-2 border-morkhe-green' },
    { id: 'canceled_on_hold', name: 'Batal/Tunda', color: 'bg-gray-50 text-gray-800', border: 'border-t-2 border-slate-400' }
  ];

  // RBAC permission check: PM can drag all, Staff can only drag assigned tasks
  const canUserDragTask = (task: Task) => {
    if (isPM) return true;
    if (task.assigneeIds && task.assigneeIds.length > 0) {
      return task.assigneeIds.includes(currentUser.id);
    }
    return task.assigneeId === currentUser.id;
  };

  // Smooth Auto-Scroll loop
  const startAutoScroll = () => {
    if (scrollAnimRef.current !== null) return;
    const step = () => {
      if (boardScrollRef.current && scrollSpeedRef.current !== 0) {
        boardScrollRef.current.scrollLeft += scrollSpeedRef.current;
        scrollAnimRef.current = requestAnimationFrame(step);
      } else {
        scrollAnimRef.current = null;
      }
    };
    scrollAnimRef.current = requestAnimationFrame(step);
  };

  const stopAutoScroll = () => {
    scrollSpeedRef.current = 0;
    if (scrollAnimRef.current !== null) {
      cancelAnimationFrame(scrollAnimRef.current);
      scrollAnimRef.current = null;
    }
  };

  // Global window listeners for drag end / cancellation
  useEffect(() => {
    if (!draggedTaskId) return;

    const handleGlobalDragEnd = () => {
      setDraggedTaskId(null);
      setDragOverColumn(null);
      setDragOverIndex(null);
      stopAutoScroll();
    };

    window.addEventListener('dragend', handleGlobalDragEnd);
    window.addEventListener('drop', handleGlobalDragEnd);

    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd);
      window.removeEventListener('drop', handleGlobalDragEnd);
      stopAutoScroll();
    };
  }, [draggedTaskId]);

  // Board container drag over: calculate horizontal auto-scroll near edges (60-80px threshold)
  const handleBoardDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!boardScrollRef.current || !draggedTaskId) return;

    const rect = boardScrollRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const distLeft = clientX - rect.left;
    const distRight = rect.right - clientX;
    const THRESHOLD = 80;

    if (distLeft < THRESHOLD && distLeft >= 0) {
      const ratio = 1 - distLeft / THRESHOLD;
      scrollSpeedRef.current = -Math.max(4, Math.round(ratio * 16));
      startAutoScroll();
    } else if (distRight < THRESHOLD && distRight >= 0) {
      const ratio = 1 - distRight / THRESHOLD;
      scrollSpeedRef.current = Math.max(4, Math.round(ratio * 16));
      startAutoScroll();
    } else {
      stopAutoScroll();
    }
  };

  // Drag start
  const handleDragStart = (e: React.DragEvent, task: Task) => {
    if (!canUserDragTask(task)) {
      e.preventDefault();
      return;
    }
    setDraggedTaskId(task.id);
    e.dataTransfer.setData('text/plain', task.id);
    e.dataTransfer.effectAllowed = 'move';
  };

  // Column drag over (broad area: covers empty space, padding, and bottom buttons)
  const handleColumnDragOver = (e: React.DragEvent, colId: Task['status'], taskCount: number) => {
    e.preventDefault();
    setDragOverColumn(colId);
    if (dragOverColumn !== colId || dragOverIndex === null) {
      setDragOverIndex(taskCount);
    }
  };

  // Card drag over: calculates precise insertion index (top half vs bottom half)
  const handleCardDragOver = (e: React.DragEvent, colId: Task['status'], index: number) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const insertIdx = e.clientY < midY ? index : index + 1;
    setDragOverColumn(colId);
    setDragOverIndex(insertIdx);
  };

  // Drop handler
  const handleDrop = (e: React.DragEvent, targetStatus: Task['status']) => {
    e.preventDefault();
    e.stopPropagation();
    stopAutoScroll();

    const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
    const currentDragOverIdx = dragOverIndex;

    setDraggedTaskId(null);
    setDragOverColumn(null);
    setDragOverIndex(null);

    if (!taskId) return;

    // Get current filtered tasks in target column
    const columnTasks = filteredTasks.filter(t => t.status === targetStatus);

    let targetNeighborTaskId: string | undefined;
    let insertBefore: boolean = true;

    if (columnTasks.length > 0) {
      if (currentDragOverIdx === null || currentDragOverIdx >= columnTasks.length) {
        // Dropped at the bottom of the column (after the last task)
        targetNeighborTaskId = columnTasks[columnTasks.length - 1].id;
        insertBefore = false;
      } else {
        const targetCard = columnTasks[currentDragOverIdx];
        if (targetCard) {
          if (targetCard.id === taskId) {
            // Dragged task hovering over itself; check adjacent tasks for stable reference
            if (currentDragOverIdx > 0) {
              targetNeighborTaskId = columnTasks[currentDragOverIdx - 1].id;
              insertBefore = false;
            } else if (currentDragOverIdx + 1 < columnTasks.length) {
              targetNeighborTaskId = columnTasks[currentDragOverIdx + 1].id;
              insertBefore = true;
            }
          } else {
            targetNeighborTaskId = targetCard.id;
            insertBefore = true;
          }
        } else {
          targetNeighborTaskId = columnTasks[columnTasks.length - 1].id;
          insertBefore = false;
        }
      }
    }

    onUpdateTaskStatus(taskId, targetStatus, targetNeighborTaskId, insertBefore);
  };

  // Insertion placeholder element (neutral gray dashed border with smooth animation)
  const renderPlaceholder = () => (
    <div 
      key="insertion-placeholder"
      className="h-24 w-full border-2 border-dashed border-gray-300 bg-gray-100/70 rounded-lg flex items-center justify-center text-gray-400 text-xs font-semibold select-none transition-all my-1.5 animate-pulse"
    >
      <span className="text-[11px] text-gray-400 font-medium">Lepaskan kartu di sini</span>
    </div>
  );

  const content = (
    <>
      {/* Header section with project filtration */}
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <Trello className="h-5 w-5 text-black" /> Papan Kerja Kanban Agensi
          </h1>
          <div className="relative inline-flex items-center group">
            <button
              type="button"
              onClick={() => setShowInfoTooltip(prev => !prev)}
              className="p-1 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
              aria-label="Informasi Halaman"
            >
              <Info className="h-4 w-4 stroke-[2.2]" />
            </button>
            <div
              className={`absolute left-0 top-full mt-1.5 z-50 w-72 md:w-80 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${
                showInfoTooltip
                  ? 'opacity-100 visible translate-y-0'
                  : 'opacity-0 invisible -translate-y-1'
              }`}
            >
              <div className="absolute -top-1 left-3.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
              {isPM 
                ? 'Manajemen PM: Tugaskan pekerjaan, evaluasi beban backlog, dan geser kartu pekerjaan.' 
                : 'Ruang Kerja Staf: Perbarui jalur tugas, pantau subtugas, dan periksa kapasitas beban aktif'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Project filtration selector */}
          <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100/80 px-3.5 py-1.5 rounded-full border border-gray-250 transition-colors relative">
            <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-500 font-sans shrink-0">Proyek:</span>
            <div className="relative flex items-center pr-4">
              <select
                id="kanban-project-filter"
                value={filterProjectId}
                disabled={!hasAccessibleProject}
                onChange={handleFilterChange}
                className="appearance-none bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none cursor-pointer pr-1.5 select-none disabled:cursor-not-allowed disabled:text-gray-400"
              >
                <option value="all">Semua Proyek</option>
                {visibleProjects.map(p => (
                  <option key={p.id} value={p.id}>{p.code ? `${p.code}: ${p.name}` : p.name}</option>
                ))}
              </select>
              <div className="pointer-events-none absolute right-0 flex items-center">
                <ChevronDown className="h-3 w-3 text-morkhe-purple stroke-[3]" />
              </div>
            </div>
          </div>

          {/* Add Task Trigger: Disabled if no accessible project exists */}
          {!hasAccessibleProject ? (
            <button
              id="btn-add-task-disabled"
              disabled
              title="Buat atau tunggu proyek tersedia dulu"
              className="px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-not-allowed shrink-0"
            >
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              <span>+ Tambah Tugas (Perlu Proyek)</span>
            </button>
          ) : (
            <button
              id="btn-add-task-trigger"
              onClick={() => onOpenAddTaskModal('todo', filterProjectId !== 'all' ? filterProjectId : undefined)}
              className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-morkhe-purple shrink-0"
            >
              <Plus className="h-4 w-4 text-morkhe-white" />
              <span>Tambah Tugas</span>
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board Layout - 3 Render Conditions */}
      <div 
        ref={boardScrollRef}
        onDragOver={hasAccessibleProject && filteredTasks.length > 0 ? handleBoardDragOver : undefined}
        className="w-full overflow-x-auto pb-4 kanban-board-scroll scroll-smooth"
      >
        <div className="grid grid-cols-[repeat(5,280px)] sm:grid-cols-[repeat(5,305px)] gap-4 items-start min-w-max pb-1">
          
          {/* ================= CONDITION 1: !hasAccessibleProject ================= */}
          {!hasAccessibleProject ? (
            <>
              {/* Header kolom dengan counter 0 dan tombol + disabled */}
              {columns.map((col) => {
                const statusColor = getStatusColor(col.id);
                return (
                  <div
                    key={col.id}
                    className="w-[280px] sm:w-[305px] bg-gray-50 rounded-xl p-3 border border-gray-200 shadow-2xs"
                  >
                    <div 
                      className="flex items-center justify-between p-2 rounded-t-lg bg-white border border-gray-100 border-b-2"
                      style={{ borderBottomColor: statusColor.bg }}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-bold text-[10px] px-2 py-0.5 rounded-full leading-none"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          0
                        </span>
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{col.name}</span>
                      </div>
                      <button 
                        disabled
                        title="Buat atau tunggu proyek tersedia dulu"
                        className="p-1 rounded-full flex items-center justify-center bg-gray-100 text-gray-300 border border-gray-200 cursor-not-allowed"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* EmptyState Proyek spanning full grid width without whitespace bugs */}
              <div 
                className="col-span-full w-full bg-white border border-gray-200 rounded-xl p-3 sm:p-5 shadow-2xs"
                style={{ gridColumn: '1 / -1' }}
              >
                {isPM ? (
                  <EmptyState
                    imageSrc={assetProyek}
                    imageAlt="Ilustrasi Belum Ada Proyek"
                    headline="Belum Ada Proyek"
                    subtext="Tugas harus dikaitkan ke sebuah proyek. Buat proyek pertama, baru tugas bisa ditambahkan."
                    ctaLabel="+ Buat Proyek"
                    onCtaClick={() => setCurrentPage ? setCurrentPage('P12') : undefined}
                  />
                ) : (
                  <EmptyState
                    imageSrc={assetProyek}
                    imageAlt="Ilustrasi Belum Ada Proyek"
                    headline="Belum Ada Proyek yang Ditugaskan"
                    subtext="Tugas baru bisa ditambahkan setelah kamu di-assign ke sebuah proyek oleh Project Manager."
                  />
                )}
              </div>
            </>
          ) : filteredTasks.length === 0 ? (
            /* ================= CONDITION 2: hasAccessibleProject && filteredTasks.length === 0 ================= */
            <>
              {/* Header kolom dengan counter 0 dan tombol + aktif */}
              {columns.map((col) => {
                const statusColor = getStatusColor(col.id);
                return (
                  <div
                    key={col.id}
                    className="w-[280px] sm:w-[305px] bg-gray-50 rounded-xl p-3 border border-gray-200 shadow-2xs"
                  >
                    <div 
                      className="flex items-center justify-between p-2 rounded-t-lg bg-white border border-gray-100 border-b-2"
                      style={{ borderBottomColor: statusColor.bg }}
                    >
                      <div className="flex items-center gap-2">
                        <span 
                          className="font-bold text-[10px] px-2 py-0.5 rounded-full leading-none"
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                        >
                          0
                        </span>
                        <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{col.name}</span>
                      </div>
                      <button 
                        onClick={() => onOpenAddTaskModal(col.id, filterProjectId !== 'all' ? filterProjectId : undefined)}
                        title="Tambah Tugas Baru"
                        className="p-1 rounded-full transition-all flex items-center justify-center bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white cursor-pointer shadow-sm border border-morkhe-purple"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* EmptyState Tugas spanning full grid width without whitespace bugs */}
              <div 
                className="col-span-full w-full bg-white border border-gray-200 rounded-xl p-3 sm:p-5 shadow-2xs"
                style={{ gridColumn: '1 / -1' }}
              >
                <EmptyState
                  imageSrc={assetKanban}
                  imageAlt="Ilustrasi Belum Ada Tugas"
                  headline="Belum Ada Tugas"
                  subtext="Tugas yang dibuat akan muncul di papan Kanban ini."
                  ctaLabel="+ Tambah Tugas"
                  onCtaClick={() => onOpenAddTaskModal('todo', filterProjectId !== 'all' ? filterProjectId : undefined)}
                />
              </div>
            </>
          ) : (
            /* ================= CONDITION 3: hasAccessibleProject && filteredTasks.length > 0 ================= */
            columns.map((col) => {
              const columnTasks = filteredTasks.filter(t => t.status === col.id);
              const statusColor = getStatusColor(col.id);
              const isOverThisCol = dragOverColumn === col.id && draggedTaskId !== null;
              
              return (
                <div
                  key={col.id}
                  onDragOver={(e) => handleColumnDragOver(e, col.id, columnTasks.length)}
                  onDrop={(e) => handleDrop(e, col.id)}
                  className={`w-[280px] sm:w-[305px] bg-gray-50 rounded-xl p-4 space-y-4 border transition-all h-fit flex flex-col shadow-xs ${
                    isOverThisCol ? 'border-gray-300 bg-gray-100/40 ring-1 ring-gray-200' : 'border-gray-200'
                  }`}
                >
                  {/* Column Header */}
                  <div 
                    className="flex items-center justify-between p-2 rounded-t-lg bg-white border border-gray-100 border-b-2"
                    style={{ borderBottomColor: statusColor.bg }}
                  >
                    <div className="flex items-center gap-2">
                      <span 
                        className="font-bold text-[10px] px-2 py-0.5 rounded-full leading-none"
                        style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                      >
                        {columnTasks.length}
                      </span>
                      <span className="text-xs font-bold text-gray-800 uppercase tracking-tight">{col.name}</span>
                    </div>
                    <button 
                      onClick={() => onOpenAddTaskModal(col.id, filterProjectId !== 'all' ? filterProjectId : undefined)}
                      title="Tambah Tugas Baru"
                      className="p-1 rounded-full transition-all flex items-center justify-center bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white cursor-pointer shadow-sm border border-morkhe-purple"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Task Cards Stack & Drop Zone */}
                  <div 
                    className="space-y-3 flex flex-col pr-0.5 min-h-[140px]"
                    onDragOver={(e) => handleColumnDragOver(e, col.id, columnTasks.length)}
                    onDrop={(e) => handleDrop(e, col.id)}
                  >
                    {columnTasks.length === 0 ? (
                      isOverThisCol ? (
                        renderPlaceholder()
                      ) : (
                        /* Functional drop-zone indicator when individual column is empty */
                        <div className="h-24 w-full border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center select-none my-1">
                          <span className="text-xs italic text-[#9CA3AF]">Geser tugas ke sini</span>
                        </div>
                      )
                    ) : (
                      <>
                        {columnTasks.map((task, index) => {
                          const assignee = users.find(u => u.id === task.assigneeId);
                          const proj = projects.find(p => p.id === task.projectId);
                          
                          const completedSubtasks = task.subtasks.filter(s => s.isCompleted).length;
                          const hasSubtasks = task.subtasks.length > 0;

                          const commentCount = comments ? comments.filter(c => c.taskId === task.id).length : 0;
                          const attachmentCount = task.attachments ? task.attachments.length : 0;

                          const isBeingDragged = task.id === draggedTaskId;
                          const isDraggable = canUserDragTask(task);
                          const showPlaceholderBefore = isOverThisCol && dragOverIndex === index;

                          return (
                            <React.Fragment key={task.id}>
                              {showPlaceholderBefore && renderPlaceholder()}
                              <div
                                id={`task-card-${task.id}`}
                                draggable={isDraggable}
                                onDragStart={(e) => handleDragStart(e, task)}
                                onDragEnd={() => {
                                  setDraggedTaskId(null);
                                  setDragOverColumn(null);
                                  setDragOverIndex(null);
                                  stopAutoScroll();
                                }}
                                onDragOver={(e) => handleCardDragOver(e, col.id, index)}
                                onDrop={(e) => handleDrop(e, col.id)}
                                onClick={() => onOpenTaskDetail(task)}
                                className={`bg-white border rounded-lg p-4 transition-all space-y-3 shadow-none ${
                                  isBeingDragged 
                                    ? 'opacity-40 border-dashed border-gray-300 scale-[0.98]' 
                                    : 'border-gray-200 hover:border-gray-400'
                                } ${
                                  isDraggable 
                                    ? 'cursor-grab active:cursor-grabbing' 
                                    : 'cursor-pointer'
                                }`}
                              >
                                {/* Tag/Project details */}
                                <div className="flex justify-between items-center gap-1.5">
                                  <div className="flex items-center gap-1 min-w-0">
                                    <span className="text-[9px] font-bold bg-gray-100 text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded truncate max-w-[140px]" title={proj ? `${proj.code}: ${proj.name}` : 'Proyek Tidak Diketahui'}>
                                      {proj ? `${proj.code}: ${proj.name}` : 'Proyek Tidak Diketahui'}
                                    </span>
                                  </div>
                                  
                                  <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded uppercase shrink-0 ${
                                    task.priority === 'Critical' ? 'bg-red-50 text-red-700 border border-red-100' :
                                    task.priority === 'High' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                    task.priority === 'Medium' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                    'bg-gray-100 text-gray-600 border border-gray-200'
                                  }`}>
                                    {task.priority === 'Critical' ? 'Kritis' : task.priority === 'High' ? 'Tinggi' : task.priority === 'Medium' ? 'Menengah' : 'Rendah'}
                                  </span>
                                </div>

                                {/* Title & Desc */}
                                <div className="space-y-1">
                                  <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{task.title}</h4>
                                  <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{task.description}</p>
                                </div>

                                {/* Subtasks Progress indicator */}
                                {hasSubtasks && (
                                  <div className="space-y-1">
                                    <div className="flex justify-between text-[9px] text-gray-400 font-medium">
                                      <span>Subtugas ({completedSubtasks}/{task.subtasks.length})</span>
                                    </div>
                                    <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                                      <div 
                                        className="h-full bg-gray-500 rounded-full"
                                        style={{ width: `${(completedSubtasks / task.subtasks.length) * 100}%` }}
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Metadata Footer: Deadline, Comments, Attachments & Assignee Avatars */}
                                <div className="flex justify-between items-center pt-2 border-t border-gray-100 text-[10px]">
                                  <div className="flex items-center gap-2.5 text-gray-500 font-medium">
                                    {/* Deadline */}
                                    <div className="flex items-center gap-1" title={`Tenggat Waktu: ${formatDate(task.deadline)}`}>
                                      <Calendar className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                      <span>{formatDate(task.deadline)}</span>
                                    </div>

                                    {/* Comment count indicator (Hidden if 0) */}
                                    {commentCount > 0 && (
                                      <div className="flex items-center gap-1" title={`${commentCount} Komentar`}>
                                        <MessageSquare className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span>{commentCount}</span>
                                      </div>
                                    )}

                                    {/* Attachment count indicator (Hidden if 0) */}
                                    {attachmentCount > 0 && (
                                      <div className="flex items-center gap-1" title={`${attachmentCount} Lampiran`}>
                                        <Paperclip className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                        <span>{attachmentCount}</span>
                                      </div>
                                    )}
                                  </div>

                                  {/* Stacked avatars */}
                                  {(() => {
                                    const taskAssigneeIds = (task.assigneeIds && task.assigneeIds.length > 0)
                                      ? task.assigneeIds
                                      : [task.assigneeId].filter(Boolean);
                                    const cardUsers = taskAssigneeIds
                                      .map(id => users.find(u => u.id === id))
                                      .filter((u): u is User => Boolean(u));
                                    const visibleAssignees = cardUsers.slice(0, 3);
                                    const overflowCount = cardUsers.length - 3;

                                    return (
                                      <div className="flex -space-x-1.5 items-center" title={cardUsers.map(u => u.name).join(', ')}>
                                        {visibleAssignees.map(u => (
                                          <img
                                            key={u.id}
                                            src={u.avatar}
                                            alt={u.name}
                                            title={`${u.name} (${u.position})`}
                                            className="w-5.5 h-5.5 rounded-full object-cover border border-white shadow-2xs shrink-0"
                                          />
                                        ))}
                                        {overflowCount > 0 && (
                                          <div
                                            title={`${overflowCount} anggota lainnya`}
                                            className="w-5.5 h-5.5 rounded-full bg-gray-100 text-gray-700 text-[9px] font-bold flex items-center justify-center border border-white shadow-2xs shrink-0"
                                          >
                                            +{overflowCount}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })()}
                                </div>

                              </div>
                            </React.Fragment>
                          );
                        })}

                        {/* Trailing placeholder if cursor is at the bottom of the column */}
                        {isOverThisCol && (dragOverIndex === null || dragOverIndex >= columnTasks.length) && renderPlaceholder()}
                      </>
                    )}
                    
                    {/* Add Task Button (Notion style) - also droppable */}
                    <button 
                      onClick={() => onOpenAddTaskModal(col.id, filterProjectId !== 'all' ? filterProjectId : undefined)}
                      title="Tambah Tugas Baru"
                      onDragOver={(e) => handleColumnDragOver(e, col.id, columnTasks.length)}
                      onDrop={(e) => handleDrop(e, col.id)}
                      className="w-full mt-2 flex items-center justify-center gap-1.5 px-4 py-2 text-center rounded-full text-xs font-bold transition-all bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white cursor-pointer shadow-sm border border-morkhe-purple"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tambah Tugas</span>
                    </button>
                  </div>

                </div>
              );
            })
          )}

        </div>
      </div>
    </>
  );

  if (isNested) {
    return <div className="space-y-6">{content}</div>;
  }

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans select-none text-gray-900">
      {content}
    </div>
  );
}

