import React, { useState, useRef } from 'react';
import {
  Sparkles,
  Clock,
  Calendar,
  ShieldCheck,
  UserCheck,
  Coffee,
  RefreshCw,
  AlertTriangle,
  Layers,
  Plus,
  Trash2,
  Edit3,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  Upload,
  Eye,
  Check,
  X,
  Building2,
  MapPin,
  Award,
  RotateCcw,
} from 'lucide-react';
import { ExamTimeConfig, Teacher, ExamRoom, ClassRoom, Subject, DailyExamSubjectPlan } from '../types';
import { calculateSessionTimes, generateExamDates } from '../services/scheduleAlgorithm';
import { LOGO_PRESETS, DEFAULT_LEFT_LOGO, DEFAULT_RIGHT_LOGO } from '../data/logoPresets';

interface AutoSchedulerSettingsProps {
  config: ExamTimeConfig;
  setConfig: React.Dispatch<React.SetStateAction<ExamTimeConfig>>;
  teachers: Teacher[];
  rooms: ExamRoom[];
  classes: ClassRoom[];
  subjects: Subject[];
  onGenerate: () => void;
  isGenerating: boolean;
  slotsCount: number;
}

export const AutoSchedulerSettings: React.FC<AutoSchedulerSettingsProps> = ({
  config,
  setConfig,
  teachers,
  rooms,
  classes,
  subjects,
  onGenerate,
  isGenerating,
  slotsCount,
}) => {
  // Compute visual time preview
  const sessionTimes = calculateSessionTimes(
    config.startTime,
    config.sessionDurationMinutes,
    config.breakDurationMinutes,
    config.sessionsPerDay
  );

  const examDates = generateExamDates(config.startDate, config.examDaysCount, config.activeDays);
  const activeTeachers = teachers.filter((t) => t.isAvailable);
  const activeRooms = rooms.filter((r) => r.isActive);

  const totalSessionsNeeded = examDates.length * sessionTimes.length * classes.length * config.invigilatorsPerRoom;
  const estimatedPerTeacher = activeTeachers.length > 0 ? (totalSessionsNeeded / activeTeachers.length).toFixed(1) : '0';

  return (
    <div className="space-y-6">
      {/* Top Banner / Generator Introduction */}
      <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 text-white rounded-2xl p-6 shadow-sm border border-indigo-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold mb-3 border border-indigo-400/20">
              <Sparkles className="w-3.5 h-3.5 text-indigo-300" />
              <span>Smart Scheduling & Invigilator Distribution Engine</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Generator Jadwal & Distribusi Pengawas Otomatis SMP
            </h2>
            <p className="text-slate-300 text-sm mt-1.5 leading-relaxed">
              Sistem akan menghitung alokasi ruang secara efisien untuk {classes.length} kelas dan membagikan tugas ke {activeTeachers.length} guru pengawas secara adil dan merata, menerapkan proteksi anti-kelelahan (tanpa jadwal berurutan), serta mencegah guru mengawas mata pelajaran atau kelas ajarannya.
            </p>
          </div>

          <div className="shrink-0">
            <button
              id="generate-schedule-primary-btn"
              onClick={onGenerate}
              disabled={isGenerating}
              className="w-full md:w-auto inline-flex items-center justify-center gap-2.5 px-6 py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold text-sm rounded-xl shadow-md hover:shadow-lg transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Distribusi...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 text-amber-300" />
                  <span>{slotsCount > 0 ? 'Regenerasi Jadwal Otomatis' : 'Buat Jadwal Otomatis Sekarang'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Simulation Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-700/60 text-xs">
          <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/60">
            <span className="text-indigo-300 block">Total Hari Ujian</span>
            <span className="text-base font-bold text-white mt-0.5">{examDates.length} Hari Aktif</span>
          </div>
          <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/60">
            <span className="text-indigo-300 block">Total Sesi Diperlukan</span>
            <span className="text-base font-bold text-white mt-0.5">{totalSessionsNeeded} Tugas Ruang</span>
          </div>
          <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/60">
            <span className="text-indigo-300 block">Guru Aktif Tersedia</span>
            <span className="text-base font-bold text-white mt-0.5">{activeTeachers.length} Guru</span>
          </div>
          <div className="bg-indigo-950/60 p-3 rounded-xl border border-indigo-800/60">
            <span className="text-indigo-300 block">Estimasi Beban/Guru</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5">± {estimatedPerTeacher} Sesi</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Time & Session Configuration */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Pengaturan Waktu & Sesi Ujian</h3>
              </div>

              {/* Mode Toggle: Otomatis vs Manual */}
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setConfig({ ...config, isManualTimeMode: false })}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    !config.isManualTimeMode
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Otomatis
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const customTimes = config.customSessionTimes && config.customSessionTimes.length > 0
                      ? config.customSessionTimes
                      : sessionTimes.map((st) => ({
                          sessionIndex: st.sessionIndex,
                          startTime: st.startTime,
                          endTime: st.endTime,
                          name: `Sesi ${st.sessionIndex}`,
                        }));
                    setConfig({ ...config, isManualTimeMode: true, customSessionTimes: customTimes });
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition-all cursor-pointer ${
                    config.isManualTimeMode
                      ? 'bg-white text-indigo-700 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Manual per Sesi
                </button>
              </div>
            </div>

            {/* Mode 1: Automatic Time Computation */}
            {!config.isManualTimeMode ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jam Mulai Ujian (WIB)
                  </label>
                  <input
                    id="input-start-time"
                    type="time"
                    value={config.startTime}
                    onChange={(e) => setConfig({ ...config, startTime: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                  />
                  <div className="flex gap-1.5 mt-1.5">
                    {['07:00', '07:30', '08:00'].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setConfig({ ...config, startTime: preset })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.startTime === preset ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Tiap Sesi Ujian
                  </label>
                  <div className="relative">
                    <input
                      id="input-session-duration"
                      type="number"
                      min="30"
                      max="180"
                      step="15"
                      value={config.sessionDurationMinutes}
                      onChange={(e) => setConfig({ ...config, sessionDurationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">Menit</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {[60, 90, 120].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setConfig({ ...config, sessionDurationMinutes: mins })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.sessionDurationMinutes === mins ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Waktu Istirahat Antar Sesi
                  </label>
                  <div className="relative">
                    <input
                      id="input-break-duration"
                      type="number"
                      min="0"
                      max="90"
                      step="5"
                      value={config.breakDurationMinutes}
                      onChange={(e) => setConfig({ ...config, breakDurationMinutes: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono"
                    />
                    <span className="absolute right-3 top-2.5 text-xs text-slate-400">Menit</span>
                  </div>
                  <div className="flex gap-1.5 mt-1.5">
                    {[15, 30, 45].map((mins) => (
                      <button
                        key={mins}
                        type="button"
                        onClick={() => setConfig({ ...config, breakDurationMinutes: mins })}
                        className={`text-[11px] px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                          config.breakDurationMinutes === mins ? 'bg-indigo-100 text-indigo-800 border-indigo-300 font-semibold' : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {mins}m
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jumlah Sesi per Hari
                  </label>
                  <select
                    id="select-sessions-per-day"
                    value={config.sessionsPerDay}
                    onChange={(e) => setConfig({ ...config, sessionsPerDay: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value={1}>1 Sesi Ujian / Hari (1 Mapel)</option>
                    <option value={2}>2 Sesi Ujian / Hari (2 Mapel - Standar SMP)</option>
                    <option value={3}>3 Sesi Ujian / Hari (3 Mapel)</option>
                    <option value={4}>4 Sesi Ujian / Hari (4 Mapel)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Tanggal Mulai Ujian
                  </label>
                  <input
                    id="input-start-date"
                    type="date"
                    value={config.startDate}
                    onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Durasi Pelaksanaan Ujian
                  </label>
                  <select
                    id="select-exam-days-count"
                    value={config.examDaysCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      if (count === 6) {
                        const sixDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                        setConfig({ ...config, examDaysCount: 6, activeDays: sixDays });
                      } else if (count === 5) {
                        const fiveDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                        setConfig({ ...config, examDaysCount: 5, activeDays: fiveDays });
                      } else {
                        setConfig({ ...config, examDaysCount: count });
                      }
                    }}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                  >
                    <option value={3}>3 Hari Pelaksanaan</option>
                    <option value={4}>4 Hari Pelaksanaan</option>
                    <option value={5}>5 Hari (Senin - Jumat)</option>
                    <option value={6}>6 Hari (Senin - Sabtu)</option>
                    <option value={8}>8 Hari (2 Minggu Ujian)</option>
                    <option value={10}>10 Hari (2 Minggu Penuh)</option>
                    <option value={12}>12 Hari (2 Minggu 6 Hari)</option>
                  </select>
                </div>
              </div>
            ) : (
              /* Mode 2: Manual Custom Times */
              <div className="space-y-4">
                <div className="p-3 bg-indigo-50/70 rounded-xl border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between">
                  <span>Atur jam mulai dan selesai secara fleksibel untuk setiap sesi ujian.</span>
                  <button
                    type="button"
                    onClick={() => {
                      const current = config.customSessionTimes || [];
                      const nextIndex = current.length + 1;
                      const updated = [
                        ...current,
                        { sessionIndex: nextIndex, startTime: '12:30', endTime: '14:00', name: `Sesi ${nextIndex}` },
                      ];
                      setConfig({ ...config, customSessionTimes: updated, sessionsPerDay: updated.length });
                    }}
                    className="px-2.5 py-1 bg-indigo-600 text-white rounded-md text-[11px] font-bold cursor-pointer hover:bg-indigo-700"
                  >
                    + Tambah Sesi
                  </button>
                </div>

                <div className="space-y-2.5">
                  {(config.customSessionTimes || sessionTimes).map((st, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3 text-xs"
                    >
                      <div className="w-16 font-bold text-slate-800 shrink-0">
                        Sesi {st.sessionIndex}
                      </div>

                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Jam Mulai</label>
                          <input
                            type="time"
                            value={st.startTime}
                            onChange={(e) => {
                              const updated = [...(config.customSessionTimes || sessionTimes)];
                              updated[idx] = { ...updated[idx], startTime: e.target.value };
                              setConfig({ ...config, customSessionTimes: updated });
                            }}
                            className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Jam Selesai</label>
                          <input
                            type="time"
                            value={st.endTime}
                            onChange={(e) => {
                              const updated = [...(config.customSessionTimes || sessionTimes)];
                              updated[idx] = { ...updated[idx], endTime: e.target.value };
                              setConfig({ ...config, customSessionTimes: updated });
                            }}
                            className="w-full px-2 py-1.5 text-xs font-mono rounded-lg border border-slate-200 bg-white"
                          />
                        </div>
                      </div>

                      {(config.customSessionTimes || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const updated = (config.customSessionTimes || []).filter((_, i) => i !== idx).map((s, i) => ({
                              ...s,
                              sessionIndex: i + 1,
                            }));
                            setConfig({ ...config, customSessionTimes: updated, sessionsPerDay: updated.length });
                          }}
                          className="p-1.5 rounded text-rose-500 hover:bg-rose-50 cursor-pointer"
                          title="Hapus Sesi Ini"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Mulai Ujian
                    </label>
                    <input
                      type="date"
                      value={config.startDate}
                      onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:ring-2 focus:ring-indigo-500 font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Durasi Hari Pelaksanaan
                    </label>
                    <select
                      value={config.examDaysCount}
                      onChange={(e) => {
                        const count = Number(e.target.value);
                        if (count === 6) {
                          const sixDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                          setConfig({ ...config, examDaysCount: 6, activeDays: sixDays });
                        } else if (count === 5) {
                          const fiveDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                          setConfig({ ...config, examDaysCount: 5, activeDays: fiveDays });
                        } else {
                          setConfig({ ...config, examDaysCount: count });
                        }
                      }}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white font-medium"
                    >
                      <option value={3}>3 Hari Pelaksanaan</option>
                      <option value={4}>4 Hari Pelaksanaan</option>
                      <option value={5}>5 Hari (Senin - Jumat)</option>
                      <option value={6}>6 Hari (Senin - Sabtu)</option>
                      <option value={8}>8 Hari (2 Minggu Ujian)</option>
                      <option value={10}>10 Hari (2 Minggu Penuh)</option>
                      <option value={12}>12 Hari (2 Minggu 6 Hari)</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Pola Hari Kerja & Pemilihan Hari Ujian Aktif (Senin-Jumat vs Senin-Sabtu) */}
            <div className="mt-4 p-4 bg-indigo-50/60 rounded-xl border border-indigo-200 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-indigo-700" />
                  <span className="text-xs font-bold text-slate-900">
                    Pola Hari Kerja & Pengaturan Hari Aktif Ujian:
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const fiveDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];
                      setConfig({
                        ...config,
                        activeDays: fiveDays,
                        examDaysCount: 5,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      config.activeDays?.length === 5 && !config.activeDays?.includes('Sabtu')
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🟢</span>
                    <span>Senin – Jumat (5 Hari)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const sixDays = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
                      setConfig({
                        ...config,
                        activeDays: sixDays,
                        examDaysCount: 6,
                      });
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all cursor-pointer flex items-center gap-1.5 ${
                      config.activeDays?.includes('Sabtu') && config.activeDays?.length >= 6
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>🔵</span>
                    <span>Senin – Sabtu (6 Hari)</span>
                  </button>
                </div>
              </div>

              {/* Day Pills Toggle Buttons */}
              <div>
                <span className="block text-[11px] font-semibold text-slate-600 mb-1.5">
                  Centang / Pilih Hari yang Digunakan Ujian:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'].map((day) => {
                    const isActive = (config.activeDays || []).includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() => {
                          let updatedDays: string[];
                          if (isActive) {
                            if ((config.activeDays || []).length <= 1) {
                              alert('Minimal 1 hari aktif harus dipilih.');
                              return;
                            }
                            updatedDays = (config.activeDays || []).filter((d) => d !== day);
                          } else {
                            const naturalOrder = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];
                            const set = new Set([...(config.activeDays || []), day]);
                            updatedDays = naturalOrder.filter((d) => set.has(d));
                          }
                          const newCount =
                            updatedDays.length >= 3 && updatedDays.length <= 7
                              ? updatedDays.length
                              : config.examDaysCount;
                          setConfig({
                            ...config,
                            activeDays: updatedDays,
                            examDaysCount: newCount,
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isActive
                            ? day === 'Sabtu'
                              ? 'bg-blue-600 text-white border border-blue-600 shadow-xs'
                              : day === 'Minggu'
                              ? 'bg-rose-600 text-white border border-rose-600 shadow-xs'
                              : 'bg-indigo-600 text-white border border-indigo-600 shadow-xs'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        {isActive ? <Check className="w-3.5 h-3.5" /> : <span className="w-3 h-3 rounded-full border border-slate-300 inline-block"></span>}
                        <span>{day}</span>
                        {day === 'Sabtu' && isActive && (
                          <span className="text-[9px] bg-blue-700 text-blue-100 px-1 py-0.2 rounded font-normal">
                            6 Hari
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Live Generated Days Timeline */}
              <div className="pt-2 border-t border-indigo-100">
                <div className="flex items-center justify-between text-[11px] font-bold text-indigo-950 mb-2">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-600" />
                    Jadwal Hari yang Dihasilkan ({examDates.length} Hari):
                  </span>
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                    {(config.activeDays || []).includes('Sabtu')
                      ? '✨ Hari Sabtu Termasuk (6 Hari Kerja)'
                      : '💡 Sabtu & Minggu Libur (5 Hari Kerja)'}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {examDates.map((ed, idx) => {
                    const isSaturday = ed.dateStr.startsWith('Sabtu');
                    const isSunday = ed.dateStr.startsWith('Minggu');
                    return (
                      <div
                        key={idx}
                        className={`p-2 rounded-xl border text-center transition-all shadow-2xs ${
                          isSaturday
                            ? 'bg-blue-50 border-blue-200 text-blue-900'
                            : isSunday
                            ? 'bg-rose-50 border-rose-200 text-rose-900'
                            : 'bg-white border-slate-200 text-slate-800'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                          Hari Ke-{idx + 1}
                        </span>
                        <span className="text-xs font-bold block mt-0.5">{ed.dateStr.split(',')[0]}</span>
                        <span className="text-[10px] text-slate-500 font-mono block">
                          {ed.dateStr.split(',')[1]?.trim()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Live Session Slot Preview */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Simulasi Waktu Sesi Harian:
              </span>
              <div className="flex flex-wrap items-center gap-2">
                {sessionTimes.map((st, sIdx) => (
                  <React.Fragment key={st.sessionIndex}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg border border-indigo-200 text-xs shadow-2xs">
                      <span className="w-2 h-2 rounded-full bg-indigo-600"></span>
                      <strong className="text-indigo-900">Sesi {st.sessionIndex}:</strong>
                      <span className="font-mono text-slate-700">{st.startTime} - {st.endTime}</span>
                    </div>

                    {!config.isManualTimeMode && sIdx < sessionTimes.length - 1 && (
                      <div className="flex items-center gap-1 px-2.5 py-1 bg-amber-50 rounded-lg border border-amber-200 text-[11px] text-amber-800">
                        <Coffee className="w-3 h-3 text-amber-600" />
                        <span>Istirahat {config.breakDurationMinutes}m</span>
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* School Identity Information, Kop Surat, Kabupaten & Logo Kiri Kanan */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Pengaturan Kop Surat, Kabupaten & Logo Resmi
                </h3>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Format Resmi Standar PDF
              </span>
            </div>

            {/* Live KOP Surat Preview Box */}
            <div className="p-4 bg-slate-50 rounded-2xl border-2 border-indigo-200 text-slate-900 shadow-2xs">
              <div className="flex items-center justify-between text-[11px] font-bold text-indigo-900 mb-2">
                <span className="flex items-center gap-1">
                  <Eye className="w-3.5 h-3.5 text-indigo-600" />
                  Pratinjau Kop Surat Resmi:
                </span>
                <span className="text-[10px] text-slate-400 font-normal">
                  Muncul di Jadwal Master, Kartu Ujian, Slip Pengawas & Daftar Hadir
                </span>
              </div>

              <div className="bg-white p-3.5 rounded-xl border border-slate-300 shadow-xs flex items-center justify-between gap-3">
                {/* Left Logo */}
                <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                  {config.leftLogoUrl ? (
                    <img
                      src={config.leftLogoUrl}
                      alt="Logo Kiri"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-slate-400 text-center font-bold">
                      Logo Kiri
                    </span>
                  )}
                </div>

                {/* Center Text Hierarchy */}
                <div className="text-center flex-1 space-y-0.5">
                  <h5 className="font-bold text-xs uppercase tracking-wide text-slate-700">
                    {config.kabupaten || 'PEMERINTAH KABUPATEN SLEMAN'}
                  </h5>
                  <h6 className="font-semibold text-[11px] uppercase tracking-normal text-slate-600">
                    {config.dinasPendidikan || 'DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA'}
                  </h6>
                  <h4 className="font-extrabold text-sm uppercase text-slate-900 tracking-tight">
                    {config.schoolName}
                  </h4>
                  <p className="text-[10px] text-slate-500 line-clamp-1">
                    {config.schoolAddress || `NPSN: ${config.schoolNpsn} • Tahun Ajaran ${config.academicYear} (${config.semester})`}
                  </p>
                </div>

                {/* Right Logo */}
                <div className="w-14 h-14 shrink-0 flex items-center justify-center bg-slate-50 rounded-lg border border-slate-200 p-1">
                  {config.rightLogoUrl ? (
                    <img
                      src={config.rightLogoUrl}
                      alt="Logo Kanan"
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    <span className="text-[9px] text-slate-400 text-center font-bold">
                      Logo Kanan
                    </span>
                  )}
                </div>
              </div>

              {/* Double Border Line Visual */}
              <div className="mt-2 space-y-0.5">
                <div className="h-0.5 bg-slate-800 rounded-full w-full" />
                <div className="h-px bg-slate-500 rounded-full w-full" />
              </div>
            </div>

            {/* Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Pemerintah Kabupaten / Kota / Provinsi
                </label>
                <input
                  type="text"
                  placeholder="Misal: KABUPATEN SLEMAN"
                  value={config.kabupaten || ''}
                  onChange={(e) => setConfig({ ...config, kabupaten: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase font-semibold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Dinas Pendidikan / Kementerian Terkait
                </label>
                <input
                  type="text"
                  placeholder="Misal: DINAS PENDIDIKAN DAN KEBUDAYAAN"
                  value={config.dinasPendidikan || ''}
                  onChange={(e) => setConfig({ ...config, dinasPendidikan: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 uppercase font-medium"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Sekolah / Madrasah</label>
                <input
                  type="text"
                  value={config.schoolName}
                  onChange={(e) => setConfig({ ...config, schoolName: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-bold"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">NPSN Satuan Pendidikan</label>
                <input
                  type="text"
                  value={config.schoolNpsn}
                  onChange={(e) => setConfig({ ...config, schoolNpsn: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono font-bold"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-bold text-slate-700 block mb-1">
                  Alamat Lengkap, Kontak & Website (Baris Bawah Kop Surat)
                </label>
                <input
                  type="text"
                  placeholder="Jl. Pendidikan No. 45, Telp. (0274) 123456 • Website: smp1cemerlang.sch.id"
                  value={config.schoolAddress || ''}
                  onChange={(e) => setConfig({ ...config, schoolAddress: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 text-xs"
                />
              </div>

              {/* Logo Kiri Settings */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Logo Kiri (Pemda / Tut Wuri / Kemenag)
                  </span>
                  {config.leftLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, leftLogoUrl: '' })}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-semibold text-xs cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unggah File Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setConfig((prev) => ({ ...prev, leftLogoUrl: reader.result as string }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, leftLogoUrl: DEFAULT_LEFT_LOGO })}
                    title="Gunakan Logo Default Tut Wuri Handayani"
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-600 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Options */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    Pilihan Cepat Logo Kiri:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {LOGO_PRESETS.filter((p) => p.category === 'left' || p.category === 'both').map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setConfig({ ...config, leftLogoUrl: preset.dataUrl })}
                        className={`px-1.5 py-1 text-[10px] rounded border font-semibold truncate cursor-pointer text-center ${
                          config.leftLogoUrl === preset.dataUrl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={preset.description}
                      >
                        {preset.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Logo Kanan Settings */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-indigo-600" />
                    Logo Kanan (Logo Sekolah / Madrasah)
                  </span>
                  {config.rightLogoUrl && (
                    <button
                      type="button"
                      onClick={() => setConfig({ ...config, rightLogoUrl: '' })}
                      className="text-[10px] text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                    >
                      Hapus
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 rounded-lg border border-slate-300 font-semibold text-xs cursor-pointer shadow-2xs">
                    <Upload className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Unggah File Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => {
                          if (typeof reader.result === 'string') {
                            setConfig((prev) => ({ ...prev, rightLogoUrl: reader.result as string }));
                          }
                        };
                        reader.readAsDataURL(file);
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, rightLogoUrl: DEFAULT_RIGHT_LOGO })}
                    title="Gunakan Logo Default Sekolah Cemerlang"
                    className="p-1.5 bg-white hover:bg-slate-100 rounded-lg border border-slate-300 text-slate-600 cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Preset Options */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold block">
                    Pilihan Cepat Logo Kanan:
                  </span>
                  <div className="grid grid-cols-3 gap-1">
                    {LOGO_PRESETS.filter((p) => p.category === 'right' || p.category === 'both').map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setConfig({ ...config, rightLogoUrl: preset.dataUrl })}
                        className={`px-1.5 py-1 text-[10px] rounded border font-semibold truncate cursor-pointer text-center ${
                          config.rightLogoUrl === preset.dataUrl
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                        title={preset.description}
                      >
                        {preset.name.split(' ')[0]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Jenis Ujian</label>
                <select
                  value={config.examType}
                  onChange={(e) => setConfig({ ...config, examType: e.target.value as any })}
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-white font-medium"
                >
                  <option value="Sumatif Akhir Semester (SAS)">Sumatif Akhir Semester (SAS)</option>
                  <option value="Asesmen Sumatif Tengah Semester (ASTS)">Asesmen Sumatif Tengah Semester (ASTS)</option>
                  <option value="Asesmen Akhir Jenjang (AAJ)">Asesmen Akhir Jenjang (AAJ) / US</option>
                  <option value="Penilaian Harian Bersama">Penilaian Harian Bersama</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Tahun Ajaran & Semester</label>
                <div className="grid grid-cols-2 gap-1">
                  <input
                    type="text"
                    value={config.academicYear}
                    onChange={(e) => setConfig({ ...config, academicYear: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold"
                    placeholder="2025/2026"
                  />
                  <select
                    value={config.semester}
                    onChange={(e) => setConfig({ ...config, semester: e.target.value as any })}
                    className="w-full px-2 py-1.5 rounded-lg border border-slate-300 text-xs bg-white font-semibold"
                  >
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
              </div>

              {/* Headmaster Information & NIP / NIPPPK */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] block">Kepala Sekolah (Penandatangan Utama):</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-200 text-[10px]">
                    {(['NIP', 'NIPPPK', 'NUPTK'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setConfig({ ...config, headmasterIdType: type })}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                          (config.headmasterIdType || 'NIP') === type
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={config.headmasterName}
                    onChange={(e) => setConfig({ ...config, headmasterName: e.target.value })}
                    className="w-full mt-0.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">
                    {config.headmasterIdType || 'NIP'} Kepala Sekolah
                  </label>
                  <input
                    type="text"
                    value={config.headmasterNip}
                    onChange={(e) => setConfig({ ...config, headmasterNip: e.target.value })}
                    placeholder={
                      config.headmasterIdType === 'NIPPPK'
                        ? '19850612 202221 1 002'
                        : config.headmasterIdType === 'NUPTK'
                        ? '4538769201948293'
                        : '19680315 199303 1 004'
                    }
                    className="w-full mt-0.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>

              {/* Committee Chairman Information & NIP / NIPPPK */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] block">Ketua Panitia Ujian:</span>
                  <div className="flex items-center gap-1 bg-white p-0.5 rounded-md border border-slate-200 text-[10px]">
                    {(['NIP', 'NIPPPK', 'NUPTK'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setConfig({ ...config, committeeChairmanIdType: type })}
                        className={`px-1.5 py-0.5 rounded font-bold cursor-pointer transition-all ${
                          (config.committeeChairmanIdType || 'NIP') === type
                            ? 'bg-indigo-600 text-white shadow-2xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">Nama Lengkap & Gelar</label>
                  <input
                    type="text"
                    value={config.committeeChairmanName}
                    onChange={(e) => setConfig({ ...config, committeeChairmanName: e.target.value })}
                    className="w-full mt-0.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-slate-500 font-semibold">
                    {config.committeeChairmanIdType || 'NIP'} Ketua Panitia
                  </label>
                  <input
                    type="text"
                    value={config.committeeChairmanNip}
                    onChange={(e) => setConfig({ ...config, committeeChairmanNip: e.target.value })}
                    placeholder={
                      config.committeeChairmanIdType === 'NIPPPK'
                        ? '19880914 202321 2 005'
                        : config.committeeChairmanIdType === 'NUPTK'
                        ? '7845129304918234'
                        : '19750820 200012 2 002'
                    }
                    className="w-full mt-0.5 px-2.5 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Smart Rules & Invigilator Constraints */}
        <div className="lg:col-span-6 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <h3 className="font-bold text-slate-900 text-sm">Kriteria Khusus & Proteksi Pengawas</h3>
            </div>

            <div className="space-y-4">
              {/* Constraint 1: Subject Conflict */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 transition-colors cursor-pointer">
                <input
                  id="checkbox-prevent-subject-conflict"
                  type="checkbox"
                  checked={config.preventTeachingSubjectConflict}
                  onChange={(e) => setConfig({ ...config, preventTeachingSubjectConflict: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Proteksi Konflik Mata Pelajaran (Wajib)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800">
                      Direkomendasikan
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guru yang mengampu mata pelajaran tertentu <strong>tidak diperbolehkan</strong> menjadi pengawas pada sesi ujian mata pelajaran tersebut.
                  </p>
                </div>
              </label>

              {/* Constraint 2: Class Conflict */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 transition-colors cursor-pointer">
                <input
                  id="checkbox-prevent-class-conflict"
                  type="checkbox"
                  checked={config.preventTeachingClassConflict}
                  onChange={(e) => setConfig({ ...config, preventTeachingClassConflict: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Proteksi Konflik Kelas Ajar
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Guru tidak akan ditugaskan mengawas ruang tempat kelas binaan/ajarannya (misal guru yang mengajar kelas VII-A tidak mengawas di Ruang VII-A).
                  </p>
                </div>
              </label>

              {/* Constraint 3: Anti-Kelelahan / Consecutive Sessions */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 transition-colors cursor-pointer">
                <input
                  id="checkbox-consecutive-fatigue"
                  type="checkbox"
                  checked={config.maxConsecutiveSessions === 1}
                  onChange={(e) => setConfig({ ...config, maxConsecutiveSessions: e.target.checked ? 1 : 2 })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900">
                      Sistem Pembatasan Jadwal Berurutan (Anti-Kelelahan)
                    </span>
                    <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-blue-100 text-blue-800">
                      Ergonomis
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Mencegah guru mengawas dua sesi berturut-turut pada hari yang sama. Guru yang mengawas Sesi 1 akan diberikan jeda/istirahat pada Sesi 2.
                  </p>
                </div>
              </label>

              {/* Constraint 4: Equal Workload */}
              <label className="flex items-start gap-3 p-3 rounded-xl border border-slate-200 hover:bg-slate-50/80 transition-colors cursor-pointer">
                <input
                  id="checkbox-balance-workload"
                  type="checkbox"
                  checked={config.balanceWorkloadStrictly}
                  onChange={(e) => setConfig({ ...config, balanceWorkloadStrictly: e.target.checked })}
                  className="mt-0.5 w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-900">
                    Beban Tugas Merata (Equal Quota Balancing)
                  </span>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Algoritma menghitung selisih tugas sekecil mungkin sehingga semua guru mendapatkan jumlah sesi pengawasan yang seimbang dan adil.
                  </p>
                </div>
              </label>

              {/* Invigilators per room setting */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Jumlah Pengawas per Ruang Ujian
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, invigilatorsPerRoom: 1 })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      config.invigilatorsPerRoom === 1
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>1 Pengawas / Ruang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfig({ ...config, invigilatorsPerRoom: 2 })}
                    className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
                      config.invigilatorsPerRoom === 2
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>2 Pengawas / Ruang (Utama & Pendamping)</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Master Data Readiness Indicator */}
          <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 text-xs">
            <h4 className="font-bold text-slate-800 mb-2 flex items-center gap-1.5">
              <span>Kesiapan Data Master SMP:</span>
            </h4>
            <div className="grid grid-cols-3 gap-2 text-slate-600">
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block font-bold text-slate-900 text-sm">{teachers.length}</span>
                <span>Guru Terdaftar</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block font-bold text-slate-900 text-sm">{rooms.length}</span>
                <span>Ruang Ujian</span>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-center">
                <span className="block font-bold text-slate-900 text-sm">{classes.length}</span>
                <span>Rombel Kelas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual & Automatic Daily Exam Subjects Schedule Management */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 pb-4 mb-5 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                📖
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm md:text-base">
                  Daftar Pelajaran yang Diujikan Setiap Harinya
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tentukan jumlah mata pelajaran per hari (1, 2, 3, atau 4 mapel), pilih dari master atau <strong>ketik manual</strong> nama mapel secara fleksibel.
                </p>
              </div>
            </div>
          </div>

          {/* Quick Pattern Presets */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-500 mr-1">Pola Cepat:</span>
            
            <button
              type="button"
              onClick={() => {
                // Preset 2 Mapel / Hari
                const newDailyPlans: DailyExamSubjectPlan[] = [];
                let sIdx = 0;
                examDates.forEach((ed, d) => {
                  [
                    { s: 1, start: '07:30', end: '09:00' },
                    { s: 2, start: '09:30', end: '11:00' },
                  ].forEach((slot) => {
                    const sub = subjects[sIdx % subjects.length] || {
                      id: `sub-${sIdx}`,
                      name: `Mapel ${sIdx + 1}`,
                      code: `MPL${sIdx + 1}`,
                      category: 'Umum',
                    };
                    newDailyPlans.push({
                      dayIndex: d,
                      sessionIndex: slot.s,
                      grade: 'all',
                      subjectId: sub.id,
                      subjectName: sub.name,
                      subjectCode: sub.code,
                      category: sub.category,
                      startTime: slot.start,
                      endTime: slot.end,
                    });
                    sIdx++;
                  });
                });
                setConfig({ ...config, dailyExamSubjects: newDailyPlans, sessionsPerDay: 2 });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <span>⚡ 2 Mapel / Hari</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Preset 3 Mapel / Hari
                const newDailyPlans: DailyExamSubjectPlan[] = [];
                let sIdx = 0;
                examDates.forEach((ed, d) => {
                  [
                    { s: 1, start: '07:30', end: '09:00' },
                    { s: 2, start: '09:30', end: '11:00' },
                    { s: 3, start: '11:15', end: '12:45' },
                  ].forEach((slot) => {
                    const sub = subjects[sIdx % subjects.length] || {
                      id: `sub-${sIdx}`,
                      name: `Mapel ${sIdx + 1}`,
                      code: `MPL${sIdx + 1}`,
                      category: 'Umum',
                    };
                    newDailyPlans.push({
                      dayIndex: d,
                      sessionIndex: slot.s,
                      grade: 'all',
                      subjectId: sub.id,
                      subjectName: sub.name,
                      subjectCode: sub.code,
                      category: sub.category,
                      startTime: slot.start,
                      endTime: slot.end,
                    });
                    sIdx++;
                  });
                });
                setConfig({ ...config, dailyExamSubjects: newDailyPlans, sessionsPerDay: 3 });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <span>⚡ 3 Mapel / Hari</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Preset 4 Mapel / Hari
                const newDailyPlans: DailyExamSubjectPlan[] = [];
                let sIdx = 0;
                examDates.forEach((ed, d) => {
                  [
                    { s: 1, start: '07:30', end: '08:45' },
                    { s: 2, start: '09:00', end: '10:15' },
                    { s: 3, start: '10:30', end: '11:45' },
                    { s: 4, start: '12:30', end: '13:45' },
                  ].forEach((slot) => {
                    const sub = subjects[sIdx % subjects.length] || {
                      id: `sub-${sIdx}`,
                      name: `Mapel ${sIdx + 1}`,
                      code: `MPL${sIdx + 1}`,
                      category: 'Umum',
                    };
                    newDailyPlans.push({
                      dayIndex: d,
                      sessionIndex: slot.s,
                      grade: 'all',
                      subjectId: sub.id,
                      subjectName: sub.name,
                      subjectCode: sub.code,
                      category: sub.category,
                      startTime: slot.start,
                      endTime: slot.end,
                    });
                    sIdx++;
                  });
                });
                setConfig({ ...config, dailyExamSubjects: newDailyPlans, sessionsPerDay: 4 });
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-300 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 transition-colors cursor-pointer"
            >
              <span>⚡ 4 Mapel / Hari</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Reset / Auto-fill based on current sessionsPerDay
                const newDailyPlans: DailyExamSubjectPlan[] = [];
                let sIdx = 0;
                examDates.forEach((ed, d) => {
                  sessionTimes.forEach((st) => {
                    const sub = subjects[sIdx % subjects.length] || {
                      id: `sub-${sIdx}`,
                      name: `Mapel ${sIdx + 1}`,
                      code: `MPL${sIdx + 1}`,
                      category: 'Umum',
                    };
                    newDailyPlans.push({
                      dayIndex: d,
                      sessionIndex: st.sessionIndex,
                      grade: 'all',
                      subjectId: sub.id,
                      subjectName: sub.name,
                      subjectCode: sub.code,
                      category: sub.category,
                      startTime: st.startTime,
                      endTime: st.endTime,
                    });
                    sIdx++;
                  });
                });
                setConfig({ ...config, dailyExamSubjects: newDailyPlans });
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-colors cursor-pointer border border-indigo-200"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Susun Ulang Otomatis</span>
            </button>
          </div>
        </div>

        {/* Daily Schedule Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {examDates.map((examDate, dIdx) => {
            // Get plans for this day, or construct default sessions if empty
            let datePlans = (config.dailyExamSubjects || []).filter((p) => p.dayIndex === dIdx);
            
            if (datePlans.length === 0) {
              datePlans = sessionTimes.map((st, sIdx) => {
                const sub = subjects[(dIdx * sessionTimes.length + sIdx) % subjects.length] || {
                  id: `sub-${dIdx}-${sIdx}`,
                  name: `Mata Pelajaran ${sIdx + 1}`,
                  code: `MAPEL${sIdx + 1}`,
                  category: 'Umum',
                };
                return {
                  dayIndex: dIdx,
                  sessionIndex: st.sessionIndex,
                  grade: 'all' as const,
                  subjectId: sub.id,
                  subjectName: sub.name,
                  subjectCode: sub.code,
                  category: sub.category,
                  startTime: st.startTime,
                  endTime: st.endTime,
                };
              });
            }

            // Sort plans by sessionIndex
            datePlans.sort((a, b) => a.sessionIndex - b.sessionIndex);

            return (
              <div
                key={dIdx}
                className="bg-slate-50/80 rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:border-indigo-300 transition-all flex flex-col justify-between"
              >
                {/* Day Header */}
                <div className="bg-indigo-900 text-white px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-indigo-700 text-indigo-200 text-xs font-bold flex items-center justify-center">
                      {dIdx + 1}
                    </span>
                    <div>
                      <span className="font-bold text-xs block">Hari Ke-{dIdx + 1}</span>
                      <span className="text-[11px] text-indigo-200">{examDate.dateStr}</span>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-indigo-800 text-indigo-200 border border-indigo-700">
                    {datePlans.length} Mapel Diujikan
                  </span>
                </div>

                {/* Day Sessions List */}
                <div className="p-3.5 space-y-3.5 flex-1">
                  {datePlans.map((plan, pIdx) => {
                    const isManual = plan.isManualInput || !subjects.some((s) => s.id === plan.subjectId);

                    return (
                      <div
                        key={`${dIdx}-${plan.sessionIndex}-${pIdx}`}
                        className="bg-white p-3 rounded-xl border border-slate-200 space-y-2.5 shadow-2xs hover:border-slate-300 transition-colors"
                      >
                        {/* Session Meta Header */}
                        <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-100">
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                              Sesi {plan.sessionIndex} (Mapel ke-{pIdx + 1})
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            {/* Toggle Mode: Dropdown vs Manual Input */}
                            <button
                              type="button"
                              onClick={() => {
                                const updated = [...(config.dailyExamSubjects || datePlans)];
                                const targetIdx = updated.findIndex(
                                  (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                );
                                const toggledManual = !isManual;
                                const newPlanItem: DailyExamSubjectPlan = {
                                  ...plan,
                                  isManualInput: toggledManual,
                                  subjectId: toggledManual ? `manual-${Date.now()}` : subjects[0]?.id || 'sub-1',
                                  subjectName: toggledManual ? (plan.subjectName || 'Mata Pelajaran Kustom') : subjects[0]?.name || 'Bahasa Indonesia',
                                  subjectCode: toggledManual ? (plan.subjectCode || 'MAPEL') : subjects[0]?.code || 'BIN',
                                };

                                if (targetIdx >= 0) {
                                  updated[targetIdx] = newPlanItem;
                                } else {
                                  updated.push(newPlanItem);
                                }
                                setConfig({ ...config, dailyExamSubjects: updated });
                              }}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border cursor-pointer transition-colors ${
                                isManual
                                  ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                              }`}
                              title="Klik untuk beralih antara Input Manual & Pilihan Master Mapel"
                            >
                              {isManual ? '✍️ Input Manual' : '📋 Master Mapel'}
                            </button>

                            {/* Delete Session button if > 1 session */}
                            {datePlans.length > 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const filtered = (config.dailyExamSubjects || datePlans).filter(
                                    (p) => !(p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex)
                                  );
                                  // Re-index sessions for this day
                                  const reindexed = filtered.map((p) => {
                                    if (p.dayIndex === dIdx && p.sessionIndex > plan.sessionIndex) {
                                      return { ...p, sessionIndex: p.sessionIndex - 1 };
                                    }
                                    return p;
                                  });
                                  setConfig({ ...config, dailyExamSubjects: reindexed });
                                }}
                                className="text-slate-400 hover:text-red-600 p-1 rounded hover:bg-red-50 cursor-pointer transition-colors"
                                title="Hapus sesi mata pelajaran ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Subject Input / Selection Area */}
                        {!isManual ? (
                          <div>
                            <label className="block text-[10px] font-semibold text-slate-500 mb-1">
                              Pilih dari Master Mata Pelajaran:
                            </label>
                            <select
                              value={plan.subjectId}
                              onChange={(e) => {
                                const selectedSub = subjects.find((s) => s.id === e.target.value);
                                if (!selectedSub) return;

                                const updated = [...(config.dailyExamSubjects || datePlans)];
                                const targetIdx = updated.findIndex(
                                  (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                );

                                const newPlanItem: DailyExamSubjectPlan = {
                                  ...plan,
                                  subjectId: selectedSub.id,
                                  subjectName: selectedSub.name,
                                  subjectCode: selectedSub.code,
                                  category: selectedSub.category,
                                  isManualInput: false,
                                };

                                if (targetIdx >= 0) {
                                  updated[targetIdx] = newPlanItem;
                                } else {
                                  updated.push(newPlanItem);
                                }
                                setConfig({ ...config, dailyExamSubjects: updated });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                            >
                              <option value="">-- Pilih Mata Pelajaran --</option>
                              {subjects.map((sub) => (
                                <option key={sub.id} value={sub.id}>
                                  {sub.name} ({sub.code}) - {sub.category}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          /* Manual Text Input */
                          <div className="space-y-2 bg-amber-50/50 p-2.5 rounded-lg border border-amber-200">
                            <div>
                              <label className="block text-[10px] font-bold text-amber-900 mb-0.5">
                                Nama Mata Pelajaran (Ketik Manual):
                              </label>
                              <input
                                type="text"
                                value={plan.subjectName}
                                placeholder="Contoh: Pendidikan Agama Islam / Muatan Lokal"
                                onChange={(e) => {
                                  const updated = [...(config.dailyExamSubjects || datePlans)];
                                  const targetIdx = updated.findIndex(
                                    (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                  );
                                  const newPlanItem: DailyExamSubjectPlan = {
                                    ...plan,
                                    subjectName: e.target.value,
                                    isManualInput: true,
                                  };
                                  if (targetIdx >= 0) updated[targetIdx] = newPlanItem;
                                  else updated.push(newPlanItem);
                                  setConfig({ ...config, dailyExamSubjects: updated });
                                }}
                                className="w-full px-2 py-1 text-xs font-semibold rounded-md border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">
                                  Kode Singkat:
                                </label>
                                <input
                                  type="text"
                                  value={plan.subjectCode || ''}
                                  placeholder="PAI / BSND / TIK"
                                  onChange={(e) => {
                                    const updated = [...(config.dailyExamSubjects || datePlans)];
                                    const targetIdx = updated.findIndex(
                                      (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                    );
                                    const newPlanItem: DailyExamSubjectPlan = {
                                      ...plan,
                                      subjectCode: e.target.value.toUpperCase(),
                                      isManualInput: true,
                                    };
                                    if (targetIdx >= 0) updated[targetIdx] = newPlanItem;
                                    else updated.push(newPlanItem);
                                    setConfig({ ...config, dailyExamSubjects: updated });
                                  }}
                                  className="w-full px-2 py-1 text-xs font-mono rounded-md border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden uppercase"
                                />
                              </div>

                              <div>
                                <label className="block text-[10px] font-semibold text-amber-900 mb-0.5">
                                  Kategori:
                                </label>
                                <select
                                  value={plan.category || 'Umum'}
                                  onChange={(e) => {
                                    const updated = [...(config.dailyExamSubjects || datePlans)];
                                    const targetIdx = updated.findIndex(
                                      (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                    );
                                    const newPlanItem: DailyExamSubjectPlan = {
                                      ...plan,
                                      category: e.target.value,
                                      isManualInput: true,
                                    };
                                    if (targetIdx >= 0) updated[targetIdx] = newPlanItem;
                                    else updated.push(newPlanItem);
                                    setConfig({ ...config, dailyExamSubjects: updated });
                                  }}
                                  className="w-full px-2 py-1 text-xs rounded-md border border-amber-300 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                                >
                                  <option value="Umum">Umum</option>
                                  <option value="Bahasa">Bahasa</option>
                                  <option value="MIPA">MIPA</option>
                                  <option value="Agama">Agama</option>
                                  <option value="Sosial">Sosial</option>
                                  <option value="Seni & PJOK">Seni & PJOK</option>
                                  <option value="Muatan Lokal">Muatan Lokal</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Session Time Interval Inputs */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">
                              Jam Mulai
                            </label>
                            <input
                              type="time"
                              value={plan.startTime || (sessionTimes[plan.sessionIndex - 1]?.startTime || '07:30')}
                              onChange={(e) => {
                                const updated = [...(config.dailyExamSubjects || datePlans)];
                                const targetIdx = updated.findIndex(
                                  (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                );
                                const newPlanItem: DailyExamSubjectPlan = {
                                  ...plan,
                                  startTime: e.target.value,
                                };
                                if (targetIdx >= 0) updated[targetIdx] = newPlanItem;
                                else updated.push(newPlanItem);
                                setConfig({ ...config, dailyExamSubjects: updated });
                              }}
                              className="w-full px-2 py-1 text-[11px] font-mono rounded border border-slate-200 bg-slate-50 focus:bg-white"
                            />
                          </div>

                          <div>
                            <label className="block text-[9px] font-semibold text-slate-500 mb-0.5">
                              Jam Selesai
                            </label>
                            <input
                              type="time"
                              value={plan.endTime || (sessionTimes[plan.sessionIndex - 1]?.endTime || '09:00')}
                              onChange={(e) => {
                                const updated = [...(config.dailyExamSubjects || datePlans)];
                                const targetIdx = updated.findIndex(
                                  (p) => p.dayIndex === dIdx && p.sessionIndex === plan.sessionIndex
                                );
                                const newPlanItem: DailyExamSubjectPlan = {
                                  ...plan,
                                  endTime: e.target.value,
                                };
                                if (targetIdx >= 0) updated[targetIdx] = newPlanItem;
                                else updated.push(newPlanItem);
                                setConfig({ ...config, dailyExamSubjects: updated });
                              }}
                              className="w-full px-2 py-1 text-[11px] font-mono rounded border border-slate-200 bg-slate-50 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Add Session / Subject to this Day button */}
                <div className="p-3 bg-slate-100 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(config.dailyExamSubjects || datePlans)];
                      const nextSessionIndex = datePlans.length + 1;
                      
                      // Calculate smart default time for next session
                      const lastPlan = datePlans[datePlans.length - 1];
                      let nextStart = '11:15';
                      let nextEnd = '12:45';
                      if (lastPlan?.endTime) {
                        const [lh, lm] = lastPlan.endTime.split(':').map(Number);
                        const startMin = lh * 60 + lm + 15;
                        const endMin = startMin + 90;
                        nextStart = `${String(Math.floor(startMin / 60)).padStart(2, '0')}:${String(startMin % 60).padStart(2, '0')}`;
                        nextEnd = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;
                      }

                      const availableSub = subjects[nextSessionIndex % subjects.length] || subjects[0] || {
                        id: `sub-auto-${nextSessionIndex}`,
                        name: `Mata Pelajaran ${nextSessionIndex}`,
                        code: `MPL${nextSessionIndex}`,
                        category: 'Umum',
                      };

                      const newPlanItem: DailyExamSubjectPlan = {
                        dayIndex: dIdx,
                        sessionIndex: nextSessionIndex,
                        grade: 'all',
                        subjectId: availableSub.id,
                        subjectName: availableSub.name,
                        subjectCode: availableSub.code,
                        category: availableSub.category,
                        startTime: nextStart,
                        endTime: nextEnd,
                      };

                      updated.push(newPlanItem);
                      setConfig({ ...config, dailyExamSubjects: updated });
                    }}
                    className="w-full py-1.5 px-3 rounded-xl bg-white hover:bg-indigo-50 text-indigo-700 hover:text-indigo-800 font-bold text-xs border border-dashed border-indigo-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>+ Tambah Mapel Sesi ke-{datePlans.length + 1} Hari Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
