import React, { useEffect, useRef, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';
import {
  type SatelliteMode,
  type SatelliteAnimationStyle,
  clampToLatestHimawariTime,
  getSatelliteTileUrl,
} from '../core/satellite';

interface SatelliteCloudLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  opacity?: number;
  mode?: SatelliteMode;
  currentTimeIso?: string;
  nextTimeIso?: string;
  animationStyle?: SatelliteAnimationStyle;
  crossfadeDurationMs?: number;
  onResolvedModeChange?: (mode: 'visible' | 'infrared' | 'airmass') => void;
}

const SRC_A = 'sekura-src-satellite-a';
const LYR_A = 'sekura-lyr-satellite-a';
const SRC_B = 'sekura-src-satellite-b';
const LYR_B = 'sekura-lyr-satellite-b';

/**
 * Lapisan Citra Satelit Cuaca Awan & Asap Geostasioner Himawari-9 (JMA / NASA GIBS).
 * Dilengkapi mesin Dual-Buffer Ping-Pong Crossfading (Buffer A & B)
 * dan Preloading GPU untuk animasi pergerakan awan yang mulus, stabil, dan bebas kedip persis Zoom Earth.
 */
export const SatelliteCloudLayer: React.FC<SatelliteCloudLayerProps> = ({
  map,
  visible = false,
  opacity = 0.85,
  mode = 'auto',
  currentTimeIso,
  nextTimeIso,
  animationStyle = 'smooth',
  crossfadeDurationMs = 320,
  onResolvedModeChange,
}) => {
  const activeBufferRef = useRef<'a' | 'b'>('a');
  const activeUrlRef = useRef<string>('');
  const rafIdRef = useRef<number | null>(null);
  const opacityRef = useRef<number>(opacity);
  opacityRef.current = opacity;

  /**
   * Menemukan ID layer pertama yang harus diletakkan DI ATAS lapisan citra satelit
   * (lapisan PM2.5, garis pantai, label kota, atau titik api karhutla) agar peta selalu terbaca jelas.
   */
  const getFirstOverlayLayerId = useCallback((): string | undefined => {
    if (!map) return undefined;
    const candidates = [
      'sekura-lyr-pm25',
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
   * Memastikan kedua source dan layer raster (Buffer A & B) terpasang di MapLibre
   */
  const ensureBuffersAttached = useCallback(
    (initialUrl: string) => {
      if (!map) return;

      const beforeLayerId = getFirstOverlayLayerId();

      // 1. Buffer A
      if (!map.getSource(SRC_A)) {
        map.addSource(SRC_A, {
          type: 'raster',
          tiles: [initialUrl],
          tileSize: 256,
          minzoom: 1,
          maxzoom: 6,
          attribution: 'Imagery &copy; JMA Himawari-9 / NASA GIBS / SekuraLabs',
        });
      }

      if (!map.getLayer(LYR_A)) {
        map.addLayer(
          {
            id: LYR_A,
            type: 'raster',
            source: SRC_A,
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
            paint: {
              'raster-opacity': visible && activeBufferRef.current === 'a' ? opacity : 0,
              'raster-fade-duration': 0, // Dikelola manual via rAF crossfade
            },
          },
          beforeLayerId,
        );
      } else {
        if (beforeLayerId) {
          try {
            map.moveLayer(LYR_A, beforeLayerId);
          } catch {}
        }
      }

      // 2. Buffer B
      if (!map.getSource(SRC_B)) {
        map.addSource(SRC_B, {
          type: 'raster',
          tiles: [initialUrl],
          tileSize: 256,
          minzoom: 1,
          maxzoom: 6,
          attribution: 'Imagery &copy; JMA Himawari-9 / NASA GIBS / SekuraLabs',
        });
      }

      if (!map.getLayer(LYR_B)) {
        map.addLayer(
          {
            id: LYR_B,
            type: 'raster',
            source: SRC_B,
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
            paint: {
              'raster-opacity': visible && activeBufferRef.current === 'b' ? opacity : 0,
              'raster-fade-duration': 0,
            },
          },
          beforeLayerId,
        );
      } else {
        if (beforeLayerId) {
          try {
            map.moveLayer(LYR_B, beforeLayerId);
          } catch {}
        }
      }
    },
    [map, visible, opacity, getFirstOverlayLayerId],
  );

  // Fungsi transisi halus (Crossfade rAF) antar dua buffer
  const triggerTransition = useCallback(
    (newUrl: string, nextPreloadUrl?: string) => {
      if (!map) return;

      const currentActive = activeBufferRef.current;
      const incomingBuffer = currentActive === 'a' ? 'b' : 'a';

      const incomingLyr = incomingBuffer === 'a' ? LYR_A : LYR_B;
      const outgoingLyr = currentActive === 'a' ? LYR_A : LYR_B;
      const incomingSrc = incomingBuffer === 'a' ? SRC_A : SRC_B;
      const outgoingSrc = currentActive === 'a' ? SRC_A : SRC_B;

      // Batalkan rAF sebelumnya jika ada transisi tertunda
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }

      // Muat URL baru pada buffer target
      const targetSource = map.getSource(incomingSrc) as any;
      if (targetSource && typeof targetSource.setTiles === 'function') {
        targetSource.setTiles([newUrl]);
      }

      // Pastikan kedua layer berstatus visible
      if (map.getLayer(incomingLyr)) {
        map.setLayoutProperty(incomingLyr, 'visibility', 'visible');
      }
      if (map.getLayer(outgoingLyr)) {
        map.setLayoutProperty(outgoingLyr, 'visibility', 'visible');
      }

      // Jika mode cepat (fast) dipilih pengguna, langsung alihkan tanpa crossfade
      if (animationStyle === 'fast') {
        map.setPaintProperty(incomingLyr, 'raster-opacity', opacityRef.current);
        map.setPaintProperty(outgoingLyr, 'raster-opacity', 0);
        activeBufferRef.current = incomingBuffer;
        activeUrlRef.current = newUrl;
        return;
      }

      // Mode Mulus (Smooth): Jalankan interpolasi crossfade matematis 60 FPS
      const startTime = performance.now();
      const duration = Math.max(80, crossfadeDurationMs);

      const step = (now: number) => {
        if (!map) return;
        const elapsed = now - startTime;
        const progress = Math.min(1, Math.max(0, elapsed / duration));

        // Kurva easing kuadratik (easeInOutQuad) untuk transisi alami
        const ease =
          progress < 0.5
            ? 2 * progress * progress
            : -1 + (4 - 2 * progress) * progress;

        const inOpacity = ease * opacityRef.current;
        const outOpacity = Math.max(0, (1 - ease) * opacityRef.current);

        try {
          if (map.getLayer(incomingLyr)) {
            map.setPaintProperty(incomingLyr, 'raster-opacity', inOpacity);
          }
          if (map.getLayer(outgoingLyr)) {
            map.setPaintProperty(outgoingLyr, 'raster-opacity', outOpacity);
          }
        } catch {}

        if (progress < 1) {
          rafIdRef.current = requestAnimationFrame(step);
        } else {
          // Transisi selesai, update status buffer aktif
          rafIdRef.current = null;
          activeBufferRef.current = incomingBuffer;
          activeUrlRef.current = newUrl;

          try {
            if (map.getLayer(incomingLyr)) {
              map.setPaintProperty(incomingLyr, 'raster-opacity', opacityRef.current);
            }
            if (map.getLayer(outgoingLyr)) {
              map.setPaintProperty(outgoingLyr, 'raster-opacity', 0);
            }
          } catch {}

          // PRELOAD FRAME BERIKUTNYA DI BUFFER IDLE:
          // Begitu buffer target mencapai 100%, buffer idle langsung diarahkan ke frame selanjutnya
          // sehingga ubin sudah diunduh & di-decode oleh GPU sebelum frame berikutnya diputar!
          if (nextPreloadUrl && map.getSource(outgoingSrc)) {
            const idleSource = map.getSource(outgoingSrc) as any;
            if (idleSource && typeof idleSource.setTiles === 'function') {
              idleSource.setTiles([nextPreloadUrl]);
            }
          }
        }
      };

      rafIdRef.current = requestAnimationFrame(step);
    },
    [map, animationStyle, crossfadeDurationMs],
  );

  // Sinkronisasi frame saat waktu berubah atau visibilitas diaktifkan
  useEffect(() => {
    if (!map) return;

    if (!visible) {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (map.getLayer(LYR_A)) map.setLayoutProperty(LYR_A, 'visibility', 'none');
      if (map.getLayer(LYR_B)) map.setLayoutProperty(LYR_B, 'visibility', 'none');
      return;
    }

    const clampedIso = clampToLatestHimawariTime(currentTimeIso || Date.now());
    const { url, resolvedMode } = getSatelliteTileUrl(mode, clampedIso);

    if (onResolvedModeChange) {
      onResolvedModeChange(resolvedMode);
    }

    // Hitung URL preload untuk frame selanjutnya jika tersedia
    let nextPreloadUrl: string | undefined;
    if (nextTimeIso) {
      const nextClamped = clampToLatestHimawariTime(nextTimeIso);
      const resNext = getSatelliteTileUrl(mode, nextClamped);
      nextPreloadUrl = resNext.url;
    }

    // Pastikan buffer terpasang jika belum ada
    if (!map.getLayer(LYR_A) || !map.getLayer(LYR_B)) {
      activeUrlRef.current = url;
      ensureBuffersAttached(url);
      return;
    }

    if (url !== activeUrlRef.current) {
      triggerTransition(url, nextPreloadUrl);
    } else {
      // Pastikan buffer aktif tetap terlihat
      const activeLyr = activeBufferRef.current === 'a' ? LYR_A : LYR_B;
      const inactiveLyr = activeBufferRef.current === 'a' ? LYR_B : LYR_A;

      if (map.getLayer(activeLyr)) {
        map.setLayoutProperty(activeLyr, 'visibility', 'visible');
        map.setPaintProperty(activeLyr, 'raster-opacity', opacity);
      }
      if (map.getLayer(inactiveLyr)) {
        map.setPaintProperty(inactiveLyr, 'raster-opacity', 0);
      }
    }
  }, [
    map,
    visible,
    mode,
    currentTimeIso,
    nextTimeIso,
    ensureBuffersAttached,
    triggerTransition,
    onResolvedModeChange,
    opacity,
  ]);

  // Handle pergantian gaya peta dasar (style.load saat user ganti basemap)
  useEffect(() => {
    if (!map) return;
    const handleStyleLoad = () => {
      activeUrlRef.current = '';
      if (visible) {
        const clampedIso = clampToLatestHimawariTime(currentTimeIso || Date.now());
        const { url, resolvedMode } = getSatelliteTileUrl(mode, clampedIso);
        if (onResolvedModeChange) {
          onResolvedModeChange(resolvedMode);
        }
        activeUrlRef.current = url;
        ensureBuffersAttached(url);
      }
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [map, visible, mode, currentTimeIso, ensureBuffersAttached, onResolvedModeChange]);

  // Update opasitas reaktif saat slider digeser
  useEffect(() => {
    if (!map) return;
    const activeLyr = activeBufferRef.current === 'a' ? LYR_A : LYR_B;
    if (map.getLayer(activeLyr)) {
      map.setPaintProperty(activeLyr, 'raster-opacity', visible ? opacity : 0);
    }
  }, [map, visible, opacity]);

  // Pembersihan saat komponen unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
      if (!map) return;
      try {
        if (map.getLayer(LYR_A)) map.removeLayer(LYR_A);
        if (map.getSource(SRC_A)) map.removeSource(SRC_A);
        if (map.getLayer(LYR_B)) map.removeLayer(LYR_B);
        if (map.getSource(SRC_B)) map.removeSource(SRC_B);
      } catch {}
    };
  }, [map]);

  return null;
};
