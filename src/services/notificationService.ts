import { ExamTimeConfig, ExamScheduleSlot, Teacher, NotificationItem, ScheduleChangeLog } from '../types';

/**
 * Generate personal WhatsApp message for a teacher
 */
export function generateTeacherWhatsAppMessage(
  config: ExamTimeConfig,
  teacher: Teacher,
  slots: ExamScheduleSlot[]
): string {
  const teacherSlots = slots.filter(
    (s) => s.invigilator1Id === teacher.id || s.invigilator2Id === teacher.id
  );

  let msg = `*PEMBERITAHUAN JADWAL PENGAWAS UJIAN*\n`;
  msg += `*${config.schoolName}*\n`;
  msg += `Kegiatan: ${config.examType}\n`;
  msg += `Tahun Ajaran: ${config.academicYear} (${config.semester})\n\n`;
  msg += `Yth. Bpk/Ibu *${teacher.name}*\n`;
  msg += `Berikut adalah rincian jadwal tugas pengawasan ujian Anda:\n\n`;

  if (teacherSlots.length === 0) {
    msg += `_Anda tidak memiliki jadwal pengawasan pada periode ujian ini._\n\n`;
  } else {
    teacherSlots.forEach((s, idx) => {
      const role = s.invigilator1Id === teacher.id ? 'Pengawas Utama' : 'Pengawas Pendamping';
      msg += `*${idx + 1}. ${s.dateStr}*\n`;
      msg += `   ⏰ Sesi ${s.sessionIndex} (${s.startTime} - ${s.endTime})\n`;
      msg += `   📍 ${s.roomName} (Kelas ${s.classNames.join(', ')})\n`;
      msg += `   📚 Mapel: ${s.subjectName}\n`;
      msg += `   👤 Posisi: ${role}\n\n`;
    });
  }

  msg += `*Catatan Penting:*\n`;
  msg += `1. Harap hadir 15 menit sebelum ujian dimulai di Ruang Panitia.\n`;
  msg += `2. Bila berhalangan hadir, harap segera konfirmasi ke Panitia Ujian.\n\n`;
  msg += `Terima kasih atas kerja sama dan dedikasi Bpk/Ibu Guru.\n`;
  msg += `_Panitia Ujian ${config.schoolName}_`;

  return msg;
}

/**
 * Generate broadcast message for Teacher WhatsApp Group
 */
export function generateTeacherGroupBroadcastMessage(
  config: ExamTimeConfig,
  slots: ExamScheduleSlot[]
): string {
  // Count unique dates
  const uniqueDates = Array.from(new Set(slots.map((s) => s.dateStr)));

  let msg = `📢 *PENGUMUMAN RESMI PANITIA UJIAN*\n`;
  msg += `*${config.schoolName}*\n\n`;
  msg += `Diberitahukan kepada seluruh Bapak/Ibu Guru dan Karyawan ${config.schoolName}, bahwa jadwal *${config.examType}* telah diterbitkan.\n\n`;
  msg += `🗓️ *Waktu Pelaksanaan:* ${uniqueDates[0] || config.startDate} s/d ${uniqueDates[uniqueDates.length - 1] || '-'}\n`;
  msg += `⏰ *Jam Mulai Ujian:* Pukul ${config.startTime} WIB\n`;
  msg += `⏱️ *Durasi Sesi:* ${config.sessionDurationMinutes} Menit (Istirahat: ${config.breakDurationMinutes} Menit)\n`;
  msg += `👥 *Sistem Pengawasan:* Beban merata & Proteksi anti-kelelahan aktif.\n\n`;
  msg += `Mohon Bapak/Ibu memeriksa slip jadwal tugas masing-masing di portal sistem atau berkas cetak yang telah dibagikan.\n\n`;
  msg += `Tetap jaga kesehatan dan salam sukses untuk kita semua.\n\n`;
  msg += `_Ketua Panitia: ${config.committeeChairmanName}_\n`;
  msg += `_Kepala Sekolah: ${config.headmasterName}_`;

  return msg;
}

/**
 * Generate broadcast message for Students / Parents
 */
export function generateStudentBroadcastMessage(
  config: ExamTimeConfig,
  slots: ExamScheduleSlot[]
): string {
  const uniqueDates = Array.from(new Set(slots.map((s) => s.dateStr)));

  let msg = `📢 *PENGUMUMAN JADWAL UJIAN SISWA*\n`;
  msg += `*${config.schoolName}*\n\n`;
  msg += `Halo Sahabat Siswa-Siswi SMP Negeri 1 Cemerlang!\n`;
  msg += `Berikut adalah informasi pelaksanaan *${config.examType}*:\n\n`;
  msg += `🗓️ *Periode Ujian:* ${uniqueDates[0] || config.startDate} s/d ${uniqueDates[uniqueDates.length - 1] || '-'}\n`;
  msg += `⏰ *Waktu Masuk:* Pukul ${config.startTime} WIB (Wajib hadir 15 menit sebelumnya)\n`;
  msg += `🎒 *Perlengkapan:* Alat tulis lengkap, kartu peserta ujian, dan seragam sesuai ketentuan hari.\n\n`;
  msg += `*Jadwal Harian:*\n`;

  // Summarize mapel per day
  uniqueDates.forEach((dateStr) => {
    const daySlots = slots.filter((s) => s.dateStr === dateStr);
    const mapelsPerSession = Array.from(new Set(daySlots.map((s) => `Sesi ${s.sessionIndex}: ${s.subjectName}`)));
    msg += `📌 *${dateStr}*\n   ${mapelsPerSession.join('\n   ')}\n\n`;
  });

  msg += `Selamat belajar dan semoga mendapatkan hasil yang memuaskan!\n`;
  msg += `_Panitia Ujian ${config.schoolName}_`;

  return msg;
}

/**
 * Build WhatsApp click-to-chat URL
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  let cleanPhone = phone.replace(/\D/g, '');
  if (cleanPhone.startsWith('0')) {
    cleanPhone = '62' + cleanPhone.slice(1);
  } else if (!cleanPhone.startsWith('62')) {
    cleanPhone = '62' + cleanPhone;
  }
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(text)}`;
}

/**
 * Create a changelog entry and notification
 */
export function createScheduleChangeLog(
  type: ScheduleChangeLog['type'],
  description: string,
  details: string,
  affectedParties: ('GURU' | 'SISWA' | 'PANITIA')[] = ['GURU', 'SISWA', 'PANITIA']
): { log: ScheduleChangeLog; notification: NotificationItem } {
  const timestamp = new Date().toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const log: ScheduleChangeLog = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp,
    type,
    description,
    affectedParties,
    details,
  };

  const notification: NotificationItem = {
    id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    targetType: 'ALL',
    title: `Perubahan Jadwal Ujian: ${description}`,
    message: details,
    timestamp,
    sentVia: ['APP'],
    isRead: false,
    priority: type === 'DELETE' || type === 'GENERATE' ? 'high' : 'normal',
  };

  return { log, notification };
}
