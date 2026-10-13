/**
 * Modul data & GeoJSON generator untuk Titik Panas Karhutla (NASA FIRMS VIIRS 375m).
 */

export interface Hotspot {
  id: string;
  lat: number;
  lng: number;
  frp: number; // Fire Radiative Power (MW)
  confidence: 'nominal' | 'high' | 'low';
  acqDate: string; // YYYY-MM-DD
  acqTime: string; // HHMM UTC
  timeFormatted: string; // e.g. "14:13 WIB"
  satellite: string;
  daynight: 'D' | 'N';
  brightness: number; // Kelvin
}

export interface HotspotsFeedResponse {
  updatedAt: string;
  source?: string;
  count: number;
  hotspots: Hotspot[];
}

let cachedHotspots: HotspotsFeedResponse | null = null;

/** Mengambil data titik panas dengan fallback otomatis */
export async function fetchHotspotsFeed(forceRefresh = false): Promise<HotspotsFeedResponse> {
  if (cachedHotspots && !forceRefresh) {
    return cachedHotspots;
  }

  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  const endpoints = [
    `${base}/api/hotspots?t=${Date.now()}`,
    `${base}/data/hotspots_live.json?t=${Date.now()}`,
  ];

  for (const url of endpoints) {
    try {
      const res = await fetch(url);
      if (res.ok) {
        const json = (await res.json()) as HotspotsFeedResponse;
        if (json && Array.isArray(json.hotspots) && json.hotspots.length > 0) {
          cachedHotspots = json;
          return json;
        }
      }
    } catch {
      // Coba endpoint fallback berikutnya
    }
  }

  return {
    updatedAt: new Date().toISOString(),
    count: 0,
    hotspots: [],
  };
}

/** Mengonversi daftar Hotspot menjadi GeoJSON FeatureCollection untuk MapLibre GL */
export function hotspotsToGeoJSON(hotspots: Hotspot[]): GeoJSON.FeatureCollection<GeoJSON.Point> {
  return {
    type: 'FeatureCollection',
    features: hotspots.map((hp) => ({
      type: 'Feature',
      geometry: {
        type: 'Point',
        coordinates: [hp.lng, hp.lat],
      },
      properties: {
        id: hp.id,
        frp: hp.frp,
        confidence: hp.confidence,
        acqDate: hp.acqDate,
        acqTime: hp.acqTime,
        timeFormatted: hp.timeFormatted,
        satellite: hp.satellite,
        daynight: hp.daynight === 'D' ? 'Siang' : 'Malam',
        brightness: Math.round(hp.brightness - 273.15), // Convert to Celsius
      },
    })),
  };
}
