/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  FolderOpen, 
  CheckSquare, 
  CheckCircle2,
  XCircle,
  Users, 
  AlertTriangle, 
  Clock, 
  Sparkles, 
  Info
} from 'lucide-react';
import { User, Project, Task, Comment } from '../types';
import { getActiveTasksForUser, getWorkloadInfo } from '../utils/taskUtils';
import { formatDate } from '../utils/dateFormat';

interface DashboardPagesProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
  onOpenTaskDetail: (task: Task) => void;
  onUpdateUserLimit?: (userId: string, newLimit: number) => void;
}

export default function DashboardPages({
  currentPage,
  setCurrentPage,
  currentUser,
  users,
  projects,
  tasks,
  comments,
  onOpenTaskDetail,
  onUpdateUserLimit
}: DashboardPagesProps) {
  
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);
  const [editLimitValue, setEditLimitValue] = React.useState<number>(1);
  const [showPmHeaderTooltip, setShowPmHeaderTooltip] = React.useState(false);
  const [showStaffHeaderTooltip, setShowStaffHeaderTooltip] = React.useState(false);
  const [showTaskInfoTooltip, setShowTaskInfoTooltip] = React.useState(false);
  const [showStaffTaskInfoTooltip, setShowStaffTaskInfoTooltip] = React.useState(false);
  const [showCapacityTooltip, setShowCapacityTooltip] = React.useState(false);
  const [showStaffCapacityTooltip, setShowStaffCapacityTooltip] = React.useState(false);

  const handleEditClick = (user: User) => {
    setEditingUserId(user.id);
    setEditLimitValue(user.overloadLimit);
  };

  const handleSaveLimit = (e: React.FormEvent, userId: string) => {
    e.preventDefault();
    if (onUpdateUserLimit) {
      onUpdateUserLimit(userId, editLimitValue);
    }
    setEditingUserId(null);
  };

  // Calculations for PM
  const activeProjects = projects.filter(p => p.status !== 'Completed');
  const activeTasks = tasks.filter(t => t.status !== 'done' && t.status !== 'canceled_on_hold');
  const completedTasks = tasks.filter(t => t.status === 'done');
  const canceledTasks = tasks.filter(t => t.status === 'canceled_on_hold');
  
  // Specific workloads for each team member (Active tasks only: Perlu Dikerjakan, Sedang Berjalan, Dalam Review)
  const hafidzUser = users.find(u => u.role === 'PM') || users[0];
  const adityaUser = users.find(u => u.id === 'USR02') || users[1];
  const amirUser = users.find(u => u.id === 'USR03') || users[2];
  const hamzahUser = users.find(u => u.id === 'USR04') || users[3];

  const hafidzActive = getActiveTasksForUser(tasks, hafidzUser.id);
  const adityaActive = getActiveTasksForUser(tasks, adityaUser.id);
  const amirActive = getActiveTasksForUser(tasks, amirUser.id);
  const hamzahActive = getActiveTasksForUser(tasks, hamzahUser.id);

  const hafidzWorkload = getWorkloadInfo(hafidzActive.length, hafidzUser.overloadLimit || 2);
  const adityaWorkload = getWorkloadInfo(adityaActive.length, adityaUser.overloadLimit || 4);
  const amirWorkload = getWorkloadInfo(amirActive.length, amirUser.overloadLimit || 2);
  const hamzahWorkload = getWorkloadInfo(hamzahActive.length, hamzahUser.overloadLimit || 3);

  const totalOverloads = (hafidzWorkload.isOverloaded ? 1 : 0) + (adityaWorkload.isOverloaded ? 1 : 0) + (amirWorkload.isOverloaded ? 1 : 0) + (hamzahWorkload.isOverloaded ? 1 : 0);

  // Helper for deadline calculations
  const calculateDeadlineBadge = (deadlineStr: string) => {
    const deadlineDate = new Date(deadlineStr);
    const today = new Date('2026-07-06'); // Baseline date
    const diffTime = deadlineDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let daysText = "";
    let daysColor = "";
    if (diffDays < 0) {
      daysText = `Terlambat ${Math.abs(diffDays)} hari`;
      daysColor = "text-red-700 bg-red-50 border-red-200";
    } else if (diffDays === 0) {
      daysText = "Hari ini";
      daysColor = "text-red-700 bg-red-50 border-red-200";
    } else if (diffDays <= 2) {
      daysText = `${diffDays} hari lagi`;
      daysColor = "text-amber-700 bg-amber-50 border-amber-200";
    } else {
      daysText = `${diffDays} hari lagi`;
      daysColor = "text-gray-700 bg-gray-50 border-gray-200";
    }

    return { daysText, daysColor };
  };

  // ==========================================
  // P04: PM DASHBOARD (CEO View)
  // ==========================================
  if (currentPage === 'P04') {
    // Sort tasks for upcoming deadlines (top 5)
    const upcomingTasks = [...activeTasks].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    }).slice(0, 5);

    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans select-none text-gray-900">
        
        {/* 1. Header Block: Unified Single Container Card */}
        <div className="bg-white px-6 py-4.5 rounded-xl border border-gray-200 shadow-xs w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Sisi Kiri: Identitas & Judul */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold bg-[#161B1E] text-[#CCF779] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Lingkup Eksekutif PM
              </span>
              <span className="text-gray-400 text-xs font-sans font-medium">
                • Studi Kasus Universitas Padjadjaran
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1.5">
              <h1 className="text-xl font-bold text-gray-950 tracking-tight">
                Dasbor Ringkasan Studio
              </h1>
              
              <div className="relative inline-flex items-center group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowPmHeaderTooltip(prev => !prev)}
                  className="p-1 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  aria-label="Informasi Dasbor PM"
                >
                  <Info className="h-4 w-4 stroke-[2.2]" />
                </button>
                <div
                  className={`absolute left-0 top-full mt-1.5 z-50 w-72 md:w-80 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${
                    showPmHeaderTooltip
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <div className="absolute -top-1 left-3.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
                  Selamat datang kembali, Hafidz Ardis Setiamihardja (Founder &amp; CEO). Kelola sumber daya studio dan hambatan kerja.
                </div>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Button Proyek Aktif */}
          <div className="w-full md:w-1/2 flex items-center">
            <button 
              id="p04-header-proyek-aktif"
              onClick={() => setCurrentPage('P06')}
              className="w-full bg-white p-3.5 sm:px-5 sm:py-3 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-6 hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
                  <FolderOpen className="h-4 w-4" /> Proyek Aktif
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-950">{activeProjects.length}</span>
                  <span className="text-xs text-gray-500 font-medium">Proyek Berjalan</span>
                </div>
              </div>
              <div className="bg-[#EBFBD8] w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#d8f8b8] transition-colors">
                <FolderOpen className="h-5 w-5 text-morkhe-black" />
              </div>
            </button>
          </div>
        </div>

        {/* 2. Baris Stat Card Ringkasan: Grid 4 Kolom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TUGAS AKTIF */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P07'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
                <CheckSquare className="h-4 w-4 shrink-0" /> Tugas Aktif
              </span>
              <div className="relative inline-flex items-center group/tooltip shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowTaskInfoTooltip(prev => !prev);
                  }}
                  className="p-0.5 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  aria-label="Informasi Tugas Aktif"
                >
                  <Info className="h-3.5 w-3.5 stroke-[2.2]" />
                </button>
                <div
                  className={`absolute right-0 top-full mt-1.5 z-50 w-64 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0 ${
                    showTaskInfoTooltip
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -top-1 right-2.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
                  Tugas Aktif adalah Tugas dengan Status: Perlu Dikerjakan, Sedang Berjalan &amp; Dalam Review
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-950">{activeTasks.length}</span>
              <span className="text-xs text-gray-500 font-medium">Dalam Pengerjaan</span>
            </div>
          </div>

          {/* Card 2: TUGAS SELESAI */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P07'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Tugas Selesai
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{completedTasks.length}</span>
            </div>
          </div>

          {/* Card 3: BATAL/TUNDA */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P07'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
              <XCircle className="h-4 w-4 text-rose-500 shrink-0" /> Tugas Batal/Tunda
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">{canceledTasks.length}</span>
            </div>
          </div>

          {/* Card 4: KOMENTAR */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P07'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
              <Sparkles className="h-4 w-4 text-morkhe-purple shrink-0" /> Diskusi &amp; Komentar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-950">{comments.length}</span>
              <span className="text-xs text-gray-500 font-medium">Diskusi Proyek &amp; Tugas</span>
            </div>
          </div>
        </div>

        {/* 3. Section: Kapasitas Tim & Beban Kerja (Grid 2 Kolom) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-5">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center border-b border-gray-100 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2 shrink-0">
                <Users className="h-5 w-5 text-gray-700" />
                Kapasitas &amp; Beban Kerja Tim
              </h2>
              <div className="relative inline-flex items-center group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowCapacityTooltip(prev => !prev)}
                  className="p-1 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  aria-label="Informasi Kapasitas Tim"
                >
                  <Info className="h-4 w-4 stroke-[2.2]" />
                </button>
                <div
                  className={`absolute left-0 top-full mt-1.5 z-50 w-72 md:w-80 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${
                    showCapacityTooltip
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <div className="absolute -top-1 left-3.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
                  Pantau alokasi tugas real-time untuk mencegah bottleneck produksi dan menjaga keseimbangan kerja staf.
                </div>
              </div>
            </div>
            {totalOverloads > 0 && (
              <div className="bg-red-50 text-red-600 border border-red-200 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 animate-pulse whitespace-nowrap shrink-0">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                {totalOverloads} Anggota Kelebihan Beban
              </div>
            )}
          </div>

          {/* Grid 2 Kolom untuk Daftar Anggota Tim */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { user: hafidzUser, active: hafidzActive, workload: hafidzWorkload, msg: "Kelebihan beban! Risiko bottleneck eksekusi & supervisi." },
              { user: adityaUser, active: adityaActive, workload: adityaWorkload, msg: "Kelebihan beban! Risiko keterlambatan produksi." },
              { user: amirUser, active: amirActive, workload: amirWorkload, msg: "Kelebihan beban! Risiko bottleneck pada video/media." },
              { user: hamzahUser, active: hamzahActive, workload: hamzahWorkload, msg: "Kelebihan beban! Risiko keterlambatan dokumentasi fotografi." }
            ].map(({ user, active, workload, msg }) => {
              const limit = user.role === 'PM' ? (user.overloadLimit || 5) : user.overloadLimit;
              const completedCount = tasks.filter(t => (t.assigneeIds && t.assigneeIds.length > 0 ? t.assigneeIds.includes(user.id) : t.assigneeId === user.id) && t.status === 'done').length;
              
              return (
                <div 
                  key={user.id}
                  className="space-y-3 bg-white p-5 rounded-xl border border-gray-200 hover:border-gray-300 transition-colors shadow-2xs"
                >
                  {editingUserId === user.id ? (
                    <form onSubmit={(e) => handleSaveLimit(e, user.id)} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-bold text-gray-700">Maks. Batas Kapasitas {user.name}:</label>
                        <span className="text-[10px] text-gray-400 font-medium">Batas Beban Kerja</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <input 
                          type="number" 
                          min="1" 
                          max="20" 
                          value={editLimitValue} 
                          onChange={e => setEditLimitValue(parseInt(e.target.value) || 1)} 
                          className="w-20 px-2.5 py-1.5 border border-gray-300 rounded-lg text-xs font-bold focus:outline-none focus:border-morkhe-black" 
                          autoFocus
                        />
                        <button type="submit" className="px-3.5 py-1.5 bg-morkhe-black text-white font-bold text-xs rounded-lg hover:bg-gray-800 transition-colors cursor-pointer">Simpan</button>
                        <button type="button" onClick={() => setEditingUserId(null)} className="px-3 py-1.5 bg-gray-100 font-bold text-gray-700 text-xs rounded-lg hover:bg-gray-200 transition-colors cursor-pointer">Batal</button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full border border-gray-200 object-cover shrink-0" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-sm font-bold text-gray-950">{user.name}</p>
                              {user.role === 'PM' && (
                                <span className="text-[9px] font-bold uppercase tracking-wider text-morkhe-green bg-morkhe-black border border-morkhe-black px-1.5 py-0.5 rounded shrink-0 shadow-2xs">
                                  PM
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{user.position}</p>
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => handleEditClick(user)}
                          className="text-[11px] font-bold text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          Ubah Limit
                        </button>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <span className={`text-xs font-bold ${
                          workload.isOverloaded 
                            ? 'text-red-600 bg-red-50 px-2.5 py-1 rounded-md border border-red-100' 
                            : workload.isFull 
                            ? 'text-[#D97706] bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200' 
                            : 'text-gray-800'
                        }`}>
                          {active.length} / {limit} Tugas Aktif
                        </span>
                        
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-100 flex items-center gap-1">
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          {completedCount} Selesai
                        </span>
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-300 ${
                            workload.isOverloaded 
                              ? 'bg-red-500' 
                              : workload.isFull 
                              ? 'bg-[#D97706]' 
                              : 'bg-morkhe-green'
                          }`}
                          style={{ width: `${Math.min((active.length / limit) * 100, 100)}%` }}
                        />
                      </div>

                      {/* Overload Alert / Full Status Text */}
                      {workload.isOverloaded && (
                        <p className="text-xs text-red-600 flex items-center gap-1.5 font-medium bg-red-50 p-2.5 rounded-lg border border-red-100">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
                          {msg}
                        </p>
                      )}
                      {workload.isFull && (
                        <p className="text-xs text-[#D97706] flex items-center gap-1.5 font-medium bg-amber-50/70 p-2.5 rounded-lg border border-amber-200/70">
                          <AlertTriangle className="h-4 w-4 shrink-0 text-[#D97706]" />
                          Kapasitas penuh! Risiko keterlambatan produksi.
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. Section: Ringkasan Deadline Mendatang (Card List Top 5) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-700" />
              Deadline Terdekat
            </h2>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full font-bold">
                Top 5 Mendesak
              </span>
              <span className="text-[11px] text-gray-400 font-medium">
                · dari {activeTasks.length} total
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-xs text-gray-500 italic py-2">Tidak ada tugas dengan tenggat waktu dalam waktu dekat.</p>
            ) : (
              upcomingTasks.map((t) => {
                const assignee = users.find(u => u.id === t.assigneeId);
                const proj = projects.find(p => p.id === t.projectId);
                const { daysText, daysColor } = calculateDeadlineBadge(t.deadline);
                const subtasks = t.subtasks || [];
                const completedSubtasks = subtasks.filter(s => s.isCompleted).length;
                const totalSubtasks = subtasks.length;
                const subtaskPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

                return (
                  <div 
                    key={t.id} 
                    className="p-3.5 hover:bg-gray-50 border border-gray-100 rounded-xl transition-colors cursor-pointer space-y-2.5" 
                    onClick={() => onOpenTaskDetail(t)}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <p className="text-xs font-bold text-gray-900 leading-tight">{t.title}</p>
                        <div className="flex items-center gap-2 text-[10px] text-gray-500">
                          <span className="font-medium px-2 py-0.5 bg-gray-100 rounded text-gray-700">
                            {proj?.name || 'Umum'}
                          </span>
                          <span className="flex items-center gap-1.5 font-medium text-gray-700">
                            <img src={assignee?.avatar} className="w-4 h-4 rounded-full object-cover" alt="" />
                            {assignee?.name}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-1 shrink-0">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${daysColor}`}>
                          {daysText}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          {formatDate(t.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Indikator Progres Subtugas - Full Width */}
                    {totalSubtasks > 0 && (
                      <div className="space-y-1.5 pt-0.5">
                        <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                          <span>Subtugas ({completedSubtasks}/{totalSubtasks})</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gray-500 rounded-full transition-all duration-300"
                            style={{ width: `${subtaskPercent}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    );
  }

  // ==========================================
  // P05: STAFF DASHBOARD (Aditya View)
  // ==========================================
  if (currentPage === 'P05') {
    const activeUser = users.find(u => u.id === currentUser.id) || currentUser;
    const ownTasks = tasks.filter(t => t.assigneeIds && t.assigneeIds.length > 0 ? t.assigneeIds.includes(activeUser.id) : t.assigneeId === activeUser.id);
    const activeOwnTasks = getActiveTasksForUser(tasks, activeUser.id);
    const completedOwnTasks = ownTasks.filter(t => t.status === 'done');
    const canceledOwnTasks = ownTasks.filter(t => t.status === 'canceled_on_hold');
    const staffWorkload = getWorkloadInfo(activeOwnTasks.length, activeUser.overloadLimit);

    // Scoped projects for this staff
    const staffProjectIds = new Set(ownTasks.map(t => t.projectId));
    const staffActiveProjects = projects.filter(p => staffProjectIds.has(p.id) && p.status !== 'Completed');

    // Scoped comments on staff tasks
    const ownTaskIds = new Set(ownTasks.map(t => t.id));
    const staffCommentsCount = comments.filter(c => ownTaskIds.has(c.taskId)).length;

    // Sorted active own tasks by nearest deadline
    const sortedActiveOwnTasks = [...activeOwnTasks].sort((a, b) => {
      return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
    });

    return (
      <div className="p-8 space-y-6 max-w-7xl mx-auto font-sans select-none text-gray-900">
        
        {/* 1. Overload Alert Banner (HANYA MUNCUL JIKA STATE 3 OVERLOADED) */}
        {staffWorkload.isOverloaded && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 shadow-xs">
            <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1 flex-1">
              <h2 className="text-xs font-bold text-red-950 uppercase tracking-wide">
                Batas Ambang Kelebihan Beban Terlampaui (Tugas Menumpuk!)
              </h2>
              <p className="text-xs text-red-800 leading-relaxed max-w-4xl">
                Peringatan {activeUser.name.split(' ')[0]}! Anda memiliki <strong>{activeOwnTasks.length} tugas aktif</strong> yang ditugaskan, melebihi batas aman Anda yaitu {activeUser.overloadLimit}. Memiliki terlalu banyak tugas secara bersamaan menyebabkan kelelahan kognitif ekstrem dan hambatan produksi. Harap segera komunikasikan dengan PM untuk redistribusi tugas.
              </p>
            </div>
          </div>
        )}

        {/* 2. Header Block: Unified Single Container Card */}
        <div className="bg-white px-6 py-4.5 rounded-xl border border-gray-200 shadow-xs w-full flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Sisi Kiri: Identitas & Judul */}
          <div className="w-full md:w-1/2 flex flex-col justify-center">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-sans font-bold bg-[#320E3B] text-[#F4F5FA] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Lingkup Staf
              </span>
              <span className="text-gray-400 text-xs font-sans font-medium">
                • Skripsi Universitas Padjadjaran
              </span>
            </div>
            
            <div className="flex items-center gap-2 mt-1.5">
              <h1 className="text-xl font-bold text-gray-950 tracking-tight">
                Papan Kerja Kreatif
              </h1>
              
              <div className="relative inline-flex items-center group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStaffHeaderTooltip(prev => !prev)}
                  className="p-1 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  aria-label="Informasi Dasbor Staf"
                >
                  <Info className="h-4 w-4 stroke-[2.2]" />
                </button>
                <div
                  className={`absolute left-0 top-full mt-1.5 z-50 w-72 md:w-80 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${
                    showStaffHeaderTooltip
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <div className="absolute -top-1 left-3.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
                  Selamat datang kembali, {activeUser.name} ({activeUser.position}).
                </div>
              </div>
            </div>
          </div>

          {/* Sisi Kanan: Button Proyek Aktif Saya */}
          <div className="w-full md:w-1/2 flex items-center">
            <button 
              id="p05-header-proyek-aktif"
              onClick={() => setCurrentPage('P06')}
              className="w-full bg-white p-3.5 sm:px-5 sm:py-3 rounded-xl border border-gray-200 shadow-xs flex items-center justify-between gap-6 hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all text-left cursor-pointer group"
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
                  <FolderOpen className="h-4 w-4" /> Proyek Aktif Saya
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="text-2xl sm:text-3xl font-bold text-gray-950">{staffActiveProjects.length}</span>
                  <span className="text-xs text-gray-500 font-medium">Proyek Berjalan</span>
                </div>
              </div>
              <div className="bg-[#EBFBD8] w-10 h-10 rounded-full flex items-center justify-center shrink-0 group-hover:bg-[#d8f8b8] transition-colors">
                <FolderOpen className="h-5 w-5 text-morkhe-black" />
              </div>
            </button>
          </div>
        </div>

        {/* 3. Baris Stat Card Ringkasan: Grid 4 Kolom */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: TUGAS AKTIF */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P08'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group relative"
          >
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
                <CheckSquare className="h-4 w-4 shrink-0" /> Tugas Aktif
              </span>
              <div className="relative inline-flex items-center group/tooltip shrink-0">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowStaffTaskInfoTooltip(prev => !prev);
                  }}
                  className="p-0.5 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  aria-label="Informasi Tugas Aktif"
                >
                  <Info className="h-3.5 w-3.5 stroke-[2.2]" />
                </button>
                <div
                  className={`absolute right-0 top-full mt-1.5 z-50 w-64 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover/tooltip:opacity-100 group-hover/tooltip:visible group-hover/tooltip:translate-y-0 ${
                    showStaffTaskInfoTooltip
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="absolute -top-1 right-2.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
                  Tugas Aktif adalah Tugas dengan Status: Perlu Dikerjakan, Sedang Berjalan &amp; Dalam Review
                </div>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-950">{activeOwnTasks.length}</span>
              <span className="text-xs text-gray-500 font-medium">Dalam Pengerjaan</span>
            </div>
          </div>

          {/* Card 2: TUGAS SELESAI */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P08'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" /> Tugas Selesai
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-emerald-700">{completedOwnTasks.length}</span>
            </div>
          </div>

          {/* Card 3: BATAL/TUNDA */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P08'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
              <XCircle className="h-4 w-4 text-rose-500 shrink-0" /> Tugas Batal/Tunda
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-rose-600">{canceledOwnTasks.length}</span>
            </div>
          </div>

          {/* Card 4: KOMENTAR */}
          <div 
            onClick={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('project_id');
              window.history.pushState({}, '', url);
              setCurrentPage('P08'); 
            }}
            className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-2 text-left hover:border-morkhe-black hover:ring-1 hover:ring-morkhe-black transition-all cursor-pointer group"
          >
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 group-hover:text-morkhe-black flex items-center gap-1.5 transition-colors">
              <Sparkles className="h-4 w-4 text-morkhe-purple shrink-0" /> Diskusi &amp; Komentar
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-gray-950">{staffCommentsCount}</span>
              <span className="text-xs text-gray-500 font-medium">Diskusi Proyek &amp; Tugas</span>
            </div>
          </div>
        </div>

        {/* 4. Section: Kapasitas Kerja Saya (Full Width) */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-5">
          <div className="flex flex-wrap sm:flex-nowrap justify-between items-center border-b border-gray-100 pb-3 gap-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2 shrink-0">
                <Users className="h-5 w-5 text-gray-700" />
                Kapasitas Kerja Saya
              </h2>
              <div className="relative inline-flex items-center group shrink-0">
                <button
                  type="button"
                  onClick={() => setShowStaffCapacityTooltip(prev => !prev)}
                  className="p-1 rounded-full text-morkhe-purple hover:bg-purple-50 transition-colors focus:outline-none cursor-pointer flex items-center justify-center"
                  aria-label="Informasi Kapasitas Kerja"
                >
                  <Info className="h-4 w-4 stroke-[2.2]" />
                </button>
                <div
                  className={`absolute left-0 top-full mt-1.5 z-50 w-72 md:w-80 p-3 bg-gray-900/95 backdrop-blur-xs text-white text-[11px] font-medium leading-relaxed rounded-xl shadow-xl border border-gray-800 transition-all duration-150 pointer-events-none group-hover:opacity-100 group-hover:visible group-hover:translate-y-0 ${
                    showStaffCapacityTooltip
                      ? 'opacity-100 visible translate-y-0'
                      : 'opacity-0 invisible -translate-y-1'
                  }`}
                >
                  <div className="absolute -top-1 left-3.5 w-2 h-2 bg-gray-900 rotate-45 border-t border-l border-gray-800" />
                  Pantau alokasi tugas aktif terhadap batas kapasitas kerja Anda untuk mencegah bottleneck produksi.
                </div>
              </div>
            </div>
            
            {/* Status Badge (Tetap dipertahankan) */}
            <div className="shrink-0">
              {staffWorkload.isOverloaded ? (
                <span className="text-[11px] font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Kelebihan Beban
                </span>
              ) : staffWorkload.isFull ? (
                <span className="text-[11px] font-bold text-[#D97706] bg-amber-50 border border-amber-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5" /> Kapasitas Penuh
                </span>
              ) : (
                <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Optimal
                </span>
              )}
            </div>
          </div>

          {/* Staf Mini-card Body */}
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <img src={activeUser.avatar} alt={activeUser.name} className="w-12 h-12 rounded-full border border-gray-200 object-cover shrink-0" />
                <div>
                  <h3 className="text-sm font-bold text-gray-950">{activeUser.name}</h3>
                  <p className="text-xs text-gray-500">{activeUser.position}</p>
                </div>
              </div>

              <div className="text-right flex flex-col items-end gap-1">
                <span className={`text-xs font-bold ${
                  staffWorkload.isOverloaded 
                    ? 'text-red-600' 
                    : staffWorkload.isFull 
                    ? 'text-[#D97706]' 
                    : 'text-gray-800'
                }`}>
                  {activeOwnTasks.length} / {activeUser.overloadLimit} Tugas Aktif
                </span>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                  {completedOwnTasks.length} Selesai
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  staffWorkload.isOverloaded 
                    ? 'bg-red-500' 
                    : staffWorkload.isFull 
                    ? 'bg-[#D97706]' 
                    : 'bg-morkhe-green'
                }`}
                style={{ width: `${Math.min((activeOwnTasks.length / activeUser.overloadLimit) * 100, 100)}%` }}
              />
            </div>

            {/* Message Box - Kondisional hanya saat State 2 (Full) atau State 3 (Overload) */}
            {staffWorkload.isOverloaded && (
              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                <p className="text-xs text-red-800 leading-relaxed font-medium">
                  Kelebihan beban! Tugas aktif Anda ({activeOwnTasks.length}) telah melebihi batas ambang ({activeUser.overloadLimit} tugas). Harap segera komunikasikan dengan PM untuk redistribusi tugas.
                </p>
              </div>
            )}
            {staffWorkload.isFull && (
              <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl flex items-start gap-2.5">
                <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0 mt-0.5" />
                <p className="text-xs text-[#D97706] leading-relaxed font-medium">
                  Kapasitas penuh! Tugas aktif Anda ({activeOwnTasks.length}) telah mencapai batas ambang ({activeUser.overloadLimit} tugas). Harap segera komunikasikan dengan PM untuk redistribusi tugas.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* 4. Section Bawah (1 Row Full-Width): TUGAS AKTIF SAYA */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3 gap-2">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold text-gray-950 uppercase tracking-wider flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-700" />
                Tugas Aktif Saya
              </h2>
              <span className="text-[11px] text-gray-600 bg-gray-100 px-2.5 py-0.5 rounded-full font-medium">
                Urut Deadline Terdekat
              </span>
            </div>
            <span className="text-xs font-bold text-gray-500">
              Total Tugas Sendiri: {ownTasks.length}
            </span>
          </div>

          <div className="space-y-3">
            {sortedActiveOwnTasks.length === 0 ? (
              <p className="text-xs text-gray-400 italic py-4">Tidak ada tugas aktif! Kapasitas Anda sepenuhnya seimbang.</p>
            ) : (
              sortedActiveOwnTasks.map((t) => {
                const proj = projects.find(p => p.id === t.projectId);
                const doneSubtasksCount = t.subtasks.filter(s => s.isCompleted).length;
                const percent = t.subtasks.length > 0 ? Math.round((doneSubtasksCount / t.subtasks.length) * 100) : 0;
                const { daysText, daysColor } = calculateDeadlineBadge(t.deadline);

                return (
                  <div
                    key={t.id}
                    onClick={() => onOpenTaskDetail(t)}
                    className="p-4 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-all cursor-pointer space-y-3 shadow-2xs"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                      <div className="space-y-1">
                        <span className="text-[10px] font-sans font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md inline-block">
                          {proj ? `${proj.code}: ${proj.name}` : 'Desain Morkhē'}
                        </span>
                        <h3 className="text-sm font-bold text-gray-900">{t.title}</h3>
                      </div>
                      
                      <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-1">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${daysColor}`}>
                          {daysText}
                        </span>
                        <span className="text-[10px] text-gray-500 font-medium">
                          Tenggat {formatDate(t.deadline)}
                        </span>
                      </div>
                    </div>

                    {/* Subtasks Progress */}
                    {t.subtasks.length > 0 && (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex justify-between text-[11px] text-gray-500 font-medium">
                          <span>Subtugas ({doneSubtasksCount}/{t.subtasks.length})</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                          <div className="h-full bg-gray-500 rounded-full transition-all duration-300" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    );
  }

  return null;
}
