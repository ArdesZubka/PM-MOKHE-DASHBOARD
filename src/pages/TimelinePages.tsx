/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, Filter, Clock, CheckCircle2, Check, AlertCircle, AlertTriangle, XCircle, ChevronRight, User as UserIcon, Briefcase, ChevronDown, Info, Lock, Plus } from 'lucide-react';
import { Task, Project, User } from '../types';
import { STATUS_COLORS, getStatusColor } from '../utils/statusColors';
import { formatDate, formatDateRange } from '../utils/dateFormat';
import EmptyState from '../components/EmptyState';
import assetProyek from '../../assets/assetProyek.png';
import assetTimeline from '../../assets/assetTimeline.png';

const BASELINE_TODAY = '2026-07-06';

interface ProjectStatusInfo {
  status: 'done' | 'late' | 'warning' | 'on_track';
  label: string;
  className: string;
  icon: React.ElementType;
}

const getProjectTimelineStatus = (
  project: Project,
  projectTasks: Task[],
  todayStr: string = BASELINE_TODAY
): ProjectStatusInfo => {
  const totalTasks = projectTasks.length;
  const completedTasks = projectTasks.filter(t => t.status === 'done').length;

  // 1. Jika % pekerjaan selesai proyek == 100% -> badge hijau "Selesai" (ikon centang)
  const is100PercentDone = totalTasks > 0 
    ? (completedTasks === totalTasks) 
    : (project.status === 'Completed' || project.progress === 100);

  if (is100PercentDone) {
    return {
      status: 'done',
      label: 'Selesai',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: CheckCircle2
    };
  }

  // Parse today and project deadline with midnight time comparison
  const today = new Date(todayStr);
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(project.endDate || '2026-12-31');
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  // 2. Jika hari ini > tenggat waktu proyek DAN belum 100% selesai -> badge merah "Terlambat" (ikon alert-circle)
  if (diffDays < 0) {
    return {
      status: 'late',
      label: 'Terlambat',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: AlertCircle
    };
  }

  // 3. Jika (tenggat waktu - hari ini) <= 7 hari DAN belum 100% selesai -> badge kuning/amber "Mendekati Deadline" (ikon alert-triangle)
  if (diffDays <= 7) {
    return {
      status: 'warning',
      label: 'Mendekati Deadline',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: AlertTriangle
    };
  }

  // 4. Selain itu -> badge hijau "Tepat Waktu" (ikon check)
  return {
    status: 'on_track',
    label: 'Tepat Waktu',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: Check
  };
};

interface TimelinePagesProps {
  currentUser: User;
  tasks: Task[];
  projects: Project[];
  users: User[];
  onOpenTaskDetail: (task: Task) => void;
  onOpenAddTaskModal?: (initialStatus?: Task['status'], targetProjectId?: string) => void;
  setCurrentPage?: (page: string) => void;
}

export default function TimelinePages({
  currentUser,
  tasks,
  projects,
  users,
  onOpenTaskDetail,
  onOpenAddTaskModal,
  setCurrentPage
}: TimelinePagesProps) {
  const isPM = currentUser.role === 'PM';

  // Allowed tasks for this user: PM sees all, Staff sees only assigned tasks
  const allowedTasks = isPM 
    ? tasks 
    : tasks.filter(t => t.assigneeIds ? t.assigneeIds.includes(currentUser.id) : t.assigneeId === currentUser.id);

  // Visible projects: PM sees all, Staff sees projects where they are assigned members
  const visibleProjects = isPM 
    ? projects
    : projects.filter(p => p.memberIds && p.memberIds.includes(currentUser.id));

  // Gate utama: apakah user memiliki proyek yang bisa diakses
  const hasAccessibleProject = visibleProjects.length > 0;

  // Total tugas lintas semua waktu di seluruh proyek yang accessible
  const accessibleProjectIds = new Set(visibleProjects.map(p => p.id));
  const accessibleTasks = allowedTasks.filter(t => accessibleProjectIds.has(t.projectId));
  const totalAccessibleTasks = accessibleTasks.length;

  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Define weekly date range for timeline grid
  // Reference date range: 10 weeks starting from June 1, 2026
  // Simulating today as July 6, 2026 (Week 6)
  const timelineStartDate = new Date('2026-06-01');
  
  const weeks = [
    { id: 1, label: '01 Jun – 07 Jun', start: '2026-06-01', end: '2026-06-07' },
    { id: 2, label: '08 Jun – 14 Jun', start: '2026-06-08', end: '2026-06-14' },
    { id: 3, label: '15 Jun – 21 Jun', start: '2026-06-15', end: '2026-06-21' },
    { id: 4, label: '22 Jun – 28 Jun', start: '2026-06-22', end: '2026-06-28' },
    { id: 5, label: '29 Jun – 05 Jul', start: '2026-06-29', end: '2026-07-05' },
    { id: 6, label: '06 Jul – 12 Jul', start: '2026-07-06', end: '2026-07-12', isCurrentWeek: true },
    { id: 7, label: '13 Jul – 19 Jul', start: '2026-07-13', end: '2026-07-19' },
    { id: 8, label: '20 Jul – 26 Jul', start: '2026-07-20', end: '2026-07-26' },
    { id: 9, label: '27 Jul – 02 Agu', start: '2026-07-27', end: '2026-08-02' },
    { id: 10, label: '03 Agu – 09 Agu', start: '2026-08-03', end: '2026-08-09' },
    { id: 11, label: '10 Agu – 16 Agu', start: '2026-08-10', end: '2026-08-16' },
    { id: 12, label: '17 Agu – 23 Agu', start: '2026-08-17', end: '2026-08-23' },
  ];

  const dayWidth = 32; // 32px per day column (1 week = 224px)
  const weekWidth = dayWidth * 7; // 224px
  const totalDays = weeks.length * 7; // 84 days

  // Generate array of 84 day columns
  const dayColumns = Array.from({ length: totalDays }, (_, i) => {
    const d = new Date(timelineStartDate);
    d.setDate(timelineStartDate.getDate() + i);
    const dayNum = d.getDate();
    const dayOfWeek = d.getDay(); // 0 = Sun, 6 = Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isEndOfWeek = (i + 1) % 7 === 0;
    const isToday = i === 35; // July 6, 2026

    return {
      index: i,
      dayNum,
      isWeekend,
      isEndOfWeek,
      isToday,
      dateStr: d.toISOString().split('T')[0]
    };
  });

  // Filter projects based on project filter and visible projects
  const filteredProjects = selectedProjectId === 'all' 
    ? visibleProjects 
    : visibleProjects.filter(p => p.id === selectedProjectId);

  // Scroll to today's marker position (July 6, 2026 = Day 35)
  const scrollToToday = (smooth: boolean = true) => {
    if (containerRef.current) {
      const container = containerRef.current;
      const visibleTrackWidth = Math.max(300, container.clientWidth - 320);
      const targetScrollX = todayMarkerLeft - (visibleTrackWidth / 2) + (dayWidth / 2);
      if (smooth) {
        container.scrollTo({
          left: Math.max(0, targetScrollX),
          behavior: 'smooth'
        });
      } else {
        container.scrollLeft = Math.max(0, targetScrollX);
      }
    }
  };

  // Auto-scroll to today (July 6, 2026 = Day 35) on mount
  useEffect(() => {
    scrollToToday(false);
  }, []);

  // Helper to calculate pixel position for task bar with daily precision
  const getTaskBarPosition = (startDateStr: string, deadlineStr: string) => {
    const start = new Date(startDateStr || '2026-06-01');
    const deadline = new Date(deadlineStr || '2026-07-09');

    // Days relative to 2026-06-01
    const diffStartMs = start.getTime() - timelineStartDate.getTime();
    const startDayIndex = Math.floor(diffStartMs / (1000 * 60 * 60 * 24));

    const diffDeadlineMs = deadline.getTime() - start.getTime();
    const durationDays = Math.max(1, Math.floor(diffDeadlineMs / (1000 * 60 * 60 * 24)) + 1);

    const left = Math.max(0, startDayIndex * dayWidth);
    const width = Math.max(28, durationDays * dayWidth);

    return { left, width };
  };

  // Helper for status styles
  const getStatusStyle = (status: Task['status']) => {
    switch (status) {
      case 'todo':
        return 'bg-slate-200 border-slate-300 text-slate-800 hover:bg-slate-300';
      case 'in_progress':
        return 'bg-blue-600 border-blue-700 text-white hover:bg-blue-700 shadow-xs';
      case 'review':
        return 'bg-amber-500 border-amber-600 text-white hover:bg-amber-600 shadow-xs';
      case 'done':
        return 'bg-emerald-600 border-emerald-700 text-white hover:bg-emerald-700 shadow-xs';
      case 'canceled_on_hold':
        return 'bg-rose-500 border-rose-600 text-white hover:bg-rose-600 opacity-80';
      default:
        return 'bg-gray-300 text-gray-800';
    }
  };

  const getStatusLabel = (status: Task['status']) => {
    switch (status) {
      case 'todo': return 'Perlu Dikerjakan';
      case 'in_progress': return 'Sedang Berjalan';
      case 'review': return 'Dalam Review';
      case 'done': return 'Selesai';
      case 'canceled_on_hold': return 'Batal/Tunda';
    }
  };

  // Calculate today's marker position (July 6, 2026 = Day 35 from June 1)
  const todayDate = new Date('2026-07-06');
  const todayDiffMs = todayDate.getTime() - timelineStartDate.getTime();
  const todayDayIndex = Math.floor(todayDiffMs / (1000 * 60 * 60 * 24));
  const todayMarkerLeft = todayDayIndex * dayWidth;

  return (
    <div className="space-y-6 font-sans select-none text-gray-900">
      
      {/* Top Header & Controls */}
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <Clock className="h-5 w-5 text-black" /> Linimasa Proyek (Timeline)
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
                ? 'Pantau durasi, rentang waktu mulai hingga tenggat waktu pekerjaan seluruh proyek agensi.' 
                : 'Pantau durasi dan tenggat waktu tugas Anda.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {/* Project Filter Dropdown */}
          <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100/80 px-3.5 py-1.5 rounded-full border border-gray-250 transition-colors relative shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-500 font-sans shrink-0">Proyek:</span>
            <div className="relative flex items-center pr-4">
              <select
                id="timeline-project-filter"
                value={selectedProjectId}
                disabled={!hasAccessibleProject}
                onChange={(e) => setSelectedProjectId(e.target.value)}
                className="appearance-none bg-transparent border-none text-xs font-bold text-gray-900 focus:outline-none cursor-pointer pr-1.5 select-none disabled:cursor-not-allowed disabled:text-gray-400"
              >
                <option value="all">Semua Proyek</option>
                {visibleProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code ? `${p.code}: ${p.name}` : p.name}
                  </option>
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
              id="timeline-btn-add-task-disabled"
              disabled
              title="Buat atau tunggu proyek tersedia dulu"
              className="px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-not-allowed shrink-0"
            >
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              <span>+ Tambah Tugas (Perlu Proyek)</span>
            </button>
          ) : (
            <button
              id="timeline-btn-add-task-trigger"
              onClick={() => onOpenAddTaskModal && onOpenAddTaskModal('todo', selectedProjectId !== 'all' ? selectedProjectId : undefined)}
              className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm border border-morkhe-purple shrink-0"
            >
              <Plus className="h-4 w-4 text-morkhe-white" />
              <span>Tambah Tugas</span>
            </button>
          )}
        </div>
      </div>

      {/* Status Color Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 bg-gray-50 px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-600">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Status Tugas:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS['Perlu Dikerjakan'].bg }}></span>
          <span>Perlu Dikerjakan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS['Sedang Berjalan'].bg }}></span>
          <span>Sedang Berjalan</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS['Dalam Review'].bg }}></span>
          <span>Dalam Review</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS['Selesai'].bg }}></span>
          <span>Selesai</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: STATUS_COLORS['Batal/Tunda'].bg }}></span>
          <span>Batal/Tunda</span>
        </div>
        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-500">
          <span className="w-2 h-2 rounded-full bg-morkhe-purple animate-ping"></span>
          <span className="font-bold text-gray-900">Garis Ungu = Hari Ini (06 Jul 2026)</span>
        </div>
      </div>

      {/* Main Timeline Content Card */}
      {!hasAccessibleProject ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-2xs">
          {isPM ? (
            <EmptyState
              imageSrc={assetProyek}
              imageAlt="Ilustrasi Belum Ada Proyek"
              headline="Belum Ada Proyek"
              subtext="Linimasa proyek akan muncul di sini setelah ada proyek yang dibuat."
              ctaLabel="+ Buat Proyek"
              onCtaClick={() => setCurrentPage ? setCurrentPage('P12') : undefined}
            />
          ) : (
            <EmptyState
              imageSrc={assetProyek}
              imageAlt="Ilustrasi Belum Ada Proyek"
              headline="Belum Ada Proyek yang Ditugaskan"
              subtext="Linimasa proyek yang di-assign PM akan muncul di sini."
            />
          )}
        </div>
      ) : totalAccessibleTasks === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-5 shadow-2xs">
          <EmptyState
            imageSrc={assetTimeline}
            imageAlt="Ilustrasi Belum Ada Tugas"
            headline="Belum Ada Tugas"
            subtext="Tugas dengan tanggal mulai dan tenggat waktu akan muncul di linimasa ini."
            ctaLabel="+ Tambah Tugas"
            onCtaClick={() => onOpenAddTaskModal ? onOpenAddTaskModal('todo', selectedProjectId !== 'all' ? selectedProjectId : undefined) : undefined}
          />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div 
              ref={containerRef}
              className="overflow-x-auto relative max-w-full"
            >
            <div className="inline-block min-w-full align-middle relative">

              {/* Single Continuous "Hari Ini" Marker Line */}
              <div 
                className="absolute top-0 bottom-0 w-0.5 bg-morkhe-purple z-20 pointer-events-none"
                style={{ left: `${320 + todayMarkerLeft}px` }}
              >
                <div className="bg-morkhe-purple text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full absolute top-1.5 -left-6 whitespace-nowrap shadow-xs border border-white/10">
                  Hari Ini
                </div>
              </div>
              
              {/* Timeline Header Row (Date Axis) */}
              <div className="flex border-b border-gray-200 bg-gray-100 sticky top-0 z-40 font-sans">
                
                {/* Sticky Left Column Header */}
                <div className="w-80 shrink-0 sticky left-0 z-50 bg-gray-100 p-3 border-r border-gray-200 font-bold text-xs uppercase tracking-wider text-gray-600 flex items-center justify-between shadow-2xs">
                  <span>Proyek & Tugas</span>
                  <span className="text-[10px] text-gray-400 font-normal">Penanggung Jawab</span>
                </div>

                {/* Daily Date Axis with Weekly Headers (2-row Header) */}
                <div className="flex flex-col relative">
                  {/* Top Row: Week Date Ranges */}
                  <div className="flex border-b border-gray-200">
                    {weeks.map((week) => (
                      <div
                        key={week.id}
                        style={{ width: `${weekWidth}px` }}
                        className={`shrink-0 py-2 px-2 text-center border-r-2 border-r-gray-300 font-bold text-[11px] flex items-center justify-center ${
                          week.isCurrentWeek ? 'bg-amber-100 text-amber-900 border-b-2 border-b-amber-500' : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span className="truncate">{week.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Bottom Row: Daily Day Numbers */}
                  <div className="flex">
                    {dayColumns.map((day) => (
                      <div
                        key={day.index}
                        style={{ width: `${dayWidth}px` }}
                        className={`shrink-0 py-1 text-center font-bold text-[10px] ${
                          day.isEndOfWeek ? 'border-r-2 border-r-gray-300' : 'border-r border-r-gray-200'
                        } ${
                          day.isToday 
                            ? 'bg-morkhe-purple text-white font-extrabold' 
                            : day.isWeekend 
                              ? 'bg-gray-200/60 text-gray-500' 
                              : 'bg-gray-50 text-gray-700'
                        }`}
                        title={`Tanggal ${day.dayNum}`}
                      >
                        {day.dayNum}
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Timeline Content Rows Grouped by Project */}
              <div className="divide-y divide-gray-200 relative">
                {filteredProjects.map((project) => {
                  const projectTasks = allowedTasks.filter(t => t.projectId === project.id);
                  const statusInfo = getProjectTimelineStatus(project, projectTasks);
                  const StatusIcon = statusInfo.icon;
                  
                  return (
                    <div key={project.id} className="bg-white">
                      
                      {/* Project Row Group Header */}
                      <div className="flex bg-gray-50/90 border-b border-gray-200">
                        <div className="w-80 shrink-0 sticky left-0 z-30 bg-gray-100/95 backdrop-blur-xs px-4 py-2 border-r border-gray-200 flex flex-col justify-center gap-1 shadow-2xs">
                          {/* Row 1: Project Code, Name, and Task Count */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2 min-w-0 truncate">
                              <span className="text-[10px] font-bold bg-morkhe-black text-morkhe-white px-2 py-0.5 rounded uppercase tracking-wider shrink-0">
                                {project.code || 'PRJ'}
                              </span>
                              <span className="text-xs font-bold text-gray-950 truncate" title={project.name}>
                                {project.name}
                              </span>
                            </div>
                            <span className="text-[10px] font-semibold text-gray-500 bg-gray-200/80 px-2 py-0.5 rounded-full shrink-0">
                              {projectTasks.length} Tugas
                            </span>
                          </div>

                          {/* Row 2: Date Range (Full with year) & Auto-calculated Status Badge at right */}
                          <div className="flex items-center justify-between gap-2 text-[10px] pt-1 border-t border-gray-200/70">
                            <div 
                              className="flex items-center gap-1 text-gray-600 font-medium truncate" 
                              title={`Rentang Waktu Proyek: ${formatDateRange(project.startDate, project.endDate)}`}
                            >
                              <Calendar className="h-3 w-3 text-gray-400 shrink-0" />
                              <span className="truncate">{formatDateRange(project.startDate, project.endDate)}</span>
                            </div>

                            {/* Status Badge at far right */}
                            <div className={`px-2 py-0.5 rounded-full font-bold text-[9.5px] flex items-center gap-1 border shrink-0 ${statusInfo.className}`}>
                              <StatusIcon className="h-2.5 w-2.5 stroke-[2.5]" />
                              <span>{statusInfo.label}</span>
                            </div>
                          </div>
                        </div>

                        {/* Extended empty track header row for timeline align */}
                        <div className="flex relative flex-1 items-center">
                          {dayColumns.map((day) => (
                            <div 
                              key={day.index} 
                              style={{ width: `${dayWidth}px` }} 
                              className={`shrink-0 h-full ${
                                day.isEndOfWeek ? 'border-r-2 border-r-gray-300' : 'border-r border-r-gray-100'
                              } ${day.isWeekend ? 'bg-gray-50/40' : ''}`} 
                            />
                          ))}
                        </div>
                      </div>

                      {/* Task Rows under this Project */}
                      {projectTasks.length === 0 ? (
                        <div className="flex items-center text-xs text-gray-400 italic py-2 px-4 border-b border-gray-100">
                          <div className="w-80 shrink-0 sticky left-0 z-30 bg-white px-4 py-3 border-r border-gray-200 shadow-2xs">Belum ada tugas di proyek ini.</div>
                        </div>
                      ) : (
                        projectTasks.map((task) => {
                          const taskAssigneeIds = (task.assigneeIds && task.assigneeIds.length > 0)
                            ? task.assigneeIds
                            : [task.assigneeId].filter(Boolean);
                          const taskAssignees = taskAssigneeIds.map(id => users.find(u => u.id === id)).filter((u): u is User => Boolean(u));
                          const visibleAssignees = taskAssignees.slice(0, 3);
                          const overflowCount = taskAssignees.length - 3;
                          const { left, width } = getTaskBarPosition(task.startDate, task.deadline);
                          const statusColor = getStatusColor(task.status);

                          return (
                            <div 
                              key={task.id} 
                              className="flex items-center hover:bg-gray-50/60 transition-colors border-b border-gray-100 group"
                            >
                              {/* Left Sticky Task Information */}
                              <div className="w-80 shrink-0 sticky left-0 z-30 bg-white group-hover:bg-gray-50 px-4 py-3 border-r border-gray-200 flex items-center justify-between shadow-2xs">
                                <div className="min-w-0 pr-2">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[9px] font-bold text-gray-500 bg-gray-100 px-1.5 py-0.2 rounded border border-gray-200">
                                      {task.code}
                                    </span>
                                    <span className="text-[10px] text-gray-400 font-medium">
                                      {formatDateRange(task.startDate, task.deadline)}
                                    </span>
                                  </div>
                                  <h4 
                                    onClick={() => onOpenTaskDetail(task)}
                                    className="text-xs font-bold text-gray-800 truncate cursor-pointer hover:text-black hover:underline"
                                    title={task.title}
                                  >
                                    {task.title}
                                  </h4>
                                </div>

                                {/* Assignee Avatar Cluster */}
                                <div className="shrink-0 flex items-center" title={taskAssignees.map(u => u.name).join(', ')}>
                                  {taskAssignees.length === 0 ? (
                                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-500">
                                      <UserIcon className="h-3 w-3" />
                                    </div>
                                  ) : (
                                    <div className="flex items-center">
                                      {visibleAssignees.map((u, index) => (
                                        <img
                                          key={u.id}
                                          src={u.avatar}
                                          alt={u.name}
                                          title={u.name}
                                          style={{ zIndex: index * 10 }}
                                          className={`w-6 h-6 rounded-full border-2 border-white object-cover shrink-0 ${
                                            index > 0 ? '-ml-2' : ''
                                          }`}
                                        />
                                      ))}
                                      {overflowCount > 0 && (
                                        <div
                                          title={`${overflowCount} anggota lainnya`}
                                          style={{ zIndex: visibleAssignees.length * 10 }}
                                          className="w-6 h-6 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold flex items-center justify-center border-2 border-white shrink-0 -ml-2"
                                        >
                                          +{overflowCount}
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Timeline Track & Bar */}
                              <div className="flex relative h-12 flex-1 items-center">
                                {/* Day column grid lines with weekly dividers */}
                                {dayColumns.map((day) => (
                                  <div 
                                    key={day.index} 
                                    style={{ width: `${dayWidth}px` }} 
                                    className={`shrink-0 h-full ${
                                      day.isEndOfWeek ? 'border-r-2 border-r-gray-300' : 'border-r border-r-gray-100'
                                    } ${day.isWeekend ? 'bg-gray-50/30' : ''}`} 
                                  />
                                ))}

                                {/* Interactive Task Duration Bar */}
                                <div
                                  onClick={() => onOpenTaskDetail(task)}
                                  style={{ left: `${left}px`, width: `${width}px`, backgroundColor: statusColor.bg, color: statusColor.text }}
                                  className="absolute top-2 h-8 rounded-lg border border-black/10 px-2.5 flex items-center justify-between cursor-pointer transition-all duration-200 z-10 hover:z-20 hover:scale-[1.02] shadow-xs"
                                  title={`${task.title}\nMulai: ${formatDate(task.startDate)}\nTenggat: ${formatDate(task.deadline)}\nStatus: ${getStatusLabel(task.status)}\nPenanggung Jawab: ${taskAssignees.map(u => u.name).join(', ') || '-'}`}
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-[10px] font-bold tracking-tight truncate">
                                      {task.code}: {task.title}
                                    </span>
                                  </div>
                                  <span className="text-[9px] font-semibold opacity-90 shrink-0 ml-1 hidden sm:inline-block bg-black/20 px-1.5 py-0.5 rounded" style={{ color: statusColor.text }}>
                                    {getStatusLabel(task.status)}
                                  </span>
                                </div>

                              </div>

                            </div>
                          );
                        })
                      )}

                    </div>
                  );
                })}
              </div>

            </div>
          </div>
        </div>

        {/* True Floating Action Button (FAB) "Hari Ini" */}
        <button
          type="button"
          id="timeline-btn-floating-today"
          onClick={() => scrollToToday(true)}
          className="fixed bottom-6 left-1/2 md:left-[calc(50%+120px)] -translate-x-1/2 z-50 flex items-center gap-1.5 px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-white border border-morkhe-purple rounded-full shadow-md hover:shadow-lg transition-all text-xs font-bold cursor-pointer select-none active:scale-95"
          title="Kembali ke Hari Ini (Garis Ungu)"
        >
          <Calendar className="h-3.5 w-3.5 text-white stroke-[2.2]" />
          <span>Hari Ini</span>
        </button>
      </>
    )}

    </div>
  );
}
