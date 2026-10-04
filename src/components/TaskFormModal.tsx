/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckSquare, Plus, AlertCircle, AlertTriangle } from 'lucide-react';
import { User, Project, Task } from '../types';
import { generateTaskCode } from '../utils/codeGenerator';
import { getActiveTasksForUser, getWorkloadInfo } from '../utils/taskUtils';

interface TaskFormModalProps {
  currentUser: User;
  users: User[];
  projects: Project[];
  tasks: Task[];
  initialStatus?: Task['status'];
  onClose: () => void;
  onAddTask: (task: Task) => void;
}

export default function TaskFormModal({
  currentUser,
  users,
  projects,
  tasks,
  initialStatus,
  onClose,
  onAddTask
}: TaskFormModalProps) {
  const isPM = currentUser.role === 'PM';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState(projects[0]?.id || '');
  const [assigneeId, setAssigneeId] = useState(isPM ? '' : currentUser.id);
  const [priority, setPriority] = useState<'Low' | 'Medium' | 'High' | 'Critical'>('Medium');
  const [status, setStatus] = useState<'todo' | 'in_progress' | 'review' | 'done' | 'canceled_on_hold'>(initialStatus || 'todo');
  const [startDate, setStartDate] = useState('2026-07-01');
  const [deadline, setDeadline] = useState('2026-07-09'); // 3 days in future
  const [dateError, setDateError] = useState('');

  const availableProjects = isPM 
    ? projects 
    : projects.filter(p => p.memberIds && p.memberIds.includes(currentUser.id));

  const selectedProject = projects.find(p => p.id === projectId);
  const availableUsers = users.filter(u => selectedProject?.memberIds?.includes(u.id));

  // Calculate stress of selected staff
  const getStaffActiveCount = (staffId: string) => {
    return getActiveTasksForUser(tasks, staffId).length;
  };
  const selectedAssignee = assigneeId ? users.find(u => u.id === assigneeId) : null;
  const selectedActiveCount = assigneeId ? getStaffActiveCount(assigneeId) : 0;
  const selectedWorkload = selectedAssignee ? getWorkloadInfo(selectedActiveCount, selectedAssignee.overloadLimit) : null;

  const isSubmitDisabled = !title.trim() || !projectId || !assigneeId || startDate > deadline;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !projectId || !assigneeId) return;

    if (startDate > deadline) {
      setDateError('Tanggal Mulai tidak boleh setelah Tenggat Waktu.');
      return;
    }

    setDateError('');

    const newTask: Task = {
      id: `TSK-${Date.now()}`,
      code: generateTaskCode(),
      projectId,
      title: title.trim(),
      description: description.trim(),
      status,
      priority,
      assigneeId,
      startDate,
      deadline,
      subtasks: []
    };

    onAddTask(newTask);
    onClose();
  };

  return createPortal(
    <div className="fixed inset-0 bg-morkhe-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none text-gray-900">
      <div className="bg-white rounded-xl w-full max-w-3xl md:max-w-4xl h-full max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-xs font-bold text-gray-950 tracking-wider uppercase flex items-center gap-2">
            <CheckSquare className="h-4 w-4 text-morkhe-black" /> Buat Tugas Baru
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-morkhe-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {availableProjects.length === 0 ? (
          <div className="p-8 text-center space-y-4 my-auto">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">Belum Ada Proyek yang Bisa Dipilih</h3>
              <p className="text-xs text-gray-600 max-w-sm mx-auto leading-relaxed">
                {isPM 
                  ? 'Tugas harus dikaitkan ke sebuah proyek. Silakan buat proyek terlebih dahulu.' 
                  : 'Tugas baru bisa ditambahkan setelah kamu diikutsertakan ke sebuah proyek oleh Project Manager.'}
              </p>
            </div>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-bold transition-all cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : (
          /* Form Body with Sticky Footer */
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">

          
          {/* Scrollable middle content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Target Proyek</label>
                <select
                  value={projectId}
                  onChange={(e) => {
                    const newProjId = e.target.value;
                    setProjectId(newProjId);
                    const newProj = projects.find(p => p.id === newProjId);
                    if (assigneeId && !newProj?.memberIds?.includes(assigneeId)) {
                      setAssigneeId('');
                    }
                  }}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-855 bg-white"
                  required
                >
                  {availableProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.code ? `${p.code}: ${p.name}` : p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-855 bg-white"
                >
                  <option value="todo">Perlu Dikerjakan</option>
                  <option value="in_progress">Sedang Berjalan</option>
                  <option value="review">Dalam Review</option>
                  <option value="done">Selesai</option>
                  <option value="canceled_on_hold">Batal/Tunda</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Nama Tugas</label>
                <input
                  type="text"
                  placeholder="Contoh: Desain 3 variasi hero landing page"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-855 font-bold bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Prioritas</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-855 bg-white"
                >
                  <option value="Low">Rendah</option>
                  <option value="Medium">Menengah</option>
                  <option value="High">Tinggi</option>
                  <option value="Critical">Kritis</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Spesifikasi Tugas & Panduan</label>
              <textarea
                placeholder="Tuliskan referensi, warna hex, spesifikasi CMYK, syarat font, atau detail teknis penting lainnya..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white leading-relaxed"
              />
            </div>

            {isPM && (
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">
                  Penugasan Anggota *
                </label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  className={`w-full text-xs px-3 py-2 border rounded-lg focus:outline-none focus:border-morkhe-black bg-white ${
                    !assigneeId ? 'text-gray-400 border-amber-300 bg-amber-50/20' : 'text-gray-855 border-gray-250'
                  }`}
                  required
                >
                  <option value="" disabled hidden>-- Pilih Anggota Tim (Wajib Minimal 1) --</option>
                  {availableUsers.map(u => (
                    <option key={u.id} value={u.id} className="text-gray-900">
                      {u.name} ({u.position}) {u.role === 'PM' ? '[PM] ' : ''}— Aktif: {getStaffActiveCount(u.id)}/{u.overloadLimit}
                    </option>
                  ))}
                </select>
                {availableUsers.length === 0 ? (
                  <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Belum ada anggota resmi pada proyek ini. Tambahkan anggota melalui Edit Proyek.</span>
                  </p>
                ) : !assigneeId && (
                  <p className="text-[10px] text-amber-700 font-medium mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    <span>Wajib memilih minimal 1 anggota tim untuk menugaskan tugas baru.</span>
                  </p>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateError('');
                  }}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Tenggat Waktu</label>
                <input
                  type="date"
                  value={deadline}
                  onChange={(e) => {
                    setDeadline(e.target.value);
                    setDateError('');
                  }}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white"
                  required
                />
              </div>
            </div>

            {dateError && (
              <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs font-semibold text-red-700 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <span>{dateError}</span>
              </div>
            )}

            {/* REAL-TIME WORKLOAD ALERT NOTIFICATION FOR PM */}
            {isPM && selectedAssignee && selectedWorkload && (
              <div className={`p-3 rounded-lg border text-xs leading-snug flex gap-2 items-start ${
                selectedWorkload.isOverloaded 
                  ? 'bg-red-50 border-red-200 text-red-800' 
                  : selectedWorkload.isFull
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-morkhe-green/20 border-morkhe-green text-morkhe-black'
              }`}>
                {selectedWorkload.isOverloaded ? (
                  <>
                    <AlertTriangle className="h-4.5 w-4.5 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Peringatan Kelebihan Beban:</strong> {selectedAssignee.name} saat ini memiliki <strong>{selectedActiveCount} tugas aktif</strong> (melebihi batas maksimal {selectedAssignee.overloadLimit}). Menambahkan tugas ini akan memperparah risiko burnout dan keterlambatan.
                    </div>
                  </>
                ) : selectedWorkload.isFull ? (
                  <>
                    <AlertTriangle className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong>Kapasitas Penuh:</strong> {selectedAssignee.name} saat ini memiliki <strong>{selectedActiveCount} tugas aktif</strong> (mencapai batas maksimal {selectedAssignee.overloadLimit}). Menugaskan tugas baru akan menyebabkan kelebihan beban.
                    </div>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4.5 w-4.5 text-morkhe-green shrink-0 mt-0.5" />
                    <div>
                      <strong>Kapasitas Aman:</strong> {selectedAssignee.name} memiliki <strong>{selectedActiveCount} tugas aktif</strong> (batas maksimal: {selectedAssignee.overloadLimit}). Kapasitasnya masih aman untuk tugas ini.
                    </div>
                  </>
                )}
              </div>
            )}

          </div>

          {/* Sticky Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-semibold transition-all cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitDisabled}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm border ${
                isSubmitDisabled
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed border-gray-200'
                  : 'bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white cursor-pointer border-morkhe-purple'
              }`}
            >
              <Plus className={`h-4 w-4 ${isSubmitDisabled ? 'text-gray-400' : 'text-morkhe-white'}`} /> Buat Tugas
            </button>
          </div>

        </form>
        )}

      </div>
    </div>,
    document.body
  );
}
