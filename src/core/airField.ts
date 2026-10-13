/**
 * Engine rasterisasi bicubic Catmull-Rom untuk data kualitas udara PM2.5.
 * Diadaptasi dan disempurnakan dari riset Mandum Rimba untuk Sekuralabs Geo.
 */

import { aqiToRgb, calculateUsAqi } from './aqi';

export interface BoundingBox {
  west: number;
  south: number;
  east: number;
  north: number;
}

export interface GridLayer {
  nx: number;
  ny: number;
  step: number;
  /** Nilai integer diskalakan (misal x10) atau null jika tidak ada data */
  values: (number | null)[];
}

export interface AirGridData {
  bbox: [number, number, number, number];
  pm25: GridLayer;
  u: GridLayer;
  v: GridLayer;
  maxSpeed: number;
  validAt: string | null;
  attribution: string;
}

export interface RasterResult {
  canvas: HTMLCanvasElement;
  box: BoundingBox;
}

const TARGET_CANVAS_PX = 1_400_000;
const SUBSAMPLE_MIN = 2;
const SUBSAMPLE_MAX = 10;
const EDGE_FADE_CELLS = 2;

/** Menghitung kepadatan piksel subsample ideal */
export function subsampleFor(nx: number, ny: number): number {
  const cells = Math.max(1, (nx - 1) * (ny - 1));
  const ideal = Math.round(Math.sqrt(TARGET_CANVAS_PX / cells));
  return Math.min(SUBSAMPLE_MAX, Math.max(SUBSAMPLE_MIN, ideal));
}

/** Web Mercator Y projection (Mencegah distorsi lintang pada MapLibre ImageSource) */
export function mercY(lat: number): number {
  return Math.log(Math.tan(Math.PI / 4 + (lat * Math.PI) / 360));
}

export function invMercY(y: number): number {
  return ((2 * Math.atan(Math.exp(y)) - Math.PI / 2) * 180) / Math.PI;
}

/** Catmull-Rom spline 1D */
function cubic(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const a = 2 * p1;
  const b = p2 - p0;
  const c = 2 * p0 - 5 * p1 + 4 * p2 - p3;
  const d = -p0 + 3 * p1 - 3 * p2 + p3;
  return 0.5 * (a + b * t + c * t * t + d * t * t * t);
}

/** Bicubic 16-lookup sampler dengan pengaman overshoot */
function sampleBicubic(
  at: (x: number, y: number) => number | null,
  x0: number,
  y0: number,
  tx: number,
  ty: number,
): number | null {
  const rows: number[] = [];
  let complete = true;

  for (let j = -1; j <= 2 && complete; j++) {
    const p: number[] = [];
    for (let i = -1; i <= 2; i++) {
      const v = at(x0 + i, y0 + j);
      if (v == null) {
        complete = false;
        break;
      }
      p.push(v);
    }
    if (complete) {
      const v = cubic(p[0], p[1], p[2], p[3], tx);
      // Batasi overshoot
      rows.push(Math.min(Math.max(p[1], p[2]), Math.max(Math.min(p[1], p[2]), v)));
    }
  }

  if (complete && rows.length === 4) {
    const v = cubic(rows[0], rows[1], rows[2], rows[3], ty);
    const lo = Math.min(rows[1], rows[2]);
    const hi = Math.max(rows[1], rows[2]);
    return Math.min(hi, Math.max(lo, v));
  }

  // Fallback ke bilinear jika ada titik kosong di sekitar 4x4
  const c00 = at(x0, y0);
  const c10 = at(x0 + 1, y0);
  const c01 = at(x0, y0 + 1);
  const c11 = at(x0 + 1, y0 + 1);
  if (c00 == null || c10 == null || c01 == null || c11 == null) return null;
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return lerp(lerp(c00, c10, tx), lerp(c01, c11, tx), ty);
}

/**
 * Merasterisasi grid PM2.5 mentah menjadi canvas RGBA bergradasi warna halus
 */
export function rasteriseGrid(
  pm: GridLayer,
  box: BoundingBox,
  subOverride?: number,
): RasterResult | null {
  if (pm.values.length === 0 || pm.nx < 2 || pm.ny < 2) return null;

  const sub = subOverride
    ? Math.min(SUBSAMPLE_MAX, Math.max(SUBSAMPLE_MIN, Math.round(subOverride)))
    : subsampleFor(pm.nx, pm.ny);

  const w = (pm.nx - 1) * sub;
  const h = (pm.ny - 1) * sub;
  if (w <= 0 || h <= 0) return null;

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  const img = ctx.createImageData(w, h);

  const at = (x: number, y: number): number | null => {
    const cx = Math.min(pm.nx - 1, Math.max(0, x));
    const cy = Math.min(pm.ny - 1, Math.max(0, y));
    const v = pm.values[cy * pm.nx + cx];
    return v == null ? null : v / 10;
  };

  const yTop = mercY(box.north);
  const yBot = mercY(box.south);
  const latStep = (box.north - box.south) / (pm.ny - 1);

  for (let py = 0; py < h; py++) {
    const lat = invMercY(yTop + (py / (h - 1)) * (yBot - yTop));
    const gy = Math.min(pm.ny - 1, Math.max(0, (lat - box.south) / latStep));
    const y0 = Math.min(pm.ny - 2, Math.floor(gy));
    const ty = gy - y0;

    for (let px = 0; px < w; px++) {
      const gx = (px / (w - 1)) * (pm.nx - 1);
      const x0 = Math.min(pm.nx - 2, Math.floor(gx));
      const tx = gx - x0;

      const o = (py * w + px) * 4;
      const val = sampleBicubic(at, x0, y0, tx, ty);

      if (val == null) {
        img.data[o + 3] = 0;
        continue;
      }

      const aqiRes = calculateUsAqi(val);
      const aqi = aqiRes?.aqi ?? 0;
      const [r, g, b] = aqiToRgb(aqi);

      // Kurva transparansi adaptif: Samudra/udara bersih tembus basemap gelap,
      // area asap pekat tetap dramatis namun kontur daratan pulau tetap terlihat jelas.
      let baseAlpha: number;
      if (aqi <= 20) {
        baseAlpha = 0.08 + (aqi / 20) * 0.24;
      } else if (aqi <= 50) {
        baseAlpha = 0.32 + ((aqi - 20) / 30) * 0.24;
      } else if (aqi <= 150) {
        baseAlpha = 0.56 + ((aqi - 50) / 100) * 0.22;
      } else {
        baseAlpha = Math.min(0.92, 0.78 + ((aqi - 150) / 150) * 0.14);
      }

      // Lembutkan tepi kotak boundary
      const edgeCells = Math.min(px, w - 1 - px, py, h - 1 - py) / sub;
      const edge = Math.max(0, Math.min(1, edgeCells / EDGE_FADE_CELLS));
      const alpha = baseAlpha * edge;

      img.data[o] = r;
      img.data[o + 1] = g;
      img.data[o + 2] = b;
      img.data[o + 3] = Math.round(255 * alpha);
    }
  }

  ctx.putImageData(img, 0, 0);
  return { canvas, box };
}

/**
 * Interpolasi bilinear layer untuk membaca angka spesifik pada klik kursor lon/lat
 */
export function sampleLayer(
  layer: GridLayer,
  bbox: [number, number, number, number],
  lon: number,
  lat: number,
): number | null {
  const fx = (lon - bbox[0]) / layer.step;
  const fy = (lat - bbox[1]) / layer.step;
  const x0 = Math.floor(fx);
  const y0 = Math.floor(fy);
  const tx = fx - x0;
  const ty = fy - y0;

  const at = (x: number, y: number): number | null => {
    if (x < 0 || y < 0 || x >= layer.nx || y >= layer.ny) return null;
    const v = layer.values[y * layer.nx + x];
    return v == null ? null : v / 10;
  };

  const c00 = at(x0, y0);
  const c10 = at(x0 + 1, y0);
  const c01 = at(x0, y0 + 1);
  const c11 = at(x0 + 1, y0 + 1);

  if (c00 == null || c10 == null || c01 == null || c11 == null) return null;
  const lerp = (a: number, b: number, t: number) => a + t * (b - a);
  return lerp(lerp(c00, c10, tx), lerp(c01, c11, tx), ty);
}
