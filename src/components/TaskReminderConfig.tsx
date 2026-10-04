/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Plus, X, Bell } from 'lucide-react';
import { TaskReminderRule } from '../types';

interface TaskReminderConfigProps {
  reminders: TaskReminderRule[];
  onChange: (newReminders: TaskReminderRule[]) => void;
  compact?: boolean;
}

export default function TaskReminderConfig({
  reminders,
  onChange,
  compact = false
}: TaskReminderConfigProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Update a specific reminder's daysBefore value
  const handleUpdateDays = (id: string, newDays: number) => {
    const sanitized = Math.max(0, Math.min(90, isNaN(newDays) ? 1 : newDays));
    const updated = reminders.map(r => r.id === id ? { ...r, daysBefore: sanitized } : r);
    onChange(updated);
  };

  // Delete a reminder rule
  const handleDelete = (id: string) => {
    const updated = reminders.filter(r => r.id !== id);
    onChange(updated);
  };

  // Add a reminder: specific days before
  const handleAddDaysBefore = (days: number = 1) => {
    const newId = `rem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const updated = [...reminders, { id: newId, daysBefore: days }];
    onChange(updated);
    setShowAddMenu(false);
  };

  // Add a reminder: On due day (Hari-H)
  const handleAddDueDay = () => {
    // If already has Hari-H, do not duplicate
    if (reminders.some(r => r.daysBefore === 0)) {
      setShowAddMenu(false);
      return;
    }
    const newId = `rem-due-${Date.now()}`;
    const updated = [...reminders, { id: newId, daysBefore: 0 }];
    onChange(updated);
    setShowAddMenu(false);
  };

  // Check if Hari-H is already present
  const hasDueDay = reminders.some(r => r.daysBefore === 0);

  return (
    <div className={`rounded-2xl border border-gray-200 bg-white ${compact ? 'p-3.5 space-y-3' : 'p-5 md:p-6 space-y-4'} shadow-2xs`}>
      {/* Header Block according to image.png reference */}
      <div>
        <div className="flex items-center justify-between">
          <h3 className={`${compact ? 'text-xs' : 'text-sm'} font-bold text-gray-900 flex items-center gap-2`}>
            <Bell className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-gray-700`} />
            Pengingat tugas
          </h3>
        </div>
        <p className="text-[11px] text-gray-500 mt-0.5">
          Default terisi otomatis, bisa ditambah atau dihapus per tugas.
        </p>
      </div>

      {/* List of active reminder rules */}
      <div className="space-y-2.5">
        {reminders.length === 0 ? (
          <div className="py-3 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center">
            <p className="text-[11px] text-gray-400 font-medium">Belum ada pengingat tugas aktif.</p>
          </div>
        ) : (
          reminders.map((rule) => {
            const isDueDay = rule.daysBefore === 0;

            if (isDueDay) {
              return (
                <div
                  key={rule.id}
                  id={`reminder-rule-${rule.id}`}
                  className="flex items-center justify-between px-3.5 py-2.5 bg-gray-50/90 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-900 tracking-tight">
                      Pada hari-H
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium bg-gray-200/60 px-1.5 py-0.5 rounded">
                      (0 hari)
                    </span>
                  </div>
                  <button
                    type="button"
                    id={`btn-delete-reminder-${rule.id}`}
                    onClick={() => handleDelete(rule.id)}
                    title="Hapus pengingat ini"
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            }

            return (
              <div
                key={rule.id}
                id={`reminder-rule-${rule.id}`}
                className="flex items-center justify-between gap-2 px-3.5 py-2 bg-gray-50/90 hover:bg-gray-50 rounded-xl border border-gray-200/80 transition-colors"
              >
                <div className="flex items-center gap-2 flex-1">
                  {/* Number input for days before */}
                  <div className="relative">
                    <input
                      id={`input-reminder-days-${rule.id}`}
                      type="number"
                      min={1}
                      max={90}
                      value={rule.daysBefore}
                      onChange={(e) => handleUpdateDays(rule.id, parseInt(e.target.value, 10))}
                      className="w-16 h-8 px-2 text-xs font-bold text-gray-900 bg-white border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-black focus:border-black shadow-2xs"
                    />
                  </div>

                  {/* Fixed label text (no dropdown as requested) */}
                  <span className="text-xs font-medium text-gray-700 bg-white border border-gray-200/80 px-2.5 py-1.5 rounded-lg shadow-2xs">
                    hari sebelum
                  </span>
                </div>

                {/* Delete button */}
                <button
                  type="button"
                  id={`btn-delete-reminder-${rule.id}`}
                  onClick={() => handleDelete(rule.id)}
                  title="Hapus pengingat ini"
                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Reminder CTA Block with Quick Options */}
      <div className="pt-1">
        {!showAddMenu ? (
          <button
            type="button"
            id="btn-add-reminder"
            onClick={() => setShowAddMenu(true)}
            className="w-full sm:w-auto px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold rounded-xl border border-gray-200 hover:border-gray-300 shadow-2xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5 text-gray-600" />
            <span>Tambah pengingat</span>
          </button>
        ) : (
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Pilih Jenis Pengingat:
              </span>
              <button
                type="button"
                onClick={() => setShowAddMenu(false)}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {!hasDueDay && (
                <button
                  type="button"
                  id="btn-add-option-due"
                  onClick={handleAddDueDay}
                  className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-gray-900 hover:text-morkhe-purple border border-gray-200 hover:border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                >
                  Pada hari-H
                </button>
              )}
              <button
                type="button"
                id="btn-add-option-1d"
                onClick={() => handleAddDaysBefore(1)}
                className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-gray-900 hover:text-morkhe-purple border border-gray-200 hover:border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                1 hari sebelum
              </button>
              <button
                type="button"
                id="btn-add-option-3d"
                onClick={() => handleAddDaysBefore(3)}
                className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-gray-900 hover:text-morkhe-purple border border-gray-200 hover:border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                3 hari sebelum
              </button>
              <button
                type="button"
                id="btn-add-option-7d"
                onClick={() => handleAddDaysBefore(7)}
                className="px-2.5 py-1.5 bg-white hover:bg-purple-50 text-gray-900 hover:text-morkhe-purple border border-gray-200 hover:border-purple-200 rounded-lg text-xs font-bold transition-colors cursor-pointer"
              >
                7 hari sebelum
              </button>
              <button
                type="button"
                id="btn-add-option-custom"
                onClick={() => handleAddDaysBefore(2)}
                className="px-2.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-lg text-xs font-medium transition-colors cursor-pointer"
              >
                + Kustom Hari
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
