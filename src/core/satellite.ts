/**
 * Modul Konfigurasi & Generator URL Citra Satelit Geostasioner Himawari-9 (NASA GIBS / JMA).
 * Menyediakan ubin Near Real-Time (NRT) berproyeksi Web Mercator (EPSG:3857) per 10 menit.
 */

export type SatelliteMode = 'auto' | 'infrared' | 'visible' | 'airmass';

export interface SatelliteModeOption {
  id: SatelliteMode;
  label: string;
  badge: string;
  description: string;
}

export const SATELLITE_MODES: SatelliteModeOption[] = [
  {
    id: 'auto',
    label: 'Otomatis (GeoColor)',
    badge: 'Siang/Malam',
    description: 'Beralih cerdas: Optik Awan & Asap saat siang hari, Infrared termal saat malam.',
  },
  {
    id: 'infrared',
    label: 'Clean Infrared (24 Jam)',
    badge: 'Band 13 (IR)',
    description: 'Memantau badai, puncak awan tebal, dan sel konveksi 24 jam tanpa henti.',
  },
  {
    id: 'visible',
    label: 'Optik Nyata 1 km (Siang)',
    badge: 'Band 3 (Red)',
    description: 'Foto warna optik 1 km. Sangat tajam untuk melihat gumpalan awan dan asap karhutla.',
  },
  {
    id: 'airmass',
    label: 'Air Mass RGB',
    badge: 'Komposit',
    description: 'Analisis multispektral pergerakan massa udara, uap air tinggi, dan jet stream.',
  },
];

export interface SatelliteLayerConfig {
  layerIdentifier: string;
  tileMatrixSet: string;
  format: 'png' | 'jpg';
  minZoom: number;
  maxZoom: number;
}

const LAYER_CONFIGS: Record<Exclude<SatelliteMode, 'auto'>, SatelliteLayerConfig> = {
  infrared: {
    layerIdentifier: 'Himawari_AHI_Band13_Clean_Infrared',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    minZoom: 1,
    maxZoom: 6,
  },
  visible: {
    layerIdentifier: 'Himawari_AHI_Band3_Red_Visible_1km',
    tileMatrixSet: 'GoogleMapsCompatible_Level7',
    format: 'png',
    minZoom: 1,
    maxZoom: 7,
  },
  airmass: {
    layerIdentifier: 'Himawari_AHI_Air_Mass',
    tileMatrixSet: 'GoogleMapsCompatible_Level6',
    format: 'png',
    minZoom: 1,
    maxZoom: 6,
  },
};

/**
 * Memeriksa apakah waktu yang diberikan adalah siang hari di kawasan Indonesia (WIB/WITA/WIT).
 * Sinar matahari di khatulistiwa Indonesia menyinari bumi kira-kira pukul 05:30 - 18:15 WIB,
 * yang setara dengan 22:30 - 11:15 UTC.
 */
export function isDaytimeInIndonesia(date: Date): boolean {
  const utcHours = date.getUTCHours() + date.getUTCMinutes() / 60;
  // Rentang siang UTC: 22.5 s/d 24.0 ATAU 0.0 s/d 11.25
  return utcHours >= 22.5 || utcHours <= 11.25;
}

/**
 * Menghitung waktu pemindaian satelit Himawari-9 terdekat (dibulatkan ke interval 10 menit).
 * Memberikan jeda aman ~20 menit dari waktu sekarang agar ubin selesai diproses di CDN NASA.
 */
export function clampToLatestHimawariTime(inputDateOrMs: Date | number | string): string {
  let targetMs: number;
  if (typeof inputDateOrMs === 'string') {
    // Normalisasi string seperti "2026-10-14 02:00" atau ISO
    const cleanStr = inputDateOrMs.replace(' ', 'T');
    targetMs = Date.parse(cleanStr.endsWith('Z') ? cleanStr : `${cleanStr}:00Z`);
  } else if (typeof inputDateOrMs === 'number') {
    targetMs = inputDateOrMs;
  } else {
    targetMs = inputDateOrMs.getTime();
  }

  const nowMs = Date.now();
  // Batas maksimum ke waktu nyata: mundur 20 menit dari sekarang
  const maxSafeMs = nowMs - 20 * 60 * 1000;
  if (targetMs > maxSafeMs || isNaN(targetMs)) {
    targetMs = maxSafeMs;
  }

  // Bulatkan ke kelipatan 10 menit terdekat
  const roundedMs = Math.floor(targetMs / (10 * 60 * 1000)) * (10 * 60 * 1000);
  const roundedDate = new Date(roundedMs);

  return roundedDate.toISOString().slice(0, 19) + 'Z';
}

/**
 * Menghasilkan URL template ubin raster WMTS NASA GIBS untuk MapLibre GL JS
 */
export function getSatelliteTileUrl(mode: SatelliteMode, timestampIso: string): {
  url: string;
  config: SatelliteLayerConfig;
  resolvedMode: Exclude<SatelliteMode, 'auto'>;
} {
  const date = new Date(timestampIso);
  let resolvedMode: Exclude<SatelliteMode, 'auto'>;

  if (mode === 'auto') {
    resolvedMode = isDaytimeInIndonesia(date) ? 'visible' : 'infrared';
  } else {
    resolvedMode = mode;
  }

  const config = LAYER_CONFIGS[resolvedMode];
  const url = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${config.layerIdentifier}/default/${timestampIso}/${config.tileMatrixSet}/{z}/{y}/{x}.${config.format}`;

  return { url, config, resolvedMode };
}

export type SatelliteAnimationSpeed = 'slow' | 'medium' | 'fast';
export type SatelliteLoopDuration = 3 | 6 | 12 | 24;
export type SatelliteAnimationStyle = 'fast' | 'smooth';

export const SATELLITE_SPEED_CONFIGS: Record<
  SatelliteAnimationSpeed,
  { label: string; stepMs: number; crossfadeMs: number }
> = {
  slow: { label: 'Lambat', stepMs: 1350, crossfadeMs: 500 },
  medium: { label: 'Sedang', stepMs: 750, crossfadeMs: 320 },
  fast: { label: 'Cepat', stepMs: 380, crossfadeMs: 160 },
};

export const SATELLITE_DURATIONS: { hours: SatelliteLoopDuration; label: string; framesCount: number }[] = [
  { hours: 3, label: '3 Jam', framesCount: 18 },
  { hours: 6, label: '6 Jam', framesCount: 36 },
  { hours: 12, label: '12 Jam', framesCount: 48 },
  { hours: 24, label: '24 Jam', framesCount: 48 },
];

export interface SatelliteLoopFrame {
  iso: string;
  timeFormatted: string;
  dateFormatted: string;
  stepMs: number;
}

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

/**
 * Menghasilkan daftar frame interval 10-30 menit untuk mode Animasi Loop Satelit ala Zoom Earth
 * @param hours Rentang durasi loop (3, 6, 12, atau 24 jam)
 */
export function generateSatelliteLoopFrames(hours: SatelliteLoopDuration = 3): SatelliteLoopFrame[] {
  const frames: SatelliteLoopFrame[] = [];
  const now = new Date();

  // Tentukan interval menit dan jumlah frame berdasarkan durasi yang dipilih
  let intervalMinutes = 10;
  let count = 18;

  if (hours === 3) {
    intervalMinutes = 10;
    count = 18;
  } else if (hours === 6) {
    intervalMinutes = 10;
    count = 36;
  } else if (hours === 12) {
    intervalMinutes = 15;
    count = 48;
  } else if (hours === 24) {
    intervalMinutes = 30;
    count = 48;
  }

  // Scan terbaru yang sudah stabil di NASA GIBS (~25 menit sebelum sekarang)
  const intervalMs = intervalMinutes * 60 * 1000;
  const latestScanMs = Math.floor((now.getTime() - 25 * 60 * 1000) / intervalMs) * intervalMs;

  for (let i = count - 1; i >= 0; i--) {
    const frameMs = latestScanMs - (i * intervalMs);
    const d = new Date(frameMs);
    const iso = d.toISOString().slice(0, 19) + 'Z';

    const utcH = d.getUTCHours();
    const utcM = d.getUTCMinutes();
    const wibH = (utcH + 7) % 24;
    const pad = (n: number) => String(n).padStart(2, '0');

    const day = d.getUTCDate();
    const month = MONTH_NAMES_ID[d.getUTCMonth()];
    const year = d.getUTCFullYear();

    frames.push({
      iso,
      timeFormatted: `${pad(wibH)}:${pad(utcM)} WIB`,
      dateFormatted: `${day} ${month} ${year}`,
      stepMs: frameMs,
    });
  }

  return frames;
}
