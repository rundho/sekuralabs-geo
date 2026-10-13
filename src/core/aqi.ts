/**
 * US EPA Air Quality Index for PM2.5 (Revisi Resmi 6 Mei 2024 - 40 CFR Part 58 Appendix G)
 * Diimplementasikan secara akurat untuk Sekuralabs Geo.
 */

export type AqiCategory =
  | 'good'
  | 'moderate'
  | 'sensitive'
  | 'unhealthy'
  | 'very_unhealthy'
  | 'hazardous';

export interface AqiBreakpoint {
  cLo: number;
  cHi: number;
  iLo: number;
  iHi: number;
  category: AqiCategory;
  name: string;
  color: string;
  bgRgba: string;
  description: string;
}

export const PM25_BREAKPOINTS: readonly AqiBreakpoint[] = [
  {
    cLo: 0.0,
    cHi: 9.0,
    iLo: 0,
    iHi: 50,
    category: 'good',
    name: 'Baik',
    color: '#10b981',
    bgRgba: 'rgba(16, 185, 129, 0.15)',
    description: 'Kualitas udara memuaskan dan berisiko sangat kecil terhadap kesehatan.',
  },
  {
    cLo: 9.1,
    cHi: 35.4,
    iLo: 51,
    iHi: 100,
    category: 'moderate',
    name: 'Sedang',
    color: '#eab308',
    bgRgba: 'rgba(234, 179, 8, 0.15)',
    description: 'Kualitas udara dapat diterima. Sedikit polutan dapat memengaruhi individu yang amat rentan.',
  },
  {
    cLo: 35.5,
    cHi: 55.4,
    iLo: 101,
    iHi: 150,
    category: 'sensitive',
    name: 'Tidak Sehat (Sensitif)',
    color: '#f97316',
    bgRgba: 'rgba(249, 115, 22, 0.15)',
    description: 'Kelompok rentan (anak-anak, lansia, pengidap asma) disarankan mengurangi aktivitas luar ruangan.',
  },
  {
    cLo: 55.5,
    cHi: 125.4,
    iLo: 151,
    iHi: 200,
    category: 'unhealthy',
    name: 'Tidak Sehat',
    color: '#ef4444',
    bgRgba: 'rgba(239, 68, 68, 0.15)',
    description: 'Setiap orang mulai merasakan dampak buruk terhadap kesehatan. Gunakan masker saat di luar.',
  },
  {
    cLo: 125.5,
    cHi: 225.4,
    iLo: 201,
    iHi: 300,
    category: 'very_unhealthy',
    name: 'Sangat Tidak Sehat',
    color: '#8f3f97',
    bgRgba: 'rgba(143, 63, 151, 0.2)',
    description: 'Peringatan darurat kesehatan. Seluruh masyarakat berisiko mengalami gangguan pernapasan serius.',
  },
  {
    cLo: 225.5,
    cHi: 325.4,
    iLo: 301,
    iHi: 500,
    category: 'hazardous',
    name: 'Berbahaya',
    color: '#7e0023',
    bgRgba: 'rgba(126, 0, 35, 0.3)',
    description: 'Peringatan bahaya tingkat tinggi. Hindari semua aktivitas fisik di luar ruangan.',
  },
] as const;

/** Slope untuk segmen Berbahaya (>325.4 ug/m3) */
const TOP = PM25_BREAKPOINTS[PM25_BREAKPOINTS.length - 1];
const TOP_SLOPE = (TOP.iHi - TOP.iLo) / (TOP.cHi - TOP.cLo);

export interface AqiResult {
  pm25: number;
  aqi: number;
  category: AqiCategory;
  name: string;
  color: string;
  bgRgba: string;
  description: string;
  extrapolated: boolean;
}

/**
 * Truncate nilai PM2.5 ke 1 tempat desimal sesuai instruksi EPA Appendix G.
 */
function truncate1(v: number): number {
  return Math.floor(v * 10) / 10;
}

/**
 * Konversi konsentrasi PM2.5 (ug/m3) ke indeks US EPA AQI.
 */
export function calculateUsAqi(ugm3: number | null | undefined): AqiResult | null {
  if (ugm3 == null || !Number.isFinite(ugm3) || ugm3 < 0) return null;
  const c = truncate1(ugm3);

  for (const bp of PM25_BREAKPOINTS) {
    if (c <= bp.cHi) {
      const aqi = ((bp.iHi - bp.iLo) / (bp.cHi - bp.cLo)) * (c - bp.cLo) + bp.iLo;
      return {
        pm25: c,
        aqi: Math.max(0, Math.round(aqi)),
        category: bp.category,
        name: bp.name,
        color: bp.color,
        bgRgba: bp.bgRgba,
        description: bp.description,
        extrapolated: false,
      };
    }
  }

  // Jika konsentrasi melebihi 325.4 ug/m3
  return {
    pm25: c,
    aqi: Math.round(TOP.iHi + (c - TOP.cHi) * TOP_SLOPE),
    category: 'hazardous',
    name: 'Berbahaya (Ekstrem)',
    color: '#7e0023',
    bgRgba: 'rgba(126, 0, 35, 0.35)',
    description: 'Kabut asap sangat tebal dan berbahaya bagi keselamatan nyawa.',
    extrapolated: true,
  };
}

/**
 * Mengambil metadata kategori, warna, dan deskripsi untuk nilai AQI US numerik (termasuk nilai ekstrem > 500)
 */
export function getCategoryForAqi(aqi: number): {
  category: AqiCategory;
  name: string;
  color: string;
  bgRgba: string;
  description: string;
} {
  if (aqi <= 50) {
    const bp = PM25_BREAKPOINTS[0];
    return { category: bp.category, name: bp.name, color: bp.color, bgRgba: bp.bgRgba, description: bp.description };
  }
  if (aqi <= 100) {
    const bp = PM25_BREAKPOINTS[1];
    return { category: bp.category, name: bp.name, color: bp.color, bgRgba: bp.bgRgba, description: bp.description };
  }
  if (aqi <= 150) {
    const bp = PM25_BREAKPOINTS[2];
    return { category: bp.category, name: bp.name, color: bp.color, bgRgba: bp.bgRgba, description: bp.description };
  }
  if (aqi <= 200) {
    const bp = PM25_BREAKPOINTS[3];
    return { category: bp.category, name: bp.name, color: bp.color, bgRgba: bp.bgRgba, description: bp.description };
  }
  if (aqi <= 300) {
    const bp = PM25_BREAKPOINTS[4];
    return { category: bp.category, name: bp.name, color: bp.color, bgRgba: bp.bgRgba, description: bp.description };
  }
  const bp = PM25_BREAKPOINTS[5];
  return {
    category: bp.category,
    name: aqi > 500 ? 'Berbahaya (Ekstrem)' : bp.name,
    color: aqi > 500 ? '#7e0023' : bp.color,
    bgRgba: bp.bgRgba,
    description: bp.description,
  };
}

/**
 * Palet warna halus untuk interpolasi raster heatmap kualitas udara
 */
export const AQI_RAMP: { aqi: number; rgb: [number, number, number] }[] = [
  { aqi: 0, rgb: [8, 38, 75] },         // Clean ocean deep navy blue
  { aqi: 25, rgb: [12, 85, 115] },       // Deep ocean teal
  { aqi: 50, rgb: [16, 175, 105] },      // Rich emerald green (Baik)
  { aqi: 100, rgb: [228, 160, 10] },     // Deep golden amber (Sedang)
  { aqi: 150, rgb: [238, 90, 18] },      // Intense warm orange (Sensitif)
  { aqi: 200, rgb: [220, 38, 38] },      // Vivid crimson red (Tidak Sehat)
  { aqi: 300, rgb: [138, 32, 115] },     // Deep rich royal magenta/purple (Sangat Tidak Sehat)
  { aqi: 500, rgb: [88, 12, 45] },       // Deep velvety burgundy/maroon (Berbahaya)
  { aqi: 800, rgb: [45, 4, 20] },        // Ultra deep dark wine
];

export function aqiToRgb(aqi: number): [number, number, number] {
  if (aqi <= AQI_RAMP[0].aqi) return AQI_RAMP[0].rgb;
  for (let i = 1; i < AQI_RAMP.length; i++) {
    const hi = AQI_RAMP[i];
    if (aqi <= hi.aqi) {
      const lo = AQI_RAMP[i - 1];
      const t = (aqi - lo.aqi) / (hi.aqi - lo.aqi);
      return [
        Math.round(lo.rgb[0] + t * (hi.rgb[0] - lo.rgb[0])),
        Math.round(lo.rgb[1] + t * (hi.rgb[1] - lo.rgb[1])),
        Math.round(lo.rgb[2] + t * (hi.rgb[2] - lo.rgb[2])),
      ];
    }
  }
  return AQI_RAMP[AQI_RAMP.length - 1].rgb;
}
