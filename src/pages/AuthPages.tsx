/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sparkles, LogIn, UserPlus, Key, Mail, AlertCircle, X, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';
import { DUMMY_CREDENTIALS } from '../data/dummy';
import logoMorkheStudio from '../../assets/logoMorkheStudio.png';
import assetAutentikasi from '../../assets/assetAutentikasi.jpg';

interface AuthPagesProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  users: User[];
  setCurrentUser: (user: User) => void;
  isSandboxMode?: boolean;
}

export default function AuthPages({
  currentPage,
  setCurrentPage,
  users,
  setCurrentUser,
  isSandboxMode = false
}: AuthPagesProps) {
  
  // Register form states
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regRole, setRegRole] = useState<'PM' | 'Staff'>('Staff');
  const [regPosition, setRegPosition] = useState('Graphic Designer');
  const [regNotice, setRegNotice] = useState('');

  // Login form states
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [loginError, setLoginError] = useState('');

  // Forgot password states
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotNotice, setForgotNotice] = useState('');

  // Quick log in utility for examiners: ONLY fills the form inputs with matching valid credentials
  // Tester MUST click "Masuk" to perform real validation and authentication
  const handleAutofill = (userId: string) => {
    const cred = DUMMY_CREDENTIALS.find(c => c.userId === userId);
    if (cred) {
      setLoginEmail(cred.email);
      setLoginPassword(cred.password);
      setLoginError('');
    }
  };

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const cleanEmail = loginEmail.trim().toLowerCase();
    const cleanPassword = loginPassword.trim();

    // Verifikasi kredensial asli terhadap DUMMY_CREDENTIALS
    const matchedCred = DUMMY_CREDENTIALS.find(
      c => c.email.toLowerCase() === cleanEmail && c.password === cleanPassword
    );

    if (!matchedCred) {
      const emailExists = DUMMY_CREDENTIALS.some(c => c.email.toLowerCase() === cleanEmail);
      if (emailExists) {
        setLoginError('Kata sandi yang Anda masukkan salah. Silakan periksa kembali.');
      } else {
        setLoginError('Email tidak terdaftar dalam sistem agensi Morkhē Studio.');
      }
      return;
    }

    const foundUser = users.find(u => u.id === matchedCred.userId || u.email.toLowerCase() === cleanEmail);
    if (foundUser) {
      setCurrentUser(foundUser);
      setLoginError('');
      localStorage.setItem('morkhe_is_authenticated', 'true');
      localStorage.setItem('morkhe_current_user', JSON.stringify(foundUser));
      
      if (foundUser.role === 'PM') {
        setCurrentPage('P04');
      } else {
        setCurrentPage('P05');
      }
    } else {
      setLoginError('Data profil pengguna tidak ditemukan dalam database agensi.');
    }
  };

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const sanitized = e.target.value.toLowerCase().replace(/[^a-z0-9._]/g, '');
    setRegUsername(sanitized);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegNotice('Pendaftaran akun baru tidak tersedia pada versi prototipe ini. Silakan gunakan akun demo yang telah disediakan.');
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setForgotNotice('Fitur reset kata sandi tidak tersedia pada versi prototipe ini.');
  };

  // Reusable split panel wrapper for P01, P02, P03
  const renderAuthLayout = (children: React.ReactNode, caption: string) => (
    <div className="min-h-full w-full flex flex-col lg:flex-row bg-[#F4F5FA] select-none text-morkhe-black font-sans">
      {/* Left Column (exact 50% width on desktop) */}
      <div className="w-full lg:w-1/2 min-h-screen flex flex-col justify-center items-center px-6 sm:px-8 md:px-10 lg:px-8 xl:px-12 py-8 lg:py-12 bg-[#F4F5FA] overflow-y-auto">
        <div className="w-full max-w-[480px]">
          {/* Top Logo and Wordmark */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <img src={logoMorkheStudio} alt="Morkhe Studio Logo" className="h-8 w-8 object-contain" />
            <span className="text-base font-bold text-gray-950 tracking-tight font-sans">Morkhē Studio</span>
          </div>
          {children}
        </div>
      </div>

      {/* Right Column (exact 50% width on desktop, hidden on <1024px) */}
      <div className="hidden lg:block lg:w-1/2 relative min-h-screen bg-gray-950 overflow-hidden select-none sticky top-0 h-screen">
        <img
          src={assetAutentikasi}
          alt="Ilustrasi Autentikasi Morkhē Studio"
          className="w-full h-full object-cover [object-position:center_30%]"
        />
        {/* Dark gradient overlay for caption contrast */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent pointer-events-none" />
        
        {/* Bottom Caption */}
        <div className="absolute bottom-0 left-0 right-0 p-8 xl:p-12 z-10 space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md border border-white/20 text-white text-[11px] font-medium tracking-wide">
            Morkhē Studio
          </div>
          <p className="text-white text-lg xl:text-xl font-bold leading-snug drop-shadow-md">
            {caption}
          </p>
        </div>
      </div>
    </div>
  );

  // P01: REGISTER
  if (currentPage === 'P01') {
    return renderAuthLayout(
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs p-6 sm:p-7 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-gray-950 tracking-tight">Buat Akun Agensi</h1>
          <p className="text-[11px] text-gray-500">Daftar untuk mengakses sistem manajemen proyek Morkhē Studio</p>
        </div>

        {regNotice && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{regNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setRegNotice('')}
              className="text-amber-500 hover:text-amber-800 p-0.5 rounded cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
          {/* Baris 1: Nama Lengkap | Username */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Nama Lengkap</label>
              <input
                type="text"
                placeholder="Hafidz Ardis S."
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Username</label>
              <div className="relative flex items-center">
                <span className="absolute left-2.5 text-xs text-gray-400 font-bold select-none">@</span>
                <input
                  type="text"
                  placeholder="hafidzardis"
                  value={regUsername}
                  onChange={handleUsernameChange}
                  className="w-full text-xs pl-6 pr-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          {/* Baris 2: Email (full width) */}
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Email</label>
            <input
              type="email"
              placeholder="hafidz.ardis@morkhestudio.com"
              value={regEmail}
              onChange={(e) => setRegEmail(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
              required
            />
          </div>

          {/* Baris 3: Pilihan Peran | Posisi / Jabatan */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Pilihan Peran</label>
              <select
                value={regRole}
                onChange={(e) => {
                  const newRole = e.target.value as 'PM' | 'Staff';
                  setRegRole(newRole);
                  setRegPosition(newRole === 'PM' ? 'Founder & CEO' : 'Graphic Designer');
                }}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white cursor-pointer"
              >
                <option value="PM">Project Manager</option>
                <option value="Staff">Staf</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Posisi / Jabatan</label>
              <select
                value={regPosition}
                onChange={(e) => setRegPosition(e.target.value)}
                className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white cursor-pointer"
              >
                {regRole === 'PM' ? (
                  <>
                    <option value="Founder & CEO">Founder & CEO</option>
                    <option value="CFO">CFO</option>
                    <option value="CMO">CMO</option>
                  </>
                ) : (
                  <>
                    <option value="Graphic Designer">Graphic Designer</option>
                    <option value="Photographer">Photographer</option>
                    <option value="Videographer">Videographer</option>
                    <option value="Sosmed Analyst & Strategist">Sosmed Analyst & Strategist</option>
                    <option value="Copywriter & SEO">Copywriter & SEO</option>
                    <option value="Finance">Finance</option>
                  </>
                )}
              </select>
            </div>
          </div>

          {/* Baris 4: Kata Sandi | Konfirmasi Kata Sandi */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Kata Sandi</label>
              <div className="relative">
                <input
                  id="reg-pass-input"
                  type={showRegPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full text-xs pl-2.5 pr-8 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                  required
                />
                <button
                  type="button"
                  id="toggle-reg-password"
                  onClick={() => setShowRegPassword(!showRegPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center"
                  tabIndex={-1}
                  title={showRegPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showRegPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Konfirmasi Kata Sandi</label>
              <div className="relative">
                <input
                  id="reg-confirm-pass-input"
                  type={showRegConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={regConfirmPassword}
                  onChange={(e) => setRegConfirmPassword(e.target.value)}
                  className="w-full text-xs pl-2.5 pr-8 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                  required
                />
                <button
                  type="button"
                  id="toggle-reg-confirm-password"
                  onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center"
                  tabIndex={-1}
                  title={showRegConfirmPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showRegConfirmPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <button
            id="btn-register-submit"
            type="submit"
            className="w-full py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <UserPlus className="h-3.5 w-3.5" /> Daftar
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-500">Sudah punya akun? </span>
          <button
            id="link-to-login"
            type="button"
            onClick={() => {
              setRegNotice('');
              setLoginError('');
              setCurrentPage('P02');
            }}
            className="font-bold text-morkhe-purple hover:underline cursor-pointer"
          >
            Masuk
          </button>
        </div>
      </div>,
      "Satu platform, semua proyek kreatif Morkhē Studio."
    );
  }

  // P02: LOGIN
  if (currentPage === 'P02') {
    return renderAuthLayout(
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs p-6 sm:p-7 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-gray-950 tracking-tight">Portal Morkhē Studio</h1>
          <p className="text-[11px] text-gray-500">Masuk untuk mengatur konten digital dan grafis</p>
        </div>

        {/* Quick Demo Autofill helper for thesis defense examiners - only visible in dev / sandbox mode */}
        {isSandboxMode && (
          <div className="bg-morkhe-white border border-gray-200 p-2.5 rounded-lg space-y-1.5">
            <div className="flex items-center gap-1.5 text-morkhe-black font-bold text-[11px]">
              <Sparkles className="h-3 w-3 text-morkhe-purple animate-pulse" /> AUTOFILL DEMO PENGUJI:
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-autofill-pm"
                type="button"
                onClick={() => handleAutofill('USR01')}
                className="py-1 px-2 bg-[#161B1E] text-[#CCF779] hover:bg-opacity-90 font-bold rounded-full text-[10px] transition-all cursor-pointer"
              >
                PM (Hafidz Ardis)
              </button>
              <button
                id="btn-autofill-staff"
                type="button"
                onClick={() => handleAutofill('USR02')}
                className="py-1 px-2 bg-[#320E3B] text-[#F4F5FA] hover:bg-opacity-95 font-bold rounded-full text-[10px] transition-all cursor-pointer"
              >
                Staf (Aditya Nur)
              </button>
            </div>
          </div>
        )}

        {loginError && (
          <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 text-[11px] rounded-lg flex items-center gap-1.5">
            <AlertCircle className="h-3.5 w-3.5 text-red-500 shrink-0" />
            <span>{loginError}</span>
          </div>
        )}

        <form onSubmit={handleLoginSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Email</label>
            <input
              id="login-email-input"
              type="email"
              placeholder="hafidz.ardis@morkhestudio.com"
              value={loginEmail}
              onChange={(e) => setLoginEmail(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
              required
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Kata Sandi</label>
              <button
                id="link-to-forgot"
                type="button"
                onClick={() => {
                  setLoginError('');
                  setForgotNotice('');
                  setCurrentPage('P03');
                }}
                className="text-[10px] text-morkhe-purple hover:underline cursor-pointer"
              >
                Lupa Kata Sandi?
              </button>
            </div>
            <div className="relative">
              <input
                id="login-pass-input"
                type={showLoginPassword ? 'text' : 'password'}
                placeholder="••••••••••••"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full text-xs pl-2.5 pr-8 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                required
              />
              <button
                type="button"
                id="toggle-login-password"
                onClick={() => setShowLoginPassword(!showLoginPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center"
                tabIndex={-1}
                title={showLoginPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
              >
                {showLoginPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
          </div>

          <button
            id="btn-login-submit"
            type="submit"
            className="w-full py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <LogIn className="h-3.5 w-3.5" /> Masuk
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs">
          <span className="text-gray-500">Belum punya akun? </span>
          <button
            id="link-to-register"
            type="button"
            onClick={() => {
              setLoginError('');
              setRegNotice('');
              setCurrentPage('P01');
            }}
            className="font-bold text-morkhe-purple hover:underline cursor-pointer"
          >
            Daftar di Sini
          </button>
        </div>
      </div>,
      "Satu platform, semua proyek kreatif Morkhē Studio."
    );
  }

  // P03: FORGOT PASSWORD
  if (currentPage === 'P03') {
    return renderAuthLayout(
      <div className="w-full bg-white border border-gray-200 rounded-2xl shadow-xs p-6 sm:p-7 space-y-4">
        <div className="text-center space-y-1">
          <h1 className="text-lg font-bold text-gray-950 tracking-tight">Atur Ulang Kata Sandi</h1>
          <p className="text-[11px] text-gray-500">Masukkan email akun Anda untuk menerima tautan atur ulang kata sandi</p>
        </div>

        {forgotNotice && (
          <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-900 text-[11px] rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
              <span>{forgotNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setForgotNotice('')}
              className="text-amber-500 hover:text-amber-800 p-0.5 rounded cursor-pointer"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        <form onSubmit={handleForgotSubmit} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Email</label>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2 h-3.5 w-3.5 text-gray-400" />
              <input
                id="forgot-email-input"
                type="email"
                placeholder="hafidz.ardis@morkhestudio.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                className="w-full text-xs pl-8 pr-2.5 py-1.5 border border-gray-250 rounded-lg focus:outline-none focus:border-black text-gray-800 bg-white"
                required
              />
            </div>
          </div>

          <button
            id="btn-forgot-submit"
            type="submit"
            className="w-full py-2 bg-morkhe-purple hover:bg-morkhe-purple-dark text-morkhe-white rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer mt-1"
          >
            <Key className="h-3.5 w-3.5" /> Kirim Link Reset
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100 text-xs">
          <button
            id="link-back-to-login"
            type="button"
            onClick={() => {
              setForgotNotice('');
              setLoginError('');
              setCurrentPage('P02');
            }}
            className="text-gray-500 hover:text-morkhe-purple font-semibold cursor-pointer"
          >
            ← Kembali ke Login
          </button>
        </div>
      </div>,
      "Satu platform, semua proyek kreatif Morkhē Studio."
    );
  }

  return null;
}
