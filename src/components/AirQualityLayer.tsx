import React, { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import type { AirIndexResponse, AirStepResponse } from '../core/api';
import { fetchAirStep } from '../core/api';
import { rasteriseGrid, subsampleFor, type AirGridData } from '../core/airField';

interface AirQualityLayerProps {
  map: maplibregl.Map | null;
  index: AirIndexResponse | null;
  currentStepIndex: number;
  opacity: number;
  visible: boolean;
  playing: boolean;
  onGridReady: (grid: AirGridData | null) => void;
}

const SRC_PM25 = 'sekura-src-pm25';
const LYR_PM25 = 'sekura-lyr-pm25';

export const AirQualityLayer: React.FC<AirQualityLayerProps> = ({
  map,
  index,
  currentStepIndex,
  opacity,
  visible,
  playing,
  onGridReady,
}) => {
  const composeCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const rastersCacheRef = useRef(new Map<string, HTMLCanvasElement>());

  // Initialize compose canvas and attach to MapLibre under basemap-labels
  const attachCanvasSource = useCallback(
    (m: maplibregl.Map, bbox: [number, number, number, number], width: number, height: number) => {
      let cv = composeCanvasRef.current;
      if (!cv) {
        cv = document.createElement('canvas');
        cv.width = width;
        cv.height = height;
        cv.getContext('2d')?.clearRect(0, 0, width, height);
        composeCanvasRef.current = cv;
      }

      if (m.getSource(SRC_PM25)) return;

      const [west, south, east, north] = bbox;
      const coordinates: [[number, number], [number, number], [number, number], [number, number]] = [
        [west, north],
        [east, north],
        [east, south],
        [west, south],
      ];

      m.addSource(SRC_PM25, {
        type: 'canvas',
        canvas: cv,
        coordinates,
        animate: false,
      });

      // Menempatkan layer PM2.5 di BAWAH basemap-labels agar nama kota & batas negara/provinsi tetap di atas
      const beforeId = m.getLayer('basemap-labels') ? 'basemap-labels' : undefined;

      m.addLayer(
        {
          id: LYR_PM25,
          type: 'raster',
          source: SRC_PM25,
          layout: { visibility: visible ? 'visible' : 'none' },
          paint: {
            'raster-opacity': opacity,
            'raster-fade-duration': 0,
          },
        },
        beforeId,
      );
    },
    [visible, opacity],
  );

  // Update opacity dynamically
  useEffect(() => {
    if (!map || !map.getLayer(LYR_PM25)) return;
    map.setPaintProperty(LYR_PM25, 'raster-opacity', visible ? opacity : 0);
  }, [map, opacity, visible]);

  // Handle style change / re-load
  useEffect(() => {
    if (!map) return;
    const handleStyleLoad = () => {
      if (index && composeCanvasRef.current) {
        attachCanvasSource(
          map,
          index.bbox,
          composeCanvasRef.current.width,
          composeCanvasRef.current.height,
        );
      }
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [map, index, attachCanvasSource]);

  // Load and render step data
  useEffect(() => {
    if (!map || !index || !visible) return;

    let cancelled = false;
    const timeKey = index.times[currentStepIndex];
    if (!timeKey) return;

    const renderStep = async () => {
      const stepData: AirStepResponse | null = await fetchAirStep(index, timeKey);
      if (cancelled || !stepData || !map) return;

      const sub = subsampleFor(index.pm.nx, index.pm.ny);
      const cacheKey = `${timeKey}@${sub}`;

      let rasterCv = rastersCacheRef.current.get(cacheKey);
      if (!rasterCv) {
        const [west, south, east, north] = index.bbox;
        const res = rasteriseGrid(
          { ...index.pm, values: stepData.pm25 },
          { west, south, east, north },
          sub,
        );
        if (res) {
          rasterCv = res.canvas;
          rastersCacheRef.current.set(cacheKey, rasterCv);
        }
      }

      if (!rasterCv) return;

      const w = rasterCv.width;
      const h = rasterCv.height;

      if (!map.getSource(SRC_PM25) || !map.getLayer(LYR_PM25)) {
        attachCanvasSource(map, index.bbox, w, h);
      }

      const composeCv = composeCanvasRef.current;
      if (!composeCv) return;

      const ctx = composeCv.getContext('2d');
      if (!ctx) return;

      ctx.clearRect(0, 0, composeCv.width, composeCv.height);
      ctx.drawImage(rasterCv, 0, 0, composeCv.width, composeCv.height);

      const src = map.getSource(SRC_PM25) as maplibregl.CanvasSource | undefined;
      if (src) {
        src.play();
        requestAnimationFrame(() => {
          try {
            src.pause();
          } catch {}
        });
      }

      // Propagate grid data for wind particles & point inspections
      onGridReady({
        bbox: index.bbox,
        pm25: { ...index.pm, values: stepData.pm25 },
        u: { ...index.wind, values: stepData.u },
        v: { ...index.wind, values: stepData.v },
        maxSpeed: stepData.maxSpeed,
        validAt: timeKey,
        attribution: index.attribution,
      });

      // Pre-fetch next step for seamless playback
      const nextIdx = (currentStepIndex + 1) % index.times.length;
      const nextKey = index.times[nextIdx];
      if (nextKey) {
        setTimeout(() => {
          if (!cancelled) fetchAirStep(index, nextKey);
        }, 150);
      }
    };

    void renderStep();

    return () => {
      cancelled = true;
    };
  }, [map, index, currentStepIndex, visible, attachCanvasSource, onGridReady]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        if (map.getLayer(LYR_PM25)) map.removeLayer(LYR_PM25);
        if (map.getSource(SRC_PM25)) map.removeSource(SRC_PM25);
      } catch {}
    };
  }, [map]);

  return null;
};
