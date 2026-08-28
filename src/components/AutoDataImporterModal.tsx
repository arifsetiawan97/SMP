import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Layers,
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  RefreshCw,
  FileText,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Teacher, ExamRoom, ClassRoom, Subject, Student } from '../types';
import { downloadTemplateXLSX } from '../services/exportService';
import {
  DEFAULT_TEACHERS,
  DEFAULT_ROOMS,
  DEFAULT_CLASSES,
  DEFAULT_SUBJECTS,
  DEFAULT_STUDENTS,
} from '../data/defaultData';

export type ImportCategory = 'teachers' | 'rooms' | 'classes' | 'subjects' | 'students';

interface AutoDataImporterModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultCategory?: ImportCategory;
  onImportTeachers: (data: Teacher[], mode: 'replace' | 'append') => void;
  onImportRooms: (data: ExamRoom[], mode: 'replace' | 'append') => void;
  onImportClasses: (data: ClassRoom[], mode: 'replace' | 'append') => void;
  onImportSubjects: (data: Subject[], mode: 'replace' | 'append') => void;
  onImportStudents: (data: Student[], mode: 'replace' | 'append') => void;
}

export const AutoDataImporterModal: React.FC<AutoDataImporterModalProps> = ({
  isOpen,
  onClose,
  defaultCategory = 'teachers',
  onImportTeachers,
  onImportRooms,
  onImportClasses,
  onImportSubjects,
  onImportStudents,
}) => {
  const [category, setCategory] = useState<ImportCategory>(defaultCategory);
  const [importMode, setImportMode] = useState<'replace' | 'append'>('append');
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rawPastedText, setRawPastedText] = useState('');
  const [inputTab, setInputTab] = useState<'file' | 'paste' | 'preset'>('file');

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setErrorMsg(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheetName];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (data.length === 0) {
          setErrorMsg('File kosong atau format kolom tidak sesuai.');
          setParsedRows([]);
        } else {
          setParsedRows(data);
        }
      } catch (err: any) {
        setErrorMsg('Gagal membaca file Excel/CSV: ' + (err.message || 'Format tidak didukung'));
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleParsePastedText = () => {
    if (!rawPastedText.trim()) {
      setErrorMsg('Silakan tempel (paste) data tabel dari Excel/Sheets terlebih dahulu.');
      return;
    }
    setErrorMsg(null);
    try {
      const lines = rawPastedText.trim().split('\n').map((l) => l.split('\t'));
      if (lines.length < 2) {
        setErrorMsg('Format teks tabel harus memiliki minimal 1 baris header dan 1 baris data (pisahkan tab).');
        return;
      }
      const headers = lines[0].map((h) => h.trim());
      const rows = lines.slice(1).map((line) => {
        const rowObj: any = {};
        headers.forEach((h, i) => {
          rowObj[h] = line[i]?.trim() || '';
        });
        return rowObj;
      });
      setParsedRows(rows);
      setFileName('Pasted_Data_Table.txt');
    } catch (err: any) {
      setErrorMsg('Gagal memproses teks: ' + err.message);
    }
  };

  const executeImport = () => {
    if (parsedRows.length === 0) {
      setErrorMsg('Tidak ada baris data yang siap diimpor.');
      return;
    }

    try {
      if (category === 'teachers') {
        const mappedTeachers: Teacher[] = parsedRows.map((r, i) => {
          const name = r['Nama Lengkap & Gelar'] || r['Nama'] || r['name'] || `Guru ${i + 1}`;
          const nip = r['NIP'] || r['nip'] || '-';
          const code = r['Kode Singkatan'] || r['Kode'] || r['code'] || name.substring(0, 3).toUpperCase();
          const gender = (r['Gender'] || r['gender'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
          const phone = r['No WhatsApp'] || r['WhatsApp'] || r['No HP'] || r['phone'] || '081234567890';
          const email = r['Email'] || r['email'] || `${code.toLowerCase()}@smp.sch.id`;
          
          let subjects: string[] = [];
          const rawSubj = r['Mapel Diampu (Pisahkan koma)'] || r['Mapel'] || r['Mata Pelajaran'] || r['subjects'] || '';
          if (typeof rawSubj === 'string') {
            subjects = rawSubj.split(',').map((s: string) => s.trim()).filter(Boolean);
          } else if (Array.isArray(rawSubj)) {
            subjects = rawSubj;
          }

          let classesTaught: string[] = [];
          const rawCls = r['Kelas Ajar (Pisahkan koma)'] || r['Kelas Ajar'] || r['classesTaught'] || '';
          if (typeof rawCls === 'string') {
            classesTaught = rawCls.split(',').map((c: string) => c.trim()).filter(Boolean);
          } else if (Array.isArray(rawCls)) {
            classesTaught = rawCls;
          }

          const maxSessions = Number(r['Max Sesi Per Hari'] || r['maxSessionsPerDay'] || 2);
          const isAvail = (r['Status Aktif (Y/T)'] || r['isAvailable'] || 'Y').toString().toUpperCase().startsWith('Y') ||
            (r['Status Aktif (Y/T)'] || '').toString().toLowerCase() === 'true';

          return {
            id: `t-imp-${Date.now()}-${i}`,
            name,
            nip,
            code,
            gender,
            phone,
            email,
            subjects: subjects.length > 0 ? subjects : ['Bahasa Indonesia'],
            classesTaught: classesTaught.length > 0 ? classesTaught : ['VII-A', 'VII-B'],
            maxSessionsPerDay: maxSessions > 0 ? maxSessions : 2,
            isAvailable: isAvail,
          };
        });

        onImportTeachers(mappedTeachers, importMode);
      } else if (category === 'rooms') {
        const mappedRooms: ExamRoom[] = parsedRows.map((r, i) => {
          const name = r['Nama Ruang'] || r['Ruang'] || r['name'] || `Ruang ${String(i + 1).padStart(2, '0')}`;
          const code = r['Kode'] || r['code'] || `R-${String(i + 1).padStart(2, '0')}`;
          const capacity = Number(r['Kapasitas'] || r['capacity'] || 32);
          const location = r['Lokasi'] || r['location'] || 'Gedung Utama';
          const isActive = (r['Status Aktif (Y/T)'] || r['isActive'] || 'Y').toString().toUpperCase().startsWith('Y');

          return {
            id: `rm-imp-${Date.now()}-${i}`,
            name,
            code,
            capacity: capacity > 0 ? capacity : 32,
            location,
            isActive,
          };
        });

        onImportRooms(mappedRooms, importMode);
      } else if (category === 'classes') {
        const mappedClasses: ClassRoom[] = parsedRows.map((r, i) => {
          const name = r['Nama Kelas'] || r['Kelas'] || r['name'] || `VII-${String.fromCharCode(65 + (i % 5))}`;
          let grade: 7 | 8 | 9 = 7;
          const rawGrade = Number(r['Tingkat'] || r['grade'] || (name.includes('8') || name.includes('VIII') ? 8 : name.includes('9') || name.includes('IX') ? 9 : 7));
          if (rawGrade === 8) grade = 8;
          if (rawGrade === 9) grade = 9;
          const studentCount = Number(r['Jumlah Siswa'] || r['studentCount'] || 32);

          return {
            id: `cls-imp-${Date.now()}-${i}`,
            name,
            grade,
            studentCount: studentCount > 0 ? studentCount : 32,
          };
        });

        onImportClasses(mappedClasses, importMode);
      } else if (category === 'subjects') {
        const categoryColors: Record<string, string> = {
          MIPA: 'bg-blue-100 text-blue-800 border-blue-200',
          Bahasa: 'bg-emerald-100 text-emerald-800 border-emerald-200',
          Sosial: 'bg-amber-100 text-amber-800 border-amber-200',
          Agama: 'bg-purple-100 text-purple-800 border-purple-200',
          Umum: 'bg-slate-100 text-slate-800 border-slate-200',
        };

        const mappedSubjects: Subject[] = parsedRows.map((r, i) => {
          const name = r['Nama Mata Pelajaran'] || r['Mapel'] || r['name'] || `Mapel ${i + 1}`;
          const code = r['Kode'] || r['code'] || name.substring(0, 3).toUpperCase();
          const cat = (r['Kategori'] || r['category'] || 'Umum') as any;
          const duration = Number(r['Durasi Menit'] || r['defaultDurationMinutes'] || 90);
          const rawGrade = r['Tingkat (7/8/9/all)'] || r['grade'] || 'all';
          const grade = rawGrade === 7 || rawGrade === 8 || rawGrade === 9 ? rawGrade : 'all';

          return {
            id: `sb-imp-${Date.now()}-${i}`,
            name,
            code,
            grade,
            defaultDurationMinutes: duration > 0 ? duration : 90,
            category: ['MIPA', 'Bahasa', 'Sosial', 'Agama', 'Umum'].includes(cat) ? cat : 'Umum',
            color: categoryColors[cat] || 'bg-slate-100 text-slate-800 border-slate-200',
          };
        });

        onImportSubjects(mappedSubjects, importMode);
      } else if (category === 'students') {
        const mappedStudents: Student[] = parsedRows.map((r, i) => {
          const name = r['Nama Lengkap'] || r['Nama Siswa'] || r['name'] || `Siswa ${i + 1}`;
          const nisn = r['NISN'] || r['nisn'] || `0078${String(i + 1).padStart(6, '0')}`;
          const nis = r['NIS'] || r['nis'] || `2526${String(i + 1).padStart(4, '0')}`;
          const className = r['Kelas'] || r['className'] || 'VII-A';
          const roomName = r['Ruang'] || r['roomName'] || 'Ruang 01';
          const seatNumber = Number(r['Nomor Kursi'] || r['seatNumber'] || (i % 32) + 1);
          const gender = (r['Gender'] || r['gender'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';

          return {
            id: `stu-imp-${Date.now()}-${i}`,
            name,
            nisn,
            nis,
            classId: `cls-${className.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
            className,
            roomName,
            seatNumber,
            gender,
          };
        });

        onImportStudents(mappedStudents, importMode);
      }

      onClose();
    } catch (err: any) {
      setErrorMsg('Terjadi kesalahan saat memetakan data: ' + err.message);
    }
  };

  const handleApplyPreset = () => {
    if (category === 'teachers') {
      onImportTeachers(DEFAULT_TEACHERS, 'replace');
    } else if (category === 'rooms') {
      onImportRooms(DEFAULT_ROOMS, 'replace');
    } else if (category === 'classes') {
      onImportClasses(DEFAULT_CLASSES, 'replace');
    } else if (category === 'subjects') {
      onImportSubjects(DEFAULT_SUBJECTS, 'replace');
    } else if (category === 'students') {
      onImportStudents(DEFAULT_STUDENTS, 'replace');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Impor Data Master & Otomatisasi SMP
              </h3>
              <p className="text-xs text-slate-300">
                Unggah berkas Excel/CSV, salin tabel, atau gunakan preset standar kurikulum SMP
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {/* Step 1: Select Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Pilih Kategori Data yang Ingin Diimpor:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <button
                type="button"
                onClick={() => {
                  setCategory('teachers');
                  setParsedRows([]);
                  setFileName(null);
                }}
                className={`flex flex-col items-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  category === 'teachers'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Users className="w-5 h-5 mb-1 text-indigo-600" />
                <span>Guru & NIP</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('rooms');
                  setParsedRows([]);
                  setFileName(null);
                }}
                className={`flex flex-col items-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  category === 'rooms'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-5 h-5 mb-1 text-indigo-600" />
                <span>Ruang Ujian</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('classes');
                  setParsedRows([]);
                  setFileName(null);
                }}
                className={`flex flex-col items-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  category === 'classes'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Layers className="w-5 h-5 mb-1 text-indigo-600" />
                <span>Rombel Kelas</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('subjects');
                  setParsedRows([]);
                  setFileName(null);
                }}
                className={`flex flex-col items-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  category === 'subjects'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <BookOpen className="w-5 h-5 mb-1 text-indigo-600" />
                <span>Mata Pelajaran</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setCategory('students');
                  setParsedRows([]);
                  setFileName(null);
                }}
                className={`flex flex-col items-center p-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                  category === 'students'
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-2xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <GraduationCap className="w-5 h-5 mb-1 text-indigo-600" />
                <span>Data Siswa</span>
              </button>
            </div>
          </div>

          {/* Import Method Tabs */}
          <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setInputTab('file')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputTab === 'file'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Upload Excel / CSV
              </button>
              <button
                type="button"
                onClick={() => setInputTab('paste')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputTab === 'paste'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Salin-Tempel (Copy-Paste)
              </button>
              <button
                type="button"
                onClick={() => setInputTab('preset')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  inputTab === 'preset'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Preset Standar SMP (1-Klik)
              </button>
            </div>

            {/* Template Download Button */}
            <button
              type="button"
              onClick={() => downloadTemplateXLSX(category)}
              className="inline-flex items-center gap-1.5 text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template Excel</span>
            </button>
          </div>

          {/* Mode 1: File Upload */}
          {inputTab === 'file' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 hover:border-indigo-500 bg-slate-50 hover:bg-indigo-50/40 rounded-2xl p-6 text-center cursor-pointer transition-colors"
              >
                <FileSpreadsheet className="w-10 h-10 text-indigo-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-800">
                  Klik di sini untuk memilih berkas Excel (.xlsx / .xls) atau CSV
                </p>
                <p className="text-[11px] text-slate-500 mt-1">
                  Format kolom akan dipetakan otomatis sesuai template resmi sekolah
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {fileName && (
                <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-indigo-900 font-semibold">
                    <FileText className="w-4 h-4 text-indigo-600" />
                    <span>Berkas terpilih: {fileName}</span>
                  </div>
                  <span className="text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-md">
                    {parsedRows.length} Baris Terbaca
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Mode 2: Copy Paste */}
          {inputTab === 'paste' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Salin beberapa baris dari tabel Excel atau Google Spreadsheet, lalu tempel di kotak berikut:
              </p>
              <textarea
                rows={5}
                value={rawPastedText}
                onChange={(e) => setRawPastedText(e.target.value)}
                placeholder="Nama Lengkap&#9;NIP&#9;Kode Singkatan&#9;Mapel Diampu..."
                className="w-full p-3 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              <button
                type="button"
                onClick={handleParsePastedText}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-lg cursor-pointer transition-colors"
              >
                Proses & Petakan Data Teks
              </button>
            </div>
          )}

          {/* Mode 3: Preset Auto Generation */}
          {inputTab === 'preset' && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-3">
              <div className="flex items-center gap-2 text-amber-900 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Otomatisasi Data Standar Jenjang SMP</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Fitur ini akan secara instan mengisi data lengkap {category === 'teachers' ? '20 Guru lengkap dengan NIP & kode mapel' : category === 'rooms' ? '9 Ruang Ujian & Laboratorium' : category === 'classes' ? '9 Rombel Kelas 7, 8, dan 9' : category === 'subjects' ? '12 Mata Pelajaran SMP Kurikulum Merdeka' : '288 Data Siswa lengkap dengan NISN & Ruang Ujian'}.
              </p>
              <button
                type="button"
                onClick={handleApplyPreset}
                className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                Terapkan Preset Standar Sekarang
              </button>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Preview Table */}
          {parsedRows.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800">
                  Pratinjau Data ({parsedRows.length} baris):
                </span>
                <div className="flex items-center gap-3 text-xs">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="importMode"
                      value="append"
                      checked={importMode === 'append'}
                      onChange={() => setImportMode('append')}
                      className="text-indigo-600"
                    />
                    <span>Tambahkan ke Data Ada (Append)</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer text-rose-700">
                    <input
                      type="radio"
                      name="importMode"
                      value="replace"
                      checked={importMode === 'replace'}
                      onChange={() => setImportMode('replace')}
                      className="text-rose-600"
                    />
                    <span>Gantikan Semua Data (Replace)</span>
                  </label>
                </div>
              </div>

              <div className="max-h-48 overflow-auto rounded-xl border border-slate-200 text-[11px]">
                <table className="min-w-full divide-y divide-slate-200 bg-white">
                  <thead className="bg-slate-50 sticky top-0 font-bold text-slate-700">
                    <tr>
                      <th className="px-2.5 py-1.5 text-left">#</th>
                      {Object.keys(parsedRows[0] || {}).slice(0, 5).map((col) => (
                        <th key={col} className="px-2.5 py-1.5 text-left">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-2.5 py-1 font-mono text-slate-400">{idx + 1}</td>
                        {Object.values(row || {}).slice(0, 5).map((val: any, vIdx) => (
                          <td key={vIdx} className="px-2.5 py-1 truncate max-w-[150px]">
                            {String(val)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="text-[10px] text-slate-400 italic text-right">
                  + {parsedRows.length - 5} baris lainnya...
                </p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            Batal
          </button>

          <button
            type="button"
            onClick={executeImport}
            disabled={parsedRows.length === 0 || isProcessing}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Memproses Data...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Impor {parsedRows.length > 0 ? `${parsedRows.length} Data` : 'Sekarang'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
