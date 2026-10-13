/**
 * API client & caching layer untuk feed data Copernicus CAMS & NOAA GFS.
 * Menghubungkan Sekuralabs Geo ke CDN R2 dengan optimasi hemat kuota.
 */

export const CDN_BASE_URL = 'https://pub-e71bae449b864ca78974083cc5663453.r2.dev';

export interface AirIndexResponse {
  bbox: [number, number, number, number];
  pm: { nx: number; ny: number; step: number };
  wind: { nx: number; ny: number; step: number };
  times: string[];
  steps?: string;
  source?: string;
  runAt?: string | null;
  stepHours?: number;
  attribution: string;
  generatedAt?: string;
}

export interface AirStepResponse {
  pm25: (number | null)[];
  u: (number | null)[];
  v: (number | null)[];
  maxSpeed: number;
}

const stepCache = new Map<string, AirStepResponse>();
let cachedIndex: AirIndexResponse | null = null;

async function smartFetch(url: string, fallbackPath: string): Promise<Response> {
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (res.ok) return res;
    throw new Error(`Direct HTTP ${res.status}`);
  } catch (directErr) {
    // Fallback ke local Edge proxy /air/... (Cloudflare Pages Function) jika R2 mengalami issue CORS
    try {
      const res = await fetch(fallbackPath);
      if (res.ok) return res;
    } catch {
      // Abaikan jika fallback juga gagal
    }
    throw directErr;
  }
}

/** Mengambil metadata index grid CAMS */
export async function fetchAirIndex(forceRefresh = false): Promise<AirIndexResponse> {
  if (cachedIndex && !forceRefresh) {
    return cachedIndex;
  }

  const directUrl = `${CDN_BASE_URL}/air/index.json?_t=${Date.now()}`;
  const fallbackUrl = `/air/index.json?_t=${Date.now()}`;
  const res = await smartFetch(directUrl, fallbackUrl);

  if (!res.ok) {
    throw new Error(`Gagal memuat indeks data udara (HTTP ${res.status})`);
  }

  const data = (await res.json()) as AirIndexResponse;
  if (!data.times || data.times.length === 0) {
    throw new Error('Indeks data tidak memiliki langkah waktu yang valid');
  }

  cachedIndex = data;
  return data;
}

/** Mengambil data grid untuk 1 jam spesifik dengan caching otomatis */
export async function fetchAirStep(
  index: AirIndexResponse,
  timestampKey: string,
): Promise<AirStepResponse | null> {
  const cacheKey = `${index.steps ?? 'air/t'}/${timestampKey}`;
  if (stepCache.has(cacheKey)) {
    return stepCache.get(cacheKey)!;
  }

  const prefix = index.steps ?? 'air/t';
  const directUrl = `${CDN_BASE_URL}/${prefix}/${encodeURIComponent(timestampKey)}.json`;
  const fallbackUrl = `/${prefix}/${encodeURIComponent(timestampKey)}.json`;

  try {
    const res = await smartFetch(directUrl, fallbackUrl);
    if (!res.ok) {
      console.warn(`[Sekuralabs Geo] Step ${timestampKey} tidak ditemukan (HTTP ${res.status})`);
      return null;
    }

    const step = (await res.json()) as AirStepResponse;
    const expected = index.pm.nx * index.pm.ny;
    if (step.pm25?.length !== expected) {
      console.warn(
        `[Sekuralabs Geo] Panjang array data (${step.pm25?.length}) tidak cocok dengan grid (${expected})`,
      );
      return null;
    }

    stepCache.set(cacheKey, step);
    return step;
  } catch (err) {
    console.error(`[Sekuralabs Geo] Error mengunduh data langkah ${timestampKey}:`, err);
    return null;
  }
}
