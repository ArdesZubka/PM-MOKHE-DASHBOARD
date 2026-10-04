/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowLeft, 
  ChevronRight, 
  Plus, 
  Users, 
  Check, 
  AlertCircle,
  AlertTriangle,
  Paperclip,
  Upload,
  Link2,
  FileText,
  X,
  MessageSquare
} from 'lucide-react';
import { User, Project, Task, TaskAttachment } from '../types';
import { DUMMY_USERS } from '../data/dummy';
import { generateProjectCode } from '../utils/codeGenerator';
import { getActiveTasksForUser, getWorkloadInfo } from '../utils/taskUtils';

interface CreateProjectPageProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  currentUser: User;
  users: User[];
  tasks?: Task[];
  onAddProject: (project: Project) => void;
}

export default function CreateProjectPage({
  currentPage,
  setCurrentPage,
  currentUser,
  users = DUMMY_USERS,
  tasks = [],
  onAddProject
}: CreateProjectPageProps) {
  const isPM = currentUser.role === 'PM';
  const availableUsers = users.length > 0 ? users : DUMMY_USERS;
  const assignableTeam = availableUsers;

  // Form states
  const [name, setName] = useState('');
  const [client, setClient] = useState('');
  const [status, setStatus] = useState<'Planning' | 'Ongoing' | 'Review' | 'Completed'>('Planning');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('2026-07-06');
  const [endDate, setEndDate] = useState('2026-08-06');
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [memberError, setMemberError] = useState(false);

  // Attachments state
  const [projectAttachments, setProjectAttachments] = useState<TaskAttachment[]>([]);
  const [showAddLinkForm, setShowAddLinkForm] = useState(false);
  const [linkUrlInput, setLinkUrlInput] = useState('');
  const [linkTextInput, setLinkTextInput] = useState('');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  // Upload file for initial project attachment
  const handleProjectFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setProjectAttachments(prev => [...prev, ...newAttachments]);

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Add link for initial project attachment
  const handleAddProjectLink = () => {
    if (!linkUrlInput.trim()) return;
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

    setProjectAttachments(prev => [...prev, newLinkAtt]);
    setLinkUrlInput('');
    setLinkTextInput('');
    setShowAddLinkForm(false);
  };

  const handleRemoveProjectAttachment = (attId: string) => {
    setProjectAttachments(prev => prev.filter(a => a.id !== attId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedMemberIds.length === 0) {
      setMemberError(true);
      return;
    }
    if (!name.trim() || !client.trim()) return;

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
      progress: 0,
      attachments: projectAttachments
    };

    onAddProject(newProject);
    setCurrentPage('P06');
  };

  // RBAC Access Guard for Staff
  if (!isPM) {
    return (
      <div className="min-h-full bg-morkhe-white p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-gray-900 select-none">
        {/* Sticky Breadcrumb */}
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
            <span className="text-gray-900 font-bold">Buat Proyek Baru</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center space-y-4 max-w-md mx-auto my-12 shadow-sm">
          <div className="mx-auto h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-500">
            <AlertCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-950">Hambatan Administratif (Aturan RBAC)</h2>
          <p className="text-xs text-gray-600 leading-relaxed">
            Peran staf tidak memiliki akses tingkat eksekutif. Mendesain atau komisioning direktori proyek baru dibatasi hanya untuk PM.
          </p>
          <button
            onClick={() => setCurrentPage('P06')}
            className="px-6 py-2 bg-morkhe-black hover:bg-gray-800 text-morkhe-white rounded-full text-xs font-semibold transition-all cursor-pointer"
          >
            Kembali ke Direktori Proyek
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-morkhe-white p-6 md:p-8 space-y-6 max-w-7xl mx-auto font-sans text-gray-900 select-none pb-24">
      
      {/* 1. BREADCRUMB NAVIGATION - STICKY HEADER */}
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
          <span className="text-gray-900 font-bold">Buat Proyek Baru</span>
        </div>
      </div>

      {/* 2. PAGE CARD FORM CONTAINER */}
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 space-y-6 shadow-2xs">
        
        {/* Header Title */}
        <h2 className="text-lg font-bold text-gray-950 pb-2 border-b border-gray-100 flex items-center gap-2">
          <Plus className="h-4 w-4 text-morkhe-purple" /> Buat Proyek Baru
        </h2>

        {/* Row 1: Nama Proyek & Organisasi Klien Grid (2 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Nama Proyek *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
              placeholder="Contoh: Perubahan Merek Bandung Art Space"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Organisasi Klien *</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none"
              placeholder="Contoh: Dinas Kebudayaan Bandung"
              required
            />
          </div>
        </div>

        {/* Row 2: Status Proyek & Tanggal Mulai & Tenggat Waktu Akhir Grid (3 Columns) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">Status Proyek</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-morkhe-purple focus:outline-none cursor-pointer"
            >
              <option value="Planning">Perencanaan (Planning)</option>
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

        {/* Row 3: Deskripsi Ruang Lingkup & Hasil Desain */}
        <div>
          <label className="block text-xs font-bold text-gray-700 mb-1">Deskripsi Ruang Lingkup & Hasil Desain</label>
          <textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-morkhe-purple focus:outline-none leading-relaxed"
            placeholder="Masukkan brief lengkap, spesifikasi file, kebutuhan tipografi, dan catatan ekspektasi akhir..."
          />
        </div>

        {/* Section 4: Assignable Members Checkbox Grid */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-700 flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5 text-gray-500" />
              Tim yang Ditugaskan <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] font-bold text-morkhe-purple uppercase">
              {selectedMemberIds.length} ANGGOTA TERPILIH
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {assignableTeam.map((u) => {
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
        </div>

        {/* Section 5: LAMPIRAN PROYEK (CREATE MODE) */}
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
                      <span className="text-xs font-bold text-gray-900 truncate block">
                        {att.name}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-500 font-medium">
                        <span>{att.type === 'file' ? (att.size || 'Dokumen File') : 'Tautan Web'}</span>
                        <span>•</span>
                        <span>Oleh PM</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveProjectAttachment(att.id)}
                      className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                      title="Hapus Lampiran"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Section 6: DISKUSI & KOMENTAR (CREATE MODE NOTICE) */}
        <div className="space-y-3 pt-4 border-t border-gray-100">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-morkhe-purple" />
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Diskusi & Komentar
            </h3>
          </div>
          <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center">
            <p className="text-xs text-gray-500 font-medium">
              Fitur diskusi & komentar akan aktif setelah proyek resmi dibuat.
            </p>
          </div>
        </div>

        {/* STICKY FOOTER CTA */}
        <div className="sticky bottom-0 -mx-6 md:-mx-8 -mb-6 md:-mb-8 mt-8 bg-white border-t border-gray-200 py-3.5 px-6 md:px-8 z-30 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            
            {/* Left Status Info */}
            <div className="text-xs text-gray-500 font-medium hidden sm:block">
              <span>Form Pembuatan Proyek Baru</span>
            </div>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={() => setCurrentPage('P06')}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-full transition-all cursor-pointer"
              >
                Batal
              </button>

              <button
                type="submit"
                disabled={selectedMemberIds.length === 0}
                className={`px-5 py-2 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                  selectedMemberIds.length === 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-70 shadow-none'
                    : 'bg-morkhe-purple hover:opacity-90 text-white cursor-pointer active:scale-[0.98]'
                }`}
              >
                <Plus className="h-4 w-4" />
                <span>Buat Proyek</span>
              </button>
            </div>

          </div>
        </div>

      </form>

    </div>
  );
}
