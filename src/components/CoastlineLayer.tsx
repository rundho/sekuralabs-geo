import React, { useEffect, useCallback } from 'react';
import type maplibregl from 'maplibre-gl';

interface CoastlineLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

const SRC_COASTLINE = 'sekura-src-coastline';
const LYR_COASTLINE_HALO = 'sekura-lyr-coastline-halo';
const LYR_COASTLINE_CORE = 'sekura-lyr-coastline-core';

export const CoastlineLayer: React.FC<CoastlineLayerProps> = ({ map, visible = true }) => {
  const addCoastlines = useCallback(() => {
    if (!map) return;

    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const dataUrl = `${base}/data/coastline_sea.json`;

    if (!map.getSource(SRC_COASTLINE)) {
      map.addSource(SRC_COASTLINE, {
        type: 'geojson',
        data: dataUrl,
      });
    }

    // 1. Halo garis luar hitam pekat (memberikan ketajaman kontras terhadap asap terang)
    if (!map.getLayer(LYR_COASTLINE_HALO)) {
      map.addLayer({
        id: LYR_COASTLINE_HALO,
        type: 'line',
        source: SRC_COASTLINE,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#030712',
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 2.0,
            6, 3.2,
            10, 4.5,
          ],
          'line-opacity': 0.75,
          'line-blur': 0.8,
        },
      });
    }

    // 2. Garis kontur pulau utama (silver luminous kontras tinggi)
    if (!map.getLayer(LYR_COASTLINE_CORE)) {
      map.addLayer({
        id: LYR_COASTLINE_CORE,
        type: 'line',
        source: SRC_COASTLINE,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'line-color': '#cbd5e1', // Slate 300 - luminous silver
          'line-width': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3, 1.1,
            6, 1.6,
            10, 2.2,
          ],
          'line-opacity': 0.90,
        },
      });
    }

    // Pastikan jika layer PM2.5 sudah ada, posisinya tetap di bawah garis pantai
    if (map.getLayer('sekura-lyr-pm25')) {
      if (map.getLayer(LYR_COASTLINE_HALO)) map.moveLayer(LYR_COASTLINE_HALO);
      if (map.getLayer(LYR_COASTLINE_CORE)) map.moveLayer(LYR_COASTLINE_CORE);
    }
  }, [map, visible]);

  useEffect(() => {
    if (!map) return;

    if (map.isStyleLoaded()) {
      addCoastlines();
    } else {
      map.once('style.load', addCoastlines);
    }

    map.on('style.load', addCoastlines);

    return () => {
      if (map) {
        map.off('style.load', addCoastlines);
        if (map.getLayer(LYR_COASTLINE_CORE)) map.removeLayer(LYR_COASTLINE_CORE);
        if (map.getLayer(LYR_COASTLINE_HALO)) map.removeLayer(LYR_COASTLINE_HALO);
        if (map.getSource(SRC_COASTLINE)) map.removeSource(SRC_COASTLINE);
      }
    };
  }, [map, addCoastlines]);

  // Handle visibility update
  useEffect(() => {
    if (!map) return;
    if (visible && !map.getLayer(LYR_COASTLINE_CORE)) {
      addCoastlines();
    }

    const vis = visible ? 'visible' : 'none';
    if (map.getLayer(LYR_COASTLINE_HALO)) {
      map.setLayoutProperty(LYR_COASTLINE_HALO, 'visibility', vis);
    }
    if (map.getLayer(LYR_COASTLINE_CORE)) {
      map.setLayoutProperty(LYR_COASTLINE_CORE, 'visibility', vis);
    }
  }, [map, visible, addCoastlines]);

  return null;
};
