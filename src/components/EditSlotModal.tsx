import React, { useState, useMemo } from 'react';
import { X, Check, AlertTriangle, ShieldCheck, User, MapPin, Clock, BookOpen, Layers } from 'lucide-react';
import { ExamScheduleSlot, Teacher, Subject, ClassRoom, ExamRoom, ExamTimeConfig } from '../types';

interface EditSlotModalProps {
  slot: ExamScheduleSlot;
  allSlots: ExamScheduleSlot[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassRoom[];
  rooms: ExamRoom[];
  config: ExamTimeConfig;
  onSave: (updatedSlot: ExamScheduleSlot) => void;
  onClose: () => void;
}

export const EditSlotModal: React.FC<EditSlotModalProps> = ({
  slot,
  allSlots,
  teachers,
  subjects,
  classes,
  rooms,
  config,
  onSave,
  onClose,
}) => {
  const [formData, setFormData] = useState<ExamScheduleSlot>({ ...slot });

  // Find target class object
  const currentClass = classes.find((c) => formData.classIds.includes(c.id)) || classes[0];

  // Helper to audit conflict for any candidate teacher in this slot
  const checkTeacherConflict = (teacherId: string, role: 'p1' | 'p2') => {
    if (!teacherId) return { level: 'ok', message: 'Belum dipilih' };

    const teacher = teachers.find((t) => t.id === teacherId);
    if (!teacher) return { level: 'ok', message: '' };

    // 1. Check double-booked in same date & session across other rooms
    const otherSlotsSameSession = allSlots.filter(
      (s) =>
        s.id !== formData.id &&
        s.dateStr === formData.dateStr &&
        s.sessionIndex === formData.sessionIndex
    );
    const isDoubleBooked = otherSlotsSameSession.some(
      (s) => s.invigilator1Id === teacherId || s.invigilator2Id === teacherId
    );
    if (isDoubleBooked) {
      return {
        level: 'error',
        message: `${teacher.name} sedang ditugaskan di ruangan lain pada sesi ini!`,
      };
    }

    // 2. Check subject conflict (Guru mengajar mapel tsb)
    const teachesSubject = teacher.subjects.some(
      (sub) =>
        sub.toLowerCase().includes(formData.subjectName.toLowerCase()) ||
        formData.subjectName.toLowerCase().includes(sub.toLowerCase())
    );
    if (teachesSubject && config.preventTeachingSubjectConflict) {
      return {
        level: 'warning',
        message: `Peringatan: ${teacher.name} adalah guru pengampu mata pelajaran ${formData.subjectName}.`,
      };
    }

    // 3. Check class conflict (Guru mengajar di kelas ini)
    if (currentClass) {
      const teachesClass = teacher.classesTaught.some(
        (ct) =>
          ct.toLowerCase() === currentClass.name.toLowerCase() ||
          ct.replace('-', '').toLowerCase() === currentClass.name.replace('-', '').toLowerCase()
      );
      if (teachesClass && config.preventTeachingClassConflict) {
        return {
          level: 'info',
          message: `Catatan: ${teacher.name} mengajar di kelas ${currentClass.name}.`,
        };
      }
    }

    return {
      level: 'safe',
      message: `Aman & Memenuhi Kriteria (Bebas Konflik)`,
    };
  };

  const conflictP1 = useMemo(() => checkTeacherConflict(formData.invigilator1Id || '', 'p1'), [
    formData.invigilator1Id,
    formData.subjectName,
    formData.classIds,
    formData.dateStr,
    formData.sessionIndex,
  ]);

  const conflictP2 = useMemo(() => checkTeacherConflict(formData.invigilator2Id || '', 'p2'), [
    formData.invigilator2Id,
    formData.subjectName,
    formData.classIds,
    formData.dateStr,
    formData.sessionIndex,
  ]);

  const handleTeacher1Change = (tId: string) => {
    const t = teachers.find((teach) => teach.id === tId);
    setFormData({
      ...formData,
      invigilator1Id: tId || undefined,
      invigilator1Name: t ? t.name : undefined,
    });
  };

  const handleTeacher2Change = (tId: string) => {
    const t = teachers.find((teach) => teach.id === tId);
    setFormData({
      ...formData,
      invigilator2Id: tId || undefined,
      invigilator2Name: t ? t.name : undefined,
    });
  };

  const handleSubjectChange = (subId: string) => {
    const s = subjects.find((sub) => sub.id === subId);
    if (s) {
      setFormData({
        ...formData,
        subjectId: s.id,
        subjectName: s.name,
      });
    }
  };

  const handleRoomChange = (rId: string) => {
    const r = rooms.find((rm) => rm.id === rId);
    if (r) {
      setFormData({
        ...formData,
        roomId: r.id,
        roomName: r.name,
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Edit Jadwal & Alokasi Pengawas</h3>
              <p className="text-xs text-slate-500">
                {formData.dateStr} — Sesi {formData.sessionIndex} ({formData.startTime} - {formData.endTime})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Subject & Room Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <BookOpen className="w-3.5 h-3.5 text-indigo-600" />
                <span>Mata Pelajaran Ujian</span>
              </label>
              <select
                value={formData.subjectId}
                onChange={(e) => handleSubjectChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {subjects.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.name} ({sub.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ruang Ujian</span>
              </label>
              <select
                value={formData.roomId}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
              >
                {rooms.map((rm) => (
                  <option key={rm.id} value={rm.id}>
                    {rm.name} ({rm.location})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Time & Session */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <div>
              <label className="text-slate-600 font-medium block mb-1">Jam Mulai</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
              />
            </div>
            <div>
              <label className="text-slate-600 font-medium block mb-1">Jam Selesai</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-mono"
              />
            </div>
          </div>

          {/* Invigilator 1 (Pengawas Utama) */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-emerald-600" />
              <span>Pengawas Utama (1)</span>
            </label>
            <select
              value={formData.invigilator1Id || ''}
              onChange={(e) => handleTeacher1Change(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
            >
              <option value="">-- Belum Ada Pengawas --</option>
              {teachers.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name} (Mapel: {t.subjects.join(', ')})
                </option>
              ))}
            </select>

            {/* Live Conflict Feedback Badge for P1 */}
            {formData.invigilator1Id && (
              <div
                className={`mt-1.5 p-2 rounded-lg text-xs flex items-center gap-2 border ${
                  conflictP1.level === 'error'
                    ? 'bg-rose-50 border-rose-200 text-rose-800'
                    : conflictP1.level === 'warning'
                    ? 'bg-amber-50 border-amber-200 text-amber-800'
                    : conflictP1.level === 'info'
                    ? 'bg-blue-50 border-blue-200 text-blue-800'
                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}
              >
                {conflictP1.level === 'safe' ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                )}
                <span>{conflictP1.message}</span>
              </div>
            )}
          </div>

          {/* Invigilator 2 (Pengawas Pendamping) */}
          {config.invigilatorsPerRoom === 2 && (
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-blue-600" />
                <span>Pengawas Pendamping (2)</span>
              </label>
              <select
                value={formData.invigilator2Id || ''}
                onChange={(e) => handleTeacher2Change(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-semibold text-slate-900"
              >
                <option value="">-- Tidak Ada Pengawas 2 --</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} (Mapel: {t.subjects.join(', ')})
                  </option>
                ))}
              </select>

              {/* Live Conflict Feedback Badge for P2 */}
              {formData.invigilator2Id && (
                <div
                  className={`mt-1.5 p-2 rounded-lg text-xs flex items-center gap-2 border ${
                    conflictP2.level === 'error'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : conflictP2.level === 'warning'
                      ? 'bg-amber-50 border-amber-200 text-amber-800'
                      : conflictP2.level === 'info'
                      ? 'bg-blue-50 border-blue-200 text-blue-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  }`}
                >
                  {conflictP2.level === 'safe' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{conflictP2.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Notes field */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Catatan Khusus Sesi / Instruksi Ruang
            </label>
            <input
              type="text"
              placeholder="Contoh: Membawa lembar rumus matematika..."
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Perubahan Jadwal</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
