/**
 * Engine animasi partikel angin streamline berbasis vektor GFS 10m.
 * Memberikan visualisasi aliran dinamis 60 FPS di atas peta.
 */

import type { AirGridData } from './airField';

export const COMPASS_ID = ['U', 'TL', 'T', 'TG', 'S', 'BD', 'B', 'BL'] as const;

/** Menghitung arah angin datang (Indonesian Compass Bearing) */
export function getWindDirection(u: number, v: number): string {
  // u, v menunjukkan arah kemana angin pergi; manusia menamai dari mana angin datang
  const deg = (Math.atan2(-u, -v) * 180) / Math.PI;
  const idx = Math.round(((deg + 360) % 360) / 45) % 8;
  return COMPASS_ID[idx];
}

/** Menghitung kecepatan angin (m/s ke km/jam) */
export function mpsToKmh(mps: number): number {
  return mps * 3.6;
}

export class WindSampler {
  private readonly west: number;
  private readonly south: number;
  private readonly nx: number;
  private readonly ny: number;
  private readonly step: number;

  constructor(private readonly data: AirGridData) {
    this.west = data.bbox[0];
    this.south = data.bbox[1];
    this.nx = data.u.nx;
    this.ny = data.u.ny;
    this.step = data.u.step;
  }

  get maxSpeed(): number {
    return this.data.maxSpeed || 1;
  }

  private at(x: number, y: number): [number, number] | null {
    if (x < 0 || y < 0 || x >= this.nx || y >= this.ny) return null;
    const i = y * this.nx + x;
    const uu = this.data.u.values[i];
    const vv = this.data.v.values[i];
    if (uu == null || vv == null) return null;
    return [uu / 10, vv / 10];
  }

  sample(lon: number, lat: number): [number, number] | null {
    const fx = (lon - this.west) / this.step;
    const fy = (lat - this.south) / this.step;
    const x0 = Math.floor(fx);
    const y0 = Math.floor(fy);
    const tx = fx - x0;
    const ty = fy - y0;

    const c00 = this.at(x0, y0);
    const c10 = this.at(x0 + 1, y0);
    const c01 = this.at(x0, y0 + 1);
    const c11 = this.at(x0 + 1, y0 + 1);
    if (!c00 || !c10 || !c01 || !c11) return null;

    const lerp = (a: number, b: number, t: number) => a + t * (b - a);
    return [
      lerp(lerp(c00[0], c10[0], tx), lerp(c01[0], c11[0], tx), ty),
      lerp(lerp(c00[1], c10[1], tx), lerp(c01[1], c11[1], tx), ty),
    ];
  }

  contains(lon: number, lat: number): boolean {
    const [w, s, e, n] = this.data.bbox;
    return lon >= w && lon <= e && lat >= s && lat <= n;
  }
}

export interface WindParticle {
  lon: number;
  lat: number;
  age: number;
}
