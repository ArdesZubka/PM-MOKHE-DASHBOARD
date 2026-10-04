/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Bell, 
  Settings as GearIcon, 
  Trash2, 
  CheckCheck, 
  CheckCircle, 
  ArrowLeft,
  ExternalLink,
  AtSign
} from 'lucide-react';
import { Notification, NotificationSettings, Task, User, TaskReminderRule } from '../types';
import NotificationItem from './NotificationItem';
import ConfirmDeleteModal from './ConfirmDeleteModal';
import TaskReminderConfig from './TaskReminderConfig';

interface NotificationPopoverProps {
  notifications: Notification[];
  notificationSettings: NotificationSettings;
  tasks: Task[];
  currentUser?: User;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onClearAll: () => void;
  onSaveSettings: (settings: NotificationSettings) => void;
  onOpenTaskDetail: (task: Task, initialTab?: 'subtasks' | 'comments' | 'logs') => void;
  onNavigateToPage?: (page: string) => void;
}

export default function NotificationPopover({
  notifications,
  notificationSettings,
  tasks,
  currentUser,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSaveSettings,
  onOpenTaskDetail,
  onNavigateToPage
}: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'list' | 'settings'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'mentions'>('all');
  const [unreadOnly, setUnreadOnly] = useState(false);
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

  // Tab-filtered notifications
  const tabFiltered = activeTab === 'all' ? notifications : mentionNotifications;

  // Unread-filtered notifications
  const filteredNotifications = unreadOnly 
    ? tabFiltered.filter(n => !n.isRead) 
    : tabFiltered;

  // Limited to 8-10 latest items for popup preview
  const displayedNotifications = filteredNotifications.slice(0, 8);

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

  const handleNavigateToP13 = () => {
    setIsOpen(false);
    if (onNavigateToPage) {
      onNavigateToPage('P13');
    }
  };

  const handleNavigateToP14 = () => {
    setIsOpen(false);
    if (onNavigateToPage) {
      onNavigateToPage('P14');
    }
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

  return (
    <div className="relative font-sans">
      {/* Bell Trigger Icon */}
      <button
        id="btn-bell-trigger"
        onClick={() => {
          setIsOpen(!isOpen);
          setView('list'); // Default to list view on open
        }}
        className="p-2 text-gray-500 hover:text-black hover:bg-gray-100 rounded-full transition-all relative cursor-pointer"
        title="Pusat Notifikasi"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold h-4 min-w-4 px-1 rounded-full flex items-center justify-center leading-none ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Backdrop to close on click outside */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-40 bg-transparent"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Popover Window */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-[390px] sm:w-[420px] bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[560px]">
          
          {/* Header */}
          <div className="p-3.5 px-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
            {view === 'list' ? (
              <>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Notifikasi</h3>
                  {unreadCount > 0 ? (
                    <span className="bg-morkhe-purple text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {unreadCount} Baru
                    </span>
                  ) : (
                    <span className="text-[11px] text-gray-400 font-medium">
                      Semua sudah dibaca
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {unreadCount > 0 && (
                    <button
                      id="btn-mark-all-read-popover"
                      onClick={handleMarkAll}
                      className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-morkhe-purple transition-all cursor-pointer text-xs"
                      title="Tandai semua sudah dibaca"
                    >
                      <CheckCheck className="h-4 w-4" />
                    </button>
                  )}
                  {notifications.length > 0 && (
                    <button
                      id="btn-notif-clear"
                      onClick={() => setShowClearConfirm(true)}
                      className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-all cursor-pointer"
                      title="Bersihkan Semua Notifikasi"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    id="btn-notif-settings"
                    onClick={() => setView('settings')}
                    className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-gray-900 transition-all cursor-pointer"
                    title="Pengaturan Notifikasi"
                  >
                    <GearIcon className="h-4 w-4" />
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => setView('list')}
                  className="flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-gray-950 transition-all cursor-pointer"
                >
                  <ArrowLeft className="h-4 w-4" /> Kembali
                </button>
                <h3 className="text-xs font-bold text-gray-950 uppercase tracking-wider">Pengaturan Cepat</h3>
                <div className="w-6" />
              </>
            )}
          </div>

          {/* Tab switcher & unread toggle for List View */}
          {view === 'list' && (
            <div className="border-b border-gray-100 bg-gray-50/60 px-3.5 py-2 space-y-2 shrink-0">
              {/* Tabs: Semua | Disebut */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-xs">
                  <button
                    id="tab-popover-all"
                    onClick={() => setActiveTab('all')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'all' 
                        ? 'bg-white text-gray-950 shadow-xs' 
                        : 'text-gray-600 hover:text-gray-950'
                    }`}
                  >
                    <span>Semua</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      activeTab === 'all' ? 'bg-gray-100 text-gray-800' : 'bg-gray-300/80 text-gray-700'
                    }`}>
                      {notifications.length}
                    </span>
                  </button>

                  <button
                    id="tab-popover-mentions"
                    onClick={() => setActiveTab('mentions')}
                    className={`px-3 py-1 rounded-md font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'mentions' 
                        ? 'bg-white text-gray-950 shadow-xs' 
                        : 'text-gray-600 hover:text-gray-950'
                    }`}
                  >
                    <AtSign className="h-3 w-3" />
                    <span>Disebut</span>
                    {mentionNotifications.length > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        activeTab === 'mentions' 
                          ? 'bg-purple-100 text-morkhe-purple font-bold' 
                          : 'bg-gray-300/80 text-gray-700'
                      }`}>
                        {mentionNotifications.length}
                      </span>
                    )}
                  </button>
                </div>

                {/* Filter toggle "Hanya belum dibaca" */}
                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-gray-600 hover:text-gray-900 cursor-pointer select-none">
                  <input
                    id="toggle-unread-popover"
                    type="checkbox"
                    checked={unreadOnly}
                    onChange={(e) => setUnreadOnly(e.target.checked)}
                    className="rounded border-gray-300 text-morkhe-purple focus:ring-morkhe-purple h-3.5 w-3.5 cursor-pointer accent-morkhe-purple"
                  />
                  <span>Belum dibaca</span>
                </label>
              </div>
            </div>
          )}

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto min-h-[260px] max-h-[360px] divide-y divide-gray-50">
            {view === 'list' ? (
              /* --- LIST VIEW --- */
              displayedNotifications.length === 0 ? (
                <div className="p-10 text-center text-gray-400 italic text-xs space-y-2">
                  <CheckCircle className="h-8 w-8 text-green-500 mx-auto opacity-70" />
                  <p className="font-medium text-gray-600">
                    {activeTab === 'mentions' 
                      ? 'Tidak ada sebutan akun saat ini.' 
                      : unreadOnly 
                        ? 'Tidak ada notifikasi belum dibaca.' 
                        : 'Kotak notifikasi kosong!'}
                  </p>
                  <p className="text-[10px] text-gray-400">
                    {activeTab === 'mentions'
                      ? 'Saat anggota tim menandai Anda dengan @username, itu akan muncul di sini.'
                      : 'Semua tenggat waktu dan progres tugas dalam kondisi terpantau.'}
                  </p>
                </div>
              ) : (
                displayedNotifications.map((notif) => {
                  const linkedTask = tasks.find(t => t.id === notif.taskId);
                  return (
                    <NotificationItem
                      key={notif.id}
                      notification={notif}
                      compact={true}
                      linkedTask={linkedTask}
                      onMarkAsRead={onMarkAsRead}
                      onOpenTaskDetail={onOpenTaskDetail}
                      onCloseParent={() => setIsOpen(false)}
                    />
                  );
                })
              )
            ) : (
              /* --- SETTINGS VIEW --- */
              <div className="p-4 space-y-4 max-h-[420px] overflow-y-auto">
                <TaskReminderConfig
                  compact={true}
                  reminders={notificationSettings.taskReminders || [
                    { id: 'rem-3d', daysBefore: 3 },
                    { id: 'rem-due', daysBefore: 0 }
                  ]}
                  onChange={handleUpdateReminders}
                />

                {/* Direct CTA to P14 Full Page */}
                <div className="pt-1">
                  <button
                    id="btn-goto-p14"
                    onClick={handleNavigateToP14}
                    className="w-full py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>Buka Pengaturan Lengkap</span>
                    <ExternalLink className="h-3.5 w-3.5 text-gray-600" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Footer - Link to P13 Notification Center */}
          {view === 'list' && (
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-gray-500 font-medium">
                {displayedNotifications.length} dari {filteredNotifications.length} notifikasi
              </span>
              <button
                id="btn-view-all-notifications"
                onClick={handleNavigateToP13}
                className="text-xs font-bold text-morkhe-purple hover:text-purple-700 hover:underline flex items-center gap-1 cursor-pointer transition-colors"
              >
                <span>Lihat Semua di Pusat Notifikasi</span>
                <ExternalLink className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      )}
      {/* Modal Konfirmasi Hapus Semua Notifikasi */}
      <ConfirmDeleteModal
        isOpen={showClearConfirm}
        title="Bersihkan Semua Notifikasi"
        message="Yakin ingin menghapus semua notifikasi? Tindakan ini tidak bisa dibatalkan."
        onConfirm={() => {
          onClearAll();
          setShowClearConfirm(false);
          setIsOpen(false);
        }}
        onCancel={() => setShowClearConfirm(false)}
      />
    </div>
  );
}
