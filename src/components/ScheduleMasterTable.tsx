import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  Users,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  LayoutGrid,
  List,
  ChevronRight,
  ChevronDown,
  BookOpen,
  Check,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import { ExamScheduleSlot, Teacher, Subject, ClassRoom, ExamRoom, ExamTimeConfig } from '../types';

interface ScheduleMasterTableProps {
  slots: ExamScheduleSlot[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: ClassRoom[];
  rooms: ExamRoom[];
  config: ExamTimeConfig;
  onEditSlot: (slot: ExamScheduleSlot) => void;
  onDeleteSlot: (slotId: string) => void;
  onDeleteMultipleSlots?: (slotIds: string[]) => void;
  onOpenDeleteModal: () => void;
  onOpenGenerator: () => void;
}

export const ScheduleMasterTable: React.FC<ScheduleMasterTableProps> = ({
  slots,
  teachers,
  subjects,
  classes,
  rooms,
  config,
  onEditSlot,
  onDeleteSlot,
  onDeleteMultipleSlots,
  onOpenDeleteModal,
  onOpenGenerator,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  // Multi-select filter states
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // empty means ALL days
  const [selectedRooms, setSelectedRooms] = useState<string[]>([]); // empty means ALL rooms
  const [selectedGrade, setSelectedGrade] = useState<string>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards' | 'matrix'>('table');
  const [selectedSlotIds, setSelectedSlotIds] = useState<string[]>([]);
  const [slotToDelete, setSlotToDelete] = useState<ExamScheduleSlot | null>(null);
  const [bulkDeleteTarget, setBulkDeleteTarget] = useState<{ mode: 'selected' | 'all'; count: number } | null>(null);

  // Dropdown open states
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState(false);
  const [isRoomDropdownOpen, setIsRoomDropdownOpen] = useState(false);
  const [roomFilterSearch, setRoomFilterSearch] = useState('');

  const dayDropdownRef = useRef<HTMLDivElement>(null);
  const roomDropdownRef = useRef<HTMLDivElement>(null);

  // Click outside listener for dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dayDropdownRef.current && !dayDropdownRef.current.contains(event.target as Node)) {
        setIsDayDropdownOpen(false);
      }
      if (roomDropdownRef.current && !roomDropdownRef.current.contains(event.target as Node)) {
        setIsRoomDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Extract unique days with count
  const uniqueDays = useMemo(() => {
    const dayCounts = new Map<string, number>();
    slots.forEach((s) => {
      dayCounts.set(s.dateStr, (dayCounts.get(s.dateStr) || 0) + 1);
    });
    return Array.from(dayCounts.entries()).map(([dateStr, count]) => ({
      dateStr,
      count,
    }));
  }, [slots]);

  // Extract rooms with count
  const roomStats = useMemo(() => {
    const counts = new Map<string, number>();
    slots.forEach((s) => {
      counts.set(s.roomId, (counts.get(s.roomId) || 0) + 1);
    });
    return rooms.map((r) => ({
      ...r,
      sessionCount: counts.get(r.id) || 0,
    }));
  }, [rooms, slots]);

  // Filtered rooms in dropdown search
  const filteredRoomsInDropdown = useMemo(() => {
    if (!roomFilterSearch.trim()) return roomStats;
    const q = roomFilterSearch.toLowerCase();
    return roomStats.filter(
      (r) => r.name.toLowerCase().includes(q) || r.code.toLowerCase().includes(q) || r.location.toLowerCase().includes(q)
    );
  }, [roomStats, roomFilterSearch]);

  // Filtered slots logic
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // Multi-Day filter
      if (selectedDays.length > 0 && !selectedDays.includes(slot.dateStr)) {
        return false;
      }

      // Multi-Room filter
      if (selectedRooms.length > 0 && !selectedRooms.includes(slot.roomId)) {
        return false;
      }

      // Grade filter
      if (selectedGrade !== 'all' && String(slot.grade) !== selectedGrade) return false;

      // Teacher filter
      if (
        selectedTeacher !== 'all' &&
        slot.invigilator1Id !== selectedTeacher &&
        slot.invigilator2Id !== selectedTeacher
      ) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchSubject = slot.subjectName.toLowerCase().includes(query);
        const matchRoom = slot.roomName.toLowerCase().includes(query);
        const matchClasses = slot.classNames.some((c) => c.toLowerCase().includes(query));
        const matchTeacher1 = (slot.invigilator1Name || '').toLowerCase().includes(query);
        const matchTeacher2 = (slot.invigilator2Name || '').toLowerCase().includes(query);
        const matchDate = slot.dateStr.toLowerCase().includes(query);

        if (
          !matchSubject &&
          !matchRoom &&
          !matchClasses &&
          !matchTeacher1 &&
          !matchTeacher2 &&
          !matchDate
        ) {
          return false;
        }
      }

      return true;
    });
  }, [slots, selectedDays, selectedRooms, selectedGrade, selectedTeacher, searchTerm]);

  // Active filters count
  const activeFilterCount =
    selectedDays.length +
    selectedRooms.length +
    (selectedGrade !== 'all' ? 1 : 0) +
    (selectedTeacher !== 'all' ? 1 : 0) +
    (searchTerm.trim() ? 1 : 0);

  const resetAllFilters = () => {
    setSelectedDays([]);
    setSelectedRooms([]);
    setSelectedGrade('all');
    setSelectedTeacher('all');
    setSearchTerm('');
    setRoomFilterSearch('');
  };

  // Group slots by Day & Session for Matrix View
  const matrixData = useMemo(() => {
    const map = new Map<string, ExamScheduleSlot[]>();
    filteredSlots.forEach((s) => {
      const key = `${s.dateStr}___Sesi ${s.sessionIndex}`;
      const arr = map.get(key) || [];
      arr.push(s);
      map.set(key, arr);
    });
    return map;
  }, [filteredSlots]);

  if (slots.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center shadow-xs">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="w-8 h-8" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Belum Ada Jadwal Ujian yang Dibuat
        </h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
          Gunakan generator otomatis untuk membuat daftar ujian, mengalokasikan ruang bagi siswa, dan mendistribusikan tugas pengawas dengan beban merata dan bebas konflik.
        </p>
        <button
          id="btn-empty-generate"
          onClick={onOpenGenerator}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>Buka Generator Otomatis</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Filter and Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              id="search-schedule-input"
              type="text"
              placeholder="Cari guru, mapel, kelas, atau ruang..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-lg border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                ✕
              </button>
            )}
          </div>

          {/* View Mode & Actions */}
          <div className="flex items-center gap-2 flex-wrap justify-between lg:justify-end">
            <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                id="view-mode-table-btn"
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Tabel Master"
              >
                <List className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Tabel</span>
              </button>
              <button
                id="view-mode-matrix-btn"
                onClick={() => setViewMode('matrix')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'matrix' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Matriks Hari/Sesi"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Matriks Sesi</span>
              </button>
              <button
                id="view-mode-cards-btn"
                onClick={() => setViewMode('cards')}
                className={`p-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === 'cards' ? 'bg-white text-indigo-700 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Tampilan Kartu Sesi"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kartu</span>
              </button>
            </div>

            {selectedSlotIds.length > 0 && (
              <button
                id="btn-delete-selected-slots"
                onClick={() => setBulkDeleteTarget({ mode: 'selected', count: selectedSlotIds.length })}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer animate-pulse"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data Pilihan ({selectedSlotIds.length})</span>
              </button>
            )}

            <button
              id="btn-delete-all-slots"
              onClick={() => setBulkDeleteTarget({ mode: 'all', count: slots.length })}
              disabled={slots.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-colors cursor-pointer disabled:opacity-40"
              title="Hapus seluruh jadwal ujian"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Hapus Semua Jadwal</span>
            </button>

            <button
              id="btn-open-delete-modal"
              onClick={onOpenDeleteModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span>Opsi Hapus Khusus</span>
            </button>
          </div>
        </div>

        {/* Floating Multi-selection Banner */}
        {selectedSlotIds.length > 0 && (
          <div className="bg-indigo-900 text-white p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-md border border-indigo-700 animate-in fade-in slide-in-from-top-1">
            <div className="flex items-center gap-2 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>
                Terpilih <strong>{selectedSlotIds.length}</strong> dari {filteredSlots.length} sesi jadwal yang ditampilkan
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (selectedSlotIds.length === filteredSlots.length) {
                    setSelectedSlotIds([]);
                  } else {
                    setSelectedSlotIds(filteredSlots.map((s) => s.id));
                  }
                }}
                className="px-2.5 py-1 bg-indigo-800 hover:bg-indigo-700 text-indigo-100 rounded-lg text-xs font-semibold cursor-pointer"
              >
                {selectedSlotIds.length === filteredSlots.length ? 'Batalkan Semua' : 'Pilih Semua'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedSlotIds([])}
                className="px-2.5 py-1 bg-indigo-800/70 hover:bg-indigo-700 text-indigo-200 rounded-lg text-xs cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteTarget({ mode: 'selected', count: selectedSlotIds.length })}
                className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus Data Pilihan ({selectedSlotIds.length})</span>
              </button>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* MULTISELECT FILTER PANEL */}
        {/* ============================================================= */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
              <span className="text-xs font-bold text-slate-800">Panel Filter & Pencarian Cepat</span>
              {activeFilterCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold">
                  {activeFilterCount} Aktif
                </span>
              )}
            </div>

            {activeFilterCount > 0 && (
              <button
                type="button"
                id="btn-reset-all-filters-top"
                onClick={resetAllFilters}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Semua Filter</span>
              </button>
            )}
          </div>

          {/* Filter Dropdown Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            {/* 1. Multiselect Hari Dropdown */}
            <div className="relative" ref={dayDropdownRef}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                  Filter Hari Ujian
                </span>
                {selectedDays.length > 0 && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    {selectedDays.length} Dipilih
                  </span>
                )}
              </label>

              <button
                type="button"
                id="btn-multiselect-day-dropdown"
                onClick={() => {
                  setIsDayDropdownOpen(!isDayDropdownOpen);
                  setIsRoomDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left border flex items-center justify-between transition-all cursor-pointer ${
                  selectedDays.length > 0
                    ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="truncate">
                  {selectedDays.length === 0
                    ? `Semua Hari (${uniqueDays.length} Hari)`
                    : selectedDays.length === 1
                    ? selectedDays[0]
                    : `${selectedDays.length} Hari Terpilih`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isDayDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {/* Day Multiselect Dropdown Popover */}
              {isDayDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 text-[11px]">Pilih Hari Ujian</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedDays(uniqueDays.map((d) => d.dateStr))}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold px-1.5 py-0.5 rounded hover:bg-indigo-50 cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedDays([])}
                        className="text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {uniqueDays.map((d) => {
                      const isSelected = selectedDays.includes(d.dateStr);
                      return (
                        <label
                          key={d.dateStr}
                          className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                            isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDays([...selectedDays, d.dateStr]);
                                } else {
                                  setSelectedDays(selectedDays.filter((day) => day !== d.dateStr));
                                }
                              }}
                              className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                            />
                            <span className="text-xs">{d.dateStr}</span>
                          </div>
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                            {d.count} sesi
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* 2. Multiselect Ruang Dropdown */}
            <div className="relative" ref={roomDropdownRef}>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500" />
                  Filter Ruang Ujian
                </span>
                {selectedRooms.length > 0 && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    {selectedRooms.length} Dipilih
                  </span>
                )}
              </label>

              <button
                type="button"
                id="btn-multiselect-room-dropdown"
                onClick={() => {
                  setIsRoomDropdownOpen(!isRoomDropdownOpen);
                  setIsDayDropdownOpen(false);
                }}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium text-left border flex items-center justify-between transition-all cursor-pointer ${
                  selectedRooms.length > 0
                    ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <span className="truncate">
                  {selectedRooms.length === 0
                    ? `Semua Ruang (${rooms.length} Ruang)`
                    : selectedRooms.length === 1
                    ? rooms.find((r) => r.id === selectedRooms[0])?.name || '1 Ruang Terpilih'
                    : `${selectedRooms.length} Ruang Terpilih`}
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-slate-400 transition-transform ${
                    isRoomDropdownOpen ? 'rotate-180 text-indigo-600' : ''
                  }`}
                />
              </button>

              {/* Room Multiselect Dropdown Popover */}
              {isRoomDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 z-40 w-80 bg-white rounded-xl shadow-xl border border-slate-200 p-2.5 animate-in fade-in zoom-in-95 duration-100">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 text-xs">
                    <span className="font-bold text-slate-800 text-[11px]">Pilih Ruang Ujian</span>
                    <div className="flex items-center gap-1 text-[11px]">
                      <button
                        type="button"
                        onClick={() => setSelectedRooms(rooms.map((r) => r.id))}
                        className="text-indigo-600 hover:text-indigo-800 font-semibold px-1.5 py-0.5 rounded hover:bg-indigo-50 cursor-pointer"
                      >
                        Pilih Semua
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        type="button"
                        onClick={() => setSelectedRooms([])}
                        className="text-slate-500 hover:text-slate-700 px-1.5 py-0.5 rounded hover:bg-slate-100 cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>
                  </div>

                  {/* Room Search in dropdown */}
                  <div className="relative mb-2">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Cari ruang / kode..."
                      value={roomFilterSearch}
                      onChange={(e) => setRoomFilterSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>

                  <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                    {filteredRoomsInDropdown.length === 0 ? (
                      <p className="text-[11px] text-slate-400 p-3 text-center">Ruang tidak ditemukan</p>
                    ) : (
                      filteredRoomsInDropdown.map((r) => {
                        const isSelected = selectedRooms.includes(r.id);
                        return (
                          <label
                            key={r.id}
                            className={`flex items-center justify-between p-2 rounded-lg text-xs cursor-pointer transition-colors ${
                              isSelected ? 'bg-indigo-50 text-indigo-900 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedRooms([...selectedRooms, r.id]);
                                  } else {
                                    setSelectedRooms(selectedRooms.filter((id) => id !== r.id));
                                  }
                                }}
                                className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5 cursor-pointer"
                              />
                              <div className="flex items-center gap-1.5">
                                <span className="font-semibold text-xs">{r.name}</span>
                                <span className="text-[10px] font-mono px-1 py-0.2 rounded bg-slate-100 text-slate-600">
                                  {r.code}
                                </span>
                              </div>
                            </div>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                              {r.sessionCount} sesi
                            </span>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* 3. Dropdown Tingkat Kelas */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-indigo-500" />
                  Tingkat Kelas
                </span>
                {selectedGrade !== 'all' && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    Kelas {selectedGrade}
                  </span>
                )}
              </label>
              <select
                id="filter-grade-select"
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer ${
                  selectedGrade !== 'all'
                    ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="all">Semua Tingkat (Kelas 7, 8, 9)</option>
                <option value="7">Kelas VII (7)</option>
                <option value="8">Kelas VIII (8)</option>
                <option value="9">Kelas IX (9)</option>
              </select>
            </div>

            {/* 4. Dropdown Guru Pengawas */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-indigo-500" />
                  Guru Pengawas
                </span>
                {selectedTeacher !== 'all' && (
                  <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-1.5 py-0.2 rounded">
                    1 Guru
                  </span>
                )}
              </label>
              <select
                id="filter-teacher-select"
                value={selectedTeacher}
                onChange={(e) => setSelectedTeacher(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs font-medium border focus:outline-hidden focus:ring-1 focus:ring-indigo-500 transition-colors cursor-pointer ${
                  selectedTeacher !== 'all'
                    ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 ring-1 ring-indigo-300'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <option value="all">Semua Guru Pengawas ({teachers.length} Guru)</option>
                {teachers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Quick Selection Filter Chips */}
          <div className="space-y-2 pt-1">
            {/* Quick Day Chips */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Pintasan Hari:</span>
              <button
                type="button"
                onClick={() => setSelectedDays([])}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedDays.length === 0
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Hari
              </button>
              {uniqueDays.map((d) => {
                const isSelected = selectedDays.includes(d.dateStr);
                return (
                  <button
                    key={d.dateStr}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedDays(selectedDays.filter((day) => day !== d.dateStr));
                      } else {
                        setSelectedDays([...selectedDays, d.dateStr]);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{d.dateStr}</span>
                    <span
                      className={`text-[10px] px-1 py-0.2 rounded font-mono ${
                        isSelected ? 'bg-indigo-800 text-indigo-100' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d.count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick Room Chips (Top 8 Rooms) */}
            <div className="flex items-center gap-1.5 flex-wrap text-xs">
              <span className="text-[11px] font-semibold text-slate-500 shrink-0">Pintasan Ruang:</span>
              <button
                type="button"
                onClick={() => setSelectedRooms([])}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  selectedRooms.length === 0
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                Semua Ruang
              </button>
              {rooms.slice(0, 8).map((r) => {
                const isSelected = selectedRooms.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      if (isSelected) {
                        setSelectedRooms(selectedRooms.filter((id) => id !== r.id));
                      } else {
                        setSelectedRooms([...selectedRooms, r.id]);
                      }
                    }}
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <span>{r.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Filter Badges Bar */}
          {activeFilterCount > 0 && (
            <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
              <span className="text-[11px] font-semibold text-slate-500">Filter Aktif:</span>

              {selectedDays.map((day) => (
                <span
                  key={day}
                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold"
                >
                  <Calendar className="w-3 h-3 text-indigo-500" />
                  <span>{day}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedDays(selectedDays.filter((d) => d !== day))}
                    className="p-0.5 hover:bg-indigo-200 rounded text-indigo-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {selectedRooms.map((roomId) => {
                const room = rooms.find((r) => r.id === roomId);
                return (
                  <span
                    key={roomId}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-semibold"
                  >
                    <MapPin className="w-3 h-3 text-emerald-500" />
                    <span>{room?.name || roomId}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedRooms(selectedRooms.filter((id) => id !== roomId))}
                      className="p-0.5 hover:bg-emerald-200 rounded text-emerald-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}

              {selectedGrade !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded-lg text-xs font-semibold">
                  <Users className="w-3 h-3 text-purple-500" />
                  <span>Kelas {selectedGrade}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedGrade('all')}
                    className="p-0.5 hover:bg-purple-200 rounded text-purple-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {selectedTeacher !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-lg text-xs font-semibold">
                  <User className="w-3 h-3 text-amber-500" />
                  <span>{teachers.find((t) => t.id === selectedTeacher)?.name || selectedTeacher}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher('all')}
                    className="p-0.5 hover:bg-amber-200 rounded text-amber-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {searchTerm.trim() && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold">
                  <Search className="w-3 h-3 text-slate-500" />
                  <span>&quot;{searchTerm}&quot;</span>
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="p-0.5 hover:bg-slate-200 rounded text-slate-600 cursor-pointer"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={resetAllFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-bold hover:underline cursor-pointer ml-auto"
              >
                Hapus Semua Filter
              </button>
            </div>
          )}

          {/* Results count indicator */}
          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
            <span>
              Menampilkan <strong>{filteredSlots.length}</strong> dari total {slots.length} sesi ujian
            </span>
            {activeFilterCount > 0 && (
              <span className="text-slate-400">
                ({slots.length - filteredSlots.length} sesi tersembunyi oleh filter)
              </span>
            )}
          </div>
        </div>
      </div>

      {/* View Mode 1: Table Master View */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-3 py-3 text-center w-8">
                    <input
                      type="checkbox"
                      checked={filteredSlots.length > 0 && selectedSlotIds.length === filteredSlots.length}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSlotIds(filteredSlots.map((s) => s.id));
                        } else {
                          setSelectedSlotIds([]);
                        }
                      }}
                      className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                    />
                  </th>
                  <th className="px-2.5 py-3 text-center w-8">No</th>
                  <th className="px-3.5 py-3">Hari & Tanggal</th>
                  <th className="px-3.5 py-3">Sesi / Waktu</th>
                  <th className="px-3.5 py-3">Tingkat & Kelas</th>
                  <th className="px-3.5 py-3">Ruang</th>
                  <th className="px-3.5 py-3">Mata Pelajaran</th>
                  <th className="px-3.5 py-3">Pengawas Utama</th>
                  {config.invigilatorsPerRoom === 2 && (
                    <th className="px-3.5 py-3">Pengawas Pendamping</th>
                  )}
                  <th className="px-3.5 py-3 text-center w-24">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSlots.map((slot, idx) => {
                  const hasTeacher = Boolean(slot.invigilator1Id);
                  const isChecked = selectedSlotIds.includes(slot.id);
                  return (
                    <tr
                      key={slot.id}
                      className={`transition-colors ${
                        isChecked ? 'bg-indigo-50/80 font-medium' : 'hover:bg-indigo-50/40'
                      }`}
                    >
                      <td className="px-3 py-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedSlotIds([...selectedSlotIds, slot.id]);
                            } else {
                              setSelectedSlotIds(selectedSlotIds.filter((id) => id !== slot.id));
                            }
                          }}
                          className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                        />
                      </td>
                      <td className="px-2.5 py-3 text-center font-mono text-slate-400">
                        {idx + 1}
                      </td>
                      <td className="px-3.5 py-3 font-medium text-slate-900 whitespace-nowrap">
                        {slot.dateStr}
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                          Sesi {slot.sessionIndex}
                        </span>
                        <span className="block text-[11px] text-slate-500 font-mono">
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-semibold text-[11px] border border-indigo-200">
                          Kelas {slot.classNames.join(', ')}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 whitespace-nowrap">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          {slot.roomName}
                        </span>
                        <span className="text-[10px] text-slate-400 block">{slot.studentCount} Siswa</span>
                      </td>
                      <td className="px-3.5 py-3">
                        <span className="font-bold text-slate-900 block">{slot.subjectName}</span>
                        <span className="text-[10px] text-slate-500">Durasi: {config.sessionDurationMinutes} Menit</span>
                      </td>
                      <td className="px-3.5 py-3">
                        {hasTeacher ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                              P1
                            </div>
                            <div>
                              <span className="font-semibold text-slate-900 block leading-tight">
                                {slot.invigilator1Name}
                              </span>
                            </div>
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold text-xs bg-rose-50 px-2 py-0.5 rounded">
                            <AlertCircle className="w-3 h-3" />
                            Belum Ada Pengawas
                          </span>
                        )}
                      </td>
                      {config.invigilatorsPerRoom === 2 && (
                        <td className="px-3.5 py-3">
                          {slot.invigilator2Id ? (
                            <div className="flex items-center gap-1.5">
                              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-800 font-bold text-[10px] flex items-center justify-center shrink-0">
                                P2
                              </div>
                              <span className="font-semibold text-slate-900 leading-tight">
                                {slot.invigilator2Name}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic">-</span>
                          )}
                        </td>
                      )}
                      <td className="px-3.5 py-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            id={`edit-slot-${slot.id}`}
                            onClick={() => onEditSlot(slot)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors cursor-pointer"
                            title="Edit / Ganti Pengawas & Ruang"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            id={`delete-slot-${slot.id}`}
                            onClick={() => setSlotToDelete(slot)}
                            className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Hapus Sesi Jadwal Ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* View Mode 2: Matrix Grid View */}
      {viewMode === 'matrix' && (
        <div className="space-y-4">
          {Array.from(matrixData.entries()).map(([daySessionTitle, slotGroup]) => {
            const [dTitle, sTitle] = daySessionTitle.split('___');
            return (
              <div key={daySessionTitle} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-bold text-slate-900 text-sm">
                      {dTitle} — <span className="text-indigo-600">{sTitle}</span>
                    </h4>
                    <span className="text-xs text-slate-400">({slotGroup[0]?.startTime} - {slotGroup[0]?.endTime})</span>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    Mapel: {slotGroup[0]?.subjectName}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
                  {slotGroup.map((slot) => (
                    <div
                      key={slot.id}
                      className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedSlotIds.includes(slot.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSlotIds([...selectedSlotIds, slot.id]);
                              } else {
                                setSelectedSlotIds(selectedSlotIds.filter((id) => id !== slot.id));
                              }
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                          />
                          <span className="font-bold text-slate-900 text-xs flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                            {slot.roomName}
                          </span>
                        </div>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          {slot.classNames.join(', ')}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs">
                        <div className="p-2 rounded-lg bg-white border border-slate-200">
                          <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                            Pengawas Utama
                          </span>
                          <span className="font-bold text-slate-900">
                            {slot.invigilator1Name || '(Belum Ditentukan)'}
                          </span>
                        </div>

                        {config.invigilatorsPerRoom === 2 && (
                          <div className="p-2 rounded-lg bg-white border border-slate-200">
                            <span className="text-[10px] text-slate-400 uppercase font-semibold block">
                              Pengawas Pendamping
                            </span>
                            <span className="font-bold text-slate-900">
                              {slot.invigilator2Name || '-'}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-200 text-xs">
                        <span className="text-[11px] text-slate-500">{slot.studentCount} Siswa</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => onEditSlot(slot)}
                            className="text-indigo-600 hover:text-indigo-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Edit</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setSlotToDelete(slot)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                            title="Hapus Sesi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* View Mode 3: Cards View */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSlots.map((slot) => {
            const isChecked = selectedSlotIds.includes(slot.id);
            return (
              <div
                key={slot.id}
                className={`bg-white rounded-xl border p-4 shadow-xs transition-all flex flex-col justify-between ${
                  isChecked ? 'border-indigo-500 ring-2 ring-indigo-200 bg-indigo-50/20' : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedSlotIds([...selectedSlotIds, slot.id]);
                          } else {
                            setSelectedSlotIds(selectedSlotIds.filter((id) => id !== slot.id));
                          }
                        }}
                        className="rounded text-indigo-600 focus:ring-indigo-500 w-3.5 h-3.5"
                      />
                      <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-200">
                        {slot.dateStr}
                      </span>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-600">
                      Sesi {slot.sessionIndex} ({slot.startTime} - {slot.endTime})
                    </span>
                  </div>

                  <h4 className="text-sm font-bold text-slate-900 mb-1 flex items-center gap-1.5">
                    <BookOpen className="w-4 h-4 text-indigo-600" />
                    {slot.subjectName}
                  </h4>

                  <div className="flex items-center gap-2 text-xs text-slate-600 mb-3">
                    <span className="flex items-center gap-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {slot.roomName}
                    </span>
                    <span>•</span>
                    <span>Kelas {slot.classNames.join(', ')}</span>
                    <span>•</span>
                    <span>{slot.studentCount} Siswa</span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-xs">
                      <User className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-slate-500 font-medium">Pengawas 1:</span>
                      <span className="font-bold text-slate-900">{slot.invigilator1Name || 'Belum Ada'}</span>
                    </div>
                    {config.invigilatorsPerRoom === 2 && (
                      <div className="flex items-center gap-2 text-xs">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        <span className="text-slate-500 font-medium">Pengawas 2:</span>
                        <span className="font-bold text-slate-900">{slot.invigilator2Name || '-'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button
                    onClick={() => onEditSlot(slot)}
                    className="px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Ubah Jadwal</span>
                  </button>
                  <button
                    onClick={() => setSlotToDelete(slot)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Hapus Sesi Jadwal Ini"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* In-App Single Slot Deletion Modal */}
      {slotToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl border border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h4 className="font-bold text-slate-900 text-sm mb-1">Konfirmasi Hapus Sesi Ujian</h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus jadwal sesi <strong>{slotToDelete.subjectName}</strong> di <strong>{slotToDelete.roomName}</strong> ({slotToDelete.dateStr}, Sesi {slotToDelete.sessionIndex})?
            </p>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSlotToDelete(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteSlot(slotToDelete.id);
                  setSlotToDelete(null);
                }}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
              >
                Ya, Hapus Sesi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Bulk / All Slot Deletion Modal */}
      {bulkDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-100">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="w-11 h-11 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h4 className="font-bold text-slate-900 text-base mb-1">
              {bulkDeleteTarget.mode === 'all' ? 'Hapus Seluruh Jadwal Ujian?' : 'Hapus Sesi Jadwal Pilihan?'}
            </h4>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              {bulkDeleteTarget.mode === 'all'
                ? `Tindakan ini akan menghapus semua ${bulkDeleteTarget.count} sesi jadwal dan penugasan pengawas secara permanen. Anda dapat membuat jadwal baru kembali menggunakan fitur generator otomatis.`
                : `Tindakan ini akan menghapus ${bulkDeleteTarget.count} sesi jadwal yang Anda pilih dari sistem secara permanen.`}
            </p>
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
                id="btn-confirm-bulk-delete-slots"
                onClick={() => {
                  if (bulkDeleteTarget.mode === 'all') {
                    if (onDeleteMultipleSlots) {
                      onDeleteMultipleSlots(slots.map((s) => s.id));
                    } else {
                      slots.forEach((s) => onDeleteSlot(s.id));
                    }
                    setSelectedSlotIds([]);
                  } else {
                    if (onDeleteMultipleSlots) {
                      onDeleteMultipleSlots(selectedSlotIds);
                    } else {
                      selectedSlotIds.forEach((id) => onDeleteSlot(id));
                    }
                    setSelectedSlotIds([]);
                  }
                  setBulkDeleteTarget(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>
                  {bulkDeleteTarget.mode === 'all' ? 'Ya, Hapus Semua Jadwal' : `Ya, Hapus ${bulkDeleteTarget.count} Sesi`}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
