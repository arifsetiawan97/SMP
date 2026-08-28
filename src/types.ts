export type EmployeeStatus = 'PNS' | 'PPPK' | 'Honorer';
export type IdNumberType = 'NIP' | 'NIPPPK' | 'NUPTK' | 'Lainnya';

export interface Teacher {
  id: string;
  name: string;
  nip: string;
  employeeStatus?: EmployeeStatus; // PNS, PPPK, Honorer
  idType?: IdNumberType; // NIP, NIPPPK, NUPTK
  code: string;
  gender: 'L' | 'P';
  phone: string;
  email: string;
  subjects: string[]; // e.g. ["Matematika", "Informatika"]
  classesTaught: string[]; // e.g. ["7A", "7B", "8A"]
  maxSessionsPerDay: number;
  isAvailable: boolean;
}

export interface Student {
  id: string;
  name: string;
  nisn: string;
  nis: string;
  classId: string;
  className: string;
  roomName: string;
  seatNumber: number;
  gender: 'L' | 'P';
  birthDate?: string;
  photoUrl?: string;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  grade: 7 | 8 | 9 | 'all';
  defaultDurationMinutes: number;
  category: 'Umum' | 'MIPA' | 'Bahasa' | 'Sosial' | 'Agama' | 'Kejuruan';
  color: string;
}

export interface ClassRoom {
  id: string;
  name: string; // e.g. "VII-A", "VIII-B"
  grade: 7 | 8 | 9;
  studentCount: number;
  homeRoomTeacherId?: string;
}

export interface ExamRoom {
  id: string;
  name: string; // e.g. "Ruang 01", "Ruang 02", "Lab Komputer 1"
  code: string;
  capacity: number;
  location: string;
  isActive: boolean;
}

export interface CustomSessionTime {
  sessionIndex: number;
  startTime: string;
  endTime: string;
  name?: string;
}

export interface DailyExamSubjectPlan {
  dayIndex: number; // 0, 1, 2, ...
  dateStr?: string; // e.g. "Senin, 08 Jun 2026"
  sessionIndex: number; // 1, 2, 3, 4 ...
  grade: 7 | 8 | 9 | 'all';
  subjectId: string;
  subjectName: string;
  subjectCode?: string;
  category?: string;
  durationMinutes?: number;
  startTime?: string;
  endTime?: string;
  isManualInput?: boolean;
}

export interface StudentAllocationOptions {
  mode: 'fixed_capacity' | 'equal_rooms'; // Kapasitas tetap (misal 20 siswa/ruang) atau bagi rata ke N ruangan
  capacityPerRoom: number; // e.g. 20, 24, 30
  genderBalance: 'equal_gender' | 'natural'; // Bagi siswa & siswi seimbang/sama banyak atau urut biasa
  mixingMethod: 'cross_class' | 'cross_grade' | 'by_class' | 'random'; // Silang kelas, silang jenjang, per kelas murni, acak
  sortOrder: 'name_asc' | 'nisn_asc' | 'nis_asc' | 'random';
  seatNumberingPrefix?: string; // e.g. "Meja ", ""
  selectedRoomIds?: string[]; // Ruang ujian aktif yang digunakan
  targetGrade?: 7 | 8 | 9 | 'all'; // Tingkat siswa yang dialokasikan
}

export interface RoomAllocationResultSummary {
  roomId: string;
  roomName: string;
  capacity: number;
  totalAssigned: number;
  maleCount: number;
  femaleCount: number;
  malePercentage?: number;
  femalePercentage?: number;
  classesCount: Record<string, number>;
  classesBreakdown?: Record<string, number>;
  students: Student[];
}

export interface ExamTimeConfig {
  // Kop Surat & Identitas Satuan Pendidikan
  kabupaten?: string; // e.g. "PEMERINTAH KABUPATEN SLEMAN"
  dinasPendidikan?: string; // e.g. "DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA"
  schoolName: string;
  schoolNpsn: string;
  schoolAddress?: string; // e.g. "Jl. Pendidikan No. 45, Telp. (0274) 123456 • Website: smp1cemerlang.sch.id"
  leftLogoUrl?: string; // Logo Kiri (Tut Wuri Handayani / Pemda / Kemenag)
  rightLogoUrl?: string; // Logo Kanan (Logo Sekolah / Madrasah)

  academicYear: string;
  semester: 'Ganjil' | 'Genap';
  examType: 'Sumatif Akhir Semester (SAS)' | 'Asesmen Sumatif Tengah Semester (ASTS)' | 'Asesmen Akhir Jenjang (AAJ)' | 'Penilaian Harian Bersama';
  headmasterName: string;
  headmasterNip: string;
  headmasterIdType?: 'NIP' | 'NIPPPK';
  committeeChairmanName: string;
  committeeChairmanNip: string;
  committeeChairmanIdType?: 'NIP' | 'NIPPPK';
  
  startDate: string; // "YYYY-MM-DD"
  examDaysCount: number; // e.g. 5 days
  activeDays: string[]; // ["Senin", "Selasa", "Rabu", "Kamis", "Jumat"]
  
  startTime: string; // "07:30"
  sessionDurationMinutes: number; // 90
  breakDurationMinutes: number; // 30
  sessionsPerDay: number; // 2
  
  isManualTimeMode?: boolean; // Pilihan pengaturan waktu manual
  customSessionTimes?: CustomSessionTime[]; // Jadwal jam manual per sesi

  // Daftar Pelajaran yang Diujikan Manual per Hari & Sesi:
  dailyExamSubjects?: DailyExamSubjectPlan[];

  invigilatorsPerRoom: 1 | 2;
  maxConsecutiveSessions: number; // e.g. 1 = tidak boleh berurutan langsung (harus istirahat)
  preventTeachingSubjectConflict: boolean; // guru mapel dilarang mengawas mapelnya
  preventTeachingClassConflict: boolean; // guru dilarang mengawas kelas ajarannya
  balanceWorkloadStrictly: boolean; // membagi beban sesama guru secara seimbang
}

export interface ExamScheduleSlot {
  id: string;
  dayIndex: number; // 0, 1, 2, ...
  dateStr: string; // e.g. "Senin, 02 Jun 2026"
  sessionIndex: number; // 1, 2, ...
  startTime: string; // "07:30"
  endTime: string; // "09:00"
  grade: 7 | 8 | 9;
  subjectId: string;
  subjectName: string;
  roomId: string;
  roomName: string;
  classIds: string[];
  classNames: string[];
  studentCount: number;
  invigilator1Id?: string;
  invigilator1Name?: string;
  invigilator2Id?: string;
  invigilator2Name?: string;
  notes?: string;
}

export interface ScheduleChangeLog {
  id: string;
  timestamp: string;
  type: 'GENERATE' | 'UPDATE' | 'DELETE' | 'SWAP_INVIGILATOR' | 'ROOM_CHANGE' | 'TIME_CHANGE';
  description: string;
  affectedParties: ('GURU' | 'SISWA' | 'PANITIA')[];
  details: string;
}

export interface NotificationItem {
  id: string;
  targetType: 'ALL' | 'GURU' | 'SISWA' | 'PANITIA' | 'SPECIFIC_TEACHER';
  targetId?: string;
  targetName?: string;
  title: string;
  message: string;
  timestamp: string;
  sentVia: ('APP' | 'WHATSAPP' | 'PRINT' | 'SHEETS')[];
  isRead: boolean;
  priority: 'normal' | 'high' | 'urgent';
}

export interface TeacherWorkloadStats {
  teacherId: string;
  teacherName: string;
  nip: string;
  code: string;
  totalSessions: number;
  totalDurationMinutes: number;
  sessionsPerDayMap: Record<number, number>; // dayIndex -> count
  hasConsecutiveWarning: boolean;
  hasSubjectConflictWarning: boolean;
  hasClassConflictWarning: boolean;
  scheduleSlots: ExamScheduleSlot[];
}
