/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  AlertTriangle, 
  Clock, 
  Calendar, 
  Info, 
  AtSign,
  ArrowRight,
  Check
} from 'lucide-react';
import { Notification, Task } from '../types';
import { formatShortDate } from '../utils/dateFormat';

interface NotificationItemProps {
  key?: string;
  notification: Notification;
  compact?: boolean;
  linkedTask?: Task;
  onMarkAsRead: (id: string) => void;
  onOpenTaskDetail?: (task: Task, initialTab?: 'subtasks' | 'comments' | 'logs') => void;
  onCloseParent?: () => void;
}

export default function NotificationItem({
  notification,
  compact = false,
  linkedTask,
  onMarkAsRead,
  onOpenTaskDetail,
  onCloseParent
}: NotificationItemProps) {
  const isUnread = !notification.isRead;

  // Format relative or readable timestamp
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins} mnt lalu`;
      if (diffHours < 24) return `${diffHours} jam lalu`;
      if (diffDays === 1) return 'Kemarin';
      if (diffDays < 7) return `${diffDays} hari lalu`;
      return formatShortDate(isoString);
    } catch {
      return '';
    }
  };

  // Render type tag
  const renderTypeBadge = () => {
    switch (notification.type) {
      case 'deadline_due':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-red-100 text-red-700 tracking-tight">
            Jatuh Tempo
          </span>
        );
      case 'deadline_1d':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-100 text-amber-800 tracking-tight">
            H-1 Tenggat
          </span>
        );
      case 'deadline_3d':
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-blue-100 text-blue-800 tracking-tight">
            H-3 Tenggat
          </span>
        );
      case 'mention':
        return (
          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-100 text-morkhe-purple tracking-tight">
            <AtSign className="h-2.5 w-2.5" /> Disebut
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-700 tracking-tight">
            Sistem
          </span>
        );
    }
  };

  // Render left visual icon/avatar
  const renderVisualIcon = () => {
    if (notification.type === 'mention') {
      return (
        <div className="relative shrink-0">
          {notification.authorAvatar ? (
            <img
              src={notification.authorAvatar}
              alt={notification.authorName || 'User'}
              className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-full object-cover border border-purple-200`}
            />
          ) : (
            <div className={`${compact ? 'w-7 h-7' : 'w-9 h-9'} rounded-full bg-purple-100 text-morkhe-purple flex items-center justify-center font-bold text-xs`}>
              <AtSign className="h-4 w-4" />
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 bg-morkhe-purple text-white rounded-full p-0.5 ring-1 ring-white">
            <AtSign className="h-2 w-2" />
          </div>
        </div>
      );
    }

    if (notification.type === 'deadline_due') {
      return (
        <div className={`shrink-0 ${compact ? 'p-1.5' : 'p-2.5'} bg-red-50 text-red-600 rounded-xl border border-red-100 flex items-center justify-center`}>
          <AlertTriangle className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-red-600`} />
        </div>
      );
    }

    if (notification.type === 'deadline_1d') {
      return (
        <div className={`shrink-0 ${compact ? 'p-1.5' : 'p-2.5'} bg-amber-50 text-amber-600 rounded-xl border border-amber-100 flex items-center justify-center`}>
          <Clock className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-amber-600`} />
        </div>
      );
    }

    if (notification.type === 'deadline_3d') {
      return (
        <div className={`shrink-0 ${compact ? 'p-1.5' : 'p-2.5'} bg-blue-50 text-blue-600 rounded-xl border border-blue-100 flex items-center justify-center`}>
          <Calendar className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-blue-600`} />
        </div>
      );
    }

    return (
      <div className={`shrink-0 ${compact ? 'p-1.5' : 'p-2.5'} bg-gray-100 text-gray-700 rounded-xl border border-gray-200 flex items-center justify-center`}>
        <Info className={`${compact ? 'h-4 w-4' : 'h-5 w-5'} text-gray-600`} />
      </div>
    );
  };

  // Format message to highlight @mentions if present
  const renderMessage = (text: string) => {
    const mentionRegex = /(@[\w.-]+)/g;
    const parts = text.split(mentionRegex);

    return parts.map((part, i) => {
      if (part.startsWith('@')) {
        return (
          <span key={i} className="font-bold text-morkhe-purple bg-purple-50 px-1 py-0.5 rounded">
            {part}
          </span>
        );
      }
      return part;
    });
  };

  const handleTaskClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (linkedTask && onOpenTaskDetail) {
      if (isUnread) {
        onMarkAsRead(notification.id);
      }
      onOpenTaskDetail(linkedTask);
      if (onCloseParent) {
        onCloseParent();
      }
    }
  };

  return (
    <div
      className={`group transition-all duration-200 select-none relative ${
        compact 
          ? 'p-3 flex gap-2.5 border-b border-gray-100 last:border-b-0' 
          : 'p-4 sm:p-5 flex gap-3.5 sm:gap-4 border-b border-gray-100 last:border-b-0 rounded-xl mb-1.5'
      } ${
        isUnread 
          ? 'bg-purple-50/40 hover:bg-purple-50/75 border-l-3 border-l-morkhe-purple' 
          : 'bg-white opacity-70 hover:opacity-100 hover:bg-gray-50/60'
      }`}
    >
      {/* Unread indicator dot */}
      {isUnread && (
        <div className="absolute top-3.5 right-3 flex items-center gap-1">
          <span className="h-2 w-2 rounded-full bg-morkhe-purple animate-pulse" title="Belum dibaca" />
        </div>
      )}

      {/* Left visual icon or avatar */}
      <div className="mt-0.5">
        {renderVisualIcon()}
      </div>

      {/* Main text content */}
      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center flex-wrap gap-1.5 pr-4">
          {renderTypeBadge()}
          <h4 className={`text-gray-950 truncate ${
            compact ? 'text-xs' : 'text-sm'
          } ${
            isUnread ? 'font-bold' : 'font-medium text-gray-700'
          }`}>
            {notification.title}
          </h4>
          <span className="text-[10px] text-gray-400 font-medium ml-auto shrink-0">
            {formatTime(notification.timestamp)}
          </span>
        </div>

        <p className={`text-gray-600 leading-relaxed ${
          compact ? 'text-[11px] line-clamp-2' : 'text-xs sm:text-[13px]'
        }`}>
          {renderMessage(notification.message)}
        </p>

        {/* Task contextual link & action buttons */}
        <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
          {linkedTask ? (
            <button
              onClick={handleTaskClick}
              className={`inline-flex items-center gap-1 font-bold text-morkhe-black hover:text-morkhe-purple hover:underline cursor-pointer transition-colors ${
                compact ? 'text-[10px]' : 'text-xs'
              }`}
            >
              <span>Selesaikan Konteks Papan Tugas</span>
              <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <div />
          )}

          {/* Quick Mark as Read button */}
          {isUnread && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onMarkAsRead(notification.id);
              }}
              className={`inline-flex items-center gap-1 text-gray-400 hover:text-morkhe-purple font-semibold hover:underline cursor-pointer transition-colors ml-auto ${
                compact ? 'text-[10px]' : 'text-xs'
              }`}
              title="Tandai notifikasi ini sudah dibaca"
            >
              <Check className="h-3 w-3" />
              <span>Tandai Dibaca</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
