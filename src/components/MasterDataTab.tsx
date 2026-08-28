import React, { useState, useRef } from 'react';
import {
  Users,
  Building2,
  BookOpen,
  GraduationCap,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Sparkles,
  Search,
  Layers,
  Clock,
  Tag,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Upload,
  UserCheck,
  Hash,
  CheckCircle2,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Teacher, ExamRoom, ClassRoom, Subject, Student } from '../types';
import {
  downloadTemplateXLSX,
  exportTeachersToXLSX,
  exportStudentsToXLSX,
} from '../services/exportService';

interface MasterDataTabProps {
  teachers: Teacher[];
  setTeachers: React.Dispatch<React.SetStateAction<Teacher[]>>;
  rooms: ExamRoom[];
  setRooms: React.Dispatch<React.SetStateAction<ExamRoom[]>>;
  classes: ClassRoom[];
  setClasses: React.Dispatch<React.SetStateAction<ClassRoom[]>>;
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  students?: Student[];
  setStudents?: React.Dispatch<React.SetStateAction<Student[]>>;
  schoolName?: string;
}

const PRESET_EXTRA_SUBJECTS: Array<Omit<Subject, 'id'>> = [
  {
    name: 'Informatika',
    code: 'INF',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Kejuruan',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
  },
  {
    name: 'Pendidikan Pancasila (PPKn)',
    code: 'PPKN',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Umum',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  {
    name: 'Bahasa Daerah / Jawa / Sunda',
    code: 'MULOK',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Bahasa',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
  },
  {
    name: 'Prakarya & Kewirausahaan',
    code: 'PRK',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Kejuruan',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  {
    name: 'Pendidikan Jasmani & Olahraga (PJOK)',
    code: 'PJOK',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Umum',
    color: 'bg-lime-50 text-lime-700 border-lime-200',
  },
  {
    name: 'Seni Budaya & Keterampilan (SBK)',
    code: 'SBD',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Umum',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  {
    name: 'Baca Tulis Al-Qur\'an (BTQ)',
    code: 'BTQ',
    grade: 'all',
    defaultDurationMinutes: 60,
    category: 'Agama',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  {
    name: 'Fiqih / Keagamaan Islam',
    code: 'FIQ',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Agama',
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  {
    name: 'Aqidah Akhlak',
    code: 'AQD',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Agama',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  {
    name: 'Pendidikan Agama Kristen & Budi Pekerti',
    code: 'PAK',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Agama',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  {
    name: 'Koding & Literasi Digital AI',
    code: 'KOD',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Kejuruan',
    color: 'bg-violet-50 text-violet-700 border-violet-200',
  },
];

interface DeleteModalTarget {
  type: 'teacher' | 'student' | 'room' | 'class' | 'subject';
  id: string;
  name: string;
  detail?: string;
}

export const MasterDataTab: React.FC<MasterDataTabProps> = ({
  teachers,
  setTeachers,
  rooms,
  setRooms,
  classes,
  setClasses,
  subjects,
  setSubjects,
  students = [],
  setStudents = (_val: React.SetStateAction<Student[]>) => {},
  schoolName = 'SMP Negeri 1 Surabaya',
}) => {
  const [subTab, setSubTab] = useState<'teachers' | 'students' | 'rooms' | 'classes' | 'subjects'>('teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // In-App Single Deletion Target Dialog
  const [itemToDelete, setItemToDelete] = useState<DeleteModalTarget | null>(null);

  // Multi-Selection State for each subtab
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<string[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);

  // Bulk / All Deletion Target Dialog
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{
    type: 'teachers' | 'students' | 'rooms' | 'classes' | 'subjects';
    isAll: boolean;
    ids?: string[];
    count: number;
    title: string;
    description: string;
  } | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleExecuteBulkDelete = () => {
    if (!bulkDeleteTarget) return;
    const { type, isAll, ids = [], count } = bulkDeleteTarget;

    if (type === 'teachers') {
      if (isAll) {
        setTeachers([]);
        showToast('Seluruh data guru & pengawas berhasil dihapus.');
      } else {
        setTeachers((prev) => prev.filter((t) => !ids.includes(t.id)));
        showToast(`${count} data guru pilihan berhasil dihapus.`);
      }
      setSelectedTeacherIds([]);
    } else if (type === 'students') {
      if (isAll) {
        setStudents([]);
        showToast('Seluruh data siswa peserta ujian berhasil dihapus.');
      } else {
        setStudents((prev) => prev.filter((s) => !ids.includes(s.id)));
        showToast(`${count} data siswa pilihan berhasil dihapus.`);
      }
      setSelectedStudentIds([]);
    } else if (type === 'rooms') {
      if (isAll) {
        setRooms([]);
        showToast('Seluruh ruang ujian berhasil dihapus.');
      } else {
        setRooms((prev) => prev.filter((r) => !ids.includes(r.id)));
        showToast(`${count} ruang ujian pilihan berhasil dihapus.`);
      }
      setSelectedRoomIds([]);
    } else if (type === 'classes') {
      if (isAll) {
        setClasses([]);
        showToast('Seluruh rombel/kelas siswa berhasil dihapus.');
      } else {
        setClasses((prev) => prev.filter((c) => !ids.includes(c.id)));
        showToast(`${count} kelas siswa pilihan berhasil dihapus.`);
      }
      setSelectedClassIds([]);
    } else if (type === 'subjects') {
      if (isAll) {
        setSubjects([]);
        showToast('Seluruh mata pelajaran ujian berhasil dihapus.');
      } else {
        setSubjects((prev) => prev.filter((s) => !ids.includes(s.id)));
        showToast(`${count} mata pelajaran pilihan berhasil dihapus.`);
      }
      setSelectedSubjectIds([]);
    }

    setBulkDeleteTarget(null);
  };

  // -------------------------------------------------------------
  // AUTOMATIC IMPORT (EXCEL / CSV) STATE & HANDLERS
  // -------------------------------------------------------------
  const [importModalType, setImportModalType] = useState<'teachers' | 'students' | null>(null);
  const [importMode, setImportMode] = useState<'append' | 'replace'>('append');
  const [parsedImportRows, setParsedImportRows] = useState<any[]>([]);
  const [importFileName, setImportFileName] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'teachers' | 'students') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportFileName(file.name);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const firstSheet = wb.SheetNames[0];
        const ws = wb.Sheets[firstSheet];
        const data = XLSX.utils.sheet_to_json(ws, { defval: '' });

        if (!data || data.length === 0) {
          setImportError('File kosong atau tidak memuat data yang valid.');
          setParsedImportRows([]);
        } else {
          setParsedImportRows(data);
          setImportModalType(type);
        }
      } catch (err: any) {
        setImportError('Gagal membaca file Excel/CSV: ' + (err.message || 'Format tidak didukung'));
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleExecuteImport = () => {
    if (!importModalType || parsedImportRows.length === 0) return;

    if (importModalType === 'teachers') {
      const newTeachers: Teacher[] = parsedImportRows.map((r, i) => {
        const name = r['Nama Lengkap & Gelar'] || r['Nama'] || r['name'] || `Guru ${i + 1}`;
        const nip = String(r['NIP'] || r['nip'] || '-').trim();
        const code = String(
          r['Kode Singkatan'] ||
            r['Kode'] ||
            r['code'] ||
            name.split(' ').map((w: string) => w[0]).join('').toUpperCase().slice(0, 3) ||
            'GUR'
        ).trim();
        const gender = String(r['Gender'] || r['gender'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';
        const phone = String(r['No WhatsApp'] || r['WhatsApp'] || r['No HP'] || r['phone'] || '081234567890');
        const email = String(r['Email'] || r['email'] || `${code.toLowerCase()}@sekolah.sch.id`);

        let subjectsList: string[] = ['Matematika'];
        const rawSubj = r['Mapel Diampu (Pisahkan koma)'] || r['Mapel'] || r['Mata Pelajaran'] || r['subjects'];
        if (typeof rawSubj === 'string' && rawSubj.trim()) {
          subjectsList = rawSubj.split(',').map((s) => s.trim()).filter(Boolean);
        } else if (Array.isArray(rawSubj)) {
          subjectsList = rawSubj;
        }

        let classList: string[] = ['VII-A'];
        const rawCls = r['Kelas Ajar (Pisahkan koma)'] || r['Kelas Ajar'] || r['classesTaught'];
        if (typeof rawCls === 'string' && rawCls.trim()) {
          classList = rawCls.split(',').map((c) => c.trim()).filter(Boolean);
        } else if (Array.isArray(rawCls)) {
          classList = rawCls;
        }

        const maxSess = Number(r['Max Sesi Per Hari'] || r['maxSessionsPerDay']) || 2;
        const isAvail = String(r['Status Aktif (Y/T)'] || r['Status Aktif'] || 'Y').toUpperCase().startsWith('Y');

        // Parse employee status & idType
        const rawStatus = String(r['Status Pegawai (PNS/PPPK/Honorer)'] || r['Status Pegawai'] || r['employeeStatus'] || '').toUpperCase();
        let employeeStatus: 'PNS' | 'PPPK' | 'Honorer' = 'PNS';
        let idType: 'NIP' | 'NIPPPK' | 'NUPTK' | 'Lainnya' = 'NIP';

        if (rawStatus.includes('PPPK')) {
          employeeStatus = 'PPPK';
          idType = 'NIPPPK';
        } else if (rawStatus.includes('HONOR') || rawStatus.includes('GTT') || rawStatus.includes('NON')) {
          employeeStatus = 'Honorer';
          idType = 'NUPTK';
        } else if (rawStatus.includes('PNS') || nip.length > 15) {
          employeeStatus = 'PNS';
          idType = 'NIP';
        }

        const rawIdType = String(r['Jenis ID (NIP/NIPPPK/NUPTK)'] || r['idType'] || '').toUpperCase();
        if (rawIdType.includes('PPPK')) idType = 'NIPPPK';
        else if (rawIdType.includes('NUPTK')) idType = 'NUPTK';
        else if (rawIdType.includes('NIP')) idType = 'NIP';

        return {
          id: `t-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
          name,
          nip,
          employeeStatus,
          idType,
          code,
          gender,
          phone,
          email,
          subjects: subjectsList.length > 0 ? subjectsList : ['Bahasa Indonesia'],
          classesTaught: classList.length > 0 ? classList : ['VII-A'],
          maxSessionsPerDay: maxSess,
          isAvailable: isAvail,
        };
      });

      if (importMode === 'replace') {
        setTeachers(newTeachers);
      } else {
        setTeachers((prev) => [...prev, ...newTeachers]);
      }
      showToast(`Berhasil mengimpor ${newTeachers.length} data guru!`);
    } else if (importModalType === 'students') {
      const newStudents: Student[] = parsedImportRows.map((r, i) => {
        const name = r['Nama Lengkap'] || r['Nama Siswa'] || r['Nama'] || r['name'] || `Siswa ${i + 1}`;
        const nisn = String(r['NISN'] || r['nisn'] || '').trim();
        const nis = String(r['NIS'] || r['nis'] || '').trim();
        const className = String(r['Kelas'] || r['className'] || 'VII-A').trim();
        const roomName = String(r['Ruang Ujian'] || r['Ruang'] || r['roomName'] || 'Ruang 01').trim();
        const seatNumber = Number(r['Nomor Kursi'] || r['Nomor Meja'] || r['seatNumber']) || (i + 1);
        const gender = String(r['Jenis Kelamin'] || r['Gender'] || 'L').toUpperCase().startsWith('P') ? 'P' : 'L';

        return {
          id: `stu-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
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

      if (importMode === 'replace') {
        setStudents(newStudents);
      } else {
        setStudents((prev) => [...prev, ...newStudents]);
      }
      showToast(`Berhasil mengimpor ${newStudents.length} data siswa!`);
    }

    setImportModalType(null);
    setParsedImportRows([]);
    setImportFileName(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // -------------------------------------------------------------
  // 1. TEACHER STATE & HANDLERS
  // -------------------------------------------------------------
  const [isAddingTeacher, setIsAddingTeacher] = useState(false);
  const [editingTeacherId, setEditingTeacherId] = useState<string | null>(null);
  const [customSubjectInput, setCustomSubjectInput] = useState('');
  const [subjectPickerSearch, setSubjectPickerSearch] = useState('');
  const [customClassInput, setCustomClassInput] = useState('');
  const [teacherFormData, setTeacherFormData] = useState<Partial<Teacher>>({
    name: '',
    nip: '',
    employeeStatus: 'PNS',
    idType: 'NIP',
    code: '',
    gender: 'L',
    phone: '',
    email: '',
    subjects: ['Matematika'],
    classesTaught: ['VII-A', 'VIII-A'],
    maxSessionsPerDay: 2,
    isAvailable: true,
  });

  const toggleTeacherStatus = (id: string) => {
    setTeachers((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isAvailable: !t.isAvailable } : t))
    );
    showToast('Status pengawas guru diperbarui.');
  };

  const handleSaveTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teacherFormData.name) return;

    const currentStatus = teacherFormData.employeeStatus || 'PNS';
    const currentIdType =
      teacherFormData.idType ||
      (currentStatus === 'PNS' ? 'NIP' : currentStatus === 'PPPK' ? 'NIPPPK' : 'NUPTK');

    if (editingTeacherId) {
      setTeachers((prev) =>
        prev.map((t) =>
          t.id === editingTeacherId
            ? ({
                ...t,
                ...teacherFormData,
                employeeStatus: currentStatus,
                idType: currentIdType,
              } as Teacher)
            : t
        )
      );
      setEditingTeacherId(null);
      showToast(`Data guru ${teacherFormData.name} berhasil diperbarui.`);
    } else {
      const newTeacher: Teacher = {
        id: `t-${Date.now()}`,
        name: teacherFormData.name || '',
        nip: teacherFormData.nip || '',
        employeeStatus: currentStatus,
        idType: currentIdType,
        code:
          teacherFormData.code ||
          teacherFormData.name
            .split(' ')
            .map((w) => w[0])
            .join('')
            .toUpperCase()
            .slice(0, 3) ||
          'GUR',
        gender: teacherFormData.gender || 'L',
        phone: teacherFormData.phone || '',
        email: teacherFormData.email || '',
        subjects: teacherFormData.subjects && teacherFormData.subjects.length > 0 ? teacherFormData.subjects : ['Bahasa Indonesia'],
        classesTaught: teacherFormData.classesTaught && teacherFormData.classesTaught.length > 0 ? teacherFormData.classesTaught : ['VII-A'],
        maxSessionsPerDay: teacherFormData.maxSessionsPerDay || 2,
        isAvailable: true,
      };
      setTeachers((prev) => [...prev, newTeacher]);
      showToast(`Guru baru ${newTeacher.name} berhasil ditambahkan.`);
    }

    setIsAddingTeacher(false);
    setTeacherFormData({
      name: '',
      nip: '',
      employeeStatus: 'PNS',
      idType: 'NIP',
      code: '',
      gender: 'L',
      phone: '',
      email: '',
      subjects: ['Matematika'],
      classesTaught: ['VII-A'],
      maxSessionsPerDay: 2,
      isAvailable: true,
    });
    setCustomSubjectInput('');
    setCustomClassInput('');
  };

  // -------------------------------------------------------------
  // 2. STUDENT STATE & HANDLERS
  // -------------------------------------------------------------
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [editingStudentId, setEditingStudentId] = useState<string | null>(null);
  const [selectedStudentClassFilter, setSelectedStudentClassFilter] = useState<string>('all');
  const [selectedStudentRoomFilter, setSelectedStudentRoomFilter] = useState<string>('all');
  const [studentFormData, setStudentFormData] = useState<Partial<Student>>({
    name: '',
    nisn: '',
    nis: '',
    className: 'VII-A',
    roomName: 'Ruang 01',
    seatNumber: 1,
    gender: 'L',
  });

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!studentFormData.name) return;

    if (editingStudentId) {
      setStudents((prev) =>
        prev.map((s) =>
          s.id === editingStudentId
            ? ({
                ...s,
                ...studentFormData,
                classId: `cls-${(studentFormData.className || s.className).toLowerCase().replace(/[^a-z0-9]/g, '')}`,
              } as Student)
            : s
        )
      );
      setEditingStudentId(null);
      showToast(`Data siswa ${studentFormData.name} berhasil diperbarui.`);
    } else {
      const newStudent: Student = {
        id: `stu-${Date.now()}`,
        name: studentFormData.name || '',
        nisn: studentFormData.nisn || '',
        nis: studentFormData.nis || '',
        classId: `cls-${(studentFormData.className || 'VII-A').toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        className: studentFormData.className || 'VII-A',
        roomName: studentFormData.roomName || 'Ruang 01',
        seatNumber: Number(studentFormData.seatNumber) || 1,
        gender: studentFormData.gender || 'L',
      };
      setStudents((prev) => [...prev, newStudent]);
      showToast(`Siswa baru ${newStudent.name} berhasil ditambahkan.`);
    }

    setIsAddingStudent(false);
    setStudentFormData({
      name: '',
      nisn: '',
      nis: '',
      className: 'VII-A',
      roomName: 'Ruang 01',
      seatNumber: students.length + 1,
      gender: 'L',
    });
  };

  const handleAutoDistributeSeats = () => {
    if (students.length === 0) {
      showToast('Tidak ada data siswa untuk diatur.');
      return;
    }
    if (rooms.length === 0) {
      showToast('Belum ada ruang ujian terdaftar.');
      return;
    }

    const activeRooms = rooms.filter((r) => r.isActive);
    const roomList = activeRooms.length > 0 ? activeRooms : rooms;

    let currentRoomIdx = 0;
    let currentSeatInRoom = 1;

    const updated = students.map((s) => {
      const room = roomList[currentRoomIdx];
      const assignedRoomName = room.name;
      const assignedSeat = currentSeatInRoom;

      if (currentSeatInRoom >= (room.capacity || 34)) {
        currentRoomIdx = (currentRoomIdx + 1) % roomList.length;
        currentSeatInRoom = 1;
      } else {
        currentSeatInRoom++;
      }

      return {
        ...s,
        roomName: assignedRoomName,
        seatNumber: assignedSeat,
      };
    });

    setStudents(updated);
    showToast(`Berhasil mengatur otomatis ${students.length} siswa ke dalam ${roomList.length} ruang ujian!`);
  };

  // -------------------------------------------------------------
  // 3. ROOM STATE & HANDLERS
  // -------------------------------------------------------------
  const [isAddingRoom, setIsAddingRoom] = useState(false);
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [roomFormData, setRoomFormData] = useState<Partial<ExamRoom>>({
    name: '',
    code: '',
    capacity: 34,
    location: 'Gedung A',
    isActive: true,
  });

  const toggleRoomStatus = (id: string) => {
    setRooms((prev) =>
      prev.map((r) => (r.id === id ? { ...r, isActive: !r.isActive } : r))
    );
    showToast('Status ruang ujian diperbarui.');
  };

  const handleSaveRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomFormData.name) return;

    if (editingRoomId) {
      setRooms((prev) =>
        prev.map((r) =>
          r.id === editingRoomId
            ? {
                ...r,
                name: roomFormData.name || r.name,
                code: roomFormData.code || r.code,
                capacity: Number(roomFormData.capacity) || r.capacity,
                location: roomFormData.location || r.location,
              }
            : r
        )
      );
      setEditingRoomId(null);
      showToast(`Ruang ujian ${roomFormData.name} diperbarui.`);
    } else {
      const newRoom: ExamRoom = {
        id: `rm-${Date.now()}`,
        name: roomFormData.name || '',
        code: roomFormData.code || `R-${String(rooms.length + 1).padStart(2, '0')}`,
        capacity: Number(roomFormData.capacity) || 34,
        location: roomFormData.location || 'Gedung A',
        isActive: true,
      };
      setRooms((prev) => [...prev, newRoom]);
      showToast(`Ruang ujian ${newRoom.name} ditambahkan.`);
    }

    setIsAddingRoom(false);
    setRoomFormData({ name: '', code: '', capacity: 34, location: 'Gedung A', isActive: true });
  };

  // -------------------------------------------------------------
  // 4. CLASS STATE & HANDLERS
  // -------------------------------------------------------------
  const [isAddingClass, setIsAddingClass] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [classFormData, setClassFormData] = useState<Partial<ClassRoom>>({
    name: '',
    grade: 7,
    studentCount: 32,
  });

  const handleSaveClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name) return;

    if (editingClassId) {
      setClasses((prev) =>
        prev.map((c) =>
          c.id === editingClassId
            ? {
                ...c,
                name: classFormData.name || c.name,
                grade: (Number(classFormData.grade) as 7 | 8 | 9) || c.grade,
                studentCount: Number(classFormData.studentCount) || c.studentCount,
              }
            : c
        )
      );
      setEditingClassId(null);
      showToast(`Kelas ${classFormData.name} berhasil diperbarui.`);
    } else {
      const newClass: ClassRoom = {
        id: `cls-${Date.now()}`,
        name: classFormData.name || '',
        grade: (Number(classFormData.grade) as 7 | 8 | 9) || 7,
        studentCount: Number(classFormData.studentCount) || 32,
      };
      setClasses((prev) => [...prev, newClass]);
      showToast(`Kelas ${newClass.name} berhasil ditambahkan.`);
    }

    setIsAddingClass(false);
    setClassFormData({ name: '', grade: 7, studentCount: 32 });
  };

  // -------------------------------------------------------------
  // 5. SUBJECT STATE & HANDLERS
  // -------------------------------------------------------------
  const [isAddingSubject, setIsAddingSubject] = useState(false);
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [subjectFormData, setSubjectFormData] = useState<Partial<Subject>>({
    name: '',
    code: '',
    grade: 'all',
    defaultDurationMinutes: 90,
    category: 'Umum',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  });

  const handleSaveSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectFormData.name) return;

    const code =
      subjectFormData.code?.trim().toUpperCase() ||
      subjectFormData.name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 4) ||
      'MAP';

    const getCategoryColor = (cat: string) => {
      switch (cat) {
        case 'MIPA':
          return 'bg-blue-50 text-blue-700 border-blue-200';
        case 'Bahasa':
          return 'bg-amber-50 text-amber-700 border-amber-200';
        case 'Agama':
          return 'bg-teal-50 text-teal-700 border-teal-200';
        case 'Sosial':
          return 'bg-orange-50 text-orange-700 border-orange-200';
        case 'Kejuruan':
          return 'bg-cyan-50 text-cyan-700 border-cyan-200';
        default:
          return 'bg-purple-50 text-purple-700 border-purple-200';
      }
    };

    if (editingSubjectId) {
      setSubjects((prev) =>
        prev.map((s) =>
          s.id === editingSubjectId
            ? {
                ...s,
                name: subjectFormData.name || s.name,
                code: code,
                grade: (subjectFormData.grade as any) || s.grade,
                defaultDurationMinutes:
                  Number(subjectFormData.defaultDurationMinutes) || s.defaultDurationMinutes,
                category: (subjectFormData.category as any) || s.category,
                color: getCategoryColor(subjectFormData.category || s.category),
              }
            : s
        )
      );
      setEditingSubjectId(null);
      showToast(`Mata pelajaran ${subjectFormData.name} diperbarui.`);
    } else {
      const newSubject: Subject = {
        id: `sub-${Date.now()}`,
        name: subjectFormData.name || '',
        code: code,
        grade: (subjectFormData.grade as any) || 'all',
        defaultDurationMinutes: Number(subjectFormData.defaultDurationMinutes) || 90,
        category: (subjectFormData.category as any) || 'Umum',
        color: getCategoryColor(subjectFormData.category || 'Umum'),
      };
      setSubjects((prev) => [...prev, newSubject]);
      showToast(`Mata pelajaran ${newSubject.name} ditambahkan.`);
    }

    setIsAddingSubject(false);
    setSubjectFormData({
      name: '',
      code: '',
      grade: 'all',
      defaultDurationMinutes: 90,
      category: 'Umum',
      color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    });
  };

  const handleAddPresetSubject = (preset: Omit<Subject, 'id'>) => {
    const existing = subjects.find(
      (s) =>
        s.name.toLowerCase() === preset.name.toLowerCase() ||
        s.code.toLowerCase() === preset.code.toLowerCase()
    );

    if (existing) {
      showToast(`Mata pelajaran "${preset.name}" (${preset.code}) sudah terdaftar.`);
      return;
    }

    const newSub: Subject = {
      id: `sub-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      ...preset,
    };
    setSubjects((prev) => [...prev, newSub]);
    showToast(`Berhasil menambahkan mapel ${preset.name}!`);
  };

  // -------------------------------------------------------------
  // DELETION EXECUTION (GUARANTEED WORKING IN IFRAME VIA IN-APP DIALOG)
  // -------------------------------------------------------------
  const handleConfirmDelete = () => {
    if (!itemToDelete) return;

    const { type, id, name } = itemToDelete;

    if (type === 'teacher') {
      setTeachers((prev) => prev.filter((t) => t.id !== id));
      showToast(`Data guru "${name}" berhasil dihapus.`);
    } else if (type === 'student') {
      setStudents((prev) => prev.filter((s) => s.id !== id));
      showToast(`Data siswa "${name}" berhasil dihapus.`);
    } else if (type === 'room') {
      setRooms((prev) => prev.filter((r) => r.id !== id));
      showToast(`Ruang ujian "${name}" berhasil dihapus.`);
    } else if (type === 'class') {
      setClasses((prev) => prev.filter((c) => c.id !== id));
      showToast(`Kelas "${name}" berhasil dihapus.`);
    } else if (type === 'subject') {
      setSubjects((prev) => prev.filter((s) => s.id !== id));
      showToast(`Mata pelajaran "${name}" berhasil dihapus.`);
    }

    setItemToDelete(null);
  };

  // Filter lists by search query
  const filteredTeachers = teachers.filter(
    (t) =>
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.nip.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.subjects.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nisn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.className.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roomName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (selectedStudentClassFilter !== 'all' && s.className !== selectedStudentClassFilter) return false;
    if (selectedStudentRoomFilter !== 'all' && s.roomName !== selectedStudentRoomFilter) return false;

    return true;
  });

  const filteredRooms = rooms.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredClasses = classes.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `kelas ${c.grade}`.includes(searchQuery.toLowerCase())
  );

  const filteredSubjects = subjects.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueStudentClasses = Array.from(new Set(students.map((s) => s.className)));
  const uniqueStudentRooms = Array.from(new Set(students.map((s) => s.roomName)));

  return (
    <div className="space-y-6">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-xl shadow-lg border border-slate-800 text-xs font-semibold flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Hidden File Input for Import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          if (subTab === 'teachers') handleFileUpload(e, 'teachers');
          else if (subTab === 'students') handleFileUpload(e, 'students');
        }}
      />

      {/* Sub-tab Navigation & Search */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap gap-2">
          <button
            id="tab-btn-teachers"
            onClick={() => {
              setSubTab('teachers');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subTab === 'teachers'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Data Guru ({teachers.length})</span>
          </button>

          <button
            id="tab-btn-students"
            onClick={() => {
              setSubTab('students');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subTab === 'students'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Data Siswa ({students.length})</span>
          </button>

          <button
            id="tab-btn-rooms"
            onClick={() => {
              setSubTab('rooms');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subTab === 'rooms'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Ruang Ujian ({rooms.length})</span>
          </button>

          <button
            id="tab-btn-classes"
            onClick={() => {
              setSubTab('classes');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subTab === 'classes'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Kelas Siswa ({classes.length})</span>
          </button>

          <button
            id="tab-btn-subjects"
            onClick={() => {
              setSubTab('subjects');
              setSearchQuery('');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              subTab === 'subjects'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Mata Pelajaran ({subjects.length})</span>
          </button>
        </div>

        {/* Quick Search Box */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, kode, kelas..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* ============================================================= */}
      {/* TAB 1: TEACHERS */}
      {/* ============================================================= */}
      {subTab === 'teachers' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Master Data Guru & Pengawas Ujian SMP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola profil guru, mata pelajaran, beban sesi, serta impor/ekspor otomatis dengan templat resmi
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Template Button */}
              <button
                type="button"
                onClick={() => downloadTemplateXLSX('teachers')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200"
                title="Unduh templat format Excel untuk data guru"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Unduh Templat</span>
              </button>

              {/* Import Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-emerald-200"
                title="Impor data guru dari file Excel atau CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Impor Guru (Excel/CSV)</span>
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => exportTeachersToXLSX(teachers, schoolName)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-blue-200"
                title="Ekspor seluruh data guru ke file Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Excel</span>
              </button>

              {/* Bulk Delete Buttons */}
              {selectedTeacherIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'teachers',
                      isAll: false,
                      ids: selectedTeacherIds,
                      count: selectedTeacherIds.length,
                      title: 'Hapus Data Guru Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedTeacherIds.length} data guru/pengawas yang dipilih secara permanen dari sistem.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Data Pilihan ({selectedTeacherIds.length})</span>
                </button>
              )}

              <button
                type="button"
                id="btn-delete-all-teachers"
                onClick={() =>
                  setBulkDeleteTarget({
                    type: 'teachers',
                    isAll: true,
                    count: teachers.length,
                    title: 'Hapus Seluruh Data Guru & Pengawas',
                    description: `Tindakan ini akan menghapus seluruh (${teachers.length}) data guru dan penugasan pengawas secara permanen.`,
                  })
                }
                disabled={teachers.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                title="Hapus seluruh data guru"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Guru</span>
              </button>

              {/* Add Teacher */}
              <button
                id="add-teacher-btn"
                onClick={() => {
                  setEditingTeacherId(null);
                  setTeacherFormData({
                    name: '',
                    nip: '',
                    code: '',
                    gender: 'L',
                    phone: '',
                    email: '',
                    subjects: ['Matematika'],
                    classesTaught: ['VII-A'],
                    maxSessionsPerDay: 2,
                    isAvailable: true,
                  });
                  setIsAddingTeacher(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Guru</span>
              </button>
            </div>
          </div>

          {/* Floating Multi-selection Banner */}
          {selectedTeacherIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-indigo-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Terpilih <strong>{selectedTeacherIds.length}</strong> dari {filteredTeachers.length} data guru yang ditampilkan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedTeacherIds.length === filteredTeachers.length) {
                      setSelectedTeacherIds([]);
                    } else {
                      setSelectedTeacherIds(filteredTeachers.map((t) => t.id));
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {selectedTeacherIds.length === filteredTeachers.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedTeacherIds([])}
                  className="px-2.5 py-1 bg-indigo-800/70 hover:bg-indigo-700 text-indigo-200 rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'teachers',
                      isAll: false,
                      ids: selectedTeacherIds,
                      count: selectedTeacherIds.length,
                      title: 'Hapus Data Guru Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedTeacherIds.length} data guru/pengawas yang dipilih secara permanen dari sistem.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Data Pilihan ({selectedTeacherIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Teacher Form */}
          {isAddingTeacher && (
            <div className="bg-slate-50 border border-indigo-200 rounded-2xl p-5 shadow-xs animate-in fade-in duration-150 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-indigo-600" />
                  {editingTeacherId ? 'Edit Data Guru & Pengawas' : 'Tambah Guru Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingTeacher(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveTeacher} className="space-y-4">
                {/* Row 1: Name, Employee Status, ID Number */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Lengkap & Gelar *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Drs. Budi Santoso, M.Pd."
                      value={teacherFormData.name || ''}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Employee Status (PNS / PPPK / Honorer) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Status Kepegawaian *
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {(['PNS', 'PPPK', 'Honorer'] as const).map((st) => {
                        const isSelected = (teacherFormData.employeeStatus || 'PNS') === st;
                        return (
                          <button
                            key={st}
                            type="button"
                            onClick={() => {
                              const autoIdType = st === 'PNS' ? 'NIP' : st === 'PPPK' ? 'NIPPPK' : 'NUPTK';
                              setTeacherFormData({
                                ...teacherFormData,
                                employeeStatus: st,
                                idType: autoIdType,
                              });
                            }}
                            className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              isSelected
                                ? st === 'PNS'
                                  ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                                  : st === 'PPPK'
                                  ? 'bg-purple-600 text-white border-purple-600 shadow-2xs'
                                  : 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                            }`}
                          >
                            {st}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ID Type and Number */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] font-bold text-slate-700">
                        Nomor Identitas Pegawai
                      </label>
                      <select
                        value={teacherFormData.idType || 'NIP'}
                        onChange={(e) =>
                          setTeacherFormData({
                            ...teacherFormData,
                            idType: e.target.value as 'NIP' | 'NIPPPK' | 'NUPTK' | 'Lainnya',
                          })
                        }
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200 bg-white text-slate-700 cursor-pointer"
                      >
                        <option value="NIP">NIP</option>
                        <option value="NIPPPK">NIPPPK</option>
                        <option value="NUPTK">NUPTK</option>
                        <option value="Lainnya">Lainnya</option>
                      </select>
                    </div>
                    <input
                      type="text"
                      placeholder={
                        teacherFormData.idType === 'NIP'
                          ? '19800512 200501 1 003'
                          : teacherFormData.idType === 'NIPPPK'
                          ? '19880315 202221 1 004'
                          : '9876543210123456'
                      }
                      value={teacherFormData.nip || ''}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, nip: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                {/* Row 2: Code, Gender, Phone, Email, Max Session */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Kode Guru (Max 4 Huruf)
                    </label>
                    <input
                      type="text"
                      placeholder="BDS"
                      maxLength={4}
                      value={teacherFormData.code || ''}
                      onChange={(e) =>
                        setTeacherFormData({ ...teacherFormData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={teacherFormData.gender || 'L'}
                      onChange={(e) =>
                        setTeacherFormData({ ...teacherFormData, gender: e.target.value as 'L' | 'P' })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="L">Laki-Laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">No. WhatsApp</label>
                    <input
                      type="text"
                      placeholder="081234567890"
                      value={teacherFormData.phone || ''}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, phone: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Sekolah</label>
                    <input
                      type="email"
                      placeholder="guru@sekolah.sch.id"
                      value={teacherFormData.email || ''}
                      onChange={(e) => setTeacherFormData({ ...teacherFormData, email: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Max Sesi/Hari</label>
                    <input
                      type="number"
                      min={1}
                      max={4}
                      value={teacherFormData.maxSessionsPerDay || 2}
                      onChange={(e) =>
                        setTeacherFormData({
                          ...teacherFormData,
                          maxSessionsPerDay: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                {/* Row 3: Enhanced Subject Selector (Mapel yang Diampu) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Mata Pelajaran yang Diampu *
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Klik mata pelajaran di bawah untuk memilih/menghapus. Anda dapat memilih lebih dari satu mata pelajaran.
                      </p>
                    </div>

                    {/* Quick Search & Custom Input */}
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <input
                          type="text"
                          placeholder="Cari mapel..."
                          value={subjectPickerSearch}
                          onChange={(e) => setSubjectPickerSearch(e.target.value)}
                          className="w-32 sm:w-40 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="text"
                          placeholder="+ Mapel kustom"
                          value={customSubjectInput}
                          onChange={(e) => setCustomSubjectInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              if (customSubjectInput.trim()) {
                                const current = teacherFormData.subjects || [];
                                if (!current.includes(customSubjectInput.trim())) {
                                  setTeacherFormData({
                                    ...teacherFormData,
                                    subjects: [...current, customSubjectInput.trim()],
                                  });
                                }
                                setCustomSubjectInput('');
                              }
                            }
                          }}
                          className="w-32 sm:w-36 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (customSubjectInput.trim()) {
                              const current = teacherFormData.subjects || [];
                              if (!current.includes(customSubjectInput.trim())) {
                                setTeacherFormData({
                                  ...teacherFormData,
                                  subjects: [...current, customSubjectInput.trim()],
                                });
                              }
                              setCustomSubjectInput('');
                            }
                          }}
                          className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 cursor-pointer"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Active Selected Subjects Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[30px] p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-semibold text-indigo-900 mr-1">Terpilih:</span>
                    {(teacherFormData.subjects || []).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Belum ada mata pelajaran dipilih (Pilih salah satu di bawah)</span>
                    ) : (
                      (teacherFormData.subjects || []).map((sub) => (
                        <span
                          key={sub}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-xs font-semibold shadow-2xs animate-in zoom-in-95 duration-100"
                        >
                          <span>{sub}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherFormData({
                                ...teacherFormData,
                                subjects: (teacherFormData.subjects || []).filter((s) => s !== sub),
                              });
                            }}
                            className="hover:text-rose-200 p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Clickable Quick Chip Cloud */}
                  <div>
                    <div className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Pilihan Cepat Mata Pelajaran (Klik untuk Memilih):</div>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                      {Array.from(
                        new Set([
                          ...subjects.map((s) => s.name),
                          'Pendidikan Agama Islam & BP',
                          'Pendidikan Pancasila & Kewarganegaraan (PPKn)',
                          'Bahasa Indonesia',
                          'Matematika',
                          'Ilmu Pengetahuan Alam (IPA)',
                          'Ilmu Pengetahuan Sosial (IPS)',
                          'Bahasa Inggris',
                          'Pendidikan Jasmani, Olahraga & Kesehatan (PJOK)',
                          'Informatika',
                          'Seni Budaya',
                          'Prakarya',
                          'Bahasa Daerah / Jawa',
                          'Bimbingan & Konseling (BK)',
                        ])
                      )
                        .filter((s) => s.toLowerCase().includes(subjectPickerSearch.toLowerCase()))
                        .map((sName) => {
                          const isPicked = (teacherFormData.subjects || []).includes(sName);
                          return (
                            <button
                              key={sName}
                              type="button"
                              onClick={() => {
                                const current = teacherFormData.subjects || [];
                                if (isPicked) {
                                  setTeacherFormData({
                                    ...teacherFormData,
                                    subjects: current.filter((s) => s !== sName),
                                  });
                                } else {
                                  setTeacherFormData({
                                    ...teacherFormData,
                                    subjects: [...current, sName],
                                  });
                                }
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                                isPicked
                                  ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-2xs'
                                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200'
                              }`}
                            >
                              {isPicked && <span className="mr-1">✓</span>}
                              {sName}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>

                {/* Row 4: Enhanced Class Taught Selector (Kelas Ajar) */}
                <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-800">
                        Kelas Ajar Guru *
                      </label>
                      <p className="text-[11px] text-slate-500">
                        Pilih rombel kelas yang diajar oleh guru ini (misal: VII-A, VIII-B).
                      </p>
                    </div>

                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="+ Kelas kustom"
                        value={customClassInput}
                        onChange={(e) => setCustomClassInput(e.target.value.toUpperCase())}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            if (customClassInput.trim()) {
                              const current = teacherFormData.classesTaught || [];
                              if (!current.includes(customClassInput.trim())) {
                                setTeacherFormData({
                                  ...teacherFormData,
                                  classesTaught: [...current, customClassInput.trim()],
                                });
                              }
                              setCustomClassInput('');
                            }
                          }
                        }}
                        className="w-32 px-2 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (customClassInput.trim()) {
                            const current = teacherFormData.classesTaught || [];
                            if (!current.includes(customClassInput.trim())) {
                              setTeacherFormData({
                                ...teacherFormData,
                                classesTaught: [...current, customClassInput.trim()],
                              });
                            }
                            setCustomClassInput('');
                          }
                        }}
                        className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] rounded-lg border border-indigo-200 cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Active Selected Classes Badges */}
                  <div className="flex flex-wrap items-center gap-1.5 min-h-[30px] p-2 bg-indigo-50/50 rounded-lg border border-indigo-100">
                    <span className="text-[11px] font-semibold text-indigo-900 mr-1">Terpilih:</span>
                    {(teacherFormData.classesTaught || []).length === 0 ? (
                      <span className="text-[11px] text-slate-400 italic">Belum ada kelas dipilih</span>
                    ) : (
                      (teacherFormData.classesTaught || []).map((cls) => (
                        <span
                          key={cls}
                          className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-indigo-600 text-white rounded-md text-xs font-semibold shadow-2xs font-mono"
                        >
                          <span>{cls}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setTeacherFormData({
                                ...teacherFormData,
                                classesTaught: (teacherFormData.classesTaught || []).filter((c) => c !== cls),
                              });
                            }}
                            className="hover:text-rose-200 p-0.5 rounded cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))
                    )}
                  </div>

                  {/* Quick Class Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {Array.from(
                      new Set([
                        ...classes.map((c) => c.name),
                        'VII-A', 'VII-B', 'VII-C', 'VII-D', 'VII-E',
                        'VIII-A', 'VIII-B', 'VIII-C', 'VIII-D', 'VIII-E',
                        'IX-A', 'IX-B', 'IX-C', 'IX-D', 'IX-E',
                      ])
                    ).map((cName) => {
                      const isPicked = (teacherFormData.classesTaught || []).includes(cName);
                      return (
                        <button
                          key={cName}
                          type="button"
                          onClick={() => {
                            const current = teacherFormData.classesTaught || [];
                            if (isPicked) {
                              setTeacherFormData({
                                ...teacherFormData,
                                classesTaught: current.filter((c) => c !== cName),
                              });
                            } else {
                              setTeacherFormData({
                                ...teacherFormData,
                                classesTaught: [...current, cName],
                              });
                            }
                          }}
                          className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all cursor-pointer border ${
                            isPicked
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-indigo-50 hover:text-indigo-700'
                          }`}
                        >
                          {cName}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingTeacher(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {editingTeacherId ? 'Perbarui Data Guru' : 'Simpan Guru Baru'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Teacher Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredTeachers.length > 0 &&
                          filteredTeachers.every((t) => selectedTeacherIds.includes(t.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newIds = Array.from(
                              new Set([...selectedTeacherIds, ...filteredTeachers.map((t) => t.id)])
                            );
                            setSelectedTeacherIds(newIds);
                          } else {
                            const filteredIdSet = new Set(filteredTeachers.map((t) => t.id));
                            setSelectedTeacherIds(selectedTeacherIds.filter((id) => !filteredIdSet.has(id)));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        title="Pilih Semua Guru di Tampilan Ini"
                      />
                    </th>
                    <th className="px-3.5 py-3 text-center w-10">No</th>
                    <th className="px-3.5 py-3">Nama Guru & Status</th>
                    <th className="px-3.5 py-3">Nomor Identitas (NIP/NIPPPK)</th>
                    <th className="px-3.5 py-3 text-center">Kode</th>
                    <th className="px-3.5 py-3">Mapel Diampu</th>
                    <th className="px-3.5 py-3">Kelas Ajar</th>
                    <th className="px-3.5 py-3">No. WhatsApp</th>
                    <th className="px-3.5 py-3 text-center">Status Pengawas</th>
                    <th className="px-3.5 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={10} className="p-8 text-center text-slate-400">
                        Tidak ada data guru yang ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((t, idx) => {
                      const isChecked = selectedTeacherIds.includes(t.id);
                      const status = t.employeeStatus || 'PNS';
                      const idLabel = t.idType || (status === 'PNS' ? 'NIP' : status === 'PPPK' ? 'NIPPPK' : 'NUPTK');

                      return (
                        <tr
                          key={t.id}
                          className={`transition-colors ${isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3.5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedTeacherIds([...selectedTeacherIds, t.id]);
                                } else {
                                  setSelectedTeacherIds(selectedTeacherIds.filter((id) => id !== t.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                          </td>
                          <td className="px-3.5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3.5 py-3">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900">{t.name}</span>
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                                  status === 'PNS'
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : status === 'PPPK'
                                    ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {status}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-400">
                              {t.gender === 'L' ? 'Laki-Laki' : 'Perempuan'} • Max {t.maxSessionsPerDay || 2} sesi/hari
                            </span>
                          </td>
                          <td className="px-3.5 py-3">
                            <span className="font-mono text-xs text-slate-700 font-semibold">
                              {idLabel}. {t.nip || '-'}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span className="font-mono font-bold text-[11px] px-1.5 py-0.5 rounded bg-slate-100">
                              {t.code}
                            </span>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="flex flex-wrap gap-1 max-w-xs">
                              {t.subjects.map((sub) => (
                                <span
                                  key={sub}
                                  className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200"
                                >
                                  {sub}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3.5 py-3">
                            <div className="flex flex-wrap gap-1">
                              {t.classesTaught.map((c) => (
                                <span
                                  key={c}
                                  className="text-[10px] font-semibold px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
                                >
                                  {c}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-3.5 py-3 font-mono text-slate-600">{t.phone || '-'}</td>
                          <td className="px-3.5 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => toggleTeacherStatus(t.id)}
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                                t.isAvailable
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-rose-50 text-rose-700 border border-rose-200'
                              }`}
                            >
                              {t.isAvailable ? 'Aktif Mengawas' : 'Dikecualikan'}
                            </button>
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingTeacherId(t.id);
                                  setTeacherFormData({ ...t });
                                  setCustomSubjectInput('');
                                  setCustomClassInput('');
                                  setIsAddingTeacher(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Guru"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setItemToDelete({
                                    type: 'teacher',
                                    id: t.id,
                                    name: t.name,
                                    detail: `NIP. ${t.nip || '-'} • Mapel: ${t.subjects.join(', ')}`,
                                  })
                                }
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Guru Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: STUDENTS */}
      {/* ============================================================= */}
      {subTab === 'students' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Master Data Siswa Peserta Ujian SMP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data identitas siswa (NISN, NIS), kelas, alokasi ruang & nomor kursi, serta impor/ekspor templat
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Template Button */}
              <button
                type="button"
                onClick={() => downloadTemplateXLSX('students')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer border border-slate-200"
                title="Unduh templat format Excel untuk data siswa"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Unduh Templat</span>
              </button>

              {/* Import Button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-emerald-200"
                title="Impor data siswa dari Excel atau CSV"
              >
                <Upload className="w-3.5 h-3.5 text-emerald-600" />
                <span>Impor Siswa (Excel/CSV)</span>
              </button>

              {/* Export Button */}
              <button
                type="button"
                onClick={() => exportStudentsToXLSX(students, schoolName)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-blue-200"
                title="Ekspor seluruh data siswa ke file Excel"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-blue-600" />
                <span>Ekspor Excel</span>
              </button>

              {/* Bulk Delete Buttons */}
              {selectedStudentIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'students',
                      isAll: false,
                      ids: selectedStudentIds,
                      count: selectedStudentIds.length,
                      title: 'Hapus Data Siswa Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedStudentIds.length} data peserta ujian terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Data Pilihan ({selectedStudentIds.length})</span>
                </button>
              )}

              <button
                type="button"
                id="btn-delete-all-students"
                onClick={() =>
                  setBulkDeleteTarget({
                    type: 'students',
                    isAll: true,
                    count: students.length,
                    title: 'Hapus Seluruh Data Siswa',
                    description: `Tindakan ini akan menghapus seluruh (${students.length}) data siswa peserta ujian, alokasi ruang, dan nomor kursi secara permanen.`,
                  })
                }
                disabled={students.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                title="Hapus seluruh data siswa"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Siswa</span>
              </button>

              {/* Auto Distribute Seats */}
              <button
                type="button"
                onClick={handleAutoDistributeSeats}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-amber-200"
                title="Atur nomor kursi 1..N dan bagi ke ruang ujian secara otomatis"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-700" />
                <span>Atur Ruang & Kursi Otomatis</span>
              </button>

              {/* Add Student */}
              <button
                id="add-student-btn"
                onClick={() => {
                  setEditingStudentId(null);
                  setStudentFormData({
                    name: '',
                    nisn: '',
                    nis: '',
                    className: 'VII-A',
                    roomName: 'Ruang 01',
                    seatNumber: students.length + 1,
                    gender: 'L',
                  });
                  setIsAddingStudent(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Siswa</span>
              </button>
            </div>
          </div>

          {/* Floating Multi-selection Banner for Students */}
          {selectedStudentIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-indigo-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Terpilih <strong>{selectedStudentIds.length}</strong> dari {filteredStudents.length} siswa yang ditampilkan
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedStudentIds.length === filteredStudents.length) {
                      setSelectedStudentIds([]);
                    } else {
                      setSelectedStudentIds(filteredStudents.map((s) => s.id));
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {selectedStudentIds.length === filteredStudents.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedStudentIds([])}
                  className="px-2.5 py-1 bg-indigo-800/70 hover:bg-indigo-700 text-indigo-200 rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'students',
                      isAll: false,
                      ids: selectedStudentIds,
                      count: selectedStudentIds.length,
                      title: 'Hapus Data Siswa Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedStudentIds.length} data peserta ujian terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Data Pilihan ({selectedStudentIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Room Allocation Sync Summary Banner */}
          {students.length > 0 && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-3.5 rounded-2xl border border-indigo-900/60 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-indigo-600/80 flex items-center justify-center shrink-0 border border-indigo-400/30">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-xs">
                      Sinkronisasi Otomatis Ruang & Meja Ujian
                    </span>
                    <span className="bg-emerald-500/20 text-emerald-300 font-semibold px-2 py-0.2 rounded-full text-[10px] border border-emerald-500/30">
                      Tersinkronisasi Otomatis
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Data ruang ujian dan nomor kursi di bawah ini otomatis terbaca dan menyesuaikan hasil dari generator ruang & kartu ujian.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 text-[11px]">
                <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/10 font-mono">
                  Tersebar di <strong>{uniqueStudentRooms.length}</strong> Ruang
                </div>
                <div className="px-2.5 py-1 rounded-lg bg-indigo-500/20 border border-indigo-400/20 text-indigo-200 font-mono">
                  {students.filter((s) => s.roomName && s.seatNumber > 0).length} / {students.length} Teralokasi
                </div>
              </div>
            </div>
          )}

          {/* Filter Toolbar for Students */}
          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 font-semibold">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filter Siswa:</span>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500">Kelas:</label>
              <select
                value={selectedStudentClassFilter}
                onChange={(e) => setSelectedStudentClassFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                <option value="all">Semua Kelas ({uniqueStudentClasses.length})</option>
                {uniqueStudentClasses.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-slate-500">Ruang:</label>
              <select
                value={selectedStudentRoomFilter}
                onChange={(e) => setSelectedStudentRoomFilter(e.target.value)}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-800"
              >
                <option value="all">Semua Ruang ({uniqueStudentRooms.length})</option>
                {uniqueStudentRooms.map((rm) => (
                  <option key={rm} value={rm}>
                    {rm}
                  </option>
                ))}
              </select>
            </div>

            <div className="ml-auto text-[11px] text-slate-500 font-medium">
              Menampilkan <strong>{filteredStudents.length}</strong> dari total {students.length} siswa
            </div>
          </div>

          {/* Student Form */}
          {isAddingStudent && (
            <div className="bg-slate-50 border border-indigo-200 rounded-2xl p-5 shadow-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-indigo-600" />
                  {editingStudentId ? 'Edit Data Peserta Ujian' : 'Tambah Siswa Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingStudent(false)}
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveStudent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Nama Lengkap Siswa *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Aditya Pratama Putra"
                      value={studentFormData.name || ''}
                      onChange={(e) => setStudentFormData({ ...studentFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">NISN</label>
                    <input
                      type="text"
                      placeholder="0078123451"
                      value={studentFormData.nisn || ''}
                      onChange={(e) => setStudentFormData({ ...studentFormData, nisn: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">NIS Sekolah</label>
                    <input
                      type="text"
                      placeholder="25267001"
                      value={studentFormData.nis || ''}
                      onChange={(e) => setStudentFormData({ ...studentFormData, nis: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Rombel / Kelas</label>
                    <input
                      type="text"
                      placeholder="VII-A"
                      value={studentFormData.className || 'VII-A'}
                      onChange={(e) => setStudentFormData({ ...studentFormData, className: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Ruang Ujian</label>
                    <select
                      value={studentFormData.roomName || (rooms[0]?.name ?? 'Ruang 01')}
                      onChange={(e) => setStudentFormData({ ...studentFormData, roomName: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-semibold"
                    >
                      {rooms.map((rm) => (
                        <option key={rm.id} value={rm.name}>
                          {rm.name} ({rm.code}) - Kap. {rm.capacity}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nomor Kursi/Meja</label>
                    <input
                      type="number"
                      min={1}
                      max={60}
                      value={studentFormData.seatNumber || 1}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, seatNumber: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                    <select
                      value={studentFormData.gender || 'L'}
                      onChange={(e) =>
                        setStudentFormData({ ...studentFormData, gender: e.target.value as 'L' | 'P' })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="L">Laki-Laki (L)</option>
                      <option value="P">Perempuan (P)</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingStudent(false)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {editingStudentId ? 'Perbarui Data Siswa' : 'Simpan Siswa Baru'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Student Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredStudents.length > 0 &&
                          filteredStudents.every((s) => selectedStudentIds.includes(s.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newIds = Array.from(
                              new Set([...selectedStudentIds, ...filteredStudents.map((s) => s.id)])
                            );
                            setSelectedStudentIds(newIds);
                          } else {
                            const filteredIdSet = new Set(filteredStudents.map((s) => s.id));
                            setSelectedStudentIds(selectedStudentIds.filter((id) => !filteredIdSet.has(id)));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        title="Pilih Semua Siswa di Tampilan Ini"
                      />
                    </th>
                    <th className="px-3.5 py-3 text-center w-10">No</th>
                    <th className="px-3.5 py-3">Nama Siswa</th>
                    <th className="px-3.5 py-3 font-mono">NISN / NIS</th>
                    <th className="px-3.5 py-3 text-center">Kelas</th>
                    <th className="px-3.5 py-3 text-center">Ruang Ujian</th>
                    <th className="px-3.5 py-3 text-center">No. Kursi</th>
                    <th className="px-3.5 py-3 text-center">L/P</th>
                    <th className="px-3.5 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Tidak ada data siswa yang sesuai pencarian atau filter.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((s, idx) => {
                      const isChecked = selectedStudentIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`transition-colors ${isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3.5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedStudentIds([...selectedStudentIds, s.id]);
                                } else {
                                  setSelectedStudentIds(selectedStudentIds.filter((id) => id !== s.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                          </td>
                          <td className="px-3.5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3.5 py-3 font-bold text-slate-900">{s.name}</td>
                          <td className="px-3.5 py-3 font-mono text-[11px] text-slate-500">
                            {s.nisn || '-'} / {s.nis || '-'}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              {s.className}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-semibold text-slate-800">
                            {s.roomName || 'Ruang 01'}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-800">
                              #{String(s.seatNumber).padStart(2, '0')}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-bold text-slate-600">{s.gender}</td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingStudentId(s.id);
                                  setStudentFormData({ ...s });
                                  setIsAddingStudent(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Data Siswa"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setItemToDelete({
                                    type: 'student',
                                    id: s.id,
                                    name: s.name,
                                    detail: `Kelas: ${s.className} • Ruang: ${s.roomName || 'Ruang 01'} • Kursi #${s.seatNumber}`,
                                  })
                                }
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Siswa Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: ROOMS */}
      {/* ============================================================= */}
      {subTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Master Ruang Ujian SMP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data ruang ujian, kapasitas meja siswa, gedung lokasi, serta status operasional
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedRoomIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'rooms',
                      isAll: false,
                      ids: selectedRoomIds,
                      count: selectedRoomIds.length,
                      title: 'Hapus Ruang Ujian Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedRoomIds.length} ruang ujian terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pilihan ({selectedRoomIds.length})</span>
                </button>
              )}

              <button
                type="button"
                id="btn-delete-all-rooms"
                onClick={() =>
                  setBulkDeleteTarget({
                    type: 'rooms',
                    isAll: true,
                    count: rooms.length,
                    title: 'Hapus Seluruh Ruang Ujian',
                    description: `Tindakan ini akan menghapus seluruh (${rooms.length}) data ruang ujian secara permanen.`,
                  })
                }
                disabled={rooms.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                title="Hapus seluruh ruang ujian"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Ruang</span>
              </button>

              <button
                id="add-room-btn"
                onClick={() => {
                  setEditingRoomId(null);
                  setRoomFormData({
                    name: `Ruang ${String(rooms.length + 1).padStart(2, '0')}`,
                    code: `R-${String(rooms.length + 1).padStart(2, '0')}`,
                    capacity: 34,
                    location: 'Gedung A - Lt. 1',
                    isActive: true,
                  });
                  setIsAddingRoom(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Ruang Ujian</span>
              </button>
            </div>
          </div>

          {/* Floating Multi-selection Banner for Rooms */}
          {selectedRoomIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-indigo-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Terpilih <strong>{selectedRoomIds.length}</strong> dari {filteredRooms.length} ruang ujian
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoomIds.length === filteredRooms.length) {
                      setSelectedRoomIds([]);
                    } else {
                      setSelectedRoomIds(filteredRooms.map((r) => r.id));
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {selectedRoomIds.length === filteredRooms.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRoomIds([])}
                  className="px-2.5 py-1 bg-indigo-800/70 hover:bg-indigo-700 text-indigo-200 rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'rooms',
                      isAll: false,
                      ids: selectedRoomIds,
                      count: selectedRoomIds.length,
                      title: 'Hapus Ruang Ujian Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedRoomIds.length} ruang ujian terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pilihan ({selectedRoomIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Add / Edit Room Form */}
          {isAddingRoom && (
            <div className="p-4 bg-slate-50 border border-indigo-200 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800">
                  {editingRoomId ? 'Edit Ruang Ujian' : 'Tambah Ruang Ujian Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingRoom(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveRoom} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Ruang *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ruang 01"
                      value={roomFormData.name || ''}
                      onChange={(e) => setRoomFormData({ ...roomFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Ruang</label>
                    <input
                      type="text"
                      placeholder="R-01"
                      value={roomFormData.code || ''}
                      onChange={(e) => setRoomFormData({ ...roomFormData, code: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kapasitas Kursi</label>
                    <input
                      type="number"
                      min={10}
                      max={60}
                      value={roomFormData.capacity || 34}
                      onChange={(e) =>
                        setRoomFormData({ ...roomFormData, capacity: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Lokasi Gedung</label>
                    <input
                      type="text"
                      placeholder="Gedung A - Lt. 1"
                      value={roomFormData.location || ''}
                      onChange={(e) => setRoomFormData({ ...roomFormData, location: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingRoom(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {editingRoomId ? 'Simpan Perubahan' : 'Tambah Ruang'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Rooms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredRooms.map((r) => {
              const isChecked = selectedRoomIds.includes(r.id);
              const assignedStudents = students.filter((s) => s.roomName === r.name);
              const assignedCount = assignedStudents.length;
              const maleCount = assignedStudents.filter((s) => s.gender === 'L').length;
              const femaleCount = assignedStudents.filter((s) => s.gender === 'P').length;
              const occupancyPct = Math.min(100, Math.round((assignedCount / Math.max(1, r.capacity)) * 100));

              // Class breakdown
              const classCountMap: Record<string, number> = {};
              assignedStudents.forEach((st) => {
                classCountMap[st.className] = (classCountMap[st.className] || 0) + 1;
              });

              return (
                <div
                  key={r.id}
                  className={`p-4 bg-white border rounded-2xl shadow-xs transition-all flex flex-col justify-between ${
                    isChecked ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedRoomIds([...selectedRoomIds, r.id]);
                            } else {
                              setSelectedRoomIds(selectedRoomIds.filter((id) => id !== r.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <Building2 className="w-4 h-4 text-indigo-600" />
                          {r.name}
                        </span>
                      </div>
                      <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {r.code}
                      </span>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-500 mb-3 pl-5.5">
                      <div className="flex items-center justify-between">
                        <span>Kapasitas Ujian:</span>
                        <strong className="text-slate-800 font-mono">{r.capacity} Peserta</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Lokasi:</span>
                        <span className="text-slate-700">{r.location}</span>
                      </div>

                      {/* Live Allocation Breakdown from Generator */}
                      <div className="pt-2 mt-2 border-t border-slate-100 space-y-1.5">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-700 flex items-center gap-1">
                            <Users className="w-3 h-3 text-indigo-600" />
                            Terisi (Siswa):
                          </span>
                          <span
                            className={`font-mono font-bold px-1.5 py-0.2 rounded text-[11px] ${
                              assignedCount > 0
                                ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {assignedCount} / {r.capacity} ({occupancyPct}%)
                          </span>
                        </div>

                        {/* Occupancy bar */}
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              occupancyPct >= 100
                                ? 'bg-amber-500'
                                : assignedCount > 0
                                ? 'bg-indigo-600'
                                : 'bg-slate-200'
                            }`}
                            style={{ width: `${occupancyPct}%` }}
                          />
                        </div>

                        {assignedCount > 0 && (
                          <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                            <span className="text-blue-700 font-medium">👦 {maleCount} L</span>
                            <span className="text-pink-700 font-medium">👧 {femaleCount} P</span>
                            <span className="text-slate-500 truncate max-w-[120px]" title={Object.keys(classCountMap).join(', ')}>
                              {Object.entries(classCountMap).map(([c, n]) => `${c}(${n})`).join(', ')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleRoomStatus(r.id)}
                      className={`text-[11px] font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        r.isActive
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-slate-100 text-slate-500'
                      }`}
                    >
                      {r.isActive ? 'Digunakan' : 'Non-Aktif'}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoomId(r.id);
                          setRoomFormData({ ...r });
                          setIsAddingRoom(true);
                        }}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                        title="Edit Ruang"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setItemToDelete({
                            type: 'room',
                            id: r.id,
                            name: r.name,
                            detail: `Kode: ${r.code} • Kapasitas: ${r.capacity} Peserta`,
                          })
                        }
                        className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Ruang Ujian"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 4: CLASSES */}
      {/* ============================================================= */}
      {subTab === 'classes' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Master Rombel / Kelas Siswa SMP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola data rombongan belajar tingkat 7, 8, dan 9 beserta jumlah siswa per kelas
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedClassIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'classes',
                      isAll: false,
                      ids: selectedClassIds,
                      count: selectedClassIds.length,
                      title: 'Hapus Rombel Kelas Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedClassIds.length} rombel kelas terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pilihan ({selectedClassIds.length})</span>
                </button>
              )}

              <button
                type="button"
                id="btn-delete-all-classes"
                onClick={() =>
                  setBulkDeleteTarget({
                    type: 'classes',
                    isAll: true,
                    count: classes.length,
                    title: 'Hapus Seluruh Data Kelas',
                    description: `Tindakan ini akan menghapus seluruh (${classes.length}) rombel kelas siswa secara permanen.`,
                  })
                }
                disabled={classes.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                title="Hapus seluruh data kelas"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Kelas</span>
              </button>

              <button
                id="add-class-btn"
                onClick={() => {
                  setEditingClassId(null);
                  setClassFormData({ name: '', grade: 7, studentCount: 32 });
                  setIsAddingClass(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Kelas Baru</span>
              </button>
            </div>
          </div>

          {/* Floating Multi-selection Banner for Classes */}
          {selectedClassIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-indigo-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Terpilih <strong>{selectedClassIds.length}</strong> dari {filteredClasses.length} kelas siswa
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedClassIds.length === filteredClasses.length) {
                      setSelectedClassIds([]);
                    } else {
                      setSelectedClassIds(filteredClasses.map((c) => c.id));
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {selectedClassIds.length === filteredClasses.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedClassIds([])}
                  className="px-2.5 py-1 bg-indigo-800/70 hover:bg-indigo-700 text-indigo-200 rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'classes',
                      isAll: false,
                      ids: selectedClassIds,
                      count: selectedClassIds.length,
                      title: 'Hapus Rombel Kelas Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedClassIds.length} rombel kelas terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pilihan ({selectedClassIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Add / Edit Class Form */}
          {isAddingClass && (
            <div className="p-4 bg-slate-50 border border-indigo-200 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800">
                  {editingClassId ? 'Edit Data Kelas' : 'Tambah Kelas Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingClass(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveClass} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Kelas *</label>
                    <input
                      type="text"
                      required
                      placeholder="VII-A atau 7A"
                      value={classFormData.name || ''}
                      onChange={(e) => setClassFormData({ ...classFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Tingkat Jenjang</label>
                    <select
                      value={classFormData.grade || 7}
                      onChange={(e) =>
                        setClassFormData({
                          ...classFormData,
                          grade: Number(e.target.value) as 7 | 8 | 9,
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value={7}>Kelas VII (7)</option>
                      <option value={8}>Kelas VIII (8)</option>
                      <option value={9}>Kelas IX (9)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Jumlah Siswa</label>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={classFormData.studentCount || 32}
                      onChange={(e) =>
                        setClassFormData({ ...classFormData, studentCount: Number(e.target.value) })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingClass(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {editingClassId ? 'Simpan Perubahan' : 'Simpan Kelas'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Classes Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {filteredClasses.map((c) => {
              const isChecked = selectedClassIds.includes(c.id);
              return (
                <div
                  key={c.id}
                  className={`p-4 bg-white border rounded-2xl shadow-xs transition-all flex flex-col justify-between ${
                    isChecked ? 'border-indigo-500 bg-indigo-50/20 ring-1 ring-indigo-500' : 'border-slate-200 hover:border-indigo-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedClassIds([...selectedClassIds, c.id]);
                            } else {
                              setSelectedClassIds(selectedClassIds.filter((id) => id !== c.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                        <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                          <GraduationCap className="w-4 h-4 text-indigo-600" />
                          Kelas {c.name}
                        </span>
                      </div>
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                        Tingkat {c.grade}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-3 font-medium pl-5.5">
                      Total: <strong className="text-slate-800 font-mono">{c.studentCount} Siswa</strong>
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-1 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingClassId(c.id);
                        setClassFormData({ ...c });
                        setIsAddingClass(true);
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                      title="Edit Kelas"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setItemToDelete({
                          type: 'class',
                          id: c.id,
                          name: `Kelas ${c.name}`,
                          detail: `Tingkat ${c.grade} • ${c.studentCount} Siswa`,
                        })
                      }
                      className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Kelas"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 5: SUBJECTS */}
      {/* ============================================================= */}
      {subTab === 'subjects' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Master Mata Pelajaran Ujian SMP</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola daftar mata pelajaran, kode singkatan, kategori rumpun ilmu, dan durasi pengerjaan soal
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {selectedSubjectIds.length > 0 && (
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'subjects',
                      isAll: false,
                      ids: selectedSubjectIds,
                      count: selectedSubjectIds.length,
                      title: 'Hapus Mata Pelajaran Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedSubjectIds.length} mata pelajaran terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer animate-pulse"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pilihan ({selectedSubjectIds.length})</span>
                </button>
              )}

              <button
                type="button"
                id="btn-delete-all-subjects"
                onClick={() =>
                  setBulkDeleteTarget({
                    type: 'subjects',
                    isAll: true,
                    count: subjects.length,
                    title: 'Hapus Seluruh Mata Pelajaran',
                    description: `Tindakan ini akan menghapus seluruh (${subjects.length}) mata pelajaran ujian secara permanen.`,
                  })
                }
                disabled={subjects.length === 0}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors cursor-pointer disabled:opacity-40"
                title="Hapus seluruh mata pelajaran"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Hapus Semua Mapel</span>
              </button>

              <button
                id="add-subject-btn"
                onClick={() => {
                  setEditingSubjectId(null);
                  setSubjectFormData({
                    name: '',
                    code: '',
                    grade: 'all',
                    defaultDurationMinutes: 90,
                    category: 'Umum',
                    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                  });
                  setIsAddingSubject(true);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Mapel Baru</span>
              </button>
            </div>
          </div>

          {/* Floating Multi-selection Banner for Subjects */}
          {selectedSubjectIds.length > 0 && (
            <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-indigo-700 animate-in fade-in slide-in-from-top-1">
              <div className="flex items-center gap-2 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  Terpilih <strong>{selectedSubjectIds.length}</strong> dari {filteredSubjects.length} mata pelajaran
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    if (selectedSubjectIds.length === filteredSubjects.length) {
                      setSelectedSubjectIds([]);
                    } else {
                      setSelectedSubjectIds(filteredSubjects.map((s) => s.id));
                    }
                  }}
                  className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
                >
                  {selectedSubjectIds.length === filteredSubjects.length ? 'Batalkan Semua' : 'Pilih Semua'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSubjectIds([])}
                  className="px-2.5 py-1 bg-indigo-800/70 hover:bg-indigo-700 text-indigo-200 rounded-lg text-xs cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setBulkDeleteTarget({
                      type: 'subjects',
                      isAll: false,
                      ids: selectedSubjectIds,
                      count: selectedSubjectIds.length,
                      title: 'Hapus Mata Pelajaran Pilihan',
                      description: `Tindakan ini akan menghapus ${selectedSubjectIds.length} mata pelajaran terpilih secara permanen.`,
                    })
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Hapus Pilihan ({selectedSubjectIds.length})</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Preset Selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 mb-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <span>Rekomendasi Cepat Mata Pelajaran Kurikulum SMP (1-Klik Tambah):</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_EXTRA_SUBJECTS.map((preset) => {
                const isAlreadyAdded = subjects.some(
                  (s) => s.code.toLowerCase() === preset.code.toLowerCase()
                );
                return (
                  <button
                    key={preset.code}
                    type="button"
                    disabled={isAlreadyAdded}
                    onClick={() => handleAddPresetSubject(preset)}
                    className={`text-xs px-2.5 py-1 rounded-lg border font-semibold flex items-center gap-1 transition-all ${
                      isAlreadyAdded
                        ? 'bg-slate-200 text-slate-400 border-slate-300 opacity-60 cursor-not-allowed'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/50 hover:text-indigo-900 cursor-pointer'
                    }`}
                  >
                    <span>{preset.name}</span>
                    <span className="font-mono text-[10px] opacity-75">({preset.code})</span>
                    {isAlreadyAdded ? <Check className="w-3 h-3 text-emerald-600" /> : <Plus className="w-3 h-3" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Add / Edit Subject Form */}
          {isAddingSubject && (
            <div className="p-4 bg-slate-50 border border-indigo-200 rounded-2xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-200">
                <span className="font-bold text-xs text-slate-800">
                  {editingSubjectId ? 'Edit Mata Pelajaran' : 'Tambah Mata Pelajaran Baru'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddingSubject(false)}
                  className="p-1 rounded text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveSubject} className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Nama Mapel *</label>
                    <input
                      type="text"
                      required
                      placeholder="Informatika"
                      value={subjectFormData.name || ''}
                      onChange={(e) => setSubjectFormData({ ...subjectFormData, name: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kode Singkat</label>
                    <input
                      type="text"
                      placeholder="INF"
                      maxLength={5}
                      value={subjectFormData.code || ''}
                      onChange={(e) =>
                        setSubjectFormData({ ...subjectFormData, code: e.target.value.toUpperCase() })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Kategori Rumpun</label>
                    <select
                      value={subjectFormData.category || 'Umum'}
                      onChange={(e) =>
                        setSubjectFormData({ ...subjectFormData, category: e.target.value as any })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    >
                      <option value="Umum">Umum</option>
                      <option value="MIPA">MIPA</option>
                      <option value="Bahasa">Bahasa</option>
                      <option value="Agama">Agama</option>
                      <option value="Sosial">Sosial</option>
                      <option value="Kejuruan">Kejuruan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Durasi Ujian (Menit)</label>
                    <input
                      type="number"
                      step={15}
                      min={30}
                      max={180}
                      value={subjectFormData.defaultDurationMinutes || 90}
                      onChange={(e) =>
                        setSubjectFormData({
                          ...subjectFormData,
                          defaultDurationMinutes: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-1.5 text-xs bg-white rounded-lg border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-mono"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setIsAddingSubject(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-200 cursor-pointer"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs cursor-pointer shadow-xs"
                  >
                    {editingSubjectId ? 'Simpan Perubahan' : 'Simpan Mapel'}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Subjects Table */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px]">
                  <tr>
                    <th className="px-3.5 py-3 text-center w-10">
                      <input
                        type="checkbox"
                        checked={
                          filteredSubjects.length > 0 &&
                          filteredSubjects.every((s) => selectedSubjectIds.includes(s.id))
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            const newIds = Array.from(
                              new Set([...selectedSubjectIds, ...filteredSubjects.map((s) => s.id)])
                            );
                            setSelectedSubjectIds(newIds);
                          } else {
                            const filteredIdSet = new Set(filteredSubjects.map((s) => s.id));
                            setSelectedSubjectIds(selectedSubjectIds.filter((id) => !filteredIdSet.has(id)));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        title="Pilih Semua Mapel"
                      />
                    </th>
                    <th className="px-3.5 py-3 text-center w-10">No</th>
                    <th className="px-3.5 py-3">Nama Mata Pelajaran</th>
                    <th className="px-3.5 py-3 text-center font-mono">Kode</th>
                    <th className="px-3.5 py-3 text-center">Kategori</th>
                    <th className="px-3.5 py-3 text-center">Tingkat Sasaran</th>
                    <th className="px-3.5 py-3 text-center">Durasi Default</th>
                    <th className="px-3.5 py-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400">
                        Tidak ada data mata pelajaran.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((s, idx) => {
                      const isChecked = selectedSubjectIds.includes(s.id);
                      return (
                        <tr
                          key={s.id}
                          className={`transition-colors ${isChecked ? 'bg-indigo-50/40' : 'hover:bg-slate-50'}`}
                        >
                          <td className="px-3.5 py-3 text-center">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedSubjectIds([...selectedSubjectIds, s.id]);
                                } else {
                                  setSelectedSubjectIds(selectedSubjectIds.filter((id) => id !== s.id));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                            />
                          </td>
                          <td className="px-3.5 py-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-3.5 py-3 font-bold text-slate-900">{s.name}</td>
                          <td className="px-3.5 py-3 text-center font-mono font-bold text-[11px] text-slate-700">
                            {s.code}
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${s.color}`}>
                              {s.category}
                            </span>
                          </td>
                          <td className="px-3.5 py-3 text-center font-semibold text-slate-600">
                            {s.grade === 'all' ? 'Semua Kelas (7,8,9)' : `Kelas ${s.grade}`}
                          </td>
                          <td className="px-3.5 py-3 text-center font-mono text-slate-600">
                            {s.defaultDurationMinutes} Menit
                          </td>
                          <td className="px-3.5 py-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubjectId(s.id);
                                  setSubjectFormData({ ...s });
                                  setIsAddingSubject(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors cursor-pointer"
                                title="Edit Mapel"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  setItemToDelete({
                                    type: 'subject',
                                    id: s.id,
                                    name: s.name,
                                    detail: `Kode: ${s.code} • Kategori: ${s.category} • Durasi: ${s.defaultDurationMinutes} Menit`,
                                  })
                                }
                                className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Hapus Mapel Ini"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* IN-APP CONFIRMATION MODAL FOR DELETING (GUARANTEED TO WORK) */}
      {/* ============================================================= */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-200">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>

            <h4 className="font-bold text-slate-900 text-base mb-1">Konfirmasi Hapus Data</h4>
            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus data <strong>"{itemToDelete.name}"</strong>?
            </p>
            {itemToDelete.detail && (
              <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 mb-4 font-mono">
                {itemToDelete.detail}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-delete-master"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Data</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* BULK / ALL SELECTION DELETION MODAL */}
      {/* ============================================================= */}
      {bulkDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>

            <h4 className="font-bold text-slate-900 text-base mb-1">{bulkDeleteTarget.title}</h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">{bulkDeleteTarget.description}</p>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setBulkDeleteTarget(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                id="btn-confirm-bulk-delete-master"
                onClick={handleExecuteBulkDelete}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Ya, Hapus Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* IMPORT PREVIEW & CONFIRMATION MODAL */}
      {/* ============================================================= */}
      {importModalType && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    Impor Otomatis {importModalType === 'teachers' ? 'Data Guru' : 'Data Siswa'}
                  </h3>
                  <p className="text-xs text-slate-500">{importFileName || 'File Excel / CSV'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setImportModalType(null);
                  setParsedImportRows([]);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {importError ? (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl my-4">
                {importError}
              </div>
            ) : (
              <div className="space-y-4 my-4">
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                  <span>
                    Terdeteksi <strong>{parsedImportRows.length} baris</strong> data siap diimpor ke sistem.
                  </span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                </div>

                <div className="space-y-2 text-xs">
                  <label className="font-bold text-slate-700 block">Metode Penggabungan Data:</label>
                  <div className="grid grid-cols-2 gap-2">
                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                        importMode === 'append'
                          ? 'bg-indigo-50 border-indigo-300 text-indigo-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'append'}
                        onChange={() => setImportMode('append')}
                        className="mt-0.5 text-indigo-600"
                      />
                      <div>
                        <div>Tambahkan (Append)</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          Menambahkan data baru tanpa menghapus data yang ada.
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-3 rounded-xl border flex items-start gap-2 cursor-pointer transition-all ${
                        importMode === 'replace'
                          ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold'
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="importMode"
                        checked={importMode === 'replace'}
                        onChange={() => setImportMode('replace')}
                        className="mt-0.5 text-rose-600"
                      />
                      <div>
                        <div>Ganti Total (Replace)</div>
                        <div className="text-[10px] font-normal text-slate-500">
                          Mengganti seluruh data lama dengan data baru dari file.
                        </div>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setImportModalType(null);
                  setParsedImportRows([]);
                }}
                className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={parsedImportRows.length === 0}
                onClick={handleExecuteImport}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Eksekusi Impor Sekarang</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
