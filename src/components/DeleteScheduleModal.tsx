import React, { useState } from 'react';
import { X, Trash2, AlertTriangle, RefreshCw, Calendar, Clock, UserX } from 'lucide-react';
import { ExamScheduleSlot } from '../types';

interface DeleteScheduleModalProps {
  slots: ExamScheduleSlot[];
  onConfirmDelete: (mode: 'ALL' | 'BY_DAY' | 'BY_SESSION' | 'CLEAR_INVIGILATORS', param?: string | number) => void;
  onClose: () => void;
}

export const DeleteScheduleModal: React.FC<DeleteScheduleModalProps> = ({
  slots,
  onConfirmDelete,
  onClose,
}) => {
  const [deleteMode, setDeleteMode] = useState<'ALL' | 'BY_DAY' | 'BY_SESSION' | 'CLEAR_INVIGILATORS'>('ALL');
  const [selectedDay, setSelectedDay] = useState<string>('');
  const [selectedSession, setSelectedSession] = useState<number>(1);
  const [isConfirmed, setIsConfirmed] = useState(false);

  // Extract unique days
  const uniqueDays = Array.from(new Set(slots.map((s) => s.dateStr)));
  const uniqueSessions = Array.from(new Set(slots.map((s) => s.sessionIndex)));

  const handleExecute = () => {
    if (deleteMode === 'BY_DAY') {
      onConfirmDelete('BY_DAY', selectedDay || uniqueDays[0]);
    } else if (deleteMode === 'BY_SESSION') {
      onConfirmDelete('BY_SESSION', Number(selectedSession));
    } else {
      onConfirmDelete(deleteMode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Menu Hapus & Sinkronisasi Jadwal</h3>
              <p className="text-xs text-slate-500">Pilih opsi penghapusan data jadwal secara aman</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-3 mt-4 text-xs">
          {/* Option 1: Delete All */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              deleteMode === 'ALL'
                ? 'bg-rose-50/70 border-rose-300 text-rose-950 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="deleteMode"
              checked={deleteMode === 'ALL'}
              onChange={() => setDeleteMode('ALL')}
              className="mt-0.5 text-rose-600"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span className="font-bold">Hapus Seluruh Jadwal (Reset Total)</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Menghapus semua {slots.length} sesi ujian dan penugasan pengawas secara permanen.
              </p>
            </div>
          </label>

          {/* Option 2: Delete by Day */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              deleteMode === 'BY_DAY'
                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="deleteMode"
              checked={deleteMode === 'BY_DAY'}
              onChange={() => setDeleteMode('BY_DAY')}
              className="mt-0.5 text-indigo-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold">Hapus Jadwal pada Hari Tertentu</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5 mb-2">
                Hapus hanya sesi pada tanggal tertentu (misal jadwal hari Jumat).
              </p>

              {deleteMode === 'BY_DAY' && (
                <select
                  value={selectedDay || uniqueDays[0]}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-normal"
                >
                  {uniqueDays.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          {/* Option 3: Delete by Session */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              deleteMode === 'BY_SESSION'
                ? 'bg-indigo-50/70 border-indigo-300 text-indigo-950 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="deleteMode"
              checked={deleteMode === 'BY_SESSION'}
              onChange={() => setDeleteMode('BY_SESSION')}
              className="mt-0.5 text-indigo-600"
            />
            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                <span className="font-bold">Hapus Jadwal pada Sesi Tertentu</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5 mb-2">
                Hapus semua ruangan untuk Sesi tertentu di semua hari.
              </p>

              {deleteMode === 'BY_SESSION' && (
                <select
                  value={selectedSession}
                  onChange={(e) => setSelectedSession(Number(e.target.value))}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-indigo-200 bg-white text-xs font-normal"
                >
                  {uniqueSessions.map((s) => (
                    <option key={s} value={s}>
                      Sesi {s}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </label>

          {/* Option 4: Clear Invigilators Only */}
          <label
            className={`flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer ${
              deleteMode === 'CLEAR_INVIGILATORS'
                ? 'bg-amber-50/70 border-amber-300 text-amber-950 font-semibold'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <input
              type="radio"
              name="deleteMode"
              checked={deleteMode === 'CLEAR_INVIGILATORS'}
              onChange={() => setDeleteMode('CLEAR_INVIGILATORS')}
              className="mt-0.5 text-amber-600"
            />
            <div>
              <div className="flex items-center gap-1.5">
                <UserX className="w-3.5 h-3.5 text-amber-600" />
                <span className="font-bold">Kosongkan Hanya Penugasan Pengawas</span>
              </div>
              <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                Mempertahankan susunan waktu, ruang, dan mata pelajaran, namun mengosongkan nama pengawas untuk dilakukan alokasi ulang.
              </p>
            </div>
          </label>
        </div>

        {/* Confirmation check */}
        <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200">
          <label className="flex items-center gap-2 text-xs font-semibold text-slate-800 cursor-pointer">
            <input
              id="confirm-delete-checkbox"
              type="checkbox"
              checked={isConfirmed}
              onChange={(e) => setIsConfirmed(e.target.checked)}
              className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
            />
            <span>Saya menyetujui sinkronisasi penghapusan data jadwal ini</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 mt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            Batal
          </button>
          <button
            id="execute-delete-btn"
            type="button"
            disabled={!isConfirmed}
            onClick={handleExecute}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Eksekusi Penghapusan</span>
          </button>
        </div>
      </div>
    </div>
  );
};
