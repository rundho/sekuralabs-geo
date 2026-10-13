import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { AirGridData } from '../core/airField';
import { getHydratedStations, type HydratedAirStation } from '../core/iqair';

interface AirStationsLayerProps {
  map: maplibregl.Map | null;
  grid: AirGridData | null;
  visible: boolean;
  onSelectStation: (station: HydratedAirStation) => void;
}

export const AirStationsLayer: React.FC<AirStationsLayerProps> = ({
  map,
  grid,
  visible,
  onSelectStation,
}) => {
  const markersRef = useRef<maplibregl.Marker[]>([]);

  useEffect(() => {
    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    if (!map || !visible) return;

    const stations = getHydratedStations(grid);

    stations.forEach((station) => {
      const { aqiData } = station;

      // Container luar: MapLibre mengontrol posisi 'translate' pada elemen ini.
      // JANGAN PERNAH mengubah style.transform pada container agar tidak loncat ke (0,0).
      const container = document.createElement('div');
      container.className = 'iqair-marker-container';
      container.style.cssText = 'pointer-events: auto; cursor: pointer;';

      // Elemen dalam (Badge): Efek animasi hover/scale diterapkan pada elemen ini saja
      const badge = document.createElement('div');
      badge.className = 'iqair-marker-badge';
      badge.title = `${station.name} — ${aqiData.aqi} AQI (${aqiData.name})\nPolutan: PM2.5 ${station.currentPm25} µg/m³\nModel: CAMS 0.4° & GFS 10m\n${station.attribution}`;
      badge.style.cssText = `
        display: flex;
        align-items: center;
        justify-content: center;
        min-width: ${aqiData.aqi >= 1000 ? '42px' : '34px'};
        height: 34px;
        padding: 0 6px;
        border-radius: 9999px;
        background-color: ${aqiData.color};
        color: #ffffff;
        font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif;
        font-size: ${aqiData.aqi >= 1000 ? '11px' : '13px'};
        font-weight: 800;
        letter-spacing: ${aqiData.aqi >= 1000 ? '-0.3px' : '0'};
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.65), 0 0 16px ${aqiData.color};
        border: 2px solid rgba(255, 255, 255, 0.95);
        transition: transform 0.18s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.18s ease;
        user-select: none;
      `;
      badge.innerHTML = `<span>${aqiData.aqi}</span>`;

      container.appendChild(badge);

      // Click handler
      container.onclick = (e) => {
        e.stopPropagation();
        onSelectStation(station);
        map.flyTo({
          center: [station.lng, station.lat],
          zoom: Math.max(map.getZoom(), 8.5),
          duration: 1200,
        });
      };

      const marker = new maplibregl.Marker({
        element: container,
        anchor: 'center',
      })
        .setLngLat([station.lng, station.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });

    // Kontrol visibilitas pintar berbasis level zoom:
    // Stasiun kota utama tampil di semua level zoom, sedangkan stasiun lingkungan
    // (misal SMAIT Al-Mumtaz, Untan, dll.) tampil elegan saat peta di-zoom in (zoom >= 9.5).
    const updateZoomVisibility = () => {
      if (!map) return;
      const currentZoom = map.getZoom();
      markersRef.current.forEach((marker, idx) => {
        const station = stations[idx];
        if (!station) return;
        const el = marker.getElement();
        if (station.minZoom && currentZoom < station.minZoom) {
          el.style.display = 'none';
        } else {
          el.style.display = 'block';
        }
      });
    };

    updateZoomVisibility();
    map.on('zoom', updateZoomVisibility);

    return () => {
      map.off('zoom', updateZoomVisibility);
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
    };
  }, [map, grid, visible, onSelectStation]);

  return null;
};
