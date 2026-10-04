/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Shield, RefreshCw, X, ChevronRight } from 'lucide-react';
import { User } from '../types';

interface SandboxControllerProps {
  currentUser: User;
  users: User[];
  setCurrentUser: (user: User) => void;
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onResetData: () => void;
}

export const PAGES_LIST = [
  { id: 'P01', name: 'P01: Registrasi', cat: 'Auth' },
  { id: 'P02', name: 'P02: Login', cat: 'Auth' },
  { id: 'P03', name: 'P03: Lupa Kata Sandi', cat: 'Auth' },
  { id: 'P04', name: 'P04: Dasbor PM', cat: 'Dasbor' },
  { id: 'P05', name: 'P05: Dasbor Staf', cat: 'Dasbor' },
  { id: 'P06', name: 'P06: Daftar Proyek', cat: 'Proyek' },
  { id: 'P07', name: 'P07: Kanban Board (PM)', cat: 'Proyek' },
  { id: 'P08', name: 'P08: Kanban Board (Staf)', cat: 'Proyek' },
  { id: 'P09', name: 'P09: Detail Tugas (PM)', cat: 'Proyek' },
  { id: 'P10', name: 'P10: Detail Tugas (Staf)', cat: 'Proyek' },
  { id: 'P11', name: 'P11: Form Tambah/Edit Tugas', cat: 'Proyek' },
  { id: 'P12', name: 'P12: Form Tambah Proyek', cat: 'Proyek' },
  { id: 'P19', name: 'P19: Detail Proyek', cat: 'Proyek' },
  { id: 'P20', name: 'P20: Timeline Proyek', cat: 'Proyek' },
  { id: 'P13', name: 'P13: Pusat Notifikasi', cat: 'Notifikasi' },
  { id: 'P14', name: 'P14: Pengaturan Notifikasi', cat: 'Notifikasi' },
  { id: 'P15', name: 'P15: Kalender (Bulanan)', cat: 'Kalender' },
  { id: 'P16', name: 'P16: Kalender (Mingguan)', cat: 'Kalender' },
  { id: 'P18', name: 'P18: Pengaturan Akun', cat: 'Akun' }
];

export default function SandboxController({
  currentUser,
  users,
  setCurrentUser,
  currentPage,
  setCurrentPage,
  onResetData
}: SandboxControllerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative font-sans select-none">
      {/* Navbar Shield Icon Button Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title={isOpen ? "Tutup Kontrol Prototipe" : "Buka Kontrol Prototipe"}
        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
          isOpen
            ? 'bg-black text-white border-black shadow-sm ring-2 ring-black/10'
            : 'bg-gray-50 hover:bg-gray-100 border-dashed border-gray-300 text-gray-500 hover:text-black hover:border-gray-400'
        }`}
      >
        <Shield className="h-4 w-4" />
      </button>

      {/* Expanded Dropdown Panel */}
      {isOpen && (
        <>
          {/* Backdrop overlay to close when clicking outside */}
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />

          <div className="absolute top-full right-0 mt-2 w-80 max-w-[calc(100vw-2.5rem)] bg-white border border-gray-200 rounded-2xl shadow-2xl p-4 text-gray-900 space-y-4 font-sans z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            
            {/* Header Row */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div className="flex items-center gap-1.5">
                <Shield className="h-4 w-4 text-gray-500" />
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Kontrol Prototipe
                </span>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                title="Tutup Kontrol"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Section 1: Persona Segmented Toggle */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                  Simulasi Pengguna
                </span>
                <span className="text-[10px] font-medium text-gray-400">
                  {currentUser.role === 'PM' ? 'Project Manager' : 'Staf Tim'}
                </span>
              </div>

              <div className="bg-gray-100 p-1 rounded-xl flex gap-1 border border-gray-200/80">
                {users.slice(0, 2).map((u) => {
                  const isSelected = currentUser.id === u.id;
                  const label = u.role === 'PM' ? `${u.name} (PM)` : `${u.name} (Staf)`;
                  return (
                    <button
                      key={u.id}
                      id={`btn-user-${u.id}`}
                      onClick={() => {
                        setCurrentUser(u);
                        localStorage.setItem('morkhe_is_authenticated', 'true');
                        localStorage.setItem('morkhe_current_user', JSON.stringify(u));
                        if (u.role === 'PM') {
                          setCurrentPage('P04');
                        } else {
                          setCurrentPage('P05');
                        }
                      }}
                      className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 cursor-pointer ${
                        isSelected
                          ? 'bg-black text-white shadow-sm'
                          : 'text-gray-600 hover:text-black hover:bg-gray-200/60'
                      }`}
                    >
                      <span>{label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section 2: Page Jump Dropdown */}
            <div className="space-y-1.5">
              <label 
                htmlFor="sandbox-page-select"
                className="block text-[10px] font-bold text-gray-500 uppercase tracking-wider"
              >
                Lompat ke Halaman
              </label>
              <div className="relative">
                <select
                  id="sandbox-page-select"
                  value={currentPage}
                  onChange={(e) => setCurrentPage(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-black cursor-pointer appearance-none pr-8"
                >
                  <optgroup label="Autentikasi" className="bg-white text-gray-800">
                    <option value="P01">P01: Registrasi</option>
                    <option value="P02">P02: Login</option>
                    <option value="P03">P03: Lupa Kata Sandi</option>
                  </optgroup>
                  <optgroup label="Dasbor" className="bg-white text-gray-800">
                    <option value="P04">P04: Dasbor PM (Hafidz)</option>
                    <option value="P05">P05: Dasbor Staf (Aditya)</option>
                  </optgroup>
                  <optgroup label="Proyek & Kanban" className="bg-white text-gray-800">
                    <option value="P06">P06: Daftar Proyek</option>
                    <option value="P07">P07: Kanban Board (PM)</option>
                    <option value="P08">P08: Kanban Board (Staf)</option>
                    <option value="P09">P09: Detail Tugas (PM)</option>
                    <option value="P10">P10: Detail Tugas (Staf)</option>
                    <option value="P11">P11: Form Tambah/Edit Tugas</option>
                    <option value="P12">P12: Form Tambah Proyek</option>
                    <option value="P20">P20: Timeline Proyek (PM)</option>
                  </optgroup>
                  <optgroup label="Notifikasi" className="bg-white text-gray-800">
                    <option value="P13">P13: Pusat Notifikasi</option>
                    <option value="P14">P14: Pengaturan Notifikasi</option>
                  </optgroup>
                  <optgroup label="Kalender" className="bg-white text-gray-800">
                    <option value="P15">P15: Kalender Bulanan</option>
                    <option value="P16">P16: Kalender Mingguan</option>
                  </optgroup>
                  <optgroup label="Profil & Pengaturan" className="bg-white text-gray-800">
                    <option value="P18">P18: Pengaturan Akun</option>
                  </optgroup>
                </select>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <ChevronRight className="h-3.5 w-3.5 rotate-90" />
                </div>
              </div>
            </div>

            {/* Section 3: Reset Data Action Button */}
            <div className="pt-1 border-t border-gray-100 flex justify-between items-center">
              <span className="text-[10px] text-gray-400 font-semibold">SKRIPSI S1 UNPAD</span>
              <button
                id="btn-reset-sandbox"
                onClick={onResetData}
                title="Reset Data ke Baseline Awal"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 hover:bg-red-50 border border-gray-200 hover:border-red-200 rounded-xl text-gray-600 hover:text-red-600 text-xs font-semibold transition-all cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Reset Baseline</span>
              </button>
            </div>

          </div>
        </>
      )}
    </div>
  );
}
