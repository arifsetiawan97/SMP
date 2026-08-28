import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
  ExamTimeConfig,
  ExamScheduleSlot,
  Teacher,
  Subject,
  ClassRoom,
  ExamRoom,
  TeacherWorkloadStats,
  Student,
} from '../types';

/**
 * Safely embed logo into jsPDF document
 */
function embedLogoSafely(
  doc: jsPDF,
  imgData: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number
) {
  if (!imgData || typeof imgData !== 'string') return;
  try {
    // If it's a data URI or image format
    doc.addImage(imgData, 'PNG', x, y, width, height, undefined, 'FAST');
  } catch {
    try {
      doc.addImage(imgData, 'JPEG', x, y, width, height, undefined, 'FAST');
    } catch {
      try {
        doc.addImage(imgData, x, y, width, height);
      } catch {
        // Silently skip if the string is not a valid renderable image
      }
    }
  }
}

/**
 * Standard Indonesian Official Letterhead (KOP SURAT) with Left & Right Logos, Kabupaten, and School identity
 */
export function drawOfficialLetterhead(
  doc: jsPDF,
  config: ExamTimeConfig,
  pageWidth: number,
  options: {
    startY?: number;
    documentTitle?: string;
    documentSubtitle?: string;
    compact?: boolean;
  } = {}
): number {
  const startY = options.startY || 8;
  const isLandscape = pageWidth > 250;
  const margin = isLandscape ? 14 : 15;
  const logoSize = options.compact ? 16 : isLandscape ? 22 : 20;
  const centerX = pageWidth / 2;

  // Draw Left Logo (Pemda / Kemdikbud / Kemenag)
  if (config.leftLogoUrl) {
    embedLogoSafely(doc, config.leftLogoUrl, margin, startY, logoSize, logoSize);
  }

  // Draw Right Logo (School / Madrasah Logo)
  if (config.rightLogoUrl) {
    embedLogoSafely(doc, config.rightLogoUrl, pageWidth - margin - logoSize, startY, logoSize, logoSize);
  }

  // Text Hierarchy
  let currentY = startY + (options.compact ? 3.5 : 4.5);
  doc.setTextColor(30, 41, 59);

  // 1. Kabupaten / Kota / Provinsi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(isLandscape ? 12 : 10.5);
  const kabupatenText = (config.kabupaten || 'PEMERINTAH KABUPATEN SLEMAN').toUpperCase();
  doc.text(kabupatenText, centerX, currentY, { align: 'center' });

  // 2. Dinas Pendidikan / Instansi Terkait
  currentY += isLandscape ? 5.5 : 4.8;
  doc.setFontSize(isLandscape ? 10.5 : 9.5);
  const dinasText = (config.dinasPendidikan || 'DINAS PENDIDIKAN, PEMUDA DAN OLAHRAGA').toUpperCase();
  doc.text(dinasText, centerX, currentY, { align: 'center' });

  // 3. Nama Sekolah / Madrasah (Besar & Jelas)
  currentY += isLandscape ? 6.5 : 5.8;
  doc.setFontSize(isLandscape ? 15 : 13);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(config.schoolName.toUpperCase(), centerX, currentY, { align: 'center' });

  // 4. Alamat & Kontak / Identitas NPSN
  currentY += isLandscape ? 4.8 : 4.2;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(isLandscape ? 8.5 : 7.8);
  doc.setTextColor(71, 85, 105);
  const addressText =
    config.schoolAddress ||
    `NPSN: ${config.schoolNpsn} | Tahun Ajaran: ${config.academicYear} | Semester: ${config.semester}`;
  doc.text(addressText, centerX, currentY, { align: 'center' });

  // Double Border (Garis Tebal & Tipis KOP Surat Resmi)
  currentY += 3.8;
  doc.setDrawColor(15, 23, 42);
  doc.setLineWidth(0.8);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  doc.setLineWidth(0.25);
  doc.line(margin, currentY + 1.2, pageWidth - margin, currentY + 1.2);

  currentY += 3.5;

  // Optional Document Title
  if (options.documentTitle) {
    currentY += 3.5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(isLandscape ? 12 : 11);
    doc.setTextColor(15, 23, 42);
    doc.text(options.documentTitle, centerX, currentY, { align: 'center' });

    if (options.documentSubtitle) {
      currentY += 4.5;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(options.documentSubtitle, centerX, currentY, { align: 'center' });
    }
    currentY += 2.5;
  }

  return currentY;
}

/**
 * Generate Master PDF Schedule
 */
export function generateMasterSchedulePDF(
  config: ExamTimeConfig,
  slots: ExamScheduleSlot[],
  teachers: Teacher[]
): void {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 297;
  const startTableY = drawOfficialLetterhead(doc, config, pageWidth, {
    documentTitle: `JADWAL PELAKSANAAN & PEMBAGIAN PENGAWAS ${config.examType.toUpperCase()}`,
    documentSubtitle: `Tahun Ajaran ${config.academicYear} - Semester ${config.semester}`,
  });

  // Prepare table data grouped by Day & Session & Room
  const tableRows = slots.map((s, idx) => [
    idx + 1,
    s.dateStr,
    `Sesi ${s.sessionIndex}\n(${s.startTime} - ${s.endTime})`,
    `Kelas ${s.classNames.join(', ')}`,
    s.roomName,
    s.subjectName,
    s.invigilator1Name || '(Belum Dialokasikan)',
    config.invigilatorsPerRoom === 2 ? (s.invigilator2Name || '-') : '1 Pengawas/Ruang',
  ]);

  autoTable(doc, {
    startY: startTableY + 2,
    head: [[
      'No',
      'Hari & Tanggal',
      'Waktu / Sesi',
      'Kelas',
      'Ruang',
      'Mata Pelajaran',
      'Pengawas Utama',
      config.invigilatorsPerRoom === 2 ? 'Pengawas Pendamping' : 'Keterangan',
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [30, 41, 59], // Slate 800
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 10, halign: 'center' },
      1: { cellWidth: 38 },
      2: { cellWidth: 30, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 50 },
      6: { cellWidth: 50 },
      7: { cellWidth: 43 },
    },
  });

  // Footer / Tanda Tangan
  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  const finalY = (doc.lastAutoTable?.finalY || 160) + 10;
  
  if (finalY < 185) {
    const signatureY = Math.max(finalY, 160);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const chairmanIdLabel = config.committeeChairmanIdType || 'NIP';
    const headmasterIdLabel = config.headmasterIdType || 'NIP';

    // Left: Ketua Panitia
    doc.text(`Mengetahui,`, 30, signatureY);
    doc.text(`Ketua Panitia Ujian,`, 30, signatureY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.committeeChairmanName, 30, signatureY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`${chairmanIdLabel}. ${config.committeeChairmanNip || '-'}`, 30, signatureY + 30);

    // Right: Kepala Sekolah
    doc.text(`Ditetapkan di: ${config.kabupaten ? config.kabupaten.replace(/^(PEMERINTAH\s+|KABUPATEN\s+|KOTA\s+)/i, '') : 'Sekolah'}`, 200, signatureY);
    doc.text(`Kepala ${config.schoolName},`, 200, signatureY + 5);
    doc.setFont('helvetica', 'bold');
    doc.text(config.headmasterName, 200, signatureY + 25);
    doc.setFont('helvetica', 'normal');
    doc.text(`${headmasterIdLabel}. ${config.headmasterNip || '-'}`, 200, signatureY + 30);
  }

  doc.save(`Jadwal_Master_${config.schoolName.replace(/\s+/g, '_')}_${config.semester}.pdf`);
}

/**
 * Generate PDF Slips per Teacher (Surat Tugas / Slip Pengawas Individu)
 */
export function generateTeacherSlipsPDF(
  config: ExamTimeConfig,
  teachers: Teacher[],
  slots: ExamScheduleSlot[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const activeTeachers = teachers.filter((t) => t.isAvailable);

  activeTeachers.forEach((teacher, tIdx) => {
    if (tIdx > 0) doc.addPage();

    // Teacher specific slots
    const teacherSlots = slots.filter(
      (s) => s.invigilator1Id === teacher.id || s.invigilator2Id === teacher.id
    );

    // KOP Header with Logos & Kabupaten
    const startContentY = drawOfficialLetterhead(doc, config, 210, {
      documentTitle: 'SURAT TUGAS & JADWAL PENGAWAS UJIAN',
      documentSubtitle: `${config.examType} - Tahun Ajaran ${config.academicYear}`,
      compact: true,
    });

    // Teacher Info Box
    const teacherIdLabel = teacher.idType || (teacher.employeeStatus === 'PPPK' ? 'NIPPPK' : teacher.employeeStatus === 'Honorer' ? 'NUPTK' : 'NIP');
    const headmasterIdLabel = config.headmasterIdType || 'NIP';

    const infoBoxY = startContentY + 2;
    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(15, infoBoxY, 180, 24, 2, 2, 'FD');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 41, 59);
    doc.text(`Nama Guru / ${teacherIdLabel}`, 20, infoBoxY + 6.5);
    doc.text(`Mata Pelajaran Diampu`, 20, infoBoxY + 12.5);
    doc.text(`Total Tugas Mengawas`, 20, infoBoxY + 18.5);

    doc.setFont('helvetica', 'normal');
    doc.text(`: ${teacher.name} (${teacherIdLabel}. ${teacher.nip || '-'})`, 68, infoBoxY + 6.5);
    doc.text(`: ${teacher.subjects.join(', ') || '-'}`, 68, infoBoxY + 12.5);
    doc.text(`: ${teacherSlots.length} Sesi (${teacherSlots.length * config.sessionDurationMinutes} Menit)`, 68, infoBoxY + 18.5);

    // Table of assigned duties
    const tableData = teacherSlots.map((s, idx) => [
      idx + 1,
      s.dateStr,
      `Sesi ${s.sessionIndex}\n(${s.startTime} - ${s.endTime})`,
      s.roomName,
      s.classNames.join(', '),
      s.subjectName,
      s.invigilator1Id === teacher.id ? 'Pengawas Utama (1)' : 'Pengawas Pendamping (2)',
    ]);

    autoTable(doc, {
      startY: infoBoxY + 28,
      head: [['No', 'Hari & Tanggal', 'Waktu / Sesi', 'Ruang', 'Kelas', 'Mata Pelajaran', 'Peran']],
      body: tableData.length > 0 ? tableData : [['-', 'Tidak ada jadwal', '-', '-', '-', '-', '-']],
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 2.5, valign: 'middle' },
      headStyles: { fillColor: [44, 62, 80], textColor: [255, 255, 255], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 35 },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 25, halign: 'center' },
        4: { cellWidth: 20, halign: 'center' },
        5: { cellWidth: 35 },
        6: { cellWidth: 25, halign: 'center' },
      },
    });

    // Instructions Box
    // @ts-expect-error jspdf-autotable
    const afterTableY = (doc.lastAutoTable?.finalY || 140) + 8;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.text('Catatan Penting Pengawas:', 15, afterTableY);
    doc.text('1. Hadir 15 menit sebelum sesi ujian dimulai di Ruang Sekretariat / Panitia.', 15, afterTableY + 4);
    doc.text('2. Memeriksa kesiapan lembar soal & lembar jawaban, presensi siswa, dan tata tertib.', 15, afterTableY + 8);
    doc.text('3. Apabila berhalangan hadir karena sakit/tugas dinas, wajib mengonfirmasi panitia H-1 untuk penggantian.', 15, afterTableY + 12);

    // Signature
    const sigY = afterTableY + 22;
    if (sigY < 265) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text(`Kepala ${config.schoolName},`, 130, sigY);
      doc.setFont('helvetica', 'bold');
      doc.text(config.headmasterName, 130, sigY + 20);
      doc.setFont('helvetica', 'normal');
      doc.text(`${headmasterIdLabel}. ${config.headmasterNip || '-'}`, 130, sigY + 24);
    }
  });

  doc.save(`Slip_Jadwal_Pengawas_Semua_Guru_${config.schoolName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate Berita Acara & Daftar Hadir Pengawas (Official Exam Documents)
 */
export function generateAttendanceAndBAP_PDF(
  config: ExamTimeConfig,
  slots: ExamScheduleSlot[]
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Group slots by date and session to generate BAP per room/session
  const uniqueSessions: { dateStr: string; sessionIndex: number; startTime: string; endTime: string }[] = [];
  slots.forEach((s) => {
    if (!uniqueSessions.some((u) => u.dateStr === s.dateStr && u.sessionIndex === s.sessionIndex)) {
      uniqueSessions.push({
        dateStr: s.dateStr,
        sessionIndex: s.sessionIndex,
        startTime: s.startTime,
        endTime: s.endTime,
      });
    }
  });

  uniqueSessions.forEach((sess, idx) => {
    if (idx > 0) doc.addPage();

    const sessionSlots = slots.filter(
      (s) => s.dateStr === sess.dateStr && s.sessionIndex === sess.sessionIndex
    );

    // KOP Header with Logos & Kabupaten
    const startTableY = drawOfficialLetterhead(doc, config, 210, {
      documentTitle: 'DAFTAR HADIR PENGAWAS & BERITA ACARA UJIAN',
      documentSubtitle: `Hari/Tanggal: ${sess.dateStr} | Sesi ${sess.sessionIndex} (${sess.startTime} - ${sess.endTime})`,
      compact: true,
    });

    const rows = sessionSlots.map((s, sIdx) => [
      sIdx + 1,
      s.roomName,
      s.classNames.join(', '),
      s.subjectName,
      s.invigilator1Name || '-',
      '', // Tanda Tangan
    ]);

    autoTable(doc, {
      startY: startTableY + 2,
      head: [['No', 'Ruang', 'Kelas', 'Mata Pelajaran', 'Nama Pengawas', 'Tanda Tangan']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 45 },
        4: { cellWidth: 45 },
        5: { cellWidth: 30 },
      },
    });

    autoTable(doc, {
      startY: 34,
      head: [['No', 'Ruang', 'Kelas', 'Mata Pelajaran', 'Nama Pengawas', 'Tanda Tangan']],
      body: rows,
      theme: 'grid',
      styles: { fontSize: 8.5, cellPadding: 3, valign: 'middle' },
      headStyles: { fillColor: [51, 65, 85], textColor: [255, 255, 255], halign: 'center' },
      columnStyles: {
        0: { cellWidth: 10, halign: 'center' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 45 },
        4: { cellWidth: 45 },
        5: { cellWidth: 30 },
      },
    });

    // @ts-expect-error jspdf-autotable
    const endY = (doc.lastAutoTable?.finalY || 140) + 10;

    // Catatan Berita Acara
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('CATATAN BERITA ACARA KEJADIAN PENTING:', 15, endY);
    doc.setDrawColor(200, 200, 200);
    doc.rect(15, endY + 3, 180, 25);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text('(Catat jumlah siswa hadir/tidak hadir, lembar soal rusak, atau insiden lainnya)', 18, endY + 8);
    doc.setTextColor(0, 0, 0);

    // Signatures
    const sigY = endY + 35;
    if (sigY < 265) {
      const chairmanIdLabel = config.committeeChairmanIdType || 'NIP';
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text('Petugas / Panitia Piket,', 30, sigY);
      doc.text('Ketua Panitia Ujian,', 140, sigY);
      
      doc.setFont('helvetica', 'bold');
      doc.text('(..................................................)', 30, sigY + 22);
      doc.text(config.committeeChairmanName, 140, sigY + 22);
      doc.setFont('helvetica', 'normal');
      doc.text(`${chairmanIdLabel}. ${config.committeeChairmanNip || '-'}`, 140, sigY + 27);
    }
  });

  doc.save(`Daftar_Hadir_Pengawas_dan_BAP_${config.schoolName.replace(/\s+/g, '_')}.pdf`);
}

/**
 * Generate Comprehensive Multi-Sheet Excel Workbook
 */
export function generateComprehensiveExcel(
  config: ExamTimeConfig,
  slots: ExamScheduleSlot[],
  teachers: Teacher[],
  teacherStats: TeacherWorkloadStats[],
  classes: ClassRoom[],
  rooms: ExamRoom[]
): void {
  const wb = XLSX.utils.book_new();

  // Sheet 1: JADWAL UTAMA UJIAN
  const masterData = slots.map((s, idx) => ({
    No: idx + 1,
    'Hari & Tanggal': s.dateStr,
    Sesi: `Sesi ${s.sessionIndex}`,
    'Waktu Mulai': s.startTime,
    'Waktu Selesai': s.endTime,
    Tingkat: `Kelas ${s.grade}`,
    Kelas: s.classNames.join(', '),
    Ruang: s.roomName,
    'Mata Pelajaran': s.subjectName,
    'Jumlah Siswa': s.studentCount,
    'Pengawas 1': s.invigilator1Name || '-',
    'Pengawas 2': s.invigilator2Name || '-',
    Catatan: s.notes || '',
  }));
  const wsMaster = XLSX.utils.json_to_sheet(masterData);
  wsMaster['!cols'] = [
    { wch: 6 }, // No
    { wch: 22 }, // Hari & Tanggal
    { wch: 10 }, // Sesi
    { wch: 12 }, // Jam Mulai
    { wch: 12 }, // Jam Selesai
    { wch: 10 }, // Tingkat
    { wch: 12 }, // Kelas
    { wch: 14 }, // Ruang
    { wch: 30 }, // Mapel
    { wch: 14 }, // Jml Siswa
    { wch: 32 }, // Pengawas 1
    { wch: 32 }, // Pengawas 2
    { wch: 20 }, // Catatan
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, 'Jadwal_Master_Ujian');

  // Sheet 2: REKAP BEBAN GURU & AUDIT
  const statsData = teacherStats.map((stat, idx) => ({
    No: idx + 1,
    'Nama Guru': stat.teacherName,
    NIP: stat.nip || '-',
    Kode: stat.code,
    'Total Sesi Mengawas': stat.totalSessions,
    'Total Durasi (Menit)': stat.totalDurationMinutes,
    'Total Jam (Jam:Menit)': `${Math.floor(stat.totalDurationMinutes / 60)}j ${stat.totalDurationMinutes % 60}m`,
    'Status Beban': stat.totalSessions === 0 ? 'Tidak Bertugas' : 'Sesuai Kuota',
    'Catatan Konflik Mapel': stat.hasSubjectConflictWarning ? 'ADA PERINGATAN MAPEL' : 'Aman',
    'Catatan Anti-Kelelahan': stat.hasConsecutiveWarning ? 'Mengawas Berurutan' : 'Normal',
  }));
  const wsStats = XLSX.utils.json_to_sheet(statsData);
  wsStats['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 24 },
    { wch: 8 },
    { wch: 20 },
    { wch: 20 },
    { wch: 22 },
    { wch: 16 },
    { wch: 24 },
    { wch: 24 },
  ];
  XLSX.utils.book_append_sheet(wb, wsStats, 'Rekap_Beban_Tugas_Guru');

  // Sheet 3: DATA GURU & MAPEL AMPU
  const teacherData = teachers.map((t, idx) => ({
    No: idx + 1,
    'Nama Guru': t.name,
    NIP: t.nip || '-',
    Kode: t.code,
    Gender: t.gender === 'L' ? 'Laki-laki' : 'Perempuan',
    No_HP: t.phone || '-',
    Email: t.email || '-',
    'Mata Pelajaran Diampu': t.subjects.join(', '),
    'Kelas Diajar': t.classesTaught.join(', '),
    'Status Aktif Mengawas': t.isAvailable ? 'Aktif' : 'Nonaktif',
  }));
  const wsTeachers = XLSX.utils.json_to_sheet(teacherData);
  wsTeachers['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 24 },
    { wch: 8 },
    { wch: 14 },
    { wch: 16 },
    { wch: 28 },
    { wch: 30 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsTeachers, 'Master_Data_Guru');

  // Sheet 4: ALOKASI RUANG & KELAS
  const roomData = classes.map((cls, idx) => {
    const room = rooms[idx % rooms.length];
    return {
      No: idx + 1,
      'Nama Kelas': cls.name,
      Tingkat: `Kelas ${cls.grade}`,
      'Jumlah Siswa': cls.studentCount,
      'Ruang Ujian': room?.name || `Ruang ${idx + 1}`,
      Lokasi: room?.location || '-',
      Kapasitas: room?.capacity || 34,
    };
  });
  const wsRooms = XLSX.utils.json_to_sheet(roomData);
  wsRooms['!cols'] = [
    { wch: 6 },
    { wch: 14 },
    { wch: 12 },
    { wch: 14 },
    { wch: 16 },
    { wch: 24 },
    { wch: 14 },
  ];
  XLSX.utils.book_append_sheet(wb, wsRooms, 'Alokasi_Ruang_Siswa');

  // Write and download
  XLSX.writeFile(wb, `Jadwal_Ujian_Lengkap_${config.schoolName.replace(/\s+/g, '_')}_${config.academicYear.replace(/\//g, '-')}.xlsx`);
}

/**
 * Synchronize Schedule to Google Sheets via Google Sheets API v4
 */
export async function syncScheduleToGoogleSheets(
  accessToken: string,
  config: ExamTimeConfig,
  slots: ExamScheduleSlot[],
  teacherStats: TeacherWorkloadStats[]
): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> {
  // 1. Create a new Spreadsheet
  const title = `Jadwal & Pengawas Ujian SMP - ${config.schoolName} (${config.semester} ${config.academicYear})`;
  
  const createResponse = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        { properties: { title: 'Jadwal_Master_Ujian' } },
        { properties: { title: 'Rekap_Beban_Pengawas' } },
      ],
    }),
  });

  if (!createResponse.ok) {
    const errText = await createResponse.text();
    throw new Error(`Gagal membuat Google Spreadsheet: ${errText}`);
  }

  const sheetData = await createResponse.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Master Rows
  const masterValues = [
    [`JADWAL PELAKSANAAN & DISTRIBUSI PENGAWAS UJIAN`],
    [config.schoolName, `Tahun Ajaran: ${config.academicYear}`, `Semester: ${config.semester}`],
    [],
    [
      'No',
      'Hari & Tanggal',
      'Sesi',
      'Waktu Mulai',
      'Waktu Selesai',
      'Kelas',
      'Ruang',
      'Mata Pelajaran',
      'Jumlah Siswa',
      'Pengawas Utama (1)',
      'Pengawas Pendamping (2)',
      'Catatan',
    ],
    ...slots.map((s, idx) => [
      idx + 1,
      s.dateStr,
      `Sesi ${s.sessionIndex}`,
      s.startTime,
      s.endTime,
      s.classNames.join(', '),
      s.roomName,
      s.subjectName,
      s.studentCount,
      s.invigilator1Name || '-',
      s.invigilator2Name || '-',
      s.notes || '',
    ]),
  ];

  // 3. Prepare Stats Rows
  const statsValues = [
    [`REKAPITULASI BEBAN TUGAS PENGAWAS UJIAN GURU`],
    [config.schoolName, `Total Guru: ${teacherStats.length}`],
    [],
    [
      'No',
      'Nama Guru',
      'NIP',
      'Kode Guru',
      'Total Sesi',
      'Total Menit',
      'Status Beban',
      'Status Peringatan Mapel',
      'Status Anti-Kelelahan',
    ],
    ...teacherStats.map((st, idx) => [
      idx + 1,
      st.teacherName,
      st.nip || '-',
      st.code,
      st.totalSessions,
      st.totalDurationMinutes,
      st.totalSessions > 0 ? 'Aktif' : 'Nihil',
      st.hasSubjectConflictWarning ? 'Peringatan Mapel' : 'Aman',
      st.hasConsecutiveWarning ? 'Mengawas Berurutan' : 'Normal',
    ]),
  ];

  // 4. Batch update data to Google Sheets
  const updateResponse = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchUpdate`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        valueInputOption: 'USER_ENTERED',
        data: [
          {
            range: 'Jadwal_Master_Ujian!A1',
            values: masterValues,
          },
          {
            range: 'Rekap_Beban_Pengawas!A1',
            values: statsValues,
          },
        ],
      }),
    }
  );

  if (!updateResponse.ok) {
    const errText = await updateResponse.text();
    throw new Error(`Gagal mengisi data Google Sheets: ${errText}`);
  }

  return { spreadsheetId, spreadsheetUrl };
}

/**
 * Generate Student Exam Cards (Kartu Peserta Ujian Siswa) in PDF
 * 2 Cards per page (A4 portrait)
 */
export function generateExamCardsPDF(
  config: ExamTimeConfig,
  students: Student[],
  slots: ExamScheduleSlot[],
  filterClassId?: string
): void {
  const targetStudents = filterClassId && filterClassId !== 'all'
    ? students.filter((s) => s.classId === filterClassId)
    : students;

  if (targetStudents.length === 0) {
    throw new Error('Tidak ada data siswa untuk dicetak kartu ujiannya.');
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const cardsPerPage = 2;
  const cardHeight = 135;
  const cardWidth = 190;
  const startX = 10;

  targetStudents.forEach((student, sIdx) => {
    const cardPositionOnPage = sIdx % cardsPerPage; // 0 (top) or 1 (bottom)

    if (sIdx > 0 && cardPositionOnPage === 0) {
      doc.addPage();
    }

    const startY = cardPositionOnPage === 0 ? 10 : 152;

    // Draw Outer Card Border with rounded corners
    doc.setDrawColor(79, 70, 229); // Indigo 600
    doc.setLineWidth(0.6);
    doc.roundedRect(startX, startY, cardWidth, cardHeight, 3, 3, 'S');

    // Header Background Strip
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(startX + 0.5, startY + 0.5, cardWidth - 1, 28, 2.5, 2.5, 'F');

    // Left & Right Logo in Card Header
    const cardLogoSize = 16;
    if (config.leftLogoUrl) {
      embedLogoSafely(doc, config.leftLogoUrl, startX + 4, startY + 4, cardLogoSize, cardLogoSize);
    }
    if (config.rightLogoUrl) {
      embedLogoSafely(doc, config.rightLogoUrl, startX + cardWidth - cardLogoSize - 4, startY + 4, cardLogoSize, cardLogoSize);
    }

    // School Header Text
    const cardCenterX = startX + cardWidth / 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    const kabDinas = `${(config.kabupaten || 'PEMERINTAH KABUPATEN SLEMAN').toUpperCase()} • ${(config.dinasPendidikan || 'DINAS PENDIDIKAN').toUpperCase()}`;
    doc.text(kabDinas, cardCenterX, startY + 5.5, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(15, 23, 42);
    doc.text(config.schoolName.toUpperCase(), cardCenterX, startY + 11, { align: 'center' });
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(67, 56, 202);
    doc.text(`KARTU PESERTA ${config.examType.toUpperCase()}`, cardCenterX, startY + 16.5, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text(
      config.schoolAddress || `NPSN: ${config.schoolNpsn} | Tahun Pelajaran: ${config.academicYear} | Semester: ${config.semester}`,
      cardCenterX,
      startY + 21.5,
      { align: 'center' }
    );

    doc.setDrawColor(203, 213, 225);
    doc.setLineWidth(0.4);
    doc.line(startX + 4, startY + 25.5, startX + cardWidth - 4, startY + 25.5);

    // ==========================================
    // 1. Photo Box (Left Side)
    // ==========================================
    const photoX = startX + 10;
    const photoY = startY + 34;
    const photoW = 28;
    const photoH = 38;

    doc.setDrawColor(148, 163, 184);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(photoX, photoY, photoW, photoH, 1.5, 1.5, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text('PAS FOTO', photoX + photoW / 2, photoY + 17, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text('3 x 4 cm', photoX + photoW / 2, photoY + 22, { align: 'center' });

    // ==========================================
    // 2. Student Identity (Middle Box)
    // ==========================================
    const infoX = startX + 46;
    const infoY = startY + 36;
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(71, 85, 105);
    doc.text('IDENTITAS PESERTA UJIAN', infoX, infoY);

    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);

    const labels = [
      { label: 'Nama Lengkap', val: student.name, isBold: true },
      { label: 'NISN / NIS', val: `${student.nisn || '-'} / ${student.nis || '-'}` },
      { label: 'Kelas / Rombel', val: `Kelas ${student.className}`, isBold: true },
      { label: 'Jenis Kelamin', val: student.gender === 'P' ? 'Perempuan (P)' : 'Laki-Laki (L)' },
    ];

    labels.forEach((item, idx) => {
      const lineY = infoY + 7 + idx * 6.5;
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(100, 116, 139);
      doc.text(item.label, infoX, lineY);

      doc.setFont('helvetica', item.isBold ? 'bold' : 'normal');
      doc.setTextColor(15, 23, 42);
      doc.text(`:  ${item.val}`, infoX + 32, lineY);
    });

    // ==========================================
    // 3. Exam Room & Seat Info (Right Highlight Box)
    // ==========================================
    const roomBoxX = startX + 120;
    const roomBoxY = startY + 34;
    const roomBoxW = 60;
    const roomBoxH = 38;

    doc.setFillColor(238, 242, 255); // Indigo 50
    doc.setDrawColor(199, 210, 254); // Indigo 200
    doc.setLineWidth(0.4);
    doc.roundedRect(roomBoxX, roomBoxY, roomBoxW, roomBoxH, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(67, 56, 202);
    doc.text('RUANG & MEJA UJIAN', roomBoxX + roomBoxW / 2, roomBoxY + 7, { align: 'center' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(30, 27, 75);
    doc.text(student.roomName || 'Ruang 01', roomBoxX + roomBoxW / 2, roomBoxY + 16, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text('Nomor Meja / Kursi:', roomBoxX + roomBoxW / 2, roomBoxY + 23, { align: 'center' });

    // Seat Number Pill
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(165, 180, 252);
    doc.roundedRect(roomBoxX + 15, roomBoxY + 25.5, 30, 9, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(67, 56, 202);
    doc.text(`NO. ${String(student.seatNumber).padStart(2, '0')}`, roomBoxX + roomBoxW / 2, roomBoxY + 31.5, { align: 'center' });

    // ==========================================
    // 4. Instructions & Signatures Section (Bottom)
    // ==========================================
    const bottomY = startY + 82;
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(startX + 6, bottomY, startX + cardWidth - 6, bottomY);

    // Left: Tata Tertib Ringkas
    const notesX = startX + 10;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('TATA TERTIB PESERTA UJIAN:', notesX, bottomY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(100, 116, 139);
    doc.text('1. Kartu peserta wajib dibawa setiap sesi ujian berlangsung.', notesX, bottomY + 12);
    doc.text('2. Peserta menempati ruang dan kursi sesuai nomor tertera.', notesX, bottomY + 16.5);
    doc.text('3. Memakai seragam sekolah rapi dan hadir 15 menit sebelum ujian.', notesX, bottomY + 21);
    doc.text('4. Dilarang membawa HP/alat komunikasi ke dalam ruang ujian.', notesX, bottomY + 25.5);

    // Right: Signature Area
    const sigX = startX + 130;
    const headmasterIdLabel = config.headmasterIdType || 'NIP';
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(51, 65, 85);
    doc.text('Mengetahui,', sigX, bottomY + 7);
    doc.text(`Kepala ${config.schoolName}`, sigX, bottomY + 11);

    // Signature line / Headmaster Info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(15, 23, 42);
    doc.text(config.headmasterName, sigX, bottomY + 34);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${headmasterIdLabel}. ${config.headmasterNip || '-'}`, sigX, bottomY + 38.5);

    // Perforated Separator Line between Top and Bottom card
    if (cardPositionOnPage === 0) {
      doc.setDrawColor(203, 213, 225);
      doc.setLineDashPattern([2, 2], 0);
      doc.setLineWidth(0.3);
      doc.line(8, 148, 202, 148);
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(6.5);
      doc.setTextColor(148, 163, 184);
      doc.text('--- Gunting / Lipat di sini ---', 105, 147.5, { align: 'center' });
      doc.setLineDashPattern([], 0); // reset dash
    }
  });

  doc.save(`Kartu_Ujian_Siswa_${config.schoolName.replace(/\s+/g, '_')}_${filterClassId || 'Semua_Kelas'}.pdf`);
}

/**
 * Generate Single Student Exam Card PDF
 */
export function generateSingleStudentCardPDF(
  config: ExamTimeConfig,
  student: Student,
  slots: ExamScheduleSlot[]
): void {
  generateExamCardsPDF(config, [student], slots);
}

/**
 * Download sample import templates (.xlsx)
 */
export function downloadTemplateXLSX(type: 'teachers' | 'rooms' | 'classes' | 'subjects' | 'students'): void {
  const wb = XLSX.utils.book_new();

  if (type === 'teachers') {
    const sampleData = [
      {
        'Nama Lengkap & Gelar': 'Drs. Bambang Sudarsono, M.Pd.',
        NIP: '19680315 199303 1 004',
        'Kode Singkatan': 'BMB',
        Gender: 'L',
        'No WhatsApp': '081234567801',
        Email: 'bambang@sekolah.sch.id',
        'Mapel Diampu (Pisahkan koma)': 'Bahasa Indonesia, Seni Budaya',
        'Kelas Ajar (Pisahkan koma)': 'VII-A, VII-B, VIII-A',
        'Max Sesi Per Hari': 2,
        'Status Aktif (Y/T)': 'Y',
      },
      {
        'Nama Lengkap & Gelar': 'Sri Wahyuni, S.Pd., M.Si.',
        NIP: '19750820 200012 2 002',
        'Kode Singkatan': 'SRI',
        Gender: 'P',
        'No WhatsApp': '081234567802',
        Email: 'sri@sekolah.sch.id',
        'Mapel Diampu (Pisahkan koma)': 'Matematika, IPA',
        'Kelas Ajar (Pisahkan koma)': 'VII-B, VII-C, IX-A',
        'Max Sesi Per Hari': 2,
        'Status Aktif (Y/T)': 'Y',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Guru');
    XLSX.writeFile(wb, 'Template_Impor_Guru_SMP.xlsx');
  } else if (type === 'rooms') {
    const sampleData = [
      { 'Nama Ruang': 'Ruang 01', Kode: 'R-01', Kapasitas: 34, Lokasi: 'Gedung A - Lt. 1', 'Status Aktif (Y/T)': 'Y' },
      { 'Nama Ruang': 'Ruang 02', Kode: 'R-02', Kapasitas: 34, Lokasi: 'Gedung A - Lt. 1', 'Status Aktif (Y/T)': 'Y' },
      { 'Nama Ruang': 'Lab Komputer 1', Kode: 'LAB-1', Kapasitas: 36, Lokasi: 'Gedung B - Lt. 2', 'Status Aktif (Y/T)': 'Y' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Ruang');
    XLSX.writeFile(wb, 'Template_Impor_Ruang_Ujian_SMP.xlsx');
  } else if (type === 'classes') {
    const sampleData = [
      { 'Nama Kelas': 'VII-A', Tingkat: 7, 'Jumlah Siswa': 32 },
      { 'Nama Kelas': 'VII-B', Tingkat: 7, 'Jumlah Siswa': 32 },
      { 'Nama Kelas': 'VIII-A', Tingkat: 8, 'Jumlah Siswa': 32 },
      { 'Nama Kelas': 'IX-A', Tingkat: 9, 'Jumlah Siswa': 32 },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Kelas');
    XLSX.writeFile(wb, 'Template_Impor_Kelas_SMP.xlsx');
  } else if (type === 'subjects') {
    const sampleData = [
      { 'Nama Mata Pelajaran': 'Bahasa Indonesia', Kode: 'BIN', Kategori: 'Bahasa', 'Durasi Menit': 90, 'Tingkat (7/8/9/all)': 'all' },
      { 'Nama Mata Pelajaran': 'Matematika', Kode: 'MTK', Kategori: 'MIPA', 'Durasi Menit': 90, 'Tingkat (7/8/9/all)': 'all' },
      { 'Nama Mata Pelajaran': 'Ilmu Pengetahuan Alam (IPA)', Kode: 'IPA', Kategori: 'MIPA', 'Durasi Menit': 90, 'Tingkat (7/8/9/all)': 'all' },
      { 'Nama Mata Pelajaran': 'Bahasa Inggris', Kode: 'BIG', Kategori: 'Bahasa', 'Durasi Menit': 90, 'Tingkat (7/8/9/all)': 'all' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Mapel');
    XLSX.writeFile(wb, 'Template_Impor_Mapel_SMP.xlsx');
  } else if (type === 'students') {
    const sampleData = [
      { 'Nama Lengkap': 'Aditya Pratama Putra', NISN: '0078123451', NIS: '25267001', Kelas: 'VII-A', Ruang: 'Ruang 01', 'Nomor Kursi': 1, Gender: 'L' },
      { 'Nama Lengkap': 'Aisyah Nur Ramadhani', NISN: '0078123452', NIS: '25267002', Kelas: 'VII-A', Ruang: 'Ruang 01', 'Nomor Kursi': 2, Gender: 'P' },
      { 'Nama Lengkap': 'Bagas Satria Wibowo', NISN: '0088123453', NIS: '25268001', Kelas: 'VIII-A', Ruang: 'Ruang 04', 'Nomor Kursi': 1, Gender: 'L' },
    ];
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Template_Siswa');
    XLSX.writeFile(wb, 'Template_Impor_Data_Siswa_SMP.xlsx');
  }
}

/**
 * Export Teacher Master Data to XLSX
 */
export function exportTeachersToXLSX(teachers: Teacher[], schoolName: string): void {
  const wb = XLSX.utils.book_new();
  const data = teachers.map((t, idx) => ({
    No: idx + 1,
    'Nama Lengkap & Gelar': t.name,
    NIP: t.nip || '-',
    'Kode Singkatan': t.code,
    Gender: t.gender,
    'No WhatsApp': t.phone,
    Email: t.email,
    'Mapel Diampu (Pisahkan koma)': t.subjects.join(', '),
    'Kelas Ajar (Pisahkan koma)': t.classesTaught.join(', '),
    'Max Sesi Per Hari': t.maxSessionsPerDay,
    'Status Aktif (Y/T)': t.isAvailable ? 'Y' : 'T',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 24 },
    { wch: 16 },
    { wch: 10 },
    { wch: 18 },
    { wch: 28 },
    { wch: 35 },
    { wch: 25 },
    { wch: 18 },
    { wch: 16 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Guru');
  XLSX.writeFile(wb, `Data_Guru_${schoolName.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Export Student Master Data to XLSX
 */
export function exportStudentsToXLSX(students: Student[], schoolName: string): void {
  const wb = XLSX.utils.book_new();
  const data = students.map((s, idx) => ({
    No: idx + 1,
    'Nama Lengkap': s.name,
    NISN: s.nisn || '-',
    NIS: s.nis || '-',
    Kelas: s.className,
    'Ruang Ujian': s.roomName || 'Ruang 01',
    'Nomor Kursi': s.seatNumber,
    'Jenis Kelamin': s.gender === 'P' ? 'Perempuan (P)' : 'Laki-Laki (L)',
  }));

  const ws = XLSX.utils.json_to_sheet(data);
  ws['!cols'] = [
    { wch: 6 },
    { wch: 32 },
    { wch: 18 },
    { wch: 16 },
    { wch: 14 },
    { wch: 18 },
    { wch: 14 },
    { wch: 20 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Data_Siswa');
  XLSX.writeFile(wb, `Data_Siswa_${schoolName.replace(/\s+/g, '_')}.xlsx`);
}

/**
 * Generate Daftar Hadir Peserta Ujian & Denah Duduk per Ruangan PDF
 */
export function generateRoomAttendancePDF(
  config: ExamTimeConfig,
  students: Student[],
  roomName: string
): void {
  const roomStudents = students
    .filter((s) => s.roomName === roomName)
    .sort((a, b) => a.seatNumber - b.seatNumber);

  if (roomStudents.length === 0) {
    throw new Error(`Tidak ada peserta ujian di ${roomName}`);
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // KOP SURAT
  const startTableY = drawOfficialLetterhead(doc, config, 210, {
    documentTitle: `DAFTAR HADIR & DENAH PESERTA UJIAN`,
    documentSubtitle: `Tahun Ajaran ${config.academicYear} • Semester ${config.semester} • ${config.examType}`,
    compact: true,
  });

  // Sub Header Details
  const subHeaderY = startTableY + 3;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`RUANG UJIAN: ${roomName.toUpperCase()}`, 15, subHeaderY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Peserta: ${roomStudents.length} Siswa (L: ${roomStudents.filter(s => s.gender === 'L').length}, P: ${roomStudents.filter(s => s.gender === 'P').length})`, 195, subHeaderY, { align: 'right' });

  const tableRows = roomStudents.map((s) => [
    s.seatNumber,
    s.name,
    s.nisn || '-',
    s.gender === 'P' ? 'P' : 'L',
    s.className,
    s.seatNumber % 2 === 1 ? `${s.seatNumber}. ................` : '',
    s.seatNumber % 2 === 0 ? `${s.seatNumber}. ................` : '',
  ]);

  autoTable(doc, {
    startY: subHeaderY + 4,
    head: [[
      'No. Meja',
      'Nama Lengkap Siswa',
      'NISN',
      'L/P',
      'Kelas',
      'Tanda Tangan (Ganjil)',
      'Tanda Tangan (Genap)',
    ]],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 8.5,
      cellPadding: 2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [49, 46, 129], // Indigo 900
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { cellWidth: 16, halign: 'center' },
      1: { cellWidth: 60 },
      2: { cellWidth: 26, halign: 'center' },
      3: { cellWidth: 12, halign: 'center' },
      4: { cellWidth: 20, halign: 'center' },
      5: { cellWidth: 24 },
      6: { cellWidth: 24 },
    },
  });

  // @ts-expect-error jspdf-autotable adds lastAutoTable to doc
  const finalY = (doc.lastAutoTable?.finalY || 200) + 10;
  if (finalY < 240) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Pengawas Ruang 1,`, 30, finalY);
    doc.text(`(....................................................)`, 30, finalY + 20);
    doc.text(`NIP. `, 30, finalY + 25);

    doc.text(`Pengawas Ruang 2,`, 130, finalY);
    doc.text(`(....................................................)`, 130, finalY + 20);
    doc.text(`NIP. `, 130, finalY + 25);
  }

  doc.save(`Daftar_Hadir_${roomName.replace(/\s+/g, '_')}_${config.schoolName.replace(/\s+/g, '_')}.pdf`);
}


