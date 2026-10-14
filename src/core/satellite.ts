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
    const cleanStr = inputDateOrMs.replace(' ', 'T');
    targetMs = Date.parse(cleanStr.endsWith('Z') ? cleanStr : `${cleanStr}:00Z`);
  } else if (typeof inputDateOrMs === 'number') {
    targetMs = inputDateOrMs;
  } else {
    targetMs = inputDateOrMs.getTime();
  }

  const nowMs = Date.now();
  // Batas aman ~25 menit agar ubin GeoColor Himawari-9 selesai diproses & stabil di CDN
  const maxSafeMs = nowMs - 25 * 60 * 1000;
  if (targetMs > maxSafeMs || isNaN(targetMs)) {
    targetMs = maxSafeMs;
  }

  // Bulatkan ke kelipatan 10 menit terdekat
  const roundedMs = Math.floor(targetMs / (10 * 60 * 1000)) * (10 * 60 * 1000);
  const roundedDate = new Date(roundedMs);

  return roundedDate.toISOString().slice(0, 19) + 'Z';
}

/**
 * Menghasilkan URL template ubin raster WMTS NASA GIBS / Zoom Earth GeoColor untuk MapLibre GL JS
 */
export function getSatelliteTileUrl(mode: SatelliteMode, timestampIso: string): {
  url: string;
  config: SatelliteLayerConfig;
  resolvedMode: Exclude<SatelliteMode, 'auto'>;
} {
  const date = new Date(timestampIso);
  let resolvedMode: Exclude<SatelliteMode, 'auto'>;

  if (mode === 'auto' || mode === 'visible') {
    resolvedMode = isDaytimeInIndonesia(date) ? 'visible' : 'infrared';
    // Gunakan GeoColor definisi tinggi langsung dari feed satelit Zoom Earth / JMA Himawari
    const ymd = date.toISOString().slice(0, 10);
    const m = Math.floor(date.getUTCMinutes() / 10) * 10;
    const hhmm = String(date.getUTCHours()).padStart(2, '0') + String(m).padStart(2, '0');
    const url = `/zoom-tiles/geocolor/himawari/${ymd}/${hhmm}/{z}/{y}/{x}.jpg`;
    return {
      url,
      config: {
        layerIdentifier: 'Himawari_GeoColor',
        tileMatrixSet: 'GoogleMapsCompatible_Level7',
        format: 'jpg',
        minZoom: 1,
        maxZoom: 7,
      },
      resolvedMode,
    };
  }

  resolvedMode = mode;
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
  slow: { label: 'Lambat', stepMs: 1200, crossfadeMs: 1200 },
  medium: { label: 'Sedang', stepMs: 700, crossfadeMs: 700 },
  fast: { label: 'Cepat', stepMs: 400, crossfadeMs: 400 },
};

export const SATELLITE_DURATIONS: { hours: SatelliteLoopDuration; label: string; framesCount: number }[] = [
  { hours: 3, label: '3 Jam', framesCount: 18 },
  { hours: 6, label: '6 Jam', framesCount: 18 },
  { hours: 12, label: '12 Jam', framesCount: 24 },
  { hours: 24, label: '24 Jam', framesCount: 24 },
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
 * Menghasilkan daftar frame interval kelipatan 10 menit untuk mode Animasi Loop Satelit ala Zoom Earth
 * @param hours Rentang durasi loop (3, 6, 12, atau 24 jam)
 */
export function generateSatelliteLoopFrames(hours: SatelliteLoopDuration = 3): SatelliteLoopFrame[] {
  const frames: SatelliteLoopFrame[] = [];
  const nowMs = Date.now();

  // Tentukan interval menit dan jumlah frame (wajib kelipatan 10 menit sesuai scan Himawari-9)
  let intervalMinutes = 10;
  let count = 18;

  if (hours === 3) {
    intervalMinutes = 10;
    count = 18;
  } else if (hours === 6) {
    intervalMinutes = 20; // 18 frames * 20 min = 360 min = 6 jam
    count = 18;
  } else if (hours === 12) {
    intervalMinutes = 30; // 24 frames * 30 min = 720 min = 12 jam
    count = 24;
  } else if (hours === 24) {
    intervalMinutes = 60; // 24 frames * 60 min = 1440 min = 24 jam
    count = 24;
  }

  // Scan terbaru yang sudah stabil di CDN (~25 menit sebelum sekarang)
  // Wajib dibulatkan ke interval 10 menit scan Himawari
  const safeDelayMs = 25 * 60 * 1000;
  const base10Ms = Math.floor((nowMs - safeDelayMs) / (10 * 60 * 1000)) * (10 * 60 * 1000);
  const intervalMs = intervalMinutes * 60 * 1000;

  for (let i = count - 1; i >= 0; i--) {
    const frameMs = base10Ms - (i * intervalMs);
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
