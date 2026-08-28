import React from 'react';
import { Calendar, Users, Building2, Bell, Sparkles, CheckCircle2, ShieldAlert, GraduationCap, FileSpreadsheet } from 'lucide-react';
import { ExamTimeConfig, NotificationItem, TeacherWorkloadStats } from '../types';

interface HeaderProps {
  config: ExamTimeConfig;
  slotsCount: number;
  teachersCount: number;
  unreadNotifsCount: number;
  fairnessScore: number;
  hasConflicts: boolean;
  activeTab: 'schedule' | 'generator' | 'workload' | 'master' | 'notifications' | 'export' | 'cards';
  setActiveTab: (tab: 'schedule' | 'generator' | 'workload' | 'master' | 'notifications' | 'export' | 'cards') => void;
  openGoogleSheetsModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  slotsCount,
  teachersCount,
  unreadNotifsCount,
  fairnessScore,
  hasConflicts,
  activeTab,
  setActiveTab,
  openGoogleSheetsModal,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3">
          {/* School Brand & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-600 to-blue-700 text-white flex items-center justify-center font-bold text-lg shadow-sm shrink-0">
              SMP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-slate-900 leading-tight">
                  {config.schoolName}
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                  {config.semester} {config.academicYear}
                </span>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
                <span>{config.examType}</span>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">Jam {config.startTime} WIB ({config.sessionDurationMinutes}m/sesi)</span>
              </p>
            </div>
          </div>

          {/* Quick Metrics & Action Badges */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span><strong>{slotsCount}</strong> Sesi Ujian</span>
            </div>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700">
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span><strong>{teachersCount}</strong> Guru Pengawas</span>
            </div>

            {slotsCount > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Fairness: <strong>{fairnessScore}%</strong></span>
              </div>
            )}

            {hasConflicts && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800 animate-pulse">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                <span>Catatan Jadwal</span>
              </div>
            )}

            <button
              id="header-sync-sheets-btn"
              onClick={openGoogleSheetsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <img
                src="https://www.gstatic.com/images/branding/product/1x/sheets_2020q4_48dp.png"
                alt="Google Sheets"
                className="w-4 h-4"
              />
              <span>Google Sheets</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-slate-100 overflow-x-auto py-1 scrollbar-none">
          <button
            id="nav-tab-schedule"
            onClick={() => setActiveTab('schedule')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'schedule'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Jadwal & Pengawas</span>
            {slotsCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'schedule' ? 'bg-indigo-700 text-indigo-100' : 'bg-slate-200 text-slate-700'}`}>
                {slotsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-generator"
            onClick={() => setActiveTab('generator')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'generator'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Generator & Waktu</span>
          </button>

          <button
            id="nav-tab-workload"
            onClick={() => setActiveTab('workload')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'workload'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Beban Tugas Guru</span>
          </button>

          <button
            id="nav-tab-master"
            onClick={() => setActiveTab('master')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'master'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Data Master (Guru/Ruang/Mapel)</span>
          </button>

          <button
            id="nav-tab-cards"
            onClick={() => setActiveTab('cards')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'cards'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Kartu Ujian Siswa</span>
          </button>

          <button
            id="nav-tab-notifications"
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifikasi Civitas</span>
            {unreadNotifsCount > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500 text-white font-bold animate-bounce">
                {unreadNotifsCount}
              </span>
            )}
          </button>

          <button
            id="nav-tab-export"
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 cursor-pointer ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <span>📄</span>
            <span>Ekspor PDF & Excel</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
