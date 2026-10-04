/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Settings, 
  Trash2, 
  CheckCheck,
  CheckCircle,
  ArrowLeft,
  Sliders,
  AtSign,
  Info
} from 'lucide-react';
import { Notification, NotificationSettings, Task, User, TaskReminderRule } from '../types';
import NotificationItem from '../components/NotificationItem';
import ConfirmDeleteModal from '../components/ConfirmDeleteModal';
import TaskReminderConfig from '../components/TaskReminderConfig';

interface NotificationPagesProps {
  currentPage: string;
  setCurrentPage?: (page: string) => void;
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  tasks: Task[];
  currentUser?: User;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll: () => void;
  onSaveSettings: (settings: NotificationSettings) => void;
  onOpenTaskDetail: (task: Task, initialTab?: 'subtasks' | 'comments' | 'logs') => void;
}

export default function NotificationPages({
  currentPage,
  setCurrentPage,
  notifications,
  notificationSettings,
  tasks,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSaveSettings,
  onOpenTaskDetail
}: NotificationPagesProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [showInfoTooltip, setShowInfoTooltip] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Filter mentions
  const isMentionNotification = (n: Notification) => {
    if (n.type === 'mention') return true;
    if (currentUser && n.mentionedUserId === currentUser.id) return true;
    return false;
  };

  const mentionNotifications = notifications.filter(isMentionNotification);
  const mentionUnreadCount = mentionNotifications.filter(n => !n.isRead).length;

  // Tab-filtered
  const tabFiltered = activeTab === 'all' ? notifications : mentionNotifications;

  // Unread-filtered
  const filteredNotifications = unreadOnly
    ? tabFiltered.filter(n => !n.isRead)
    : tabFiltered;

  // Handle setting updates
  const handleToggleSetting = (key: keyof NotificationSettings) => {
    onSaveSettings({
      ...notificationSettings,
      [key]: !notificationSettings[key]
    });
  };

  const handleUpdateReminders = (newReminders: TaskReminderRule[]) => {
    onSaveSettings({
      ...notificationSettings,
      taskReminders: newReminders
    });
  };

  const handleMarkAll = () => {
    if (onMarkAllAsRead) {
      onMarkAllAsRead();
    } else {
      notifications.forEach(n => {
        if (!n.isRead) onMarkAsRead(n.id);
      });
    }
  };

  // P13: NOTIFICATION CENTER (FULL PAGE ARCHIVE)
  if (currentPage === 'P13') {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto font-sans select-none text-gray-900">
        
        {/* Header Block */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-purple-50 text-morkhe-purple rounded-xl border border-purple-100 shrink-0">
              <Bell className="h-5 w-5" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-gray-950 tracking-tight flex items-center gap-2">
                Kotak Masuk Notifikasi
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
                  Arsip lengkap pemicu tenggat waktu tugas studio dan pemberitahuan sebutan tim (@mention).
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read-p13"
                onClick={handleMarkAll}
                className="px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-morkhe-purple rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border border-purple-200 whitespace-nowrap"
              >
                <CheckCheck className="h-4 w-4" /> Tandai Semua Dibaca
              </button>
            )}

            {notifications.length > 0 && (
              <button
                id="btn-clear-notifications"
                onClick={() => setShowClearConfirm(true)}
                className="px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
              >
                <Trash2 className="h-3.5 w-3.5 text-gray-500" /> Bersihkan Arsip
              </button>
            )}

            {setCurrentPage && (
              <button
                id="btn-nav-to-p14"
                onClick={() => setCurrentPage('P14')}
                className="px-3.5 py-2 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                title="Buka Pengaturan Notifikasi"
              >
                <Settings className="h-3.5 w-3.5" /> Pengaturan
              </button>
            )}
          </div>
        </div>

        {/* Modal Konfirmasi Hapus Semua Notifikasi */}
        <ConfirmDeleteModal
          isOpen={showClearConfirm}
          title="Bersihkan Semua Notifikasi"
          message="Yakin ingin menghapus semua notifikasi? Tindakan ini tidak bisa dibatalkan."
          onConfirm={() => {
            onClearAll();
            setShowClearConfirm(false);
          }}
          onCancel={() => setShowClearConfirm(false)}
        />

        {/* Tab switcher & unread filter bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 px-4 rounded-xl border border-gray-200">
          
          {/* Tabs: Semua | Disebut */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl">
            <button
              id="tab-p13-all"
              onClick={() => setActiveTab('all')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'all'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              <span>Semua Notifikasi</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'all' ? 'bg-gray-100 text-gray-900 font-bold' : 'bg-gray-200 text-gray-600'
              }`}>
                {notifications.length}
              </span>
            </button>

            <button
              id="tab-p13-mentions"
              onClick={() => setActiveTab('mentions')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'mentions'
                  ? 'bg-white text-gray-950 shadow-xs'
                  : 'text-gray-600 hover:text-gray-950'
              }`}
            >
              <AtSign className="h-3.5 w-3.5 text-morkhe-purple" />
              <span>Disebut</span>
              <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                activeTab === 'mentions' 
                  ? 'bg-purple-100 text-morkhe-purple font-bold' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {mentionNotifications.length}
              </span>
            </button>
          </div>

          {/* Filter options */}
          <div className="flex items-center gap-4 text-xs font-medium text-gray-600">
            <label className="flex items-center gap-2 cursor-pointer select-none font-semibold hover:text-gray-900">
              <input
                id="toggle-unread-p13"
                type="checkbox"
                checked={unreadOnly}
                onChange={(e) => setUnreadOnly(e.target.checked)}
                className="rounded border-gray-300 text-morkhe-purple focus:ring-morkhe-purple h-4 w-4 cursor-pointer accent-morkhe-purple"
              />
              <span>Tampilkan hanya yang belum dibaca</span>
            </label>

            <span className="text-gray-300">|</span>

            <span className="text-gray-500 text-xs">
              {filteredNotifications.length} notifikasi
            </span>
          </div>
        </div>

        {/* Full Notification Archive List */}
        <div className="bg-white rounded-2xl border border-gray-200 p-2 sm:p-3 overflow-hidden">
          {filteredNotifications.length === 0 ? (
            <div className="p-16 text-center text-gray-400 italic text-xs space-y-3">
              <CheckCircle className="h-10 w-10 text-green-500 mx-auto opacity-70" />
              <p className="text-sm font-semibold text-gray-700">
                {activeTab === 'mentions'
                  ? 'Belum ada sebutan akun (@mention) untuk Anda.'
                  : unreadOnly
                    ? 'Semua notifikasi dalam tampilan ini sudah dibaca.'
                    : 'Kotak masuk notifikasi bersih dan kosong!'}
              </p>
              <p className="text-xs text-gray-500 max-w-md mx-auto">
                {activeTab === 'mentions'
                  ? 'Saat rekan kerja menandai username Anda di kolom diskusi tugas, pemberitahuan akan terarsip di sini.'
                  : 'Semua tenggat waktu tugas studio berada dalam kondisi termonitor secara real-time.'}
              </p>
            </div>
          ) : (
            filteredNotifications.map((notif) => {
              const linkedTask = tasks.find(t => t.id === notif.taskId);
              return (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                  compact={false}
                  linkedTask={linkedTask}
                  onMarkAsRead={onMarkAsRead}
                  onOpenTaskDetail={onOpenTaskDetail}
                />
              );
            })
          )}
        </div>

      </div>
    );
  }

  // P14: NOTIFICATION SETTINGS (TETAP HALAMAN TERPISAH, TIDAK DI-RETIRE)
  if (currentPage === 'P14') {
    return (
      <div className="p-6 md:p-8 space-y-6 max-w-3xl mx-auto font-sans select-none text-gray-900">
        
        {/* Navigation & Header Block */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
          {setCurrentPage && (
            <button
              id="btn-back-to-p13"
              onClick={() => setCurrentPage('P13')}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-morkhe-purple transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" /> Kembali ke Pusat Notifikasi
            </button>
          )}

          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 text-gray-900 rounded-xl">
              <Sliders className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-950 tracking-tight">
                Konfigurasi Pengingat & Notifikasi
              </h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Kalibrasi waktu peringatan otomatis, ambang batas jatuh tempo, dan integrasi saluran keluar tim.
              </p>
            </div>
          </div>
        </div>

        {/* User Identity / Personal Notification Info */}
        {currentUser && (
          <div className="flex items-center justify-between px-4 py-3 bg-purple-50/60 rounded-xl border border-purple-100 text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <img src={currentUser.avatar} alt={currentUser.name} className="w-5 h-5 rounded-full object-cover" />
              <span>Pengaturan notifikasi ini bersifat <strong>personal</strong> untuk akun <strong>{currentUser.name}</strong> ({currentUser.role}).</span>
            </div>
          </div>
        )}

        {/* Task Reminder Configuration Block */}
        <TaskReminderConfig
          reminders={notificationSettings.taskReminders || [
            { id: 'rem-3d', daysBefore: 3 },
            { id: 'rem-due', daysBefore: 0 }
          ]}
          onChange={handleUpdateReminders}
        />

      </div>
    );
  }

  return null;
}
