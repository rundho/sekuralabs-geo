import React, { useEffect, useRef, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';
import {
  type SatelliteMode,
  clampToLatestHimawariTime,
  getSatelliteTileUrl,
} from '../core/satellite';

interface SatelliteCloudLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
  opacity?: number;
  mode?: SatelliteMode;
  currentTimeIso?: string;
  onResolvedModeChange?: (mode: 'visible' | 'infrared' | 'airmass') => void;
}

const SRC_SATELLITE = 'sekura-src-satellite';
const LYR_SATELLITE = 'sekura-lyr-satellite';

/**
 * Lapisan Citra Satelit Cuaca Awan & Asap Geostasioner Himawari-9 (JMA / NASA GIBS).
 * Menggunakan engine raster WebGL MapLibre dengan raster-fade-duration 300ms
 * untuk transisi pergantian frame waktu yang halus tanpa kedip.
 */
export const SatelliteCloudLayer: React.FC<SatelliteCloudLayerProps> = ({
  map,
  visible = false,
  opacity = 0.85,
  mode = 'auto',
  currentTimeIso,
  onResolvedModeChange,
}) => {
  const currentTileUrlRef = useRef<string>('');

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
   * Memastikan source dan layer raster satelit terpasang pada MapLibre.
   */
  const ensureLayerAttached = useCallback(
    (tileUrl: string) => {
      if (!map) return;

      const beforeLayerId = getFirstOverlayLayerId();

      if (!map.getSource(SRC_SATELLITE)) {
        map.addSource(SRC_SATELLITE, {
          type: 'raster',
          tiles: [tileUrl],
          tileSize: 256,
          minzoom: 1,
          maxzoom: 6,
          attribution: 'Imagery &copy; JMA Himawari-9 / NASA GIBS / SekuraLabs',
        });
      } else {
        const src = map.getSource(SRC_SATELLITE) as any;
        if (src && typeof src.setTiles === 'function') {
          src.setTiles([tileUrl]);
        }
      }

      if (!map.getLayer(LYR_SATELLITE)) {
        map.addLayer(
          {
            id: LYR_SATELLITE,
            type: 'raster',
            source: SRC_SATELLITE,
            minzoom: 0,
            maxzoom: 19,
            layout: {
              visibility: visible ? 'visible' : 'none',
            },
            paint: {
              'raster-opacity': visible ? opacity : 0,
              'raster-fade-duration': 300,
            },
          },
          beforeLayerId,
        );
      } else {
        map.setLayoutProperty(LYR_SATELLITE, 'visibility', visible ? 'visible' : 'none');
        map.setPaintProperty(LYR_SATELLITE, 'raster-opacity', visible ? opacity : 0);
        if (beforeLayerId) {
          try {
            map.moveLayer(LYR_SATELLITE, beforeLayerId);
          } catch {}
        }
      }
    },
    [map, visible, opacity, getFirstOverlayLayerId],
  );

  // Sinkronisasi URL ubin saat waktu, visibilitas, atau mode berganti
  useEffect(() => {
    if (!map) return;

    if (!visible) {
      if (map.getLayer(LYR_SATELLITE)) {
        map.setLayoutProperty(LYR_SATELLITE, 'visibility', 'none');
      }
      return;
    }

    const clampedIso = clampToLatestHimawariTime(currentTimeIso || Date.now());
    const { url, resolvedMode } = getSatelliteTileUrl(mode, clampedIso);

    if (onResolvedModeChange) {
      onResolvedModeChange(resolvedMode);
    }

    if (url !== currentTileUrlRef.current || !map.getLayer(LYR_SATELLITE)) {
      currentTileUrlRef.current = url;
      ensureLayerAttached(url);
    } else {
      map.setLayoutProperty(LYR_SATELLITE, 'visibility', 'visible');
      map.setPaintProperty(LYR_SATELLITE, 'raster-opacity', opacity);
    }
  }, [map, visible, opacity, mode, currentTimeIso, ensureLayerAttached, onResolvedModeChange]);

  // Handle style change / re-load (misal pengguna ganti basemap Esri/Dark/Positron)
  useEffect(() => {
    if (!map) return;
    const handleStyleLoad = () => {
      currentTileUrlRef.current = '';
      if (visible) {
        const clampedIso = clampToLatestHimawariTime(currentTimeIso || Date.now());
        const { url, resolvedMode } = getSatelliteTileUrl(mode, clampedIso);
        if (onResolvedModeChange) {
          onResolvedModeChange(resolvedMode);
        }
        currentTileUrlRef.current = url;
        ensureLayerAttached(url);
      }
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [map, visible, mode, currentTimeIso, ensureLayerAttached, onResolvedModeChange]);

  // Update opasitas reaktif saat slider digeser
  useEffect(() => {
    if (!map || !map.getLayer(LYR_SATELLITE)) return;
    map.setPaintProperty(LYR_SATELLITE, 'raster-opacity', visible ? opacity : 0);
  }, [map, visible, opacity]);

  // Pembersihan saat komponen unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (map.getLayer(LYR_SATELLITE)) map.removeLayer(LYR_SATELLITE);
        if (map.getSource(SRC_SATELLITE)) map.removeSource(SRC_SATELLITE);
      } catch {}
    };
  }, [map]);

  return null;
};
