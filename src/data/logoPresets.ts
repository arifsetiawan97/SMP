// Preset SVG Data URLs for Indonesian Education Letterhead (KOP Surat)
export interface LogoPreset {
  id: string;
  name: string;
  category: 'left' | 'right' | 'both';
  description: string;
  dataUrl: string;
}

// 1. Logo Tut Wuri Handayani (Kemendikbud)
const TUT_WURI_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon points="50,4 96,28 80,88 50,96 20,88 4,28" fill="%230b5394" stroke="%23f1c232" stroke-width="3"/>
  <circle cx="50" cy="50" r="34" fill="%23ffffff" stroke="%230b5394" stroke-width="2"/>
  <path d="M50 20 L58 38 L78 38 L62 50 L68 70 L50 58 L32 70 L38 50 L22 38 L42 38 Z" fill="%23f1c232" stroke="%23bf9000" stroke-width="1"/>
  <path d="M30 65 Q50 45 70 65 L65 72 Q50 55 35 72 Z" fill="%23cc0000"/>
  <circle cx="50" cy="42" r="5" fill="%230b5394"/>
</svg>`;

// 2. Logo Pemerintah Daerah / Garuda Emas
const PEMDA_GARUDA_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <path d="M50 6 C70 6 88 20 88 48 C88 74 65 90 50 94 C35 90 12 74 12 48 C12 20 30 6 50 6 Z" fill="%23134f5c" stroke="%23ffd966" stroke-width="3"/>
  <polygon points="50,16 60,36 82,36 64,48 70,70 50,56 30,70 36,48 18,36 40,36" fill="%23f1c232"/>
  <rect x="36" y="52" width="28" height="22" rx="4" fill="%23cc0000" stroke="%23ffffff" stroke-width="1.5"/>
  <circle cx="50" cy="63" r="6" fill="%23ffffff"/>
</svg>`;

// 3. Logo Kementerian Agama RI (Kemenag)
const KEMENAG_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon points="50,5 92,26 92,74 50,95 8,74 8,26" fill="%23274e13" stroke="%23ffd966" stroke-width="3"/>
  <circle cx="50" cy="50" r="32" fill="%23ffffff"/>
  <polygon points="50,22 56,36 70,36 59,45 63,59 50,50 37,59 41,45 30,36 44,36" fill="%2338761d"/>
  <path d="M30 64 Q50 52 70 64 L66 70 Q50 60 34 70 Z" fill="%23f1c232"/>
  <circle cx="50" cy="38" r="4" fill="%23f1c232"/>
</svg>`;

// 4. Logo Sekolah Cemerlang (Buku, Obor, & Bintang Emas)
const SEKOLAH_CEMERLANG_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <circle cx="50" cy="50" r="45" fill="%231e3a8a" stroke="%23fbbf24" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="37" fill="%23ffffff" stroke="%231e3a8a" stroke-width="1.5"/>
  <!-- Buku Terbuka -->
  <path d="M26 62 Q50 52 50 68 Q50 52 74 62 L74 46 Q50 36 50 52 Q50 36 26 46 Z" fill="%233b82f6" stroke="%231d4ed8" stroke-width="1.5"/>
  <!-- Api Obor -->
  <path d="M50 22 C56 28 58 35 50 44 C42 35 44 28 50 22 Z" fill="%23ef4444"/>
  <path d="M50 28 C53 32 54 36 50 42 C46 36 47 32 50 28 Z" fill="%23f59e0b"/>
  <!-- Bintang -->
  <polygon points="50,10 53,16 60,16 55,20 57,26 50,22 43,26 45,20 40,16 47,16" fill="%23fbbf24"/>
</svg>`;

// 5. Logo Prestasi Madrasah & Yayasan
const LOGO_MADRASAH_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <rect x="8" y="8" width="84" height="84" rx="18" fill="%23065f46" stroke="%2334d399" stroke-width="3"/>
  <circle cx="50" cy="50" r="32" fill="%23ffffff"/>
  <!-- Lambang Bulan Bintang & Buku -->
  <path d="M56 30 A18 18 0 1 0 56 62 A14 14 0 1 1 56 30 Z" fill="%23059669"/>
  <polygon points="58,40 61,46 67,46 62,50 64,56 58,52 52,56 54,50 49,46 55,46" fill="%23f59e0b"/>
  <path d="M32 70 Q50 62 68 70 L64 74 Q50 67 36 74 Z" fill="%23065f46"/>
</svg>`;

// 6. Logo Tunas Unggul (Modern Blue & Cyan)
const LOGO_TUNAS_SVG = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <polygon points="50,6 90,26 90,74 50,94 10,74 10,26" fill="%230369a1" stroke="%2338bdf8" stroke-width="3"/>
  <circle cx="50" cy="50" r="30" fill="%23f0f9ff"/>
  <path d="M50 30 Q65 42 50 68 Q35 42 50 30 Z" fill="%230284c7"/>
  <path d="M50 36 Q58 45 50 62 Q42 45 50 36 Z" fill="%2338bdf8"/>
  <circle cx="50" cy="24" r="5" fill="%23f59e0b"/>
</svg>`;

export const LOGO_PRESETS: LogoPreset[] = [
  {
    id: 'tut-wuri',
    name: 'Kemdikbud (Tut Wuri Handayani)',
    category: 'left',
    description: 'Logo resmi Kementerian Pendidikan, Kebudayaan, Riset, dan Teknologi',
    dataUrl: TUT_WURI_SVG,
  },
  {
    id: 'pemda-garuda',
    name: 'Pemerintah Daerah (Pemda / Garuda)',
    category: 'left',
    description: 'Logo resmi Pemerintah Kabupaten / Kota / Provinsi',
    dataUrl: PEMDA_GARUDA_SVG,
  },
  {
    id: 'kemenag',
    name: 'Kementerian Agama (Kemenag RI)',
    category: 'left',
    description: 'Logo resmi Kemenag untuk MTs / MA / Sekolah Keagamaan',
    dataUrl: KEMENAG_SVG,
  },
  {
    id: 'sekolah-cemerlang',
    name: 'Logo Sekolah Cemerlang (Buku & Obor)',
    category: 'right',
    description: 'Logo elegan lambang pendidikan, prestasi, buku, dan obor semangat',
    dataUrl: SEKOLAH_CEMERLANG_SVG,
  },
  {
    id: 'madrasah-hijau',
    name: 'Logo Madrasah / Yayasan Islami',
    category: 'right',
    description: 'Logo hijau madrasah dengan simbol bulan bintang & ketakwaan',
    dataUrl: LOGO_MADRASAH_SVG,
  },
  {
    id: 'tunas-unggul',
    name: 'Logo Tunas Unggul & Sains',
    category: 'right',
    description: 'Logo modern perisai heksagon biru untuk sekolah berwawasan digital',
    dataUrl: LOGO_TUNAS_SVG,
  },
];

export const DEFAULT_LEFT_LOGO = TUT_WURI_SVG;
export const DEFAULT_RIGHT_LOGO = SEKOLAH_CEMERLANG_SVG;
