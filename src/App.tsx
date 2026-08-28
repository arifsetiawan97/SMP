import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import {
  DEFAULT_CONFIG,
  DEFAULT_TEACHERS,
  DEFAULT_ROOMS,
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS,
  DEFAULT_STUDENTS,
} from './data/defaultData';
import {
  ExamTimeConfig,
  Teacher,
  ExamRoom,
  ClassRoom,
  Subject,
  ExamScheduleSlot,
  ScheduleChangeLog,
  NotificationItem,
  Student,
} from './types';
import {
  generateAutomaticSchedule,
  computeScheduleWorkloadAndAudits,
} from './services/scheduleAlgorithm';
import { createScheduleChangeLog } from './services/notificationService';
import { Header } from './components/Header';
import { AutoSchedulerSettings } from './components/AutoSchedulerSettings';
import { ScheduleMasterTable } from './components/ScheduleMasterTable';
import { WorkloadDashboard } from './components/WorkloadDashboard';
import { MasterDataTab } from './components/MasterDataTab';
import { NotificationsCenter } from './components/NotificationsCenter';
import { ExportSyncModal } from './components/ExportSyncModal';
import { EditSlotModal } from './components/EditSlotModal';
import { DeleteScheduleModal } from './components/DeleteScheduleModal';
import { ExamCardsTab } from './components/ExamCardsTab';

export default function App() {
  // Master States
  const [config, setConfig] = useState<ExamTimeConfig>(() => {
    const saved = localStorage.getItem('smp_exam_config');
    return saved ? JSON.parse(saved) : DEFAULT_CONFIG;
  });

  const [teachers, setTeachers] = useState<Teacher[]>(() => {
    const saved = localStorage.getItem('smp_exam_teachers');
    return saved ? JSON.parse(saved) : DEFAULT_TEACHERS;
  });

  const [rooms, setRooms] = useState<ExamRoom[]>(() => {
    const saved = localStorage.getItem('smp_exam_rooms');
    return saved ? JSON.parse(saved) : DEFAULT_ROOMS;
  });

  const [classes, setClasses] = useState<ClassRoom[]>(() => {
    const saved = localStorage.getItem('smp_exam_classes');
    return saved ? JSON.parse(saved) : DEFAULT_CLASSES;
  });

  const [subjects, setSubjects] = useState<Subject[]>(() => {
    const saved = localStorage.getItem('smp_exam_subjects');
    return saved ? JSON.parse(saved) : DEFAULT_SUBJECTS;
  });

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('smp_exam_students');
    return saved ? JSON.parse(saved) : DEFAULT_STUDENTS;
  });

  const [slots, setSlots] = useState<ExamScheduleSlot[]>(() => {
    const saved = localStorage.getItem('smp_exam_slots');
    if (saved) return JSON.parse(saved);
    // Generate initial schedule automatically on start
    try {
      const generated = generateAutomaticSchedule(
        DEFAULT_CONFIG,
        DEFAULT_TEACHERS,
        DEFAULT_SUBJECTS,
        DEFAULT_CLASSES,
        DEFAULT_ROOMS
      );
      return generated.slots;
    } catch {
      return [];
    }
  });

  const [changeLogs, setChangeLogs] = useState<ScheduleChangeLog[]>(() => {
    const saved = localStorage.getItem('smp_exam_logs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'init-log',
        timestamp: new Date().toLocaleDateString('id-ID', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
        type: 'GENERATE',
        description: 'Inisialisasi Sistem Jadwal & Pengawas Ujian SMP',
        affectedParties: ['GURU', 'SISWA', 'PANITIA'],
        details: 'Jadwal dan pembagian pengawas otomatis dibuat dengan kriteria beban merata dan bebas konflik.',
      },
    ];
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    const saved = localStorage.getItem('smp_exam_notifs');
    if (saved) return JSON.parse(saved);
    return [
      {
        id: 'init-notif',
        targetType: 'ALL',
        title: 'Jadwal Ujian SMP Telah Diterbitkan',
        message: 'Jadwal pelaksanaan ujian dan alokasi ruang pengawas telah siap ditinjau dan disinkronkan.',
        timestamp: 'Baru saja',
        sentVia: ['APP'],
        isRead: false,
        priority: 'normal',
      },
    ];
  });

  // UI state
  const [activeTab, setActiveTab] = useState<
    'schedule' | 'generator' | 'workload' | 'master' | 'notifications' | 'export' | 'cards'
  >('schedule');
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingSlot, setEditingSlot] = useState<ExamScheduleSlot | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('smp_exam_config', JSON.stringify(config));
  }, [config]);

  useEffect(() => {
    localStorage.setItem('smp_exam_teachers', JSON.stringify(teachers));
  }, [teachers]);

  useEffect(() => {
    localStorage.setItem('smp_exam_rooms', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('smp_exam_classes', JSON.stringify(classes));
  }, [classes]);

  useEffect(() => {
    localStorage.setItem('smp_exam_subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('smp_exam_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('smp_exam_slots', JSON.stringify(slots));
  }, [slots]);

  useEffect(() => {
    localStorage.setItem('smp_exam_logs', JSON.stringify(changeLogs));
  }, [changeLogs]);

  useEffect(() => {
    localStorage.setItem('smp_exam_notifs', JSON.stringify(notifications));
  }, [notifications]);

  // Compute Workload and Audits
  const { teacherStats, conflicts, overallStats } = useMemo(() => {
    return computeScheduleWorkloadAndAudits(slots, teachers, subjects, classes, config);
  }, [slots, teachers, subjects, classes, config]);

  const unreadNotifsCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  // Handler: Run Automatic Generator
  const handleRunGenerator = () => {
    setIsGenerating(true);
    setTimeout(() => {
      try {
        const result = generateAutomaticSchedule(config, teachers, subjects, classes, rooms);
        setSlots(result.slots);

        // Record Change Log & Notification
        const { log, notification } = createScheduleChangeLog(
          'GENERATE',
          `Pembuatan Jadwal Otomatis (${result.slots.length} Sesi)`,
          `Jadwal baru berhasil dibuat untuk ${config.examDaysCount} hari ujian dengan rata-rata ${result.stats.avgWorkload} sesi per guru. Beban merata & proteksi anti-kelelahan aktif.`
        );
        setChangeLogs((prev) => [log, ...prev]);
        setNotifications((prev) => [notification, ...prev]);

        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });

        setActiveTab('schedule');
      } catch (err: any) {
        alert(err.message || 'Gagal membuat jadwal otomatis.');
      } finally {
        setIsGenerating(false);
      }
    }, 400);
  };

  // Handler: Edit Slot Save
  const handleSaveSlot = (updatedSlot: ExamScheduleSlot) => {
    setSlots((prev) => prev.map((s) => (s.id === updatedSlot.id ? updatedSlot : s)));

    // Log the change
    const { log, notification } = createScheduleChangeLog(
      'UPDATE',
      `Pembaruan Slot ${updatedSlot.dateStr} Sesi ${updatedSlot.sessionIndex} (${updatedSlot.roomName})`,
      `Pengawas diubah menjadi: ${updatedSlot.invigilator1Name || '-'}${
        updatedSlot.invigilator2Name ? ` & ${updatedSlot.invigilator2Name}` : ''
      }. Mapel: ${updatedSlot.subjectName}.`,
      ['GURU', 'PANITIA']
    );
    setChangeLogs((prev) => [log, ...prev]);
    setNotifications((prev) => [notification, ...prev]);

    setEditingSlot(null);
  };

  // Handler: Single Slot Delete
  const handleDeleteSlot = (slotId: string) => {
    const target = slots.find((s) => s.id === slotId);
    if (!target) return;

    if (confirm(`Hapus sesi ujian ${target.dateStr} Sesi ${target.sessionIndex} (${target.roomName})?`)) {
      setSlots((prev) => prev.filter((s) => s.id !== slotId));

      const { log, notification } = createScheduleChangeLog(
        'DELETE',
        `Penghapusan Sesi ${target.dateStr} (${target.roomName})`,
        `Sesi ujian ${target.subjectName} pada ${target.dateStr} Sesi ${target.sessionIndex} telah dihapus dari sistem.`,
        ['GURU', 'SISWA', 'PANITIA']
      );
      setChangeLogs((prev) => [log, ...prev]);
      setNotifications((prev) => [notification, ...prev]);
    }
  };

  // Handler: Multiple Slots Delete
  const handleDeleteMultipleSlots = (slotIds: string[]) => {
    setSlots((prev) => prev.filter((s) => !slotIds.includes(s.id)));
    const { log, notification } = createScheduleChangeLog(
      'DELETE',
      `Penghapusan Massal (${slotIds.length} Sesi Terpilih)`,
      `${slotIds.length} sesi jadwal ujian telah berhasil dihapus dari sistem secara bersamaan.`,
      ['GURU', 'SISWA', 'PANITIA']
    );
    setChangeLogs((prev) => [log, ...prev]);
    setNotifications((prev) => [notification, ...prev]);
  };

  // Handler: Comprehensive Delete Mode
  const handleConfirmDelete = (
    mode: 'ALL' | 'BY_DAY' | 'BY_SESSION' | 'CLEAR_INVIGILATORS',
    param?: string | number
  ) => {
    if (mode === 'ALL') {
      setSlots([]);
      const { log, notification } = createScheduleChangeLog(
        'DELETE',
        'Reset Total Seluruh Jadwal Ujian',
        'Seluruh daftar jadwal dan penugasan pengawas telah dihapus dan disinkronkan ke sistem utama.',
        ['GURU', 'SISWA', 'PANITIA']
      );
      setChangeLogs((prev) => [log, ...prev]);
      setNotifications((prev) => [notification, ...prev]);
    } else if (mode === 'BY_DAY') {
      const dayStr = String(param);
      setSlots((prev) => prev.filter((s) => s.dateStr !== dayStr));
      const { log, notification } = createScheduleChangeLog(
        'DELETE',
        `Penghapusan Jadwal Hari ${dayStr}`,
        `Semua sesi ujian pada tanggal ${dayStr} telah dihapus dari sistem.`,
        ['GURU', 'SISWA', 'PANITIA']
      );
      setChangeLogs((prev) => [log, ...prev]);
      setNotifications((prev) => [notification, ...prev]);
    } else if (mode === 'BY_SESSION') {
      const sessIdx = Number(param);
      setSlots((prev) => prev.filter((s) => s.sessionIndex !== sessIdx));
      const { log, notification } = createScheduleChangeLog(
        'DELETE',
        `Penghapusan Sesi ${sessIdx}`,
        `Semua sesi ujian ke-${sessIdx} di seluruh hari telah dihapus.`,
        ['GURU', 'SISWA', 'PANITIA']
      );
      setChangeLogs((prev) => [log, ...prev]);
      setNotifications((prev) => [notification, ...prev]);
    } else if (mode === 'CLEAR_INVIGILATORS') {
      setSlots((prev) =>
        prev.map((s) => ({
          ...s,
          invigilator1Id: undefined,
          invigilator1Name: undefined,
          invigilator2Id: undefined,
          invigilator2Name: undefined,
        }))
      );
      const { log, notification } = createScheduleChangeLog(
        'UPDATE',
        'Pengosongan Alokasi Pengawas',
        'Data penugasan pengawas telah dikosongkan. Struktur mapel dan ruang tetap dipertahankan untuk alokasi ulang.',
        ['GURU', 'PANITIA']
      );
      setChangeLogs((prev) => [log, ...prev]);
      setNotifications((prev) => [notification, ...prev]);
    }

    setIsDeleteModalOpen(false);
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Header & Navigation */}
      <Header
        config={config}
        slotsCount={slots.length}
        teachersCount={teachers.filter((t) => t.isAvailable).length}
        unreadNotifsCount={unreadNotifsCount}
        fairnessScore={overallStats.balanceFairnessScore}
        hasConflicts={conflicts.some((c) => c.severity === 'error' || c.severity === 'warning')}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openGoogleSheetsModal={() => setActiveTab('export')}
      />

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'schedule' && (
          <ScheduleMasterTable
            slots={slots}
            teachers={teachers}
            subjects={subjects}
            classes={classes}
            rooms={rooms}
            config={config}
            onEditSlot={(slot) => setEditingSlot(slot)}
            onDeleteSlot={handleDeleteSlot}
            onDeleteMultipleSlots={handleDeleteMultipleSlots}
            onOpenDeleteModal={() => setIsDeleteModalOpen(true)}
            onOpenGenerator={() => setActiveTab('generator')}
          />
        )}

        {activeTab === 'generator' && (
          <AutoSchedulerSettings
            config={config}
            setConfig={setConfig}
            teachers={teachers}
            rooms={rooms}
            classes={classes}
            subjects={subjects}
            onGenerate={handleRunGenerator}
            isGenerating={isGenerating}
            slotsCount={slots.length}
          />
        )}

        {activeTab === 'workload' && (
          <WorkloadDashboard
            teacherStats={teacherStats}
            teachers={teachers}
            config={config}
            overallStats={overallStats}
            conflicts={conflicts}
          />
        )}

        {activeTab === 'master' && (
          <MasterDataTab
            teachers={teachers}
            setTeachers={setTeachers}
            rooms={rooms}
            setRooms={setRooms}
            classes={classes}
            setClasses={setClasses}
            subjects={subjects}
            setSubjects={setSubjects}
            students={students}
            setStudents={setStudents}
          />
        )}

        {activeTab === 'cards' && (
          <ExamCardsTab
            config={config}
            slots={slots}
            students={students}
            setStudents={setStudents}
            classes={classes}
            rooms={rooms}
          />
        )}

        {activeTab === 'notifications' && (
          <NotificationsCenter
            notifications={notifications}
            changeLogs={changeLogs}
            config={config}
            slots={slots}
            teachers={teachers}
            onMarkAllAsRead={handleMarkAllAsRead}
          />
        )}

        {activeTab === 'export' && (
          <ExportSyncModal
            config={config}
            slots={slots}
            teachers={teachers}
            teacherStats={teacherStats}
            classes={classes}
            rooms={rooms}
            subjects={subjects}
            students={students}
            onNavigateToCards={() => setActiveTab('cards')}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
          <div>
            <strong>{config.schoolName}</strong> — Sistem Otomatisasi Jadwal & Pengawas Ujian SMP
          </div>
          <div>
            Tahun Ajaran {config.academicYear} ({config.semester}) • Terintegrasi Google Workspace
          </div>
        </div>
      </footer>

      {/* Edit Slot Modal */}
      {editingSlot && (
        <EditSlotModal
          slot={editingSlot}
          allSlots={slots}
          teachers={teachers}
          subjects={subjects}
          classes={classes}
          rooms={rooms}
          config={config}
          onSave={handleSaveSlot}
          onClose={() => setEditingSlot(null)}
        />
      )}

      {/* Delete / Reset Schedule Modal */}
      {isDeleteModalOpen && (
        <DeleteScheduleModal
          slots={slots}
          onConfirmDelete={handleConfirmDelete}
          onClose={() => setIsDeleteModalOpen(false)}
        />
      )}
    </div>
  );
}
