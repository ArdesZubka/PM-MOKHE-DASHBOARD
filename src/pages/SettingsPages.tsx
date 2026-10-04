/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { 
  User, Key, CheckCircle, Save, UploadCloud, Trash2, Eye, 
  EyeOff, Lock, Camera, Link as LinkIcon, Image, Sparkles
} from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsPagesProps {
  currentPage: string;
  currentUser: UserType;
  onUpdateCurrentUser: (updatedUser: UserType) => void;
}

const PM_POSITION_OPTIONS = [
  'Founder & CEO',
  'CFO',
  'CMO'
];

const STAFF_POSITION_OPTIONS = [
  'Graphic Designer',
  'Photographer',
  'Videographer',
  'Sosmed Analyst & Strategist',
  'Copywriter & SEO',
  'Finance'
];

export default function SettingsPages({
  currentPage,
  currentUser,
  onUpdateCurrentUser
}: SettingsPagesProps) {
  
  // P18 Edit Profile states
  const normalizePos = (pos: string) => (pos && pos.includes('Founder & CEO')) ? 'Founder & CEO' : pos;
  const [profileName, setProfileName] = useState(currentUser.name);
  const [profileUsername, setProfileUsername] = useState(currentUser.username || '');
  const [profileEmail, setProfileEmail] = useState(currentUser.email);
  const [profilePosition, setProfilePosition] = useState(normalizePos(currentUser.position));
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatar);

  // Card 1 (Foto Profil) state
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [isPhotoSaved, setIsPhotoSaved] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Card 2 (Informasi Akun) state
  const [isInfoSaved, setIsInfoSaved] = useState(false);
  const positionOptions = currentUser.role === 'PM' ? PM_POSITION_OPTIONS : STAFF_POSITION_OPTIONS;

  // Card 3 (Keamanan) state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordSaved, setIsPasswordSaved] = useState(false);

  React.useEffect(() => {
    setProfileName(currentUser.name);
    setProfileUsername(currentUser.username || '');
    setProfileEmail(currentUser.email);
    setProfilePosition(normalizePos(currentUser.position));
    setProfileAvatar(currentUser.avatar);
  }, [currentUser]);

  // Card 1 Handlers
  const handleSavePhoto = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentUser({
      ...currentUser,
      avatar: profileAvatar.trim()
    });
    setIsPhotoSaved(true);
    setTimeout(() => setIsPhotoSaved(false), 3000);
  };

  const handleFileChange = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Harap pilih file gambar (PNG, JPG).');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      alert('Ukuran file maksimal 2MB.');
      return;
    }
    const imageUrl = URL.createObjectURL(file);
    setProfileAvatar(imageUrl);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleRemovePhoto = () => {
    const defaultPlaceholder = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileName || 'User')}&background=111827&color=fff`;
    setProfileAvatar(defaultPlaceholder);
  };

  // Card 2 Handlers
  const handleSaveInfo = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateCurrentUser({
      ...currentUser,
      name: profileName.trim(),
      username: profileUsername.trim(),
      email: profileEmail.trim(),
      position: profilePosition.trim(),
      avatar: profileAvatar.trim()
    });
    setIsInfoSaved(true);
    setTimeout(() => setIsInfoSaved(false), 3000);
  };

  // Card 3 Handlers
  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    if (!currentPassword) {
      setPasswordError('Kata sandi saat ini wajib diisi.');
      return;
    }

    if (newPassword.length < 8) {
      setPasswordError('Kata sandi minimal 8 karakter');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Kata sandi tidak cocok');
      return;
    }

    setIsPasswordSaved(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setIsPasswordSaved(false), 3000);
  };

  // P18: EDIT PROFILE
  if (currentPage === 'P18') {
    return (
      <div className="p-8 space-y-6 max-w-4xl mx-auto font-sans select-none text-gray-900">
        
        {/* Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
          <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-black" /> Pengaturan Akun
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Kelola foto profil, informasi identitas akun, dan keamanan kata sandi Anda.
          </p>
        </div>

        {/* CARD 1 — Foto Profil */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Camera className="h-5 w-5 text-black" />
            <div>
              <h2 className="text-sm font-bold text-gray-950">Foto Profil</h2>
              <p className="text-xs text-gray-500">Foto ini akan tampil di navbar dan seluruh sistem.</p>
            </div>
          </div>

          {isPhotoSaved && (
            <div className="p-3 bg-morkhe-green/20 border border-morkhe-green text-morkhe-black font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-morkhe-green shrink-0" />
              <span>Foto profil berhasil diperbarui.</span>
            </div>
          )}

          <form onSubmit={handleSavePhoto} className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              {/* Left: Avatar Preview 96px */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <img
                  src={profileAvatar}
                  alt={profileName}
                  className="w-24 h-24 rounded-full border-2 border-gray-200 object-cover shadow-sm bg-gray-100"
                />
              </div>

              {/* Right: Upload Dropzone & Controls */}
              <div className="flex-1 space-y-3 w-full">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => e.target.files?.[0] && handleFileChange(e.target.files[0])}
                />

                {/* Primary Upload Dropzone */}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-1.5 ${
                    isDragging 
                      ? 'border-morkhe-black bg-gray-100' 
                      : 'border-gray-200 hover:border-gray-400 bg-gray-50/60 hover:bg-gray-50'
                  }`}
                >
                  <UploadCloud className="h-6 w-6 text-gray-500" />
                  <p className="text-xs font-semibold text-gray-800">Klik untuk unggah atau seret gambar</p>
                  <p className="text-[11px] text-gray-400">PNG, JPG (maks. 2MB)</p>
                </div>

                {/* Secondary controls: URL input toggle + Remove Photo */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowUrlInput(!showUrlInput)}
                    className="text-xs text-gray-500 hover:text-black font-medium underline flex items-center gap-1 cursor-pointer"
                  >
                    <LinkIcon className="h-3.5 w-3.5" />
                    {showUrlInput ? 'Sembunyikan URL gambar' : 'atau gunakan URL gambar'}
                  </button>

                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Hapus Foto
                  </button>
                </div>

                {showUrlInput && (
                  <div className="pt-2">
                    <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1">Tautan URL Gambar</label>
                    <input
                      type="text"
                      value={profileAvatar}
                      onChange={(e) => setProfileAvatar(e.target.value)}
                      placeholder="https://images.unsplash.com/..."
                      className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                id="btn-save-photo"
                type="submit"
                className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" /> Simpan Foto Profil
              </button>
            </div>
          </form>
        </div>

        {/* CARD 2 — Informasi Akun */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <User className="h-5 w-5 text-black" />
            <div>
              <h2 className="text-sm font-bold text-gray-950">Informasi Akun</h2>
              <p className="text-xs text-gray-500">Perbarui informasi akun dan identitas Anda di sistem.</p>
            </div>
          </div>

          {isInfoSaved && (
            <div className="p-3 bg-morkhe-green/20 border border-morkhe-green text-morkhe-black font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-morkhe-green shrink-0" />
              <span>Informasi akun berhasil diperbarui.</span>
            </div>
          )}

          <form onSubmit={handleSaveInfo} className="space-y-4">
            {/* Two-column form grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 1. Nama Lengkap */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Nama Lengkap</label>
                <input
                  id="edit-profile-name"
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white font-medium"
                  required
                />
              </div>

              {/* 2. Username */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Username</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-gray-400 font-bold select-none">@</span>
                  <input
                    id="edit-profile-username"
                    type="text"
                    value={profileUsername}
                    onChange={(e) => setProfileUsername(e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, ''))}
                    className="w-full text-xs pl-7 pr-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                    required
                  />
                </div>
              </div>

              {/* 3. Email Kerja (full width) */}
              <div className="space-y-1 md:col-span-2">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Email Kerja</label>
                <input
                  id="edit-profile-email"
                  type="email"
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                  required
                />
              </div>

              {/* 4. Peran (READ-ONLY badge) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Peran</label>
                <div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 border border-gray-200 text-gray-800 rounded-full text-xs font-semibold">
                    <Lock className="h-3.5 w-3.5 text-gray-500" />
                    {currentUser.role === 'PM' ? 'Project Manager (PM)' : 'Staf'}
                  </span>
                </div>
              </div>

              {/* 5. Posisi / Jabatan (select dropdown) */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Posisi / Jabatan</label>
                <select
                  id="edit-profile-position"
                  value={profilePosition}
                  onChange={(e) => setProfilePosition(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white cursor-pointer"
                >
                  {positionOptions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                  {!positionOptions.includes(profilePosition) && profilePosition && (
                    <option value={profilePosition}>{profilePosition}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                id="btn-save-info"
                type="submit"
                className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="h-4 w-4" /> Simpan Informasi Akun
              </button>
            </div>
          </form>
        </div>

        {/* CARD 3 — Keamanan */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-2 border-b border-gray-100 pb-4">
            <Key className="h-5 w-5 text-black" />
            <div>
              <h2 className="text-sm font-bold text-gray-950">Keamanan</h2>
              <p className="text-xs text-gray-500">Perbarui kata sandi akun Anda secara berkala untuk menjaga keamanan.</p>
            </div>
          </div>

          {isPasswordSaved && (
            <div className="p-3 bg-morkhe-green/20 border border-morkhe-green text-morkhe-black font-bold text-xs rounded-xl flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-morkhe-green shrink-0" />
              <span>Kata sandi berhasil diperbarui</span>
            </div>
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div className="space-y-3.5 max-w-md">
              {/* 1. Kata Sandi Saat Ini */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Kata Sandi Saat Ini</label>
                <div className="relative">
                  <input
                    id="current-password-input"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-3 pr-9 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* 2. Kata Sandi Baru */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    id="new-password-input"
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-3 pr-9 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-gray-400">Minimal 8 karakter</p>
                {passwordError === 'Kata sandi minimal 8 karakter' && (
                  <p className="text-xs text-red-600 font-semibold mt-1">{passwordError}</p>
                )}
              </div>

              {/* 3. Konfirmasi Kata Sandi Baru */}
              <div className="space-y-1">
                <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block">Konfirmasi Kata Sandi Baru</label>
                <div className="relative">
                  <input
                    id="confirm-password-input"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (passwordError) setPasswordError('');
                    }}
                    placeholder="••••••••••••"
                    className="w-full text-xs pl-3 pr-9 py-2 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordError === 'Kata sandi tidak cocok' && (
                  <p className="text-xs text-red-600 font-semibold mt-1">{passwordError}</p>
                )}
              </div>

              {passwordError && passwordError !== 'Kata sandi minimal 8 karakter' && passwordError !== 'Kata sandi tidak cocok' && (
                <p className="text-xs text-red-600 font-semibold">{passwordError}</p>
              )}
            </div>

            <div className="pt-3 border-t border-gray-100 flex justify-end">
              <button
                id="btn-change-password"
                type="submit"
                className="px-4 py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Key className="h-4 w-4" /> Ubah Kata Sandi
              </button>
            </div>
          </form>
        </div>

      </div>
    );
  }

  return null;
}

