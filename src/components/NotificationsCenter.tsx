import React, { useState, useEffect } from 'react';
import {
  Bell,
  MessageCircle,
  Users,
  GraduationCap,
  History,
  Send,
  CheckCircle2,
  Share2,
  Copy,
  Clock,
  Check,
  AlertCircle,
  Edit3,
  RotateCcw,
  Trash2,
  Plus,
  Eye,
  FileText,
  Sparkles,
  Bold,
  Italic,
  X,
  UserCheck,
} from 'lucide-react';
import { NotificationItem, ScheduleChangeLog, ExamTimeConfig, ExamScheduleSlot, Teacher } from '../types';
import {
  generateTeacherGroupBroadcastMessage,
  generateStudentBroadcastMessage,
  generateTeacherWhatsAppMessage,
  buildWhatsAppLink,
} from '../services/notificationService';

interface NotificationsCenterProps {
  notifications: NotificationItem[];
  changeLogs: ScheduleChangeLog[];
  config: ExamTimeConfig;
  slots: ExamScheduleSlot[];
  teachers: Teacher[];
  onMarkAllAsRead: () => void;
}

export const NotificationsCenter: React.FC<NotificationsCenterProps> = ({
  notifications,
  changeLogs,
  config,
  slots,
  teachers,
  onMarkAllAsRead,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'broadcast' | 'logs' | 'notifications'>('broadcast');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Editable Messages State
  const [teacherMsg, setTeacherMsg] = useState<string>('');
  const [studentMsg, setStudentMsg] = useState<string>('');
  const [isTeacherEditing, setIsTeacherEditing] = useState<boolean>(false);
  const [isStudentEditing, setIsStudentEditing] = useState<boolean>(false);

  // Template Type Switchers
  const [teacherTemplateType, setTeacherTemplateType] = useState<string>('full_schedule');
  const [studentTemplateType, setStudentTemplateType] = useState<string>('full_schedule');

  // Custom User Snippets with Add / Delete
  const [customSnippets, setCustomSnippets] = useState<Array<{ id: string; target: 'teacher' | 'student' | 'all'; title: string; content: string }>>([
    {
      id: 'snip-1',
      target: 'teacher',
      title: '📌 Tata Tertib Pengawas',
      content: '📌 *Tata Tertib Pengawas:*\n1. Hadir di Ruang Panitia 15 menit sebelum ujian dimulai.\n2. Mengambil berkas naskah soal dan daftar hadir di meja panitia piket.\n3. Mengisi berita acara dan memverifikasi identitas peserta di ruang kelas.',
    },
    {
      id: 'snip-2',
      target: 'teacher',
      title: '⚠️ Konfirmasi Izin',
      content: '⚠️ *Konfirmasi Izin / Berhalangan:*\nBagi Bpk/Ibu yang berhalangan hadir harap segera menghubungi Panitia Ujian minimal 1 hari sebelumnya untuk penugasan pengawas pengganti.',
    },
    {
      id: 'snip-3',
      target: 'teacher',
      title: '☕ Ruang Transit',
      content: '☕ *Konsumsi & Tempat Istirahat:*\nRuang Transit Pengawas dan konsumsi disediakan di Ruang Guru / Panitia Ujian.',
    },
    {
      id: 'snip-4',
      target: 'student',
      title: '🎽 Aturan Seragam',
      content: '🎽 *Ketentuan Seragam:*\n- Senin & Selasa: OSIS Putih Biru Lengkap + Dasi\n- Rabu & Kamis: Batik Sekolah / Khas\n- Jumat: Pramuka Lengkap / Busana Muslim',
    },
    {
      id: 'snip-5',
      target: 'student',
      title: '🚫 Larangan HP & Jam',
      content: '🚫 *Larangan Selama Ujian:*\n1. Dilarang membawa HP / Smartwatch ke dalam ruang ujian (wajib ditaruh di tas depan kelas).\n2. Dilarang meminjam alat tulis saat ujian berlangsung.\n3. Dilarang saling berdiskusi atau berbuat curang.',
    },
    {
      id: 'snip-6',
      target: 'student',
      title: '🎯 Wajib Kartu Ujian',
      content: '🎯 *Kartu Peserta Ujian:*\nSeluruh siswa wajib mencetak dan membawa Kartu Peserta Ujian setiap hari serta meletakkannya di sudut kanan atas meja ujian.',
    },
  ]);

  // Modal State for Adding New Snippet
  const [isAddSnippetOpen, setIsAddSnippetOpen] = useState<boolean>(false);
  const [newSnippetTarget, setNewSnippetTarget] = useState<'teacher' | 'student' | 'all'>('teacher');
  const [newSnippetTitle, setNewSnippetTitle] = useState<string>('');
  const [newSnippetContent, setNewSnippetContent] = useState<string>('');

  // Individual Teacher Slip Modal State
  const [selectedTeacherForSlip, setSelectedTeacherForSlip] = useState<Teacher | null>(null);
  const [customPersonalMsg, setCustomPersonalMsg] = useState<string>('');
  const [isCustomSlipModalOpen, setIsCustomSlipModalOpen] = useState<boolean>(false);

  // Sync / Initialize generated messages
  useEffect(() => {
    const generatedTeacher = generateTeacherGroupBroadcastMessage(config, slots);
    const generatedStudent = generateStudentBroadcastMessage(config, slots);
    setTeacherMsg(generatedTeacher);
    setStudentMsg(generatedStudent);
  }, [config, slots]);

  const handleResetTeacherMsg = (template: string = 'full_schedule') => {
    if (template === 'h_minus_1') {
      setTeacherMsg(
        `*⏰ PENGINGAT H-1 PELAKSANAAN UJIAN*\n*${config.schoolName}*\n\nBapak/Ibu Guru & Karyawan Pengawas Ujian,\n\nDiingatkan kembali bahwa besok adalah pelaksanaan *${config.examType.toUpperCase()}*. Mohon hadir di Ruang Panitia 15 menit sebelum sesi pertama dimulai.\n\n_Panitia Ujian ${config.schoolName}_`
      );
    } else if (template === 'revision') {
      setTeacherMsg(
        `*📢 PEMBERITAHUAN REVISI JADWAL PENGAWAS*\n*${config.schoolName}*\n\nBapak/Ibu Pengawas Ujian yang terhormat,\n\nTerdapat penyesuaian jadwal tugas pengawas ujian. Mohon memeriksa kembali rincian jadwal terbaru pada sistem.\n\n_Panitia Ujian ${config.schoolName}_`
      );
    } else {
      const defaultMsg = generateTeacherGroupBroadcastMessage(config, slots);
      setTeacherMsg(defaultMsg);
    }
  };

  const handleResetStudentMsg = (template: string = 'full_schedule') => {
    if (template === 'h_minus_1') {
      setStudentMsg(
        `*⏰ PENGINGAT H-1 UNTUK SISWA & WALI MURID*\n*${config.schoolName}*\n\nKepada seluruh siswa dan orang tua/wali,\n\nDiingatkan kembali bahwa besok ujian *${config.examType.toUpperCase()}* dimulai pukul ${config.startTime} WIB. Pastikan:\n1. Membawa Kartu Peserta Ujian resmi.\n2. Mengenakan seragam lengkap & rapi.\n3. Datang 15 menit lebih awal.\n\n_Semoga sukses dan lancar!_`
      );
    } else if (template === 'room_info') {
      setStudentMsg(
        `*🪑 INFORMASI RUANGAN & DENAH UJIAN*\n*${config.schoolName}*\n\nKepada seluruh siswa,\n\nDenah ruang dan nomor meja ujian telah ditetapkan. Pastikan kalian memeriksa nomor ruang dan nomor kursi pada Kartu Ujian masing-masing sebelum memasuki ruang tes.\n\n_Panitia Ujian ${config.schoolName}_`
      );
    } else {
      const defaultMsg = generateStudentBroadcastMessage(config, slots);
      setStudentMsg(defaultMsg);
    }
  };

  const handleSaveNewSnippet = () => {
    if (!newSnippetTitle.trim() || !newSnippetContent.trim()) {
      alert('Judul dan isi catatan tidak boleh kosong.');
      return;
    }
    const newSnip = {
      id: `snip-${Date.now()}`,
      target: newSnippetTarget,
      title: newSnippetTitle.trim(),
      content: newSnippetContent.trim(),
    };
    setCustomSnippets([...customSnippets, newSnip]);
    setNewSnippetTitle('');
    setNewSnippetContent('');
    setIsAddSnippetOpen(false);
  };

  const handleDeleteSnippet = (id: string) => {
    setCustomSnippets(customSnippets.filter((s) => s.id !== id));
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleOpenWhatsApp = (text: string) => {
    const link = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(link, '_blank');
  };

  const handleInsertSnippet = (
    target: 'teacher' | 'student' | 'personal',
    snippet: string
  ) => {
    if (target === 'teacher') {
      setTeacherMsg((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
    } else if (target === 'student') {
      setStudentMsg((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
    } else if (target === 'personal') {
      setCustomPersonalMsg((prev) => (prev ? `${prev}\n\n${snippet}` : snippet));
    }
  };

  const handleFormatText = (target: 'teacher' | 'student', wrapper: string) => {
    if (target === 'teacher') {
      setTeacherMsg((prev) => `${prev} ${wrapper}Teks${wrapper} `);
    } else {
      setStudentMsg((prev) => `${prev} ${wrapper}Teks${wrapper} `);
    }
  };

  const handleOpenPersonalSlip = (teacher: Teacher) => {
    const msg = generateTeacherWhatsAppMessage(config, teacher, slots);
    setSelectedTeacherForSlip(teacher);
    setCustomPersonalMsg(msg);
    setIsCustomSlipModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Sub Tabs */}
      <div className="flex space-x-2 border-b border-slate-200 pb-3">
        <button
          onClick={() => setActiveSubTab('broadcast')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'broadcast'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Share2 className="w-4 h-4" />
          <span>Broadcast Civitas Sekolah</span>
        </button>

        <button
          onClick={() => setActiveSubTab('logs')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'logs'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Riwayat Perubahan Jadwal ({changeLogs.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('notifications')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'notifications'
              ? 'bg-indigo-600 text-white shadow-xs'
              : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Notifikasi Sistem ({notifications.length})</span>
        </button>
      </div>

      {/* SubTab 1: Broadcast Civitas */}
      {activeSubTab === 'broadcast' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">
                  Pusat Notifikasi & Distribusi Pesan Otomatis WhatsApp
                </h3>
                <p className="text-xs text-slate-500">
                  Edit, sesuaikan, tambahkan catatan khusus, atau hapus bagian pesan sebelum dibagikan ke WhatsApp Grup Guru dan Siswa.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                  {slots.length} Sesi Terjadwal
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Broadcast Guru */}
              <div className="p-4.5 rounded-2xl border border-indigo-200 bg-indigo-50/40 flex flex-col justify-between space-y-3.5">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-indigo-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          Pesan Grup WhatsApp Guru
                        </span>
                        <span className="text-[10px] text-slate-500">Bapak/Ibu Guru & Karyawan</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsTeacherEditing(!isTeacherEditing)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          isTeacherEditing
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                        }`}
                      >
                        {isTeacherEditing ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Pratinjau</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit / Ubah Pesan</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetTeacherMsg(teacherTemplateType)}
                        title="Kembalikan pesan ke template otomatis sesuai jadwal terbaru"
                        className="p-1.5 bg-white hover:bg-indigo-100 text-slate-600 hover:text-indigo-700 rounded-lg border border-indigo-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Template Picker & Snippets Toolbar */}
                  <div className="space-y-2 py-2">
                    {/* Template Preset Selector */}
                    <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase shrink-0">Template:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherTemplateType('full_schedule');
                          handleResetTeacherMsg('full_schedule');
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer shrink-0 transition-colors ${
                          teacherTemplateType === 'full_schedule'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        📋 Jadwal Lengkap
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherTemplateType('h_minus_1');
                          handleResetTeacherMsg('h_minus_1');
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer shrink-0 transition-colors ${
                          teacherTemplateType === 'h_minus_1'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        ⏰ Pengingat H-1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setTeacherTemplateType('revision');
                          handleResetTeacherMsg('revision');
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer shrink-0 transition-colors ${
                          teacherTemplateType === 'revision'
                            ? 'bg-indigo-600 text-white border-indigo-600'
                            : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        📢 Revisi Jadwal
                      </button>
                    </div>

                    {/* Snippet Badges (Add / Insert / Delete) */}
                    <div className="bg-white/95 p-2 rounded-xl border border-indigo-100 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-900 uppercase">
                          + Sisipkan Bagian Pesan:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSnippetTarget('teacher');
                            setIsAddSnippetOpen(true);
                          }}
                          className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Buat Catatan Baru</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {customSnippets
                          .filter((s) => s.target === 'teacher' || s.target === 'all')
                          .map((snip) => (
                            <div
                              key={snip.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold rounded-md border border-indigo-200 text-[10.5px]"
                            >
                              <button
                                type="button"
                                onClick={() => handleInsertSnippet('teacher', snip.content)}
                                className="cursor-pointer hover:underline"
                                title="Klik untuk menyisipkan ke pesan"
                              >
                                {snip.title}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSnippet(snip.id)}
                                title="Hapus catatan ini"
                                className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Text Formatting Controls when editing */}
                      {isTeacherEditing && (
                        <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400 font-semibold">Format:</span>
                          <button
                            type="button"
                            onClick={() => handleFormatText('teacher', '*')}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 font-bold rounded"
                            title="Tebal (*teks*)"
                          >
                            *B*
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('teacher', '_')}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 italic font-serif rounded"
                            title="Miring (_teks_)"
                          >
                            _I_
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('teacher', '~')}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 line-through rounded"
                            title="Coret (~teks~)"
                          >
                            ~S~
                          </button>
                          <button
                            type="button"
                            onClick={() => setTeacherMsg('')}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded ml-auto flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Kosongkan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Message Body: Textarea (Editing) or Pre (Preview) */}
                  {isTeacherEditing ? (
                    <div className="relative mt-1">
                      <textarea
                        rows={11}
                        value={teacherMsg}
                        onChange={(e) => setTeacherMsg(e.target.value)}
                        placeholder="Ketik atau edit pesan WhatsApp grup guru di sini..."
                        className="w-full p-3 rounded-xl border border-indigo-300 bg-white text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-indigo-500 shadow-inner"
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                        <span>
                          {teacherMsg.length} Karakter • {teacherMsg.split(/\s+/).filter(Boolean).length} Kata
                        </span>
                        <span className="text-indigo-600 font-semibold">Mode Edit Aktif</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="bg-white p-3.5 rounded-xl border border-indigo-100 text-[11px] font-mono text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                        {teacherMsg || (
                          <span className="text-slate-400 italic">
                            (Pesan masih kosong. Klik 'Edit Pesan' untuk menulis pesan atau klik tombol reset untuk memuat pesan otomatis).
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                        <span>
                          {teacherMsg.length} Karakter • {teacherMsg.split(/\s+/).filter(Boolean).length} Kata
                        </span>
                        <span className="text-slate-400">Pratinjau Teks Siap Kirim</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-indigo-100">
                  <button
                    onClick={() => handleCopy(teacherMsg, 'teacher-broadcast')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    {copiedId === 'teacher-broadcast' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(teacherMsg)}
                    disabled={!teacherMsg.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim ke Grup WA Guru</span>
                  </button>
                </div>
              </div>

              {/* Broadcast Siswa */}
              <div className="p-4.5 rounded-2xl border border-blue-200 bg-blue-50/40 flex flex-col justify-between space-y-3.5">
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-blue-100">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shadow-xs">
                        <GraduationCap className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs block">
                          Pesan Grup WhatsApp Siswa & Wali
                        </span>
                        <span className="text-[10px] text-slate-500">Seluruh Kelas 7, 8, & 9</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setIsStudentEditing(!isStudentEditing)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                          isStudentEditing
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-100'
                        }`}
                      >
                        {isStudentEditing ? (
                          <>
                            <Eye className="w-3.5 h-3.5" />
                            <span>Lihat Pratinjau</span>
                          </>
                        ) : (
                          <>
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Edit / Ubah Pesan</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() => handleResetStudentMsg(studentTemplateType)}
                        title="Kembalikan pesan ke template otomatis sesuai jadwal terbaru"
                        className="p-1.5 bg-white hover:bg-blue-100 text-slate-600 hover:text-blue-700 rounded-lg border border-blue-200 transition-colors cursor-pointer"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Template Picker & Snippets Toolbar */}
                  <div className="space-y-2 py-2">
                    {/* Template Preset Selector */}
                    <div className="flex items-center gap-1.5 text-[11px] overflow-x-auto pb-1">
                      <span className="text-[10px] font-bold text-blue-900 uppercase shrink-0">Template:</span>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentTemplateType('full_schedule');
                          handleResetStudentMsg('full_schedule');
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer shrink-0 transition-colors ${
                          studentTemplateType === 'full_schedule'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        📋 Jadwal Lengkap
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentTemplateType('h_minus_1');
                          handleResetStudentMsg('h_minus_1');
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer shrink-0 transition-colors ${
                          studentTemplateType === 'h_minus_1'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        ⏰ Pengingat H-1
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setStudentTemplateType('room_info');
                          handleResetStudentMsg('room_info');
                        }}
                        className={`px-2 py-1 rounded-md text-[11px] font-semibold border cursor-pointer shrink-0 transition-colors ${
                          studentTemplateType === 'room_info'
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-blue-700 border-blue-200 hover:bg-blue-50'
                        }`}
                      >
                        🪑 Info Ruang Ujian
                      </button>
                    </div>

                    {/* Snippet Badges (Add / Insert / Delete) */}
                    <div className="bg-white/95 p-2 rounded-xl border border-blue-100 text-[11px] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-900 uppercase">
                          + Sisipkan Bagian Pesan:
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            setNewSnippetTarget('student');
                            setIsAddSnippetOpen(true);
                          }}
                          className="text-[10px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-0.5 cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>Buat Catatan Baru</span>
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5">
                        {customSnippets
                          .filter((s) => s.target === 'student' || s.target === 'all')
                          .map((snip) => (
                            <div
                              key={snip.id}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-800 font-semibold rounded-md border border-blue-200 text-[10.5px]"
                            >
                              <button
                                type="button"
                                onClick={() => handleInsertSnippet('student', snip.content)}
                                className="cursor-pointer hover:underline"
                                title="Klik untuk menyisipkan ke pesan"
                              >
                                {snip.title}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSnippet(snip.id)}
                                title="Hapus catatan ini"
                                className="text-slate-400 hover:text-rose-600 cursor-pointer ml-0.5"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ))}
                      </div>

                      {/* Text Formatting Controls when editing */}
                      {isStudentEditing && (
                        <div className="flex items-center gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                          <span className="text-slate-400 font-semibold">Format:</span>
                          <button
                            type="button"
                            onClick={() => handleFormatText('student', '*')}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 font-bold rounded"
                            title="Tebal (*teks*)"
                          >
                            *B*
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('student', '_')}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 italic font-serif rounded"
                            title="Miring (_teks_)"
                          >
                            _I_
                          </button>
                          <button
                            type="button"
                            onClick={() => handleFormatText('student', '~')}
                            className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 line-through rounded"
                            title="Coret (~teks~)"
                          >
                            ~S~
                          </button>
                          <button
                            type="button"
                            onClick={() => setStudentMsg('')}
                            className="px-1.5 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold rounded ml-auto flex items-center gap-1"
                          >
                            <Trash2 className="w-2.5 h-2.5" />
                            <span>Kosongkan</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Main Message Body: Textarea (Editing) or Pre (Preview) */}
                  {isStudentEditing ? (
                    <div className="relative mt-1">
                      <textarea
                        rows={11}
                        value={studentMsg}
                        onChange={(e) => setStudentMsg(e.target.value)}
                        placeholder="Ketik atau edit pesan WhatsApp grup siswa dan orang tua di sini..."
                        className="w-full p-3 rounded-xl border border-blue-300 bg-white text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-blue-500 shadow-inner"
                      />
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                        <span>
                          {studentMsg.length} Karakter • {studentMsg.split(/\s+/).filter(Boolean).length} Kata
                        </span>
                        <span className="text-blue-600 font-semibold">Mode Edit Aktif</span>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-1">
                      <div className="bg-white p-3.5 rounded-xl border border-blue-100 text-[11px] font-mono text-slate-700 max-h-64 overflow-y-auto whitespace-pre-wrap leading-relaxed shadow-inner">
                        {studentMsg || (
                          <span className="text-slate-400 italic">
                            (Pesan masih kosong. Klik 'Edit Pesan' untuk menulis pesan atau klik tombol reset untuk memuat pesan otomatis).
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 px-1">
                        <span>
                          {studentMsg.length} Karakter • {studentMsg.split(/\s+/).filter(Boolean).length} Kata
                        </span>
                        <span className="text-slate-400">Pratinjau Teks Siap Kirim</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center gap-2 pt-2 border-t border-blue-100">
                  <button
                    onClick={() => handleCopy(studentMsg, 'student-broadcast')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                  >
                    {copiedId === 'student-broadcast' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Pesan</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => handleOpenWhatsApp(studentMsg)}
                    disabled={!studentMsg.trim()}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Kirim ke Grup Siswa & Ortu</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Individual Teachers Dispatch List with Custom Edit & Preview Modal */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">
                  Slip Jadwal Mandiri Guru Pengawas (Kirim Personal WhatsApp)
                </h4>
                <p className="text-xs text-slate-500">
                  Klik tombol pesan pada guru untuk melihat, mengedit pesan slip tugas khusus, atau langsung mengirimkannya melalui WhatsApp personal.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {teachers.map((teacher) => {
                const teacherSlots = slots.filter(
                  (s) => s.invigilator1Id === teacher.id || s.invigilator2Id === teacher.id
                );
                return (
                  <div
                    key={teacher.id}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/20 transition-all flex items-center justify-between text-xs gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <span className="font-bold text-slate-900 block truncate">{teacher.name}</span>
                      <span className="text-[11px] text-slate-500 block truncate">
                        {teacherSlots.length} Sesi Tugas • {teacher.phone || 'Tanpa No. HP'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => handleOpenPersonalSlip(teacher)}
                        disabled={teacherSlots.length === 0}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 disabled:opacity-30 text-emerald-700 font-semibold text-xs transition-colors cursor-pointer flex items-center gap-1"
                        title="Buka & Sesuaikan Slip Guru Ini"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Kirim WA</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SubTab 2: Change Logs */}
      {activeSubTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">
              Log Audit Perubahan Jadwal & Pengawas
            </h3>
            <p className="text-xs text-slate-500">
              Riwayat kronologis setiap perubahan jadwal yang tersinkronisasi langsung ke sistem
            </p>
          </div>

          {changeLogs.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Belum ada riwayat perubahan jadwal tercatat.
            </div>
          ) : (
            <div className="space-y-3">
              {changeLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/60 flex items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[10px] ${
                          log.type === 'GENERATE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.type === 'DELETE'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-indigo-100 text-indigo-800'
                        }`}
                      >
                        {log.type}
                      </span>
                      <span className="font-bold text-slate-900">{log.description}</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">{log.details}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <span className="text-[10px] text-slate-400">Sasaran:</span>
                      {log.affectedParties.map((p) => (
                        <span key={p} className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>

                  <span className="text-[11px] font-mono text-slate-400 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SubTab 3: In-App Notifications */}
      {activeSubTab === 'notifications' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Notifikasi Sistem</h3>
              <p className="text-xs text-slate-500">Pemberitahuan perubahan yang relevan bagi seluruh civitas</p>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={onMarkAllAsRead}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
              >
                Tandai Semua Sudah Dibaca
              </button>
            )}
          </div>

          <div className="space-y-2">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`p-3.5 rounded-xl border flex items-start gap-3 transition-colors ${
                  notif.isRead
                    ? 'bg-white border-slate-200'
                    : 'bg-indigo-50/50 border-indigo-200'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-indigo-600 mt-1.5 shrink-0" />
                <div className="flex-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h5 className="font-bold text-slate-900">{notif.title}</h5>
                    <span className="text-[10px] font-mono text-slate-400">{notif.timestamp}</span>
                  </div>
                  <p className="text-slate-600 mt-0.5">{notif.message}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Custom Personal Teacher Slip Modal */}
      {isCustomSlipModalOpen && selectedTeacherForSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-xl w-full p-5 shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">
                    Slip WhatsApp Personal: {selectedTeacherForSlip.name}
                  </h4>
                  <span className="text-xs text-slate-500">
                    No. Tujuan: {selectedTeacherForSlip.phone || '081234567890'}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setIsCustomSlipModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3">
              <div className="flex items-center justify-between text-xs">
                <label className="font-bold text-slate-700">
                  Teks Pesan WhatsApp Personal (Bisa Ditambah / Diedit):
                </label>
                <button
                  type="button"
                  onClick={() => {
                    const defaultMsg = generateTeacherWhatsAppMessage(
                      config,
                      selectedTeacherForSlip,
                      slots
                    );
                    setCustomPersonalMsg(defaultMsg);
                  }}
                  className="text-indigo-600 hover:text-indigo-800 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default</span>
                </button>
              </div>

              <textarea
                rows={10}
                value={customPersonalMsg}
                onChange={(e) => setCustomPersonalMsg(e.target.value)}
                className="w-full p-3 rounded-xl border border-slate-300 bg-slate-50 text-xs font-mono text-slate-800 leading-relaxed focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />

              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="text-[10px] font-bold text-slate-500 uppercase">+ Tambah Catatan:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleInsertSnippet(
                      'personal',
                      '📌 *Catatan Tambahan:* Mohon pastikan membawa pulpen hitam dan spidol untuk koreksi berkas ujian.'
                    )
                  }
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md border border-slate-200 cursor-pointer"
                >
                  + Pulpen & Spidol
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleInsertSnippet(
                      'personal',
                      '☕ *Ruang Transit Pengawas:* Ruang Guru Lt. 1 telah disiapkan untuk tempat istirahat antar sesi.'
                    )
                  }
                  className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-md border border-slate-200 cursor-pointer"
                >
                  + Info Ruang Transit
                </button>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsCustomSlipModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer"
              >
                Tutup
              </button>

              <button
                type="button"
                onClick={() => handleCopy(customPersonalMsg, 'personal-slip')}
                className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-lg border border-slate-200 cursor-pointer flex items-center gap-1.5"
              >
                {copiedId === 'personal-slip' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Tersalin!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  const link = buildWhatsAppLink(
                    selectedTeacherForSlip.phone || '081234567890',
                    customPersonalMsg
                  );
                  window.open(link, '_blank');
                  setIsCustomSlipModalOpen(false);
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Buka WhatsApp & Kirim</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Buat Catatan / Snippet Baru */}
      {isAddSnippetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Tambah Bagian Pesan Baru</h4>
                  <p className="text-xs text-slate-500">Buat catatan atau aturan khusus untuk WhatsApp</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddSnippetOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Target Pesan:</label>
                <select
                  value={newSnippetTarget}
                  onChange={(e) => setNewSnippetTarget(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 font-semibold"
                >
                  <option value="teacher">Grup WhatsApp Guru</option>
                  <option value="student">Grup WhatsApp Siswa & Wali</option>
                  <option value="all">Keduanya (Guru & Siswa)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Tombol Catatan:</label>
                <input
                  type="text"
                  placeholder="Misal: 📢 Ketentuan Masker & Kesehatan"
                  value={newSnippetTitle}
                  onChange={(e) => setNewSnippetTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 rounded-lg border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Isi Teks Pesan WhatsApp:</label>
                <textarea
                  rows={4}
                  placeholder="Tuliskan teks lengkap yang akan disisipkan ke pesan..."
                  value={newSnippetContent}
                  onChange={(e) => setNewSnippetContent(e.target.value)}
                  className="w-full p-3 bg-slate-50 rounded-lg border border-slate-300 font-mono text-xs focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsAddSnippetOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveNewSnippet}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs cursor-pointer"
              >
                Simpan Bagian Pesan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
