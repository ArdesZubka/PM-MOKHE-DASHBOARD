/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Grid, Clock, ListCollapse, Briefcase, ChevronDown, Info, Check, Lock, Plus } from 'lucide-react';
import { Task, Project, User } from '../types';
import { STATUS_COLORS, getStatusColor } from '../utils/statusColors';
import EmptyState from '../components/EmptyState';
import assetProyek from '../../assets/assetProyek.png';

interface CalendarPagesProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User;
  tasks: Task[];
  projects: Project[];
  onOpenTaskDetail: (task: Task) => void;
  isNested?: boolean;
  onOpenAddTaskModal?: (initialStatus?: Task['status'], targetProjectId?: string) => void;
}

export default function CalendarPages({
  currentPage,
  setCurrentPage,
  currentUser,
  tasks,
  projects,
  onOpenTaskDetail,
  isNested,
  onOpenAddTaskModal
}: CalendarPagesProps) {
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
  const [isViewDropdownOpen, setIsViewDropdownOpen] = useState(false);

  const filteredTasks = filterProjectId === 'all'
    ? allowedTasks
    : allowedTasks.filter(t => t.projectId === filterProjectId);
  
  const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Calendar date state (defaults to baseline simulation date: 6 Juli 2026)
  const [currentDate, setCurrentDate] = useState<Date>(() => new Date(2026, 6, 6));

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  // Helper to format Date to 'YYYY-MM-DD'
  const formatDateStr = (d: Date): string => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Monthly navigation handlers
  const handlePrevMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
  };

  // Weekly navigation handlers
  const handlePrevWeek = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 7));
  };

  const handleNextWeek = () => {
    setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 7));
  };

  // Quick-jump to simulated today (6 Juli 2026)
  const handleJumpToToday = () => {
    setCurrentDate(new Date(2026, 6, 6));
  };

  // Monthly calendar grid representation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const startDayOffset = new Date(currentYear, currentMonth, 1).getDay(); // 0 (Min) to 6 (Sab)
  
  const weekDays = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
  
  // Generate blank offset spaces + current month days
  const calendarGridCells: (number | null)[] = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarGridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarGridCells.push(d);
  }
  // Fill grid to complete full week rows (multiples of 7)
  while (calendarGridCells.length % 7 !== 0) {
    calendarGridCells.push(null);
  }

  // Map dates in format "YYYY-MM-DD"
  const getTasksForDay = (day: number) => {
    const dateStr = formatDateStr(new Date(currentYear, currentMonth, day));
    return filteredTasks.filter(t => t.deadline === dateStr);
  };

  // Weekly view date calculation (Senin s/d Minggu)
  const dayOfWeek = currentDate.getDay(); // 0 (Min) .. 6 (Sab)
  const diffToMonday = (dayOfWeek + 6) % 7;
  const mondayDate = new Date(currentYear, currentMonth, currentDate.getDate() - diffToMonday);
  const sundayDate = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + 6);

  const weeklySubtitle = `Minggu tanggal ${mondayDate.getDate()} ${MONTH_NAMES[mondayDate.getMonth()]} ${mondayDate.getFullYear()} sampai ${sundayDate.getDate()} ${MONTH_NAMES[sundayDate.getMonth()]} ${sundayDate.getFullYear()}.`;

  const weeklyDaysList = [
    { name: 'Sen', offset: 0 },
    { name: 'Sel', offset: 1 },
    { name: 'Rab', offset: 2 },
    { name: 'Kam', offset: 3 },
    { name: 'Jum', offset: 4 },
    { name: 'Sab', offset: 5 },
    { name: 'Min', offset: 6 }
  ].map(item => {
    const d = new Date(mondayDate.getFullYear(), mondayDate.getMonth(), mondayDate.getDate() + item.offset);
    return {
      name: item.name,
      num: d.getDate(),
      monthName: MONTH_NAMES[d.getMonth()],
      dateStr: formatDateStr(d),
      isToday: formatDateStr(d) === '2026-07-06'
    };
  });

  const content = (
    <>
      {/* Top Header Selector Bar */}
      <div className="flex items-center justify-between gap-4 bg-white p-6 rounded-xl border border-gray-200">
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <Calendar className="h-5 w-5 text-black" /> Jadwal Pekerjaan
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
              Visualisasikan milestone proyek, tinjauan kemasan, dan tenggat waktu kampanye di seluruh tata letak.
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {/* Project filtration selector */}
          <div className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100/80 px-3.5 py-1.5 rounded-full border border-gray-250 transition-colors relative shrink-0">
            <Briefcase className="h-3.5 w-3.5 text-gray-500 shrink-0" />
            <span className="text-[11px] font-bold text-gray-500 font-sans shrink-0">Proyek:</span>
            <div className="relative flex items-center pr-4">
              <select
                id="calendar-project-filter"
                value={filterProjectId}
                disabled={!hasAccessibleProject}
                onChange={(e) => setFilterProjectId(e.target.value)}
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

          {/* View Switcher Dropdown */}
          <div className="relative shrink-0">
            <button
              id="btn-calendar-view-dropdown"
              type="button"
              disabled={!hasAccessibleProject}
              onClick={() => {
                if (hasAccessibleProject) {
                  setIsViewDropdownOpen(prev => !prev);
                }
              }}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold transition-all select-none border ${
                !hasAccessibleProject
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed font-medium'
                  : 'bg-morkhe-black text-white hover:bg-gray-900 border-morkhe-black cursor-pointer shadow-2xs'
              }`}
            >
              <span>{currentPage === 'P15' ? 'Bulanan' : 'Mingguan'}</span>
              <ChevronDown className={`h-3 w-3 ${!hasAccessibleProject ? 'text-gray-400' : 'text-gray-300'} transition-transform duration-150 ${isViewDropdownOpen && hasAccessibleProject ? 'rotate-180' : ''}`} />
            </button>

            {isViewDropdownOpen && (
              <>
                {/* Backdrop to close dropdown on click outside */}
                <div 
                  className="fixed inset-0 z-40" 
                  onClick={() => setIsViewDropdownOpen(false)} 
                />
                <div className="absolute right-0 top-full mt-1.5 z-50 w-36 bg-white border border-gray-200 rounded-xl shadow-lg p-1 space-y-0.5 font-sans">
                  <button
                    type="button"
                    id="btn-switch-monthly"
                    onClick={() => {
                      setCurrentPage('P15');
                      setIsViewDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === 'P15'
                        ? 'bg-purple-50 text-morkhe-purple font-bold'
                        : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    <span>Bulanan</span>
                    {currentPage === 'P15' && <Check className="h-3.5 w-3.5 text-morkhe-purple" />}
                  </button>

                  <button
                    type="button"
                    id="btn-switch-weekly"
                    onClick={() => {
                      setCurrentPage('P16');
                      setIsViewDropdownOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                      currentPage === 'P16'
                        ? 'bg-purple-50 text-morkhe-purple font-bold'
                        : 'text-gray-700 hover:bg-gray-100/80 hover:text-gray-900'
                    }`}
                  >
                    <span>Mingguan</span>
                    {currentPage === 'P16' && <Check className="h-3.5 w-3.5 text-morkhe-purple" />}
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Add Task Trigger: Disabled if no accessible project exists */}
          {!hasAccessibleProject ? (
            <button
              id="calendar-btn-add-task-disabled"
              disabled
              title="Buat atau tunggu proyek tersedia dulu"
              className="px-4 py-2 bg-gray-100 text-gray-400 border border-gray-200 rounded-full text-xs font-medium flex items-center gap-1.5 cursor-not-allowed shrink-0"
            >
              <Lock className="h-3.5 w-3.5 text-gray-400" />
              <span>+ Tambah Tugas (Perlu Proyek)</span>
            </button>
          ) : (
            <button
              id="calendar-btn-add-task-trigger"
              onClick={() => onOpenAddTaskModal && onOpenAddTaskModal('todo', filterProjectId !== 'all' ? filterProjectId : undefined)}
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
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">STATUS TUGAS:</span>
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
      </div>

      {/* P15/P16: CONDITION 1 - !hasAccessibleProject */}
      {!hasAccessibleProject ? (
        <div className="bg-white border border-gray-200 rounded-xl p-6 sm:p-8 shadow-2xs">
          {isPM ? (
            <EmptyState
              imageSrc={assetProyek}
              imageAlt="Ilustrasi Belum Ada Proyek"
              headline="Belum Ada Proyek"
              subtext="Linimasa proyek akan muncul di sini setelah ada proyek yang dibuat."
              ctaLabel="+ Buat Proyek"
              onCtaClick={() => setCurrentPage('P12')}
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
      ) : (
        <>
          {/* P15: MONTHLY VIEW GRID */}
          {currentPage === 'P15' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
          
          {/* Calendar Controller Bar */}
          <div className="flex justify-between items-center pb-2 border-b border-gray-100">
            <h2 className="text-xs font-bold text-gray-950 uppercase tracking-wider">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </h2>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="monthly-btn-today"
                onClick={handleJumpToToday}
                className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-950 border border-gray-200 rounded-lg shadow-2xs transition-all cursor-pointer select-none"
              >
                Hari Ini
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="monthly-btn-prev"
                  onClick={handlePrevMonth}
                  className="p-1 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Bulan sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  id="monthly-btn-next"
                  onClick={handleNextMonth}
                  className="p-1 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Bulan berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Day name labels */}
            {weekDays.map(wd => (
              <div key={wd} className="text-center font-bold text-[10px] text-gray-400 uppercase py-2 bg-gray-50 rounded-lg">
                {wd}
              </div>
            ))}

            {/* Grid Cells */}
            {calendarGridCells.map((cellDay, index) => {
              const dayTasks = cellDay ? getTasksForDay(cellDay) : [];
              const isToday = cellDay ? formatDateStr(new Date(currentYear, currentMonth, cellDay)) === '2026-07-06' : false;

              return (
                <div
                  key={index}
                  className={`min-h-[110px] border border-gray-100 rounded-lg p-2 flex flex-col justify-between transition-all ${
                    cellDay ? 'bg-white hover:bg-gray-50/50' : 'bg-gray-50/20 opacity-40'
                  } ${isToday ? 'ring-1 ring-morkhe-black border-morkhe-black bg-gray-50/30' : ''}`}
                >
                  <div className="flex justify-between items-center">
                    {cellDay ? (
                      <span className={`text-[11px] font-bold ${
                        isToday ? 'bg-morkhe-black text-morkhe-white h-5 w-5 rounded-full flex items-center justify-center font-bold' : 'text-gray-600'
                      }`}>
                        {cellDay}
                      </span>
                    ) : (
                      <span />
                    )}
                    
                    {isToday && (
                      <span className="text-[8px] uppercase text-morkhe-black font-bold tracking-wide">Hari Ini</span>
                    )}
                  </div>

                  {/* Task pills space */}
                  <div className="space-y-1 mt-2 flex-1 flex flex-col justify-end">
                    {dayTasks.map(task => {
                      const proj = projects.find(p => p.id === task.projectId);
                      const statusColor = getStatusColor(task.status);
                      return (
                        <div
                          key={task.id}
                          onClick={() => onOpenTaskDetail(task)}
                          title={`${task.title} (Click for full specs)`}
                          style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                          className="text-[9px] font-bold px-1.5 py-1 rounded truncate cursor-pointer transition-all hover:brightness-95"
                        >
                          {task.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* P16: WEEKLY VIEW STRIP */}
      {currentPage === 'P16' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-6">
          <div className="flex justify-between items-center pb-3 border-b border-gray-100">
            <div>
              <h2 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Lajur Mingguan Pekerjaan</h2>
              <p className="text-[11px] text-gray-500 mt-0.5">{weeklySubtitle}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                id="weekly-btn-today"
                onClick={handleJumpToToday}
                className="px-2.5 py-1 text-xs font-semibold text-gray-700 bg-white hover:bg-gray-50 hover:text-gray-950 border border-gray-200 rounded-lg shadow-2xs transition-all cursor-pointer select-none"
              >
                Hari Ini
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  id="weekly-btn-prev"
                  onClick={handlePrevWeek}
                  className="p-1 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Minggu sebelumnya"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  id="weekly-btn-next"
                  onClick={handleNextWeek}
                  className="p-1 text-gray-600 hover:text-gray-950 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  aria-label="Minggu berikutnya"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-4">
            {weeklyDaysList.map((wd) => {
              const dayTasks = filteredTasks.filter(t => t.deadline === wd.dateStr);
              const isToday = wd.isToday;

              return (
                <div
                  key={wd.dateStr}
                  className={`border rounded-xl p-4 min-h-[300px] flex flex-col space-y-3 transition-all ${
                    isToday ? 'bg-gray-50 border-morkhe-black ring-1 ring-morkhe-black' : 'bg-white border-gray-200'
                  }`}
                >
                  {/* Day Date Label */}
                  <div className="flex justify-between items-center pb-2 border-b border-gray-100">
                    <div>
                      <span className="text-xs font-bold text-gray-900 block">{wd.name}</span>
                      <span className="text-[10px] text-gray-400 font-semibold">{wd.monthName} {wd.num}</span>
                    </div>
                    {isToday && (
                      <span className="bg-morkhe-black text-morkhe-white font-mono text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">
                        Hari Ini
                      </span>
                    )}
                  </div>

                  {/* Task list in strip */}
                  <div className="space-y-2 flex-1 overflow-y-auto">
                    {dayTasks.length === 0 ? (
                      <p className="text-[10px] text-gray-350 italic text-center pt-8">Tidak ada tenggat</p>
                    ) : (
                      dayTasks.map(task => {
                        const proj = projects.find(p => p.id === task.projectId);
                        const statusColor = getStatusColor(task.status);
                        return (
                          <div
                            key={task.id}
                            onClick={() => onOpenTaskDetail(task)}
                            style={{ backgroundColor: statusColor.bg, color: statusColor.text }}
                            className="p-2.5 rounded-lg cursor-pointer transition-all hover:scale-[1.01] hover:shadow-xs text-left space-y-1.5"
                          >
                             <span className="text-[8px] font-bold uppercase block tracking-wider opacity-60">
                              {proj ? `${proj.code}: ${proj.name}` : 'Kampanye Desain'}
                            </span>
                            <span className="text-[10px] font-bold leading-tight block truncate">
                              {task.title}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>
              );
            })}
          </div>

        </div>
      )}

        </>
      )}

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
