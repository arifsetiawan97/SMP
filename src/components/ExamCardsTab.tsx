import React, { useState, useMemo } from 'react';
import {
  Printer,
  Download,
  Search,
  Filter,
  GraduationCap,
  Sparkles,
  Building2,
  Users,
  CheckCircle2,
  FileText,
  Clock,
  QrCode,
  MapPin,
  User,
  ShieldCheck,
  RotateCcw,
  Sliders,
  Layers,
  X,
  Check,
  HelpCircle,
  BarChart2,
  Shuffle,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  ExamTimeConfig,
  ExamScheduleSlot,
  Student,
  ClassRoom,
  ExamRoom,
  StudentAllocationOptions,
  RoomAllocationResultSummary,
} from '../types';
import {
  generateExamCardsPDF,
  generateSingleStudentCardPDF,
  generateRoomAttendancePDF,
} from '../services/exportService';
import { allocateStudentsToRooms } from '../services/scheduleAlgorithm';

interface ExamCardsTabProps {
  config: ExamTimeConfig;
  slots: ExamScheduleSlot[];
  students: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  classes: ClassRoom[];
  rooms: ExamRoom[];
  onOpenImporter?: () => void;
}

export const ExamCardsTab: React.FC<ExamCardsTabProps> = ({
  config,
  slots,
  students,
  setStudents,
  classes,
  rooms,
}) => {
  const [selectedClassId, setSelectedClassId] = useState<string>('all');
  const [selectedRoomName, setSelectedRoomName] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [previewStudentId, setPreviewStudentId] = useState<string | null>(
    students.length > 0 ? students[0].id : null
  );

  // Generator Modal State
  const [isGeneratorModalOpen, setIsGeneratorModalOpen] = useState<boolean>(false);
  const [allocationOptions, setAllocationOptions] = useState<StudentAllocationOptions>({
    mode: 'equal_rooms',
    capacityPerRoom: 20,
    genderBalance: 'equal_gender',
    mixingMethod: 'cross_class',
    sortOrder: 'name_asc',
    seatNumberingPrefix: '',
    selectedRoomIds: rooms.filter((r) => r.isActive).map((r) => r.id),
    targetGrade: 'all',
  });

  // Calculate real-time allocation simulation
  const allocationSimulation = useMemo(() => {
    try {
      if (!students || students.length === 0 || !rooms || rooms.length === 0) {
        return { updatedStudents: [], summaries: [], unallocatedCount: 0 };
      }
      return allocateStudentsToRooms(students, rooms, classes, allocationOptions);
    } catch {
      return { updatedStudents: [], summaries: [], unallocatedCount: 0 };
    }
  }, [students, rooms, classes, allocationOptions]);

  // Filter students based on selection
  const filteredStudents = students.filter((s) => {
    const matchClass = selectedClassId === 'all' || s.classId === selectedClassId;
    const matchRoom = selectedRoomName === 'all' || s.roomName === selectedRoomName;
    const matchSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.includes(searchQuery) ||
      s.nis.includes(searchQuery);
    return matchClass && matchRoom && matchSearch;
  });

  const currentPreviewStudent =
    students.find((s) => s.id === previewStudentId) || filteredStudents[0] || students[0];

  const handleApplyAllocation = () => {
    if (!setStudents) {
      alert('Fungsi update siswa tidak tersedia.');
      return;
    }
    if (allocationSimulation.updatedStudents.length === 0) {
      alert('Tidak ada siswa yang dialokasikan.');
      return;
    }

    setStudents(allocationSimulation.updatedStudents);
    setIsGeneratorModalOpen(false);
    confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
  };

  const handleDownloadAllCards = () => {
    if (students.length === 0) {
      alert('Data siswa belum tersedia.');
      return;
    }
    setIsExporting(true);
    try {
      generateExamCardsPDF(config, students, slots);
      confetti({ particleCount: 60, spread: 70 });
    } catch (err: any) {
      alert('Gagal mengunduh kartu ujian: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadClassCards = (classId: string) => {
    const targetClass = classes.find((c) => c.id === classId);
    if (!targetClass) return;
    setIsExporting(true);
    try {
      generateExamCardsPDF(config, students, slots, classId);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      alert('Gagal mengunduh kartu kelas: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadSingleCard = (student: Student) => {
    setIsExporting(true);
    try {
      generateSingleStudentCardPDF(config, student, slots);
      confetti({ particleCount: 30, spread: 50 });
    } catch (err: any) {
      alert('Gagal mengunduh kartu siswa: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintRoomAttendance = (roomName?: string) => {
    if (students.length === 0) {
      alert('Data siswa belum tersedia.');
      return;
    }
    setIsExporting(true);
    try {
      generateRoomAttendancePDF(config, students, roomName);
      confetti({ particleCount: 50, spread: 60 });
    } catch (err: any) {
      alert('Gagal mengunduh daftar hadir & denah ruang: ' + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrintCard = () => {
    window.print();
  };

  // Gender counts in current dataset
  const totalMale = students.filter((s) => s.gender === 'L').length;
  const totalFemale = students.filter((s) => s.gender === 'P').length;

  return (
    <div className="space-y-6">
      {/* Top Banner with Generator Trigger */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-sm border border-indigo-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/20">
              <GraduationCap className="w-3.5 h-3.5 text-indigo-300" />
              <span>Sistem Pencetakan & Distribusi Ruangan Kartu Peserta Ujian</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Cetak & Generator Ruangan Kartu Ujian Siswa SMP
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm mt-1.5 leading-relaxed max-w-2xl">
              Atur dan bagikan siswa ke dalam ruangan secara otomatis (seimbang siswa/siswi, sama rata antar ruang, atau silang kelas), lalu cetak kartu peserta dan daftar hadir ruangan resmi.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap">
            {/* Prominent Smart Generator Button */}
            <button
              type="button"
              onClick={() => setIsGeneratorModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer border border-indigo-400/40 hover:scale-[1.02]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Generator Otomatis Ruang & Meja</span>
            </button>

            <button
              id="download-all-exam-cards-btn"
              onClick={handleDownloadAllCards}
              disabled={isExporting || students.length === 0}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Unduh Semua Kartu (PDF)</span>
            </button>

            <button
              type="button"
              onClick={() => handlePrintRoomAttendance()}
              disabled={isExporting || students.length === 0}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer border border-slate-700"
            >
              <FileText className="w-4 h-4 text-amber-300" />
              <span>Daftar Hadir & Denah Ruang</span>
            </button>

            <button
              id="print-exam-cards-btn"
              onClick={handlePrintCard}
              className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer border border-slate-700"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Kartu</span>
            </button>
          </div>
        </div>

        {/* Quick Student Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-indigo-800/80 text-xs">
          <div className="bg-indigo-950/70 p-3 rounded-xl border border-indigo-800/80">
            <span className="text-indigo-300 block">Total Siswa Terdaftar</span>
            <span className="text-base font-bold text-white mt-0.5">
              {students.length} Siswa ({totalMale} L / {totalFemale} P)
            </span>
          </div>
          <div className="bg-indigo-950/70 p-3 rounded-xl border border-indigo-800/80">
            <span className="text-indigo-300 block">Total Rombel Kelas</span>
            <span className="text-base font-bold text-white mt-0.5">{classes.length} Kelas</span>
          </div>
          <div className="bg-indigo-950/70 p-3 rounded-xl border border-indigo-800/80">
            <span className="text-indigo-300 block">Ruang Ujian Digunakan</span>
            <span className="text-base font-bold text-white mt-0.5">
              {new Set(students.map((s) => s.roomName)).size} / {rooms.length} Ruang
            </span>
          </div>
          <div className="bg-indigo-950/70 p-3 rounded-xl border border-indigo-800/80">
            <span className="text-indigo-300 block">Format Tata Letak</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5">2 Kartu / Lembar A4</span>
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Filter and Student Selector List */}
        <div className="lg:col-span-5 space-y-4">
          {/* Filter Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Filter className="w-3.5 h-3.5 text-indigo-600" />
                <span>Filter & Pencarian Siswa</span>
              </span>
              <span className="text-[11px] text-slate-500">{filteredStudents.length} siswa ditemukan</span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari nama siswa, NISN, atau NIS..."
                className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter by Class & Room */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Pilih Kelas:
                </label>
                <select
                  value={selectedClassId}
                  onChange={(e) => setSelectedClassId(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="all">Semua Kelas</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      Kelas {cls.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-600 mb-1">
                  Pilih Ruang:
                </label>
                <select
                  value={selectedRoomName}
                  onChange={(e) => setSelectedRoomName(e.target.value)}
                  className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white"
                >
                  <option value="all">Semua Ruang</option>
                  {rooms.map((rm) => (
                    <option key={rm.id} value={rm.name}>
                      {rm.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Room Attendance PDF Download for filtered room */}
            {selectedRoomName !== 'all' && (
              <button
                type="button"
                onClick={() => handlePrintRoomAttendance(selectedRoomName)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-lg border border-amber-200 transition-colors cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5 text-amber-700" />
                <span>Unduh Daftar Hadir & Denah {selectedRoomName}</span>
              </button>
            )}

            {/* Batch Class Download Buttons */}
            {selectedClassId !== 'all' && (
              <button
                type="button"
                onClick={() => handleDownloadClassCards(selectedClassId)}
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold rounded-lg border border-indigo-200 transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Unduh PDF Khusus Kelas Ini</span>
              </button>
            )}
          </div>

          {/* Student List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden max-h-[520px] flex flex-col">
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Daftar Peserta Ujian</span>
              <span className="text-[11px] font-normal text-slate-500">Klik untuk melihat kartu</span>
            </div>

            <div className="overflow-y-auto divide-y divide-slate-100 flex-1">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Tidak ada data siswa yang cocok dengan filter.
                </div>
              ) : (
                filteredStudents.map((stu) => (
                  <div
                    key={stu.id}
                    onClick={() => setPreviewStudentId(stu.id)}
                    className={`p-3 text-xs flex items-center justify-between cursor-pointer transition-colors ${
                      currentPreviewStudent?.id === stu.id
                        ? 'bg-indigo-50/80 border-l-4 border-indigo-600'
                        : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-1.5">
                        <span>{stu.name}</span>
                        <span
                          className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                            stu.gender === 'P'
                              ? 'bg-pink-100 text-pink-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {stu.gender === 'P' ? 'P' : 'L'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                        <span>NISN: {stu.nisn}</span>
                        <span>•</span>
                        <span>Kelas {stu.className}</span>
                        <span>•</span>
                        <span className="font-semibold text-indigo-600">
                          {stu.roomName} (No. {stu.seatNumber})
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      title="Unduh Kartu Siswa Ini"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadSingleCard(stu);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-white border border-transparent hover:border-slate-200 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Live Official Card Preview (Foto + Identitas + Ruang Ujian) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Pratinjau Resmi Kartu Peserta Ujian</h3>
              </div>

              {currentPreviewStudent && (
                <button
                  type="button"
                  onClick={() => handleDownloadSingleCard(currentPreviewStudent)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF Kartu Ini</span>
                </button>
              )}
            </div>

            {currentPreviewStudent ? (
              <div className="p-6 bg-white rounded-2xl border-2 border-indigo-300 max-w-lg mx-auto shadow-sm text-slate-900 font-sans">
                {/* Official School Header / KOP */}
                <div className="text-center pb-3 border-b-2 border-slate-800">
                  <span className="text-[10px] font-bold text-slate-600 tracking-wider uppercase block">
                    PEMERINTAH KABUPATEN / KOTA • DINAS PENDIDIKAN
                  </span>
                  <h4 className="text-base font-extrabold text-slate-950 uppercase tracking-tight mt-0.5">
                    {config.schoolName}
                  </h4>
                  <div className="inline-block mt-1.5 px-3 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-xs font-extrabold tracking-wide">
                    KARTU PESERTA {config.examType.toUpperCase()}
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    NPSN: {config.schoolNpsn} | Tahun Pelajaran {config.academicYear} ({config.semester})
                  </p>
                </div>

                {/* Main Card Body: Photo, Student Identity, Exam Room */}
                <div className="grid grid-cols-12 gap-4 py-5 items-center">
                  {/* Photo Box */}
                  <div className="col-span-4 flex flex-col items-center justify-center">
                    <div className="w-24 h-32 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 flex flex-col items-center justify-center text-slate-400 shadow-2xs">
                      <User className="w-8 h-8 text-slate-300 mb-1" />
                      <span className="text-[10px] font-bold text-slate-500">FOTO</span>
                      <span className="text-[9px] text-slate-400">3 x 4 cm</span>
                    </div>
                  </div>

                  {/* Student Particulars & Exam Room */}
                  <div className="col-span-8 space-y-2 text-xs">
                    <div className="space-y-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Identitas Peserta Ujian
                      </span>
                      <div className="flex">
                        <span className="w-28 text-slate-500 font-medium">Nama Lengkap</span>
                        <span className="font-extrabold text-slate-950">: {currentPreviewStudent.name}</span>
                      </div>
                      <div className="flex">
                        <span className="w-28 text-slate-500 font-medium">NISN / NIS</span>
                        <span className="font-mono text-slate-800">
                          : {currentPreviewStudent.nisn} / {currentPreviewStudent.nis}
                        </span>
                      </div>
                      <div className="flex">
                        <span className="w-28 text-slate-500 font-medium">Kelas / Rombel</span>
                        <span className="font-bold text-slate-900">: Kelas {currentPreviewStudent.className}</span>
                      </div>
                      <div className="flex">
                        <span className="w-28 text-slate-500 font-medium">Jenis Kelamin</span>
                        <span className="text-slate-800">
                          : {currentPreviewStudent.gender === 'P' ? 'Perempuan (P)' : 'Laki-Laki (L)'}
                        </span>
                      </div>
                    </div>

                    {/* Room & Seat Highlight Box */}
                    <div className="p-2.5 rounded-xl bg-indigo-50/80 border border-indigo-200 mt-2 space-y-1">
                      <span className="text-[10px] font-bold text-indigo-900 uppercase tracking-wider block flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-indigo-600" />
                        Lokasi & Ruang Ujian
                      </span>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Ruang Ujian:</span>
                        <span className="font-extrabold text-indigo-800 text-sm">
                          {currentPreviewStudent.roomName}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-700">Nomor Meja / Kursi:</span>
                        <span className="font-mono font-black text-indigo-950 px-2 py-0.5 rounded bg-white border border-indigo-200">
                          No. {String(currentPreviewStudent.seatNumber).padStart(2, '0')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Signatures & Instructions */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-200 text-[10px] items-end">
                  <div className="text-slate-500 space-y-1">
                    <p className="font-semibold text-slate-700">Tata Tertib Peserta:</p>
                    <p>1. Wajib membawa kartu ujian ini setiap sesi.</p>
                    <p>2. Menempati kursi & ruang sesuai kartu.</p>
                    <p>3. Mengenakan seragam sekolah rapi & sopan.</p>
                  </div>

                  <div className="text-right space-y-0.5">
                    <p className="text-slate-600">Mengetahui,</p>
                    <p className="font-semibold text-slate-900">Kepala {config.schoolName}</p>
                    <div className="h-12 flex items-center justify-end">
                      <span className="text-[9px] text-slate-300 italic">(Tanda Tangan & Cap)</span>
                    </div>
                    <p className="font-bold text-slate-950 underline">{config.headmasterName}</p>
                    <p className="font-mono text-slate-600">NIP. {config.headmasterNip}</p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400">
                Pilih salah satu siswa di sebelah kiri untuk melihat kartu.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SMART STUDENT ROOM & SEAT GENERATOR MODAL */}
      {/* ========================================================================= */}
      {isGeneratorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/80 flex items-center justify-center shadow-inner border border-indigo-400/30">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    Generator Otomatis Penentuan Ruang & Meja Ujian Siswa
                  </h3>
                  <p className="text-xs text-indigo-200">
                    Bagi rata jumlah siswa & siswi sama banyak, tentukan kapasitas per ruang, dan pilih metode silang kelas
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsGeneratorModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
              {/* Step 1: Mode Distribusi & Kapasitas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <Sliders className="w-4 h-4 text-indigo-600" />
                  <span>1. Kriteria Pembagian & Kapasitas Ruangan</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      allocationOptions.mode === 'equal_rooms'
                        ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="allocationMode"
                      checked={allocationOptions.mode === 'equal_rooms'}
                      onChange={() =>
                        setAllocationOptions({ ...allocationOptions, mode: 'equal_rooms' })
                      }
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block text-xs">
                        Bagi Sama Banyak ke Seluruh Ruang Aktif (Rekomendasi)
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Total {students.length} siswa akan dibagi rata ke {allocationOptions.selectedRoomIds.length} ruang (~
                        {Math.ceil(students.length / Math.max(1, allocationOptions.selectedRoomIds.length))} siswa/ruang).
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      allocationOptions.mode === 'fixed_capacity'
                        ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="allocationMode"
                      checked={allocationOptions.mode === 'fixed_capacity'}
                      onChange={() =>
                        setAllocationOptions({ ...allocationOptions, mode: 'fixed_capacity' })
                      }
                      className="mt-0.5 text-indigo-600"
                    />
                    <div className="w-full">
                      <span className="font-bold block text-xs">Kapasitas Tetap per Ruangan</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] text-slate-500">Maksimal:</span>
                        <input
                          type="number"
                          min={1}
                          max={50}
                          value={allocationOptions.capacityPerRoom}
                          onChange={(e) =>
                            setAllocationOptions({
                              ...allocationOptions,
                              capacityPerRoom: Math.max(1, parseInt(e.target.value) || 20),
                            })
                          }
                          className="w-16 px-2 py-1 bg-white rounded border border-slate-300 font-bold text-center text-xs"
                        />
                        <span className="text-[11px] text-slate-500">siswa / ruang</span>
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 2: Keseimbangan Siswa & Siswi (Gender Balancing) */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <Users className="w-4 h-4 text-indigo-600" />
                  <span>2. Keseimbangan Siswa (Laki-laki) & Siswi (Perempuan)</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      allocationOptions.genderBalance === 'equal_gender'
                        ? 'bg-pink-50/70 border-pink-400 text-slate-900 ring-1 ring-pink-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="genderBalance"
                      checked={allocationOptions.genderBalance === 'equal_gender'}
                      onChange={() =>
                        setAllocationOptions({
                          ...allocationOptions,
                          genderBalance: 'equal_gender',
                        })
                      }
                      className="mt-0.5 text-pink-600"
                    />
                    <div>
                      <span className="font-bold block text-xs text-pink-950">
                        ⚖️ Seimbang Siswa (L) & Siswi (P) Sama Banyak
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Setiap ruangan akan diisi dengan proporsi Laki-laki dan Perempuan yang seimbang sama rata (misal: 10 L dan 10 P).
                      </span>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      allocationOptions.genderBalance === 'natural'
                        ? 'bg-indigo-50/70 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="genderBalance"
                      checked={allocationOptions.genderBalance === 'natural'}
                      onChange={() =>
                        setAllocationOptions({
                          ...allocationOptions,
                          genderBalance: 'natural',
                        })
                      }
                      className="mt-0.5 text-indigo-600"
                    />
                    <div>
                      <span className="font-bold block text-xs">
                        👤 Urutan Alami (Natural Order)
                      </span>
                      <span className="text-[11px] text-slate-500 mt-0.5 block">
                        Pengelompokan siswa tanpa pemisahan/penyeimbangan kuota khusus gender.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* Step 3: Metode Penyebaran & Silang Kelas */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-indigo-950 font-bold">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>3. Metode Silang Antar Kelas & Penyusunan Meja</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                  {[
                    {
                      id: 'cross_class',
                      title: '🔀 Silang Antar Kelas',
                      desc: 'Siswa kelas A & B diselingi duduk berdampingan (Anti-Contek).',
                    },
                    {
                      id: 'cross_grade',
                      title: '🎓 Silang Jenjang',
                      desc: 'Mencampur tingkat kelas 7, 8, dan 9 dalam satu ruangan.',
                    },
                    {
                      id: 'by_class',
                      title: '🏫 Per Rombel Kelas',
                      desc: 'Mengisi ruang secara berurutan berdasarkan rombel kelas.',
                    },
                    {
                      id: 'random',
                      title: '🎲 Acak Merata',
                      desc: 'Mengacak urutan siswa secara proporsional ke semua ruang.',
                    },
                  ].map((method) => (
                    <label
                      key={method.id}
                      className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                        allocationOptions.mixingMethod === method.id
                          ? 'bg-indigo-50 border-indigo-400 text-indigo-950 ring-1 ring-indigo-400'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="radio"
                          name="mixingMethod"
                          checked={allocationOptions.mixingMethod === method.id}
                          onChange={() =>
                            setAllocationOptions({
                              ...allocationOptions,
                              mixingMethod: method.id as any,
                            })
                          }
                          className="mt-0.5 text-indigo-600"
                        />
                        <div>
                          <span className="font-bold block text-xs">{method.title}</span>
                          <span className="text-[10px] text-slate-500 mt-1 block">
                            {method.desc}
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Step 4: Urutan & Pilihan Ruang Aktif */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Sort Order */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 block">
                    Urutan Nama dalam Ruangan:
                  </label>
                  <select
                    value={allocationOptions.sortOrder}
                    onChange={(e) =>
                      setAllocationOptions({
                        ...allocationOptions,
                        sortOrder: e.target.value as any,
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-semibold"
                  >
                    <option value="name_asc">Alfabet Nama Siswa (A - Z)</option>
                    <option value="nisn_asc">Nomor Induk Siswa Nasional (NISN)</option>
                    <option value="nis_asc">Nomor Induk Siswa (NIS)</option>
                    <option value="random">Acak Acak Nomor Meja</option>
                  </select>
                </div>

                {/* Target Grade Filter */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                  <label className="font-bold text-slate-900 block">
                    Tingkat Kelas yang Dialokasikan:
                  </label>
                  <select
                    value={allocationOptions.targetGrade}
                    onChange={(e) =>
                      setAllocationOptions({
                        ...allocationOptions,
                        targetGrade: e.target.value === 'all' ? 'all' : (Number(e.target.value) as any),
                      })
                    }
                    className="w-full px-2.5 py-1.5 bg-white rounded-lg border border-slate-200 font-semibold"
                  >
                    <option value="all">Semua Tingkat (Kelas 7, 8, dan 9)</option>
                    <option value="7">Khusus Kelas 7</option>
                    <option value="8">Khusus Kelas 8</option>
                    <option value="9">Khusus Kelas 9</option>
                  </select>
                </div>
              </div>

              {/* Step 5: Ruangan Ujian Aktif Checklist */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900">
                    Pilih Ruangan yang Digunakan ({allocationOptions.selectedRoomIds.length} dari {rooms.length} ruang dipilih):
                  </span>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setAllocationOptions({
                          ...allocationOptions,
                          selectedRoomIds: rooms.map((r) => r.id),
                        })
                      }
                      className="text-[11px] text-indigo-600 font-bold hover:underline"
                    >
                      Pilih Semua
                    </button>
                    <span>•</span>
                    <button
                      type="button"
                      onClick={() =>
                        setAllocationOptions({
                          ...allocationOptions,
                          selectedRoomIds: rooms.slice(0, 1).map((r) => r.id),
                        })
                      }
                      className="text-[11px] text-slate-500 font-semibold hover:underline"
                    >
                      Reset
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {rooms.map((room) => {
                    const isSelected = allocationOptions.selectedRoomIds.includes(room.id);
                    return (
                      <label
                        key={room.id}
                        className={`p-2 rounded-lg border cursor-pointer flex items-center gap-2 transition-colors ${
                          isSelected
                            ? 'bg-indigo-50 border-indigo-300 text-indigo-900 font-bold'
                            : 'bg-white border-slate-200 text-slate-600'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAllocationOptions({
                                ...allocationOptions,
                                selectedRoomIds: [...allocationOptions.selectedRoomIds, room.id],
                              });
                            } else {
                              if (allocationOptions.selectedRoomIds.length <= 1) {
                                alert('Minimal satu ruangan harus dipilih.');
                                return;
                              }
                              setAllocationOptions({
                                ...allocationOptions,
                                selectedRoomIds: allocationOptions.selectedRoomIds.filter(
                                  (id) => id !== room.id
                                ),
                              });
                            }
                          }}
                          className="text-indigo-600 rounded"
                        />
                        <span className="truncate">{room.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Real-time Simulation Results Breakdown */}
              <div className="bg-indigo-900 text-white p-4 rounded-xl space-y-3">
                <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
                  <div className="flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                    <span className="font-bold text-sm">
                      Hasil Simulasi Distribusi ({allocationSimulation.updatedStudents.length} Siswa Terdistribusi)
                    </span>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-300 bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
                    Status: 100% Siap Diterapkan
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allocationSimulation.summaries.map((sum) => (
                    <div
                      key={sum.roomId}
                      className="bg-indigo-950/80 p-3 rounded-lg border border-indigo-800 space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-xs">{sum.roomName}</span>
                        <span className="font-mono text-[11px] font-bold text-amber-300">
                          {sum.totalAssigned} Siswa
                        </span>
                      </div>

                      {/* Gender Balance Badge */}
                      <div className="flex items-center gap-2 text-[11px] text-slate-300">
                        <span className="px-1.5 py-0.2 rounded bg-blue-900/80 text-blue-200 font-semibold">
                          👦 L: {sum.maleCount} ({sum.malePercentage ?? 0}%)
                        </span>
                        <span className="px-1.5 py-0.2 rounded bg-pink-900/80 text-pink-200 font-semibold">
                          👧 P: {sum.femaleCount} ({sum.femalePercentage ?? 0}%)
                        </span>
                      </div>

                      {/* Class Mix */}
                      <div className="text-[10px] text-slate-400 truncate">
                        Asal Kelas:{' '}
                        {Object.entries(sum.classesBreakdown || sum.classesCount || {}).length > 0
                          ? Object.entries(sum.classesBreakdown || sum.classesCount || {})
                              .map(([cls, cnt]) => `${cls}: ${cnt}`)
                              .join(', ')
                          : '-'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer Buttons */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                💡 Setelah diterapkan, seluruh nomor meja dan ruang pada kartu peserta ujian akan diperbarui seketika.
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsGeneratorModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition-colors cursor-pointer"
                >
                  Batal
                </button>

                <button
                  type="button"
                  onClick={handleApplyAllocation}
                  className="inline-flex items-center gap-1.5 px-5 py-2 bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white text-xs font-bold rounded-xl shadow-md transition-all cursor-pointer hover:scale-[1.02]"
                >
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Terapkan Distribusi ke Kartu Ujian</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
