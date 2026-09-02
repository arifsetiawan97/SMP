import {
  Teacher,
  Subject,
  ClassRoom,
  ExamRoom,
  ExamTimeConfig,
  ExamScheduleSlot,
  TeacherWorkloadStats,
  Student,
  StudentAllocationOptions,
  RoomAllocationResultSummary,
} from '../types';

/**
 * Format date into Indonesian locale string: "Senin, 08 Jun 2026"
 */
export function formatIndonesianDate(date: Date): string {
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
  
  const dayName = days[date.getDay()];
  const dayNum = String(date.getDate()).padStart(2, '0');
  const monthName = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${dayName}, ${dayNum} ${monthName} ${year}`;
}

/**
 * Calculate dynamic sessions for a given day (supporting 1, 2, 3, 4 or custom sessions per day)
 */
export function getSessionsForDay(
  dayIndex: number,
  config: ExamTimeConfig,
  defaultSessionTimes: { sessionIndex: number; startTime: string; endTime: string }[]
): { sessionIndex: number; startTime: string; endTime: string }[] {
  if (config.dailyExamSubjects && config.dailyExamSubjects.length > 0) {
    const dayPlans = config.dailyExamSubjects.filter((p) => p.dayIndex === dayIndex);
    if (dayPlans.length > 0) {
      const sessionIndices = Array.from(new Set(dayPlans.map((p) => p.sessionIndex))).sort((a, b) => a - b);
      return sessionIndices.map((sIdx) => {
        const plan = dayPlans.find((p) => p.sessionIndex === sIdx);
        if (plan?.startTime && plan?.endTime) {
          return { sessionIndex: sIdx, startTime: plan.startTime, endTime: plan.endTime };
        }
        const def = defaultSessionTimes.find((st) => st.sessionIndex === sIdx);
        if (def) return def;
        
        // Calculate dynamically if sIdx exceeds standard sessionsPerDay (e.g. 3rd or 4th session)
        const computed = calculateSessionTimes(
          config.startTime,
          config.sessionDurationMinutes,
          config.breakDurationMinutes,
          sIdx
        );
        return computed[sIdx - 1] || {
          sessionIndex: sIdx,
          startTime: '07:30',
          endTime: '09:00',
        };
      });
    }
  }
  return defaultSessionTimes;
}

/**
 * Calculate time slots for sessions (Automatic mode or Manual Custom times)
 */
export function calculateSessionTimes(
  startTime: string,
  durationMinutes: number,
  breakMinutes: number,
  sessionCount: number,
  isManualMode?: boolean,
  customTimes?: { sessionIndex: number; startTime: string; endTime: string; name?: string }[]
): { sessionIndex: number; startTime: string; endTime: string; name?: string }[] {
  if (isManualMode && customTimes && customTimes.length > 0) {
    return customTimes.map((ct, idx) => ({
      sessionIndex: ct.sessionIndex || idx + 1,
      startTime: ct.startTime,
      endTime: ct.endTime,
      name: ct.name,
    }));
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const slots: { sessionIndex: number; startTime: string; endTime: string }[] = [];
  
  let currentMinutes = startHour * 60 + startMin;
  
  for (let s = 1; s <= sessionCount; s++) {
    const sessionStartH = Math.floor(currentMinutes / 60);
    const sessionStartM = currentMinutes % 60;
    const sStartStr = `${String(sessionStartH).padStart(2, '0')}:${String(sessionStartM).padStart(2, '0')}`;
    
    currentMinutes += durationMinutes;
    const sessionEndH = Math.floor(currentMinutes / 60);
    const sessionEndM = currentMinutes % 60;
    const sEndStr = `${String(sessionEndH).padStart(2, '0')}:${String(sessionEndM).padStart(2, '0')}`;
    
    slots.push({
      sessionIndex: s,
      startTime: sStartStr,
      endTime: sEndStr,
    });
    
    // Add break time after session (except after the last session)
    if (s < sessionCount) {
      currentMinutes += breakMinutes;
    }
  }
  
  return slots;
}

/**
 * Generate dates array skipping non-active days according to activeDays
 */
export function generateExamDates(
  startDateStr: string,
  totalDays: number,
  activeDays: string[]
): { dayIndex: number; date: Date; dateStr: string }[] {
  const result: { dayIndex: number; date: Date; dateStr: string }[] = [];
  const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  
  // Safe local parsing at noon (12:00:00) to prevent UTC/local timezone shifts
  const parts = (startDateStr || '2026-06-08').split('-').map(Number);
  const year = parts[0] || 2026;
  const month = (parts[1] || 6) - 1;
  const day = parts[2] || 8;
  const cur = new Date(year, month, day, 12, 0, 0);

  const safeActiveDays =
    activeDays && activeDays.length > 0
      ? activeDays
      : ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat'];

  const targetCount = Math.max(1, totalDays || 5);
  let daysAdded = 0;
  let safetyLoop = 0;

  while (daysAdded < targetCount && safetyLoop < 150) {
    safetyLoop++;
    const dayName = daysMap[cur.getDay()];
    if (safeActiveDays.includes(dayName)) {
      result.push({
        dayIndex: daysAdded,
        date: new Date(cur),
        dateStr: formatIndonesianDate(cur),
      });
      daysAdded++;
    }
    // Move to next calendar day
    cur.setDate(cur.getDate() + 1);
  }

  return result;
}

/**
 * Smart Auto-Scheduling Engine with Fair Workload Distribution,
 * Fatigue Prevention (Anti-Kelelahan), and Conflict of Interest Protection.
 */
export function generateAutomaticSchedule(
  config: ExamTimeConfig,
  teachers: Teacher[],
  subjects: Subject[],
  classes: ClassRoom[],
  rooms: ExamRoom[]
): {
  slots: ExamScheduleSlot[];
  warnings: string[];
  stats: {
    totalSlots: number;
    totalTeachersAssigned: number;
    avgWorkload: number;
    minWorkload: number;
    maxWorkload: number;
  };
} {
  const warnings: string[] = [];
  const activeTeachers = teachers.filter((t) => t.isAvailable);
  const activeRooms = rooms.filter((r) => r.isActive);

  if (activeTeachers.length === 0) {
    throw new Error('Tidak ada guru aktif/tersedia untuk mengawas.');
  }
  if (activeRooms.length === 0) {
    throw new Error('Tidak ada ruang ujian yang aktif.');
  }
  if (classes.length === 0) {
    throw new Error('Data kelas belum tersedia.');
  }

  // 1. Generate Exam Dates
  const examDates = generateExamDates(config.startDate, config.examDaysCount, config.activeDays);
  
  // 2. Generate Session Times
  const sessionTimes = calculateSessionTimes(
    config.startTime,
    config.sessionDurationMinutes,
    config.breakDurationMinutes,
    config.sessionsPerDay,
    config.isManualTimeMode,
    config.customSessionTimes
  );

  // 3. Map Subject Distribution per Day & Session
  // Provide standard SMP subject sequencing if available
  const subjectPool = [...subjects];
  const scheduledSlots: ExamScheduleSlot[] = [];

  // Workload tracking per teacher
  const teacherAssignmentCounts = new Map<string, number>();
  activeTeachers.forEach((t) => teacherAssignmentCounts.set(t.id, 0));

  // Daily tracking to prevent fatigue and excessive sessions:
  // Key: `${teacherId}_day_${dayIndex}` -> Array of sessionIndices
  const dailyTeacherSessions = new Map<string, number[]>();

  // Map classes to rooms (1 room per class or paired)
  const classToRoomMap = new Map<string, ExamRoom>();
  classes.forEach((cls, idx) => {
    const room = activeRooms[idx % activeRooms.length];
    classToRoomMap.set(cls.id, room);
  });

  // Calculate total room-slots
  const totalSlotsNeeded = examDates.length * sessionTimes.length * classes.length * config.invigilatorsPerRoom;
  const avgSlotsPerTeacher = (totalSlotsNeeded / activeTeachers.length);

  // For each day and session, distribute subjects and assign invigilators
  let subjectCursor = 0;

  for (let d = 0; d < examDates.length; d++) {
    const examDate = examDates[d];
    const daySessions = getSessionsForDay(d, config, sessionTimes);

    for (let s = 0; s < daySessions.length; s++) {
      const session = daySessions[s];

      // Pick subject for this day & session
      const currentSubject = subjectPool[subjectCursor % subjectPool.length] || {
        id: 'sub-default',
        name: 'Mata Pelajaran Ujian',
        code: 'MPU',
        grade: 'all',
        defaultDurationMinutes: config.sessionDurationMinutes,
        category: 'Umum',
        color: 'bg-blue-50 text-blue-700 border-blue-200'
      };
      subjectCursor++;

      // In this session, set of teachers already assigned in ANY room (to prevent double booking)
      const assignedTeachersInCurrentSession = new Set<string>();

      // Iterate through each class/room
      for (const cls of classes) {
        const assignedRoom = classToRoomMap.get(cls.id) || activeRooms[0];
        
        // Check if there is a manual daily exam subject assigned for this day, session, and class/grade
        let classSubject = currentSubject;
        if (config.dailyExamSubjects && config.dailyExamSubjects.length > 0) {
          const manualPlan = config.dailyExamSubjects.find(
            (p) =>
              p.dayIndex === d &&
              p.sessionIndex === session.sessionIndex &&
              (p.grade === 'all' || p.grade === cls.grade)
          );
          if (manualPlan) {
            const foundSub = subjects.find((s) => s.id === manualPlan.subjectId);
            if (foundSub) {
              classSubject = foundSub;
            } else {
              classSubject = {
                id: manualPlan.subjectId,
                name: manualPlan.subjectName,
                code: manualPlan.subjectCode || 'MAPEL',
                grade: manualPlan.grade,
                defaultDurationMinutes: config.sessionDurationMinutes,
                category: (manualPlan.category as any) || 'Umum',
                color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
              };
            }
          }
        }

        // Find best invigilator 1
        const invigilator1 = selectBestInvigilator({
          activeTeachers,
          currentSubject: classSubject,
          targetClass: cls,
          dayIndex: d,
          sessionIndex: session.sessionIndex,
          assignedInCurrentSession: assignedTeachersInCurrentSession,
          dailyTeacherSessions,
          teacherAssignmentCounts,
          config,
          excludeTeacherId: undefined,
        });

        if (invigilator1) {
          assignedTeachersInCurrentSession.add(invigilator1.id);
          teacherAssignmentCounts.set(invigilator1.id, (teacherAssignmentCounts.get(invigilator1.id) || 0) + 1);
          
          const dayKey = `${invigilator1.id}_day_${d}`;
          const currentDaySessions = dailyTeacherSessions.get(dayKey) || [];
          dailyTeacherSessions.set(dayKey, [...currentDaySessions, session.sessionIndex]);
        } else {
          warnings.push(
            `Tidak ditemukan pengawas yang memenuhi syarat ketat untuk ${cls.name} pada ${examDate.dateStr} Sesi ${session.sessionIndex} (${classSubject.name}).`
          );
        }

        // If 2 invigilators per room are required
        let invigilator2: Teacher | null = null;
        if (config.invigilatorsPerRoom === 2) {
          invigilator2 = selectBestInvigilator({
            activeTeachers,
            currentSubject: classSubject,
            targetClass: cls,
            dayIndex: d,
            sessionIndex: session.sessionIndex,
            assignedInCurrentSession: assignedTeachersInCurrentSession,
            dailyTeacherSessions,
            teacherAssignmentCounts,
            config,
            excludeTeacherId: invigilator1?.id,
          });

          if (invigilator2) {
            assignedTeachersInCurrentSession.add(invigilator2.id);
            teacherAssignmentCounts.set(invigilator2.id, (teacherAssignmentCounts.get(invigilator2.id) || 0) + 1);

            const dayKey = `${invigilator2.id}_day_${d}`;
            const currentDaySessions = dailyTeacherSessions.get(dayKey) || [];
            dailyTeacherSessions.set(dayKey, [...currentDaySessions, session.sessionIndex]);
          }
        }

        const slotId = `slot-d${d}-s${session.sessionIndex}-${cls.id}`;
        scheduledSlots.push({
          id: slotId,
          dayIndex: d,
          dateStr: examDate.dateStr,
          sessionIndex: session.sessionIndex,
          startTime: session.startTime,
          endTime: session.endTime,
          grade: cls.grade,
          subjectId: classSubject.id,
          subjectName: classSubject.name,
          roomId: assignedRoom.id,
          roomName: assignedRoom.name,
          classIds: [cls.id],
          classNames: [cls.name],
          studentCount: cls.studentCount,
          invigilator1Id: invigilator1?.id,
          invigilator1Name: invigilator1?.name,
          invigilator2Id: invigilator2?.id,
          invigilator2Name: invigilator2?.name,
          notes: '',
        });
      }
    }
  }

  // Calculate statistics
  const workloads = Array.from(teacherAssignmentCounts.values());
  const minWorkload = workloads.length > 0 ? Math.min(...workloads) : 0;
  const maxWorkload = workloads.length > 0 ? Math.max(...workloads) : 0;

  return {
    slots: scheduledSlots,
    warnings,
    stats: {
      totalSlots: scheduledSlots.length,
      totalTeachersAssigned: activeTeachers.filter((t) => (teacherAssignmentCounts.get(t.id) || 0) > 0).length,
      avgWorkload: Number(avgSlotsPerTeacher.toFixed(1)),
      minWorkload,
      maxWorkload,
    },
  };
}

interface SelectInvigilatorParams {
  activeTeachers: Teacher[];
  currentSubject: Subject;
  targetClass: ClassRoom;
  dayIndex: number;
  sessionIndex: number;
  assignedInCurrentSession: Set<string>;
  dailyTeacherSessions: Map<string, number[]>;
  teacherAssignmentCounts: Map<string, number>;
  config: ExamTimeConfig;
  excludeTeacherId?: string;
}

/**
 * Heuristic Selection with Penalty Scoring & Conflict Validation
 */
function selectBestInvigilator(params: SelectInvigilatorParams): Teacher | null {
  const {
    activeTeachers,
    currentSubject,
    targetClass,
    dayIndex,
    sessionIndex,
    assignedInCurrentSession,
    dailyTeacherSessions,
    teacherAssignmentCounts,
    config,
    excludeTeacherId,
  } = params;

  // Filter out hard constraints:
  const eligibleCandidates = activeTeachers.filter((teacher) => {
    // 1. Exclude if already picked for this exact room as Invigilator 1
    if (excludeTeacherId && teacher.id === excludeTeacherId) return false;

    // 2. Exclude if already invigilating another room in this identical session
    if (assignedInCurrentSession.has(teacher.id)) return false;

    // 3. Subject conflict: Guru mapel dilarang mengawas ujian mapel yang diajarkannya
    if (config.preventTeachingSubjectConflict) {
      const teachesSubject = teacher.subjects.some((subName) =>
        subName.toLowerCase().includes(currentSubject.name.toLowerCase()) ||
        currentSubject.name.toLowerCase().includes(subName.toLowerCase())
      );
      if (teachesSubject) return false;
    }

    // 4. Class conflict: Guru dilarang mengawas kelas ajarannya
    if (config.preventTeachingClassConflict) {
      const teachesThisClass = teacher.classesTaught.some(
        (c) => c.toLowerCase() === targetClass.name.toLowerCase() ||
               c.replace('-', '').toLowerCase() === targetClass.name.replace('-', '').toLowerCase()
      );
      if (teachesThisClass) return false;
    }

    // 5. Max sessions per day limit
    const dayKey = `${teacher.id}_day_${dayIndex}`;
    const sessionsToday = dailyTeacherSessions.get(dayKey) || [];
    if (sessionsToday.length >= (teacher.maxSessionsPerDay || config.sessionsPerDay)) {
      return false;
    }

    return true;
  });

  if (eligibleCandidates.length === 0) {
    // Fallback: If no candidate without conflicts, try relaxing class conflict first before subject conflict
    const fallbackCandidates = activeTeachers.filter((t) => {
      if (excludeTeacherId && t.id === excludeTeacherId) return false;
      if (assignedInCurrentSession.has(t.id)) return false;
      return true;
    });

    if (fallbackCandidates.length === 0) return null;
    // Pick candidate with lowest assignment count
    fallbackCandidates.sort((a, b) => {
      const countA = teacherAssignmentCounts.get(a.id) || 0;
      const countB = teacherAssignmentCounts.get(b.id) || 0;
      return countA - countB;
    });
    return fallbackCandidates[0];
  }

  // Scoring candidates:
  // Lower score = better candidate
  const scoredCandidates = eligibleCandidates.map((teacher) => {
    let score = 0;
    const currentAssignments = teacherAssignmentCounts.get(teacher.id) || 0;

    // 1. Balance workload: Weight assignment count heavily (100 pts per session)
    score += currentAssignments * 100;

    // 2. Fatigue Prevention (Sistem Pembatasan Jadwal Berurutan):
    const dayKey = `${teacher.id}_day_${dayIndex}`;
    const sessionsToday = dailyTeacherSessions.get(dayKey) || [];

    if (config.maxConsecutiveSessions === 1) {
      // If teacher supervised the immediate previous session (sessionIndex - 1), add heavy penalty
      if (sessionsToday.includes(sessionIndex - 1)) {
        score += 300; // Penalize consecutive duty so another fresh teacher gets chosen
      }
    }

    // If teacher already has 1 session today, slight preference to teachers with 0 sessions today
    if (sessionsToday.length > 0) {
      score += 50;
    }

    // Add tiny deterministic jitter based on teacher ID to avoid picking the same teacher first on ties
    const charCodeSum = teacher.name.charCodeAt(0) % 7;
    score += charCodeSum;

    return { teacher, score };
  });

  // Sort ascending by score
  scoredCandidates.sort((a, b) => a.score - b.score);

  return scoredCandidates[0].teacher;
}

/**
 * Validate full schedule and compute workload statistics & conflict alerts
 */
export function computeScheduleWorkloadAndAudits(
  slots: ExamScheduleSlot[],
  teachers: Teacher[],
  subjects: Subject[],
  classes: ClassRoom[],
  config: ExamTimeConfig
): {
  teacherStats: TeacherWorkloadStats[];
  conflicts: {
    slotId: string;
    slotInfo: string;
    severity: 'error' | 'warning' | 'info';
    type: 'SUBJECT_CONFLICT' | 'CLASS_CONFLICT' | 'CONSECUTIVE_FATIGUE' | 'DOUBLE_BOOKED' | 'UNASSIGNED';
    message: string;
  }[];
  overallStats: {
    totalSlots: number;
    assignedSlots: number;
    unassignedCount: number;
    averageSessionsPerTeacher: number;
    workloadVariance: number;
    balanceFairnessScore: number; // 0 to 100%
  };
} {
  const teacherMap = new Map<string, Teacher>(teachers.map((t) => [t.id, t]));
  const statsMap = new Map<string, TeacherWorkloadStats>();
  const conflicts: {
    slotId: string;
    slotInfo: string;
    severity: 'error' | 'warning' | 'info';
    type: 'SUBJECT_CONFLICT' | 'CLASS_CONFLICT' | 'CONSECUTIVE_FATIGUE' | 'DOUBLE_BOOKED' | 'UNASSIGNED';
    message: string;
  }[] = [];

  // Initialize stats for each teacher
  teachers.forEach((t) => {
    statsMap.set(t.id, {
      teacherId: t.id,
      teacherName: t.name,
      nip: t.nip,
      code: t.code,
      totalSessions: 0,
      totalDurationMinutes: 0,
      sessionsPerDayMap: {},
      hasConsecutiveWarning: false,
      hasSubjectConflictWarning: false,
      hasClassConflictWarning: false,
      scheduleSlots: [],
    });
  });

  // Check double-booking per (dayIndex, sessionIndex)
  const sessionAssignmentMap = new Map<string, string[]>(); // key: `${day}_${session}` -> [teacherIds]

  slots.forEach((slot) => {
    const slotKey = `${slot.dayIndex}_${slot.sessionIndex}`;
    const currentAssigned = sessionAssignmentMap.get(slotKey) || [];

    // Check if slot has no invigilator
    if (!slot.invigilator1Id && (!slot.invigilator2Id || config.invigilatorsPerRoom === 2)) {
      conflicts.push({
        slotId: slot.id,
        slotInfo: `${slot.dateStr} - Sesi ${slot.sessionIndex} (${slot.roomName} / ${slot.classNames.join(', ')})`,
        severity: 'error',
        type: 'UNASSIGNED',
        message: `Pengawas belum dialokasikan untuk mata pelajaran ${slot.subjectName}.`,
      });
    }

    const assignedIds = [slot.invigilator1Id, slot.invigilator2Id].filter(Boolean) as string[];

    assignedIds.forEach((tId) => {
      const teacher = teacherMap.get(tId);
      const stat = statsMap.get(tId);

      if (teacher && stat) {
        stat.totalSessions += 1;
        stat.totalDurationMinutes += config.sessionDurationMinutes;
        stat.sessionsPerDayMap[slot.dayIndex] = (stat.sessionsPerDayMap[slot.dayIndex] || 0) + 1;
        stat.scheduleSlots.push(slot);

        // 1. Double Booking Check
        if (currentAssigned.includes(tId)) {
          conflicts.push({
            slotId: slot.id,
            slotInfo: `${slot.dateStr} - Sesi ${slot.sessionIndex}`,
            severity: 'error',
            type: 'DOUBLE_BOOKED',
            message: `${teacher.name} terduplikasi mengawas lebih dari satu ruangan pada sesi yang sama!`,
          });
        }
        currentAssigned.push(tId);

        // 2. Subject Conflict Check (Guru mengajar mapel tsb)
        const teachesSubject = teacher.subjects.some(
          (sub) => sub.toLowerCase().includes(slot.subjectName.toLowerCase()) ||
                   slot.subjectName.toLowerCase().includes(sub.toLowerCase())
        );
        if (teachesSubject && config.preventTeachingSubjectConflict) {
          stat.hasSubjectConflictWarning = true;
          conflicts.push({
            slotId: slot.id,
            slotInfo: `${slot.dateStr} - Sesi ${slot.sessionIndex} (${slot.roomName})`,
            severity: 'warning',
            type: 'SUBJECT_CONFLICT',
            message: `${teacher.name} adalah guru pengampu ${slot.subjectName}. Disarankan ditukar agar tidak terjadi konflik kepentingan.`,
          });
        }

        // 3. Class Conflict Check (Guru mengajar di kelas tsb)
        const teachesClass = slot.classNames.some((clsName) =>
          teacher.classesTaught.some((ct) => ct.replace('-', '').toLowerCase() === clsName.replace('-', '').toLowerCase())
        );
        if (teachesClass && config.preventTeachingClassConflict) {
          stat.hasClassConflictWarning = true;
          conflicts.push({
            slotId: slot.id,
            slotInfo: `${slot.dateStr} - Sesi ${slot.sessionIndex} (${slot.roomName})`,
            severity: 'info',
            type: 'CLASS_CONFLICT',
            message: `${teacher.name} mengajar di kelas ${slot.classNames.join(', ')}.`,
          });
        }
      }
    });

    sessionAssignmentMap.set(slotKey, currentAssigned);
  });

  // Check consecutive session fatigue per teacher per day
  teachers.forEach((t) => {
    const stat = statsMap.get(t.id);
    if (!stat) return;

    // Group teacher's slots by dayIndex
    const daySlotsMap = new Map<number, number[]>();
    stat.scheduleSlots.forEach((slot) => {
      const arr = daySlotsMap.get(slot.dayIndex) || [];
      arr.push(slot.sessionIndex);
      daySlotsMap.set(slot.dayIndex, arr);
    });

    daySlotsMap.forEach((sessions, dIdx) => {
      sessions.sort((a, b) => a - b);
      for (let i = 0; i < sessions.length - 1; i++) {
        if (sessions[i + 1] === sessions[i] + 1 && config.maxConsecutiveSessions === 1) {
          stat.hasConsecutiveWarning = true;
          conflicts.push({
            slotId: `fatigue-${t.id}-${dIdx}`,
            slotInfo: `Hari ke-${dIdx + 1} (Sesi ${sessions[i]} & Sesi ${sessions[i + 1]})`,
            severity: 'info',
            type: 'CONSECUTIVE_FATIGUE',
            message: `${t.name} mengawas berurutan (Sesi ${sessions[i]} & ${sessions[i + 1]}). Sistem mencatat peringatan potensi kelelahan.`,
          });
        }
      }
    });
  });

  // Calculate fairness metrics
  const sessionCounts = Array.from(statsMap.values()).map((s) => s.totalSessions);
  const totalTeacherSessions = sessionCounts.reduce((a, b) => a + b, 0);
  const avg = teachers.length > 0 ? totalTeacherSessions / teachers.length : 0;
  
  // Calculate variance and standard deviation
  const variance = teachers.length > 0
    ? sessionCounts.reduce((acc, count) => acc + Math.pow(count - avg, 2), 0) / teachers.length
    : 0;
  const stdDev = Math.sqrt(variance);
  
  // Fairness Score: 100% when stdDev is 0, drops gently as stdDev increases
  const fairnessScore = Math.max(0, Math.min(100, Math.round(100 - stdDev * 15)));

  const unassignedCount = slots.filter((s) => !s.invigilator1Id).length;

  return {
    teacherStats: Array.from(statsMap.values()),
    conflicts,
    overallStats: {
      totalSlots: slots.length,
      assignedSlots: slots.length - unassignedCount,
      unassignedCount,
      averageSessionsPerTeacher: Number(avg.toFixed(1)),
      workloadVariance: Number(stdDev.toFixed(2)),
      balanceFairnessScore: fairnessScore,
    },
  };
}

/**
 * Smart Auto-Generator for Student Exam Room & Seat Distribution
 * - Supports fixed capacity per room (e.g. 20 students/room) or equal distribution across N rooms
 * - Supports gender balancing (seimbang siswa L & siswi P per ruangan)
 * - Supports mixing methods: Cross-class (anti-contek), Cross-grade, By class, or Random
 * - Re-indexes seats sequentially (Meja 01 s/d N)
 */
export function allocateStudentsToRooms(
  students: Student[],
  rooms: ExamRoom[],
  classes: ClassRoom[],
  options: StudentAllocationOptions
): {
  updatedStudents: Student[];
  summaries: RoomAllocationResultSummary[];
  unallocatedCount: number;
} {
  const activeRooms = rooms.filter(
    (r) => r.isActive && (!options.selectedRoomIds || options.selectedRoomIds.length === 0 || options.selectedRoomIds.includes(r.id))
  );

  if (activeRooms.length === 0 || students.length === 0) {
    return {
      updatedStudents: [...students],
      summaries: [],
      unallocatedCount: 0,
    };
  }

  // Filter target students
  const targetStudents = options.targetGrade && options.targetGrade !== 'all'
    ? students.filter((s) => {
        const cls = classes.find((c) => c.id === s.classId || c.name === s.className);
        return cls ? cls.grade === options.targetGrade : true;
      })
    : [...students];

  if (targetStudents.length === 0) {
    return {
      updatedStudents: [...students],
      summaries: [],
      unallocatedCount: 0,
    };
  }

  // Helper sort
  const sortStudents = (list: Student[]) => {
    return [...list].sort((a, b) => {
      if (options.sortOrder === 'name_asc') {
        return a.name.localeCompare(b.name, 'id');
      } else if (options.sortOrder === 'nisn_asc') {
        return (a.nisn || '').localeCompare(b.nisn || '');
      } else if (options.sortOrder === 'nis_asc') {
        return (a.nis || '').localeCompare(b.nis || '');
      } else if (options.sortOrder === 'random') {
        return Math.random() - 0.5;
      }
      return 0;
    });
  };

  // Determine Room Capacities / Target Counts
  const totalStudents = targetStudents.length;
  const roomAllocations: { room: ExamRoom; targetCount: number }[] = [];

  if (options.mode === 'fixed_capacity') {
    const cap = Math.max(1, options.capacityPerRoom || 20);
    const roomsNeeded = Math.min(activeRooms.length, Math.ceil(totalStudents / cap));
    let remaining = totalStudents;

    for (let i = 0; i < roomsNeeded; i++) {
      const room = activeRooms[i];
      const count = Math.min(cap, remaining);
      roomAllocations.push({ room, targetCount: count });
      remaining -= count;
    }
  } else {
    // Mode equal_rooms: Bagi rata ke semua ruangan aktif
    const roomCount = activeRooms.length;
    const basePerRoom = Math.floor(totalStudents / roomCount);
    const remainder = totalStudents % roomCount;

    for (let i = 0; i < roomCount; i++) {
      const targetCount = basePerRoom + (i < remainder ? 1 : 0);
      if (targetCount > 0) {
        roomAllocations.push({ room: activeRooms[i], targetCount });
      }
    }
  }

  // Organize student pool according to mixingMethod
  let orderedMales: Student[] = [];
  let orderedFemales: Student[] = [];
  let orderedGeneral: Student[] = [];

  if (options.mixingMethod === 'cross_class') {
    // Group students by class
    const classMap = new Map<string, Student[]>();
    classes.forEach((c) => classMap.set(c.id, []));

    targetStudents.forEach((s) => {
      const arr = classMap.get(s.classId) || [];
      arr.push(s);
      classMap.set(s.classId, arr);
    });

    const classBuckets = Array.from(classMap.values())
      .filter((arr) => arr.length > 0)
      .map((arr) => sortStudents(arr));

    if (options.genderBalance === 'equal_gender') {
      // Split each class bucket into M and F
      const maleBuckets = classBuckets.map((arr) => arr.filter((s) => s.gender === 'L'));
      const femaleBuckets = classBuckets.map((arr) => arr.filter((s) => s.gender === 'P'));

      // Round-robin weave
      let mRemaining = true;
      while (mRemaining) {
        mRemaining = false;
        for (const mb of maleBuckets) {
          if (mb.length > 0) {
            orderedMales.push(mb.shift()!);
            mRemaining = true;
          }
        }
      }

      let fRemaining = true;
      while (fRemaining) {
        fRemaining = false;
        for (const fb of femaleBuckets) {
          if (fb.length > 0) {
            orderedFemales.push(fb.shift()!);
            fRemaining = true;
          }
        }
      }
    } else {
      // Round-robin weave all students across classes
      let remaining = true;
      while (remaining) {
        remaining = false;
        for (const cb of classBuckets) {
          if (cb.length > 0) {
            orderedGeneral.push(cb.shift()!);
            remaining = true;
          }
        }
      }
    }
  } else if (options.mixingMethod === 'cross_grade') {
    // Group by Grade
    const grade7 = sortStudents(targetStudents.filter((s) => s.className.startsWith('VII') || s.className.startsWith('7')));
    const grade8 = sortStudents(targetStudents.filter((s) => s.className.startsWith('VIII') || s.className.startsWith('8')));
    const grade9 = sortStudents(targetStudents.filter((s) => s.className.startsWith('IX') || s.className.startsWith('9')));
    const gradeBuckets = [grade7, grade8, grade9].filter((b) => b.length > 0);

    if (options.genderBalance === 'equal_gender') {
      const maleBuckets = gradeBuckets.map((b) => b.filter((s) => s.gender === 'L'));
      const femaleBuckets = gradeBuckets.map((b) => b.filter((s) => s.gender === 'P'));

      let mRem = true;
      while (mRem) {
        mRem = false;
        for (const mb of maleBuckets) {
          if (mb.length > 0) {
            orderedMales.push(mb.shift()!);
            mRem = true;
          }
        }
      }

      let fRem = true;
      while (fRem) {
        fRem = false;
        for (const fb of femaleBuckets) {
          if (fb.length > 0) {
            orderedFemales.push(fb.shift()!);
            fRem = true;
          }
        }
      }
    } else {
      let rem = true;
      while (rem) {
        rem = false;
        for (const gb of gradeBuckets) {
          if (gb.length > 0) {
            orderedGeneral.push(gb.shift()!);
            rem = true;
          }
        }
      }
    }
  } else if (options.mixingMethod === 'random') {
    const shuffled = [...targetStudents].sort(() => Math.random() - 0.5);
    if (options.genderBalance === 'equal_gender') {
      orderedMales = shuffled.filter((s) => s.gender === 'L');
      orderedFemales = shuffled.filter((s) => s.gender === 'P');
    } else {
      orderedGeneral = shuffled;
    }
  } else {
    // by_class
    const sorted = sortStudents(targetStudents);
    if (options.genderBalance === 'equal_gender') {
      orderedMales = sorted.filter((s) => s.gender === 'L');
      orderedFemales = sorted.filter((s) => s.gender === 'P');
    } else {
      orderedGeneral = sorted;
    }
  }

  // Prepare Output Map
  const updatedStudentMap = new Map<string, Student>();
  // Start with existing students to preserve un-targeted students if any
  students.forEach((s) => updatedStudentMap.set(s.id, { ...s }));

  const summaries: RoomAllocationResultSummary[] = [];
  const allTargetMalesCount = targetStudents.filter((s) => s.gender === 'L').length;
  const allTargetFemalesCount = targetStudents.filter((s) => s.gender === 'P').length;

  roomAllocations.forEach((alloc) => {
    const room = alloc.room;
    const targetRoomCount = alloc.targetCount;
    const roomStudents: Student[] = [];

    if (options.genderBalance === 'equal_gender') {
      // Calculate target male & female count for this room based on global ratio
      const maleRatio = allTargetMalesCount / (totalStudents || 1);
      let targetMales = Math.round(targetRoomCount * maleRatio);
      let targetFemales = targetRoomCount - targetMales;

      // Adjust if running short on one gender
      if (orderedMales.length < targetMales) {
        targetMales = orderedMales.length;
        targetFemales = targetRoomCount - targetMales;
      } else if (orderedFemales.length < targetFemales) {
        targetFemales = orderedFemales.length;
        targetMales = targetRoomCount - targetFemales;
      }

      // Pick Males
      const pickedMales: Student[] = [];
      for (let m = 0; m < targetMales && orderedMales.length > 0; m++) {
        pickedMales.push(orderedMales.shift()!);
      }

      // Pick Females
      const pickedFemales: Student[] = [];
      for (let f = 0; f < targetFemales && orderedFemales.length > 0; f++) {
        pickedFemales.push(orderedFemales.shift()!);
      }

      // Interleave Males and Females (L, P, L, P) for seating
      let mIdx = 0;
      let fIdx = 0;
      while (mIdx < pickedMales.length || fIdx < pickedFemales.length) {
        if (mIdx < pickedMales.length) roomStudents.push(pickedMales[mIdx++]);
        if (fIdx < pickedFemales.length) roomStudents.push(pickedFemales[fIdx++]);
      }

      // If still not full and someone is left in either pool, drain remaining
      while (roomStudents.length < targetRoomCount && (orderedMales.length > 0 || orderedFemales.length > 0)) {
        if (orderedMales.length > 0) roomStudents.push(orderedMales.shift()!);
        else if (orderedFemales.length > 0) roomStudents.push(orderedFemales.shift()!);
      }
    } else {
      // Natural fill
      for (let i = 0; i < targetRoomCount && orderedGeneral.length > 0; i++) {
        roomStudents.push(orderedGeneral.shift()!);
      }
    }

    // Assign Room & Seat Numbers
    const classesCount: Record<string, number> = {};
    let maleCount = 0;
    let femaleCount = 0;

    const prefix = options.seatNumberingPrefix !== undefined ? options.seatNumberingPrefix : '';

    const assignedWithSeats: Student[] = roomStudents.map((st, seatIdx) => {
      if (st.gender === 'L') maleCount++;
      else femaleCount++;

      classesCount[st.className] = (classesCount[st.className] || 0) + 1;

      const updated: Student = {
        ...st,
        roomName: room.name,
        seatNumber: seatIdx + 1,
      };

      updatedStudentMap.set(st.id, updated);
      return updated;
    });

    const totalInRoom = assignedWithSeats.length;
    const malePct = totalInRoom > 0 ? Math.round((maleCount / totalInRoom) * 100) : 0;
    const femalePct = totalInRoom > 0 ? Math.round((femaleCount / totalInRoom) * 100) : 0;

    summaries.push({
      roomId: room.id,
      roomName: room.name,
      capacity: room.capacity || 34,
      totalAssigned: totalInRoom,
      maleCount,
      femaleCount,
      malePercentage: malePct,
      femalePercentage: femalePct,
      classesCount,
      classesBreakdown: classesCount,
      students: assignedWithSeats,
    });
  });

  const updatedStudents = Array.from(updatedStudentMap.values());
  const allocatedIds = new Set(summaries.flatMap((s) => s.students.map((st) => st.id)));
  const unallocatedCount = targetStudents.filter((s) => !allocatedIds.has(s.id)).length;

  return {
    updatedStudents,
    summaries,
    unallocatedCount,
  };
}
