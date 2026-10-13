import React, { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

interface CoastlineLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

const SRC_COASTLINE = 'sekura-src-coastline';
const LYR_COASTLINE_HALO = 'sekura-lyr-coastline-halo';
const LYR_COASTLINE_CORE = 'sekura-lyr-coastline-core';

export const CoastlineLayer: React.FC<CoastlineLayerProps> = ({ map, visible = true }) => {
  useEffect(() => {
    if (!map) return;

    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const dataUrl = `${base}/data/coastline_sea.json`;

    const addCoastlines = () => {
      if (map.getSource(SRC_COASTLINE)) return;

      map.addSource(SRC_COASTLINE, {
        type: 'geojson',
        data: dataUrl,
      });

      // Target penempatan: di atas lapisan asap PM2.5, namun di bawah label teks nama kota
      const beforeId = map.getLayer('basemap-labels') ? 'basemap-labels' : undefined;

      // 1. Halo garis luar hitam pekat (memberikan ketajaman kontras terhadap asap terang)
      map.addLayer(
        {
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
        },
        beforeId,
      );

      // 2. Garis kontur pulau utama (silver luminous kontras tinggi)
      map.addLayer(
        {
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
        },
        beforeId,
      );

      // Pastikan jika layer PM2.5 sudah ada, posisinya tetap di bawah garis pantai
      if (map.getLayer('sekura-lyr-pm25')) {
        map.moveLayer('sekura-lyr-pm25', LYR_COASTLINE_HALO);
      }
    };

    if (map.isStyleLoaded()) {
      addCoastlines();
    } else {
      map.once('style.load', addCoastlines);
    }

    return () => {
      if (map.getLayer(LYR_COASTLINE_CORE)) map.removeLayer(LYR_COASTLINE_CORE);
      if (map.getLayer(LYR_COASTLINE_HALO)) map.removeLayer(LYR_COASTLINE_HALO);
      if (map.getSource(SRC_COASTLINE)) map.removeSource(SRC_COASTLINE);
    };
  }, [map, visible]);

  // Handle visibility update
  useEffect(() => {
    if (!map) return;
    const vis = visible ? 'visible' : 'none';
    if (map.getLayer(LYR_COASTLINE_HALO)) {
      map.setLayoutProperty(LYR_COASTLINE_HALO, 'visibility', vis);
    }
    if (map.getLayer(LYR_COASTLINE_CORE)) {
      map.setLayoutProperty(LYR_COASTLINE_CORE, 'visibility', vis);
    }
  }, [map, visible]);

  return null;
};
