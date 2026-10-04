/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Briefcase, Plus, AlertCircle, AlertTriangle, Users, Check } from 'lucide-react';
import { User, Project, Task } from '../types';
import { DUMMY_USERS, DUMMY_PROJECTS, DUMMY_TASKS } from '../data/dummy';
import { generateProjectCode } from '../utils/codeGenerator';
import { getActiveTasksForUser, getWorkloadInfo } from '../utils/taskUtils';

interface ProjectFormModalProps {
  currentUser: User;
  users?: User[];
  tasks?: Task[];
  onClose: () => void;
  onAddProject?: (project: Project) => void;
  onUpdateProject?: (project: Project) => void;
  initialProject?: Project;
}

export default function ProjectFormModal({
  currentUser,
  users = DUMMY_USERS,
  tasks = DUMMY_TASKS,
  onClose,
  onAddProject,
  onUpdateProject,
  initialProject
}: ProjectFormModalProps) {
  const isPM = currentUser.role === 'PM';
  const availableUsers = users.length > 0 ? users : DUMMY_USERS;
  // All team members including PM
  const assignableTeam = availableUsers;
  
  const [name, setName] = useState(initialProject?.name || '');
  const [description, setDescription] = useState(initialProject?.description || '');
  const [client, setClient] = useState(initialProject?.client || '');
  const [status, setStatus] = useState<'Planning' | 'Ongoing' | 'Review' | 'Completed'>(initialProject?.status || 'Planning');
  const [startDate, setStartDate] = useState(initialProject?.startDate || '2026-07-06');
  const [endDate, setEndDate] = useState(initialProject?.endDate || '2026-08-06');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>(() => {
    if (initialProject) {
      if (initialProject.memberIds && initialProject.memberIds.length > 0) {
        return initialProject.memberIds;
      }
      const dummyP = DUMMY_PROJECTS.find(dp => dp.id === initialProject.id);
      return dummyP?.memberIds || [];
    }
    return [];
  });
  const [memberError, setMemberError] = useState(false);

  React.useEffect(() => {
    if (initialProject) {
      const dummyP = DUMMY_PROJECTS.find(dp => dp.id === initialProject.id);
      setSelectedMemberIds(
        (initialProject.memberIds && initialProject.memberIds.length > 0)
          ? initialProject.memberIds
          : (dummyP?.memberIds || [])
      );
    } else {
      setSelectedMemberIds([]);
    }
  }, [initialProject]);

  const toggleMember = (userId: string) => {
    let updated: string[];
    if (selectedMemberIds.includes(userId)) {
      updated = selectedMemberIds.filter(id => id !== userId);
    } else {
      updated = [...selectedMemberIds, userId];
    }
    setSelectedMemberIds(updated);
    if (updated.length > 0) {
      setMemberError(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) {
      setMemberError(true);
      return;
    }
    if (!name.trim() || !client.trim()) return;

    if (initialProject && onUpdateProject) {
      onUpdateProject({
        ...initialProject,
        name: name.trim(),
        description: description.trim(),
        status,
        client: client.trim(),
        startDate,
        endDate,
        memberIds: selectedMemberIds,
        progress: initialProject.progress
      });
    } else if (onAddProject) {
      const newProject: Project = {
        id: `PRJ-${Date.now()}`,
        code: generateProjectCode(),
        name: name.trim(),
        description: description.trim(),
        status,
        client: client.trim(),
        managerId: currentUser.id,
        startDate,
        endDate,
        memberIds: selectedMemberIds,
        progress: 0
      };
      onAddProject(newProject);
    }
    onClose();
  };

  if (!isPM) {
    return createPortal(
      <div className="fixed inset-0 bg-morkhe-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none">
        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-center space-y-4 border border-gray-250">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-950">Hambatan Administratif (Aturan RBAC)</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Peran staf tidak memiliki akses tingkat eksekutif. Mendesain atau komisioning direktori proyek baru dibatasi hanya untuk PM (Hafidz Ardis S.).
          </p>
          <button
            onClick={onClose}
            className="w-full py-2 bg-morkhe-black hover:bg-gray-800 text-morkhe-white rounded-full text-xs font-semibold transition-all cursor-pointer"
          >
            Mengerti & Tutup
          </button>
        </div>
      </div>,
      document.body
    );
  }

  return createPortal(
    <div className="fixed inset-0 bg-morkhe-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none text-gray-900">
      <div className="bg-white rounded-xl w-full max-w-3xl md:max-w-4xl h-full max-h-[90vh] shadow-xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <h2 className="text-xs font-bold text-gray-950 tracking-wider uppercase flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-morkhe-black" /> {initialProject ? 'Edit Proyek Desain' : 'Buat Proyek Desain Baru'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 rounded-lg transition-all text-gray-400 hover:text-morkhe-black"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body with Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 overflow-hidden">
          
          {/* Scrollable middle content area */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Nama Proyek</label>
              <input
                type="text"
                placeholder="Contoh: Perubahan Merek Bandung Art Space"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-850 font-bold bg-white"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Organisasi Klien</label>
                <input
                  type="text"
                  placeholder="Contoh: Dinas Kebudayaan Bandung"
                  value={client}
                  onChange={(e) => setClient(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white"
                  required
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Status Proyek</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-855 bg-white"
                >
                  <option value="Planning">Perencanaan</option>
                  <option value="Ongoing">Berjalan</option>
                  <option value="Review">Dalam Review</option>
                  <option value="Completed">Selesai</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Deskripsi Ruang Lingkup & Hasil Desain</label>
              <textarea
                placeholder="Masukkan brief lengkap, spesifikasi file, kebutuhan tipografi, dan catatan ekspektasi akhir..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white leading-relaxed"
              />
            </div>

            {/* Assigned Team Members Section */}
            <div>
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 flex items-center justify-between mb-1.5">
                <span className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-gray-500" />
                  Tim yang Ditugaskan (Assigned Members)
                </span>
                <span className="text-gray-400 font-normal text-[10px] uppercase">
                  {selectedMemberIds.length} Anggota Terpilih
                </span>
              </label>

              <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50/50 p-2.5 rounded-lg border max-h-40 overflow-y-auto ${
                memberError ? 'border-red-300 bg-red-50/20' : 'border-gray-200'
              }`}>
                {assignableTeam.map((user) => {
                  const isSelected = selectedMemberIds.includes(user.id);
                  const activeTasks = getActiveTasksForUser(tasks, user.id);
                  const workload = getWorkloadInfo(activeTasks.length, user.overloadLimit);

                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => toggleMember(user.id)}
                      className={`flex items-center justify-between p-2 rounded-md border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-morkhe-purple/10 border-morkhe-purple text-gray-900 font-semibold'
                          : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-100/70'
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
                        <div className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 transition-colors ${
                          isSelected 
                            ? 'bg-morkhe-purple border-morkhe-purple text-white' 
                            : 'border-gray-300 bg-white'
                        }`}>
                          {isSelected && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>

                        <img 
                          src={user.avatar} 
                          alt={user.name} 
                          className="w-6 h-6 rounded-full object-cover border border-gray-200 shrink-0" 
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-gray-900 truncate leading-snug">{user.name}</p>
                          <p className="text-[10px] text-gray-500 truncate leading-snug">{user.position}</p>
                        </div>
                      </div>

                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                        workload.isOverloaded 
                          ? 'bg-red-100 text-red-700' 
                          : workload.isFull
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-emerald-100 text-emerald-700'
                      }`}>
                        {activeTasks.length}/{user.overloadLimit}
                      </span>
                    </button>
                  );
                })}
              </div>
              {selectedMemberIds.length === 0 && (
                <div className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 p-2 rounded-lg flex items-center gap-1.5 font-medium mt-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span>Wajib menugaskan minimal 1 anggota tim sebelum membuat/menyimpan proyek.</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Tanggal Mulai</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Tenggat Waktu Akhir</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-morkhe-black text-gray-800 bg-white"
                />
              </div>
            </div>

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
              disabled={selectedMemberIds.length === 0}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 border ${
                selectedMemberIds.length === 0
                  ? 'bg-gray-200 text-gray-400 border-gray-200 cursor-not-allowed opacity-70 shadow-none'
                  : 'bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white border-morkhe-purple cursor-pointer shadow-sm'
              }`}
            >
              <Plus className={`h-4 w-4 ${selectedMemberIds.length === 0 ? 'text-gray-400' : 'text-morkhe-white'}`} />
              <span>{initialProject ? 'Simpan Perubahan' : 'Buat Proyek'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>,
    document.body
  );
}
