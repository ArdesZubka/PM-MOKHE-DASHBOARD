/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, Trash2, X } from 'lucide-react';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDeleteModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel
}: ConfirmDeleteModalProps) {
  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 font-sans select-none text-gray-900 animate-fadeIn">
      <div 
        className="fixed inset-0" 
        onClick={onCancel} 
      />
      
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-center space-y-4 relative z-10 border border-gray-100">
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 p-1 rounded-full text-gray-400 hover:text-black hover:bg-gray-100 transition-all cursor-pointer"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto h-12 w-12 rounded-full bg-red-50 flex items-center justify-center text-red-600">
          <ShieldAlert className="h-6 w-6" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-bold text-gray-950">{title}</h2>
          <p className="text-xs text-gray-500 leading-relaxed px-2">
            {message}
          </p>
        </div>

        <div className="flex gap-3 pt-2">
          <button
            id="btn-cancel-delete"
            onClick={onCancel}
            className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full text-xs font-bold transition-all cursor-pointer"
          >
            Batal
          </button>
          <button
            id="btn-confirm-delete"
            onClick={onConfirm}
            className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Hapus</span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
