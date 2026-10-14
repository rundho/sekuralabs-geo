import React, { useEffect, useRef, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';
import {
  type SatelliteMode,
  type SatelliteAnimationSpeed,
  type SatelliteAnimationStyle,
  type SatelliteLoopFrame,
  clampToLatestHimawariTime,
  getSatelliteTileUrl,
  SATELLITE_SPEED_CONFIGS,
} from '../core/satellite';

interface SatelliteCloudLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  opacity?: number;
  mode?: SatelliteMode;
  frames?: SatelliteLoopFrame[];
  currentStepIndex?: number;
  currentTimeIso?: string;
  playing?: boolean;
  onStepChange?: (index: number) => void;
  speed?: SatelliteAnimationSpeed;
  animationStyle?: SatelliteAnimationStyle;
  onResolvedModeChange?: (mode: 'visible' | 'infrared' | 'airmass') => void;
}

const SRC_PREFIX = 'sekura-sat-src-';
const LYR_PREFIX = 'sekura-sat-lyr-';

/**
 * Mesin Animasi Citra Satelit Geostasioner Himawari-9 60 FPS (Zoom Earth Architecture).
 *
 * Desain Bebas Kedip (Zero Flicker / Zero Jitter):
 * 1. Multi-Frame Pool terisolasi: Source dan Layer dibuat sekali dan tetap berada di GPU VRAM.
 * 2. Decoupled Clock: Loop animasi berjalan independen di rAF 60 FPS tanpa terpengaruh re-render React.
 * 3. Equal-Energy Cosine Crossfade: Total opasitas frame outgoing + incoming selalu 100% konstan.
 */
export const SatelliteCloudLayer: React.FC<SatelliteCloudLayerProps> = ({
  map,
  visible = false,
  opacity = 0.85,
  mode = 'auto',
  frames,
  currentStepIndex = 0,
  currentTimeIso,
  playing = false,
  onStepChange,
  speed = 'medium',
  animationStyle = 'smooth',
  onResolvedModeChange,
}) => {
  const poolCountRef = useRef<number>(0);
  const rafIdRef = useRef<number | null>(null);

  const opacityRef = useRef<number>(opacity);
  opacityRef.current = opacity;

  const modeRef = useRef<SatelliteMode>(mode);
  modeRef.current = mode;

  const speedRef = useRef<SatelliteAnimationSpeed>(speed);
  speedRef.current = speed;

  const animStyleRef = useRef<SatelliteAnimationStyle>(animationStyle);
  animStyleRef.current = animationStyle;

  const currentStepIndexRef = useRef<number>(currentStepIndex);
  currentStepIndexRef.current = currentStepIndex;

  const onStepChangeRef = useRef(onStepChange);
  onStepChangeRef.current = onStepChange;

  const onResolvedModeChangeRef = useRef(onResolvedModeChange);
  onResolvedModeChangeRef.current = onResolvedModeChange;

  const currentFloatRef = useRef<number>(currentStepIndex);
  const lastEmittedIdxRef = useRef<number>(currentStepIndex);
  const activePairRef = useRef<[number, number]>([currentStepIndex, currentStepIndex]);

  /**
   * Menemukan ID layer pertama yang harus diletakkan DI ATAS lapisan citra satelit
   * (garis pantai, label kota, atau titik api karhutla) agar peta selalu terbaca jelas.
   */
  const getFirstOverlayLayerId = useCallback((): string | undefined => {
    if (!map) return undefined;
    const candidates = [
      'sekura-lyr-coastline-halo',
      'sekura-lyr-coastline-core',
      'sekura-lyr-city-dots',
      'sekura-lyr-city-labels',
      'sekura-lyr-hotspots-halo',
      'sekura-lyr-hotspots-core',
    ];

    for (const id of candidates) {
      if (map.getLayer(id)) {
        return id;
      }
    }
    return undefined;
  }, [map]);

  /**
   * 1. Sinkronisasi Multi-Frame Raster Pool di MapLibre GL
   * Hanya dijalankan saat map, mode citra, visibilitas, atau daftar frame berubah.
   * DILARANG bergantung pada currentStepIndex atau playing agar tidak pernah re-order layer saat memutar!
   */
  const syncPoolLayers = useCallback(() => {
    if (!map) return;

    const activeFrames: { iso: string }[] =
      frames && frames.length > 0
        ? frames
        : [{ iso: clampToLatestHimawariTime(currentTimeIso || Date.now()) }];

    const count = activeFrames.length;
    const beforeLayerId = getFirstOverlayLayerId();
    const safeIdx = Math.min(Math.max(0, currentStepIndexRef.current), count - 1);

    for (let i = 0; i < count; i++) {
      const frameIso = activeFrames[i].iso;
      const { url, resolvedMode } = getSatelliteTileUrl(mode, frameIso);

      if (i === safeIdx && onResolvedModeChangeRef.current) {
        onResolvedModeChangeRef.current(resolvedMode);
      }

      const srcId = `${SRC_PREFIX}${i}`;
      const lyrId = `${LYR_PREFIX}${i}`;

      // 1. Source Raster
      let existingSource = map.getSource(srcId) as any;
      if (!existingSource) {
        map.addSource(srcId, {
          type: 'raster',
          tiles: [url],
          tileSize: 256,
          minzoom: 1,
          maxzoom: 7,
          attribution: 'Imagery &copy; JMA Himawari-9 / NASA GIBS / SekuraLabs',
        });
        existingSource = map.getSource(srcId) as any;
        if (existingSource) {
          existingSource._currentUrl = url;
        }
      } else if (existingSource._currentUrl !== url) {
        existingSource._currentUrl = url;
        if (typeof existingSource.setTiles === 'function') {
          existingSource.setTiles([url]);
        }
      }

      // 2. Layer Raster
      if (!map.getLayer(lyrId)) {
        map.addLayer(
          {
            id: lyrId,
            type: 'raster',
            source: srcId,
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
            paint: {
              'raster-opacity': visible && i === safeIdx ? opacityRef.current : 0,
              'raster-fade-duration': 0, // Gunakan kendali GPU crossfade murni tanpa delay internal
              'raster-contrast': 0.1, // Pertajam kontras gumpalan awan dan sebaran asap
              'raster-saturation': 0.05,
            },
          },
          beforeLayerId,
        );
      } else {
        map.setLayoutProperty(lyrId, 'visibility', visible ? 'visible' : 'none');
      }
    }

    // Bersihkan surplus layer jika rentang durasi diperpendek
    const prevCount = poolCountRef.current;
    if (prevCount > count) {
      for (let i = count; i < prevCount; i++) {
        const srcId = `${SRC_PREFIX}${i}`;
        const lyrId = `${LYR_PREFIX}${i}`;
        try {
          if (map.getLayer(lyrId)) map.removeLayer(lyrId);
          if (map.getSource(srcId)) map.removeSource(srcId);
        } catch {}
      }
    }

    poolCountRef.current = count;

    // Background preloader: panaskan cache ubin kawasan Indonesia untuk zoom 4
    if (visible && activeFrames.length > 1) {
      setTimeout(() => {
        const sampleTiles = [
          { z: 4, x: 12, y: 8 },
          { z: 4, x: 13, y: 8 },
          { z: 4, x: 14, y: 8 },
          { z: 4, x: 15, y: 8 },
          { z: 4, x: 13, y: 9 },
        ];
        activeFrames.forEach((frame) => {
          const { url } = getSatelliteTileUrl(mode, frame.iso);
          sampleTiles.forEach((tile) => {
            const tileUrl = url
              .replace('{z}', String(tile.z))
              .replace('{x}', String(tile.x))
              .replace('{y}', String(tile.y));
            const img = new Image();
            img.src = tileUrl;
          });
        });
      }, 100);
    }
  }, [map, visible, mode, frames, getFirstOverlayLayerId]);

  // Sinkronisasi pool saat struktur peta atau daftar frame berubah
  useEffect(() => {
    syncPoolLayers();
  }, [syncPoolLayers]);

  /**
   * 2. Kontrol Posisi Frame Saat Mode Diam / Scrubbing (Paused)
   * Efek ini HANYA aktif saat playing === false.
   * Saat playing === true, efek ini sama sekali TIDAK menyentuh opasitas layer!
   */
  useEffect(() => {
    if (!map || !visible || playing) return;

    const count = frames && frames.length > 0 ? frames.length : poolCountRef.current || 1;
    const safeIdx = Math.min(Math.max(0, currentStepIndex), count - 1);
    currentFloatRef.current = safeIdx;
    lastEmittedIdxRef.current = safeIdx;
    activePairRef.current = [safeIdx, safeIdx];

    for (let i = 0; i < count; i++) {
      const lyrId = `${LYR_PREFIX}${i}`;
      if (map.getLayer(lyrId)) {
        map.setLayoutProperty(lyrId, 'visibility', 'visible');
        map.setPaintProperty(lyrId, 'raster-opacity', i === safeIdx ? opacityRef.current : 0);
      }
    }
  }, [map, visible, playing, currentStepIndex, frames]);

  /**
   * 3. Mesin Pemutaran Animasi Kontinyu 60 FPS (Zoom Earth Style)
   * Loop ini berjalan TANPA TERPUTUS saat playing === true.
   * DILARANG memasukkan currentStepIndex ke dependency array agar loop tidak di-cancel setiap tick!
   */
  useEffect(() => {
    if (!map || !visible || !playing) {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const count = frames && frames.length > 0 ? frames.length : poolCountRef.current || 1;
    if (count <= 1) return;

    let lastTime = performance.now();
    let currentFloat = isNaN(currentFloatRef.current)
      ? currentStepIndexRef.current
      : currentFloatRef.current;

    // Pastikan semua layer visible
    for (let i = 0; i < count; i++) {
      const lyrId = `${LYR_PREFIX}${i}`;
      if (map.getLayer(lyrId)) {
        map.setLayoutProperty(lyrId, 'visibility', 'visible');
      }
    }

    const animateLoop = (now: number) => {
      if (!map) return;
      const deltaMs = now - lastTime;
      lastTime = now;

      const speedConfig = SATELLITE_SPEED_CONFIGS[speedRef.current] || SATELLITE_SPEED_CONFIGS.medium;
      const stepMs = Math.max(200, speedConfig.stepMs);

      // Tingkatkan float progress secara kontinyu tanpa jeda
      currentFloat = (currentFloat + deltaMs / stepMs) % count;
      if (isNaN(currentFloat)) currentFloat = 0;
      currentFloatRef.current = currentFloat;

      const idxA = Math.floor(currentFloat);
      const idxB = (idxA + 1) % count;
      const fraction = currentFloat - idxA;

      const lyrA = `${LYR_PREFIX}${idxA}`;
      const lyrB = `${LYR_PREFIX}${idxB}`;

      const targetOp = opacityRef.current;

      if (animStyleRef.current === 'smooth') {
        // Equal-Alpha Over Crossfade:
        // Transisi kurva halus di mana layer atas blend-in mulus sementara layer bawah mempertahankan
        // opasitas penuh. Menghilangkan 100% dip penurunan cahaya / kedipan ke basemap (zero flicker).
        const blend = 0.5 - 0.5 * Math.cos(Math.PI * fraction);

        let opA: number;
        let opB: number;

        if (idxB > idxA) {
          // Playback sekuensial normal: Layer B berada di atas Layer A
          opB = blend * targetOp;
          opA = targetOp;
        } else {
          // Wrap-around dari frame terakhir (17) kembali ke frame awal (0):
          // Layer A (17) berada di atas Layer B (0)
          opA = (1 - blend) * targetOp;
          opB = targetOp;
        }

        try {
          if (map.getLayer(lyrA)) map.setPaintProperty(lyrA, 'raster-opacity', opA);
          if (map.getLayer(lyrB)) map.setPaintProperty(lyrB, 'raster-opacity', opB);

          // Padamkan layer lain yang tidak sedang aktif
          const [prevA, prevB] = activePairRef.current;
          if (prevA !== idxA && prevA !== idxB) {
            const prevLyr = `${LYR_PREFIX}${prevA}`;
            if (map.getLayer(prevLyr)) map.setPaintProperty(prevLyr, 'raster-opacity', 0);
          }
          if (prevB !== idxA && prevB !== idxB) {
            const prevLyr = `${LYR_PREFIX}${prevB}`;
            if (map.getLayer(prevLyr)) map.setPaintProperty(prevLyr, 'raster-opacity', 0);
          }
          activePairRef.current = [idxA, idxB];
        } catch {}
      } else {
        // Mode Fast: Langkah diskrit instan
        try {
          if (map.getLayer(lyrA)) map.setPaintProperty(lyrA, 'raster-opacity', targetOp);
          const [prevA] = activePairRef.current;
          if (prevA !== idxA) {
            const prevLyr = `${LYR_PREFIX}${prevA}`;
            if (map.getLayer(prevLyr)) map.setPaintProperty(prevLyr, 'raster-opacity', 0);
          }
          activePairRef.current = [idxA, idxA];
        } catch {}
      }

      // Kirim pembaruan ke linimasa UI saat melintasi batas frame
      if (idxA !== lastEmittedIdxRef.current) {
        lastEmittedIdxRef.current = idxA;
        if (onStepChangeRef.current) {
          onStepChangeRef.current(idxA);
        }
        if (onResolvedModeChangeRef.current && frames?.[idxA]) {
          const { resolvedMode } = getSatelliteTileUrl(modeRef.current, frames[idxA].iso);
          onResolvedModeChangeRef.current(resolvedMode);
        }
      }

      rafIdRef.current = requestAnimationFrame(animateLoop);
    };

    rafIdRef.current = requestAnimationFrame(animateLoop);

    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [map, visible, playing, frames]);

  // Update opasitas reaktif saat slider opasitas digeser pengguna
  useEffect(() => {
    if (!map) return;
    opacityRef.current = opacity;
    if (!playing) {
      const count = frames && frames.length > 0 ? frames.length : poolCountRef.current || 1;
      const safeIdx = Math.min(Math.max(0, currentStepIndexRef.current), count - 1);
      const currentActiveLyr = `${LYR_PREFIX}${safeIdx}`;
      if (map.getLayer(currentActiveLyr)) {
        map.setPaintProperty(currentActiveLyr, 'raster-opacity', visible ? opacity : 0);
      }
    }
  }, [map, visible, opacity, playing, frames]);

  // Handle pergantian gaya peta dasar (style.load saat user ganti basemap)
  useEffect(() => {
    if (!map) return;
    const handleStyleLoad = () => {
      syncPoolLayers();
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [map, syncPoolLayers]);

  // Pembersihan saat komponen unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (!map) return;
      const count = poolCountRef.current;
      for (let i = 0; i < count; i++) {
        const srcId = `${SRC_PREFIX}${i}`;
        const lyrId = `${LYR_PREFIX}${i}`;
        try {
          if (map.getLayer(lyrId)) map.removeLayer(lyrId);
          if (map.getSource(srcId)) map.removeSource(srcId);
        } catch {}
      }
    };
  }, [map]);

  return null;
};
