import React, { useState } from 'react';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Send,
  Sparkles,
  Search,
  MessageCircle,
  HelpCircle,
  Coffee,
} from 'lucide-react';
import { TeacherWorkloadStats, ExamTimeConfig, Teacher } from '../types';
import { generateTeacherWhatsAppMessage, buildWhatsAppLink } from '../services/notificationService';

interface WorkloadDashboardProps {
  teacherStats: TeacherWorkloadStats[];
  teachers: Teacher[];
  config: ExamTimeConfig;
  overallStats: {
    totalSlots: number;
    assignedSlots: number;
    unassignedCount: number;
    averageSessionsPerTeacher: number;
    workloadVariance: number;
    balanceFairnessScore: number;
  };
  conflicts: {
    slotId: string;
    slotInfo: string;
    severity: 'error' | 'warning' | 'info';
    type: 'SUBJECT_CONFLICT' | 'CLASS_CONFLICT' | 'CONSECUTIVE_FATIGUE' | 'DOUBLE_BOOKED' | 'UNASSIGNED';
    message: string;
  }[];
}

export const WorkloadDashboard: React.FC<WorkloadDashboardProps> = ({
  teacherStats,
  teachers,
  config,
  overallStats,
  conflicts,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeacherModal, setSelectedTeacherModal] = useState<TeacherWorkloadStats | null>(null);

  // Filter stats
  const filteredStats = teacherStats.filter((st) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      st.teacherName.toLowerCase().includes(q) ||
      st.nip.toLowerCase().includes(q) ||
      st.code.toLowerCase().includes(q)
    );
  });

  // Calculate day labels
  const dayIndices = Array.from({ length: config.examDaysCount }, (_, i) => i);

  const handleSendWhatsAppSlip = (stat: TeacherWorkloadStats) => {
    const teacher = teachers.find((t) => t.id === stat.teacherId);
    if (!teacher) return;

    const message = generateTeacherWhatsAppMessage(config, teacher, stat.scheduleSlots);
    const link = buildWhatsAppLink(teacher.phone || '081234567890', message);
    window.open(link, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Fairness Score */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Indeks Pemerataan Beban</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-slate-900">{overallStats.balanceFairnessScore}%</span>
              <span className="text-xs font-bold text-emerald-600">
                {overallStats.balanceFairnessScore >= 90 ? 'Sangat Merata' : 'Cukup Merata'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Standar Deviasi: ±{overallStats.workloadVariance} sesi
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 2: Avg Sessions */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Rata-rata Tugas Pengawas</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-indigo-600">
                {overallStats.averageSessionsPerTeacher}
              </span>
              <span className="text-xs font-medium text-slate-600">Sesi / Guru</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Total {overallStats.assignedSlots} slot pengawasan
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Users className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 3: Anti-Kelelahan Protection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Sistem Anti-Kelelahan</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-blue-600">
                {teacherStats.filter((t) => !t.hasConsecutiveWarning).length}/{teacherStats.length}
              </span>
              <span className="text-xs font-semibold text-blue-700">Guru Aman</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Jeda istirahat antar sesi aktif
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Coffee className="w-6 h-6" />
          </div>
        </div>

        {/* Metric 4: Conflict Protection */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Proteksi Mapel & Kelas</span>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-2xl font-black text-emerald-600">
                {teacherStats.filter((t) => !t.hasSubjectConflictWarning).length}/{teacherStats.length}
              </span>
              <span className="text-xs font-semibold text-emerald-700">Bebas Konflik</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-0.5 block">
              Guru mapel tidak mengawas mapelnya
            </span>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Conflicts & Audit Alerts if any */}
      {conflicts.length > 0 && (
        <div className="bg-amber-50 rounded-2xl border border-amber-200 p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <h4 className="font-bold text-amber-900 text-xs">
              Catatan & Audit Jadwal ({conflicts.length} entri):
            </h4>
          </div>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-2">
            {conflicts.slice(0, 10).map((c, idx) => (
              <div
                key={idx}
                className="text-[11px] p-2 rounded-lg bg-white/80 border border-amber-200/80 text-amber-900 flex items-start gap-2"
              >
                <span className="font-semibold text-amber-700 shrink-0">[{c.slotInfo}]</span>
                <span>{c.message}</span>
              </div>
            ))}
            {conflicts.length > 10 && (
              <p className="text-[10px] text-amber-700 italic pt-1">
                ...dan {conflicts.length - 10} catatan audit lainnya.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Teachers Workload Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Rekapitulasi Distribusi Beban Pengawasan Guru SMP
            </h3>
            <p className="text-xs text-slate-500">
              Evaluasi keadilan beban tugas, durasi menit mengawas, dan slip jadwal personal
            </p>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-teacher-workload-input"
              type="text"
              placeholder="Cari guru..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/50 focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-3.5 py-3 text-center w-10">No</th>
                <th className="px-3.5 py-3">Nama Guru & NIP</th>
                <th className="px-3.5 py-3 text-center">Kode</th>
                <th className="px-3.5 py-3 text-center">Total Sesi</th>
                <th className="px-3.5 py-3 text-center">Total Durasi</th>
                <th className="px-3.5 py-3">Distribusi Hari</th>
                <th className="px-3.5 py-3">Status Kriteria</th>
                <th className="px-3.5 py-3 text-center w-28">Kirim Slip</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredStats.map((stat, idx) => {
                const teacher = teachers.find((t) => t.id === stat.teacherId);
                const hasWarning = stat.hasSubjectConflictWarning || stat.hasConsecutiveWarning;

                return (
                  <tr key={stat.teacherId} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3.5 py-3 text-center font-mono text-slate-400">
                      {idx + 1}
                    </td>
                    <td className="px-3.5 py-3">
                      <span className="font-bold text-slate-900 block">{stat.teacherName}</span>
                      <span className="text-[11px] text-slate-500 font-mono">
                        NIP. {stat.nip || '-'}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span className="font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                        {stat.code}
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-full font-bold text-xs ${
                          stat.totalSessions === 0
                            ? 'bg-slate-100 text-slate-500'
                            : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                        }`}
                      >
                        {stat.totalSessions} Sesi
                      </span>
                    </td>
                    <td className="px-3.5 py-3 text-center font-mono">
                      <span className="text-slate-900 font-semibold">
                        {stat.totalDurationMinutes} m
                      </span>
                      <span className="block text-[10px] text-slate-400">
                        ({(stat.totalDurationMinutes / 60).toFixed(1)} Jam)
                      </span>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="flex items-center gap-1">
                        {dayIndices.map((dIdx) => {
                          const count = stat.sessionsPerDayMap[dIdx] || 0;
                          return (
                            <span
                              key={dIdx}
                              className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold ${
                                count > 0
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-slate-100 text-slate-400'
                              }`}
                              title={`Hari ke-${dIdx + 1}: ${count} sesi`}
                            >
                              {count}
                            </span>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-3.5 py-3">
                      <div className="space-y-0.5">
                        {!hasWarning ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" />
                            Ideal & Aman
                          </span>
                        ) : (
                          <>
                            {stat.hasConsecutiveWarning && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-blue-800 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                                Sesi Berurutan
                              </span>
                            )}
                            {stat.hasSubjectConflictWarning && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                Mengajar Mapel Ujian
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-3.5 py-3 text-center">
                      <button
                        onClick={() => handleSendWhatsAppSlip(stat)}
                        disabled={stat.totalSessions === 0}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-40 text-emerald-700 text-xs font-semibold transition-colors cursor-pointer"
                        title="Kirim Slip Rincian Tugas via WhatsApp"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
