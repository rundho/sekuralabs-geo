import React, { useEffect } from 'react';
import type maplibregl from 'maplibre-gl';

interface CityLabelsLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

const SRC_CITIES = 'sekura-src-cities';
const LYR_CITY_DOTS = 'sekura-lyr-city-dots';
const LYR_CITY_LABELS_T1 = 'sekura-lyr-city-labels-t1';
const LYR_CITY_LABELS_T2 = 'sekura-lyr-city-labels-t2';

export const CityLabelsLayer: React.FC<CityLabelsLayerProps> = ({ map, visible = true }) => {
  useEffect(() => {
    if (!map) return;

    const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
    const dataUrl = `${base}/data/cities_id.json`;

    const addCities = () => {
      if (map.getSource(SRC_CITIES)) return;

      map.addSource(SRC_CITIES, {
        type: 'geojson',
        data: dataUrl,
      });

      // 1. Titik koordinat kota (Cyan radar pulse dot)
      map.addLayer({
        id: LYR_CITY_DOTS,
        type: 'circle',
        source: SRC_CITIES,
        layout: {
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'circle-radius': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 2.8,
            6, 3.6,
            9, 4.5,
          ],
          'circle-color': [
            'case',
            ['==', ['get', 'tier'], 1],
            '#00e5ff', // Cyan neon untuk kota utama/ibukota (Pontianak, Jakarta, dll)
            '#94a3b8', // Slate untuk kota pendukung
          ],
          'circle-stroke-width': 1.8,
          'circle-stroke-color': '#020617',
          'circle-opacity': 1.0,
        },
      });

      // 2. Label Teks Tier 1: Ibukota provinsi & kota besar (Pontianak, dll)
      // Selalu terlihat dari zoom paling jauh (minzoom 3.0), tidak akan hilang saat zoom out!
      map.addLayer({
        id: LYR_CITY_LABELS_T1,
        type: 'symbol',
        source: SRC_CITIES,
        filter: ['==', ['get', 'tier'], 1],
        minzoom: 3.0,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Bold'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            3.5, 12.0,
            5, 13.5,
            7, 15.0,
            10, 17.5,
          ],
          'text-offset': [0, 0.8],
          'text-anchor': 'top',
          'text-letter-spacing': 0.04,
          'text-allow-overlap': true, // Ibukota utama seperti Pontianak selalu tampil, tidak di-hide oleh tabrakan
          'text-ignore-placement': true,
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'text-color': '#ffffff', // Putih bersih terang
          'text-halo-color': '#020617', // Shadow outline hitam pekat tebal agar terbaca jelas di atas asap
          'text-halo-width': 3.0,
          'text-halo-blur': 0.2,
        },
      });

      // 3. Label Teks Tier 2: Kota berkembang & penyangga (Singkawang, Ketapang, dll)
      // Muncul otomatis saat peta mulai di-zoom in (minzoom 5.5)
      map.addLayer({
        id: LYR_CITY_LABELS_T2,
        type: 'symbol',
        source: SRC_CITIES,
        filter: ['==', ['get', 'tier'], 2],
        minzoom: 5.5,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Open Sans Regular'],
          'text-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            5.5, 10.5,
            7, 12.0,
            10, 14.0,
          ],
          'text-offset': [0, 0.7],
          'text-anchor': 'top',
          'text-letter-spacing': 0.02,
          'text-allow-overlap': false,
          visibility: visible ? 'visible' : 'none',
        },
        paint: {
          'text-color': '#e2e8f0',
          'text-halo-color': '#030712',
          'text-halo-width': 2.0,
        },
      });

      // Pastikan layer label nama kota selalu diposisikan di paling atas
      if (map.getLayer(LYR_CITY_DOTS)) map.moveLayer(LYR_CITY_DOTS);
      if (map.getLayer(LYR_CITY_LABELS_T2)) map.moveLayer(LYR_CITY_LABELS_T2);
      if (map.getLayer(LYR_CITY_LABELS_T1)) map.moveLayer(LYR_CITY_LABELS_T1);
    };

    if (map.isStyleLoaded()) {
      addCities();
    } else {
      map.once('style.load', addCities);
    }

    return () => {
      if (map.getLayer(LYR_CITY_LABELS_T2)) map.removeLayer(LYR_CITY_LABELS_T2);
      if (map.getLayer(LYR_CITY_LABELS_T1)) map.removeLayer(LYR_CITY_LABELS_T1);
      if (map.getLayer(LYR_CITY_DOTS)) map.removeLayer(LYR_CITY_DOTS);
      if (map.getSource(SRC_CITIES)) map.removeSource(SRC_CITIES);
    };
  }, [map, visible]);

  // Handle visibility toggle
  useEffect(() => {
    if (!map) return;
    const vis = visible ? 'visible' : 'none';
    if (map.getLayer(LYR_CITY_DOTS)) map.setLayoutProperty(LYR_CITY_DOTS, 'visibility', vis);
    if (map.getLayer(LYR_CITY_LABELS_T1)) map.setLayoutProperty(LYR_CITY_LABELS_T1, 'visibility', vis);
    if (map.getLayer(LYR_CITY_LABELS_T2)) map.setLayoutProperty(LYR_CITY_LABELS_T2, 'visibility', vis);
  }, [map, visible]);

  return null;
};
