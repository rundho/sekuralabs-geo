import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { fetchHotspotsFeed, hotspotsToGeoJSON } from '../core/hotspots';

interface HotspotsLayerProps {
  map: maplibregl.Map | null;
  visible: boolean;
  onCountChange?: (count: number) => void;
}

const SRC_HOTSPOTS = 'sekura-src-hotspots';
const LYR_EMBER_HALO = 'sekura-lyr-hotspots-halo';
const LYR_EMBER_CORE = 'sekura-lyr-hotspots-core';

export const HotspotsLayer: React.FC<HotspotsLayerProps> = ({
  map,
  visible,
  onCountChange,
}) => {
  const popupRef = useRef<maplibregl.Popup | null>(null);

  useEffect(() => {
    if (!map) return;

    let cancelled = false;

    const initHotspots = async () => {
      const feed = await fetchHotspotsFeed();
      if (cancelled || !map) return;

      if (onCountChange) {
        onCountChange(feed.count);
      }

      const geojson = hotspotsToGeoJSON(feed.hotspots);

      if (map.getSource(SRC_HOTSPOTS)) {
        const src = map.getSource(SRC_HOTSPOTS) as maplibregl.GeoJSONSource;
        src.setData(geojson);
        return;
      }

      // GeoJSON Source langsung tanpa clustering pizza-bubble dan tanpa heatmap blur tebal
      map.addSource(SRC_HOTSPOTS, {
        type: 'geojson',
        data: geojson,
      });

      const beforeId = map.getLayer('basemap-labels') ? 'basemap-labels' : undefined;

      // 1. Halo Pendaran Panas (Soft Radial Thermal Glow di sekeliling setiap titik api)
      map.addLayer(
        {
          id: LYR_EMBER_HALO,
          type: 'circle',
          source: SRC_HOTSPOTS,
          layout: { visibility: visible ? 'visible' : 'none' },
          paint: {
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'frp'],
              1, '#f97316',
              15, '#ea580c',
              50, '#dc2626',
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 3.2,
              6, 5.5,
              10, 9.0,
              14, 16.0,
            ],
            'circle-blur': 0.75,
            'circle-opacity': 0.55,
          },
        },
        beforeId,
      );

      // 2. Inti Bara Api (Crisp Fire Spark / Ember Dot - Presisi, Tajam & Estetis)
      map.addLayer(
        {
          id: LYR_EMBER_CORE,
          type: 'circle',
          source: SRC_HOTSPOTS,
          layout: { visibility: visible ? 'visible' : 'none' },
          paint: {
            'circle-color': [
              'interpolate',
              ['linear'],
              ['get', 'frp'],
              1, '#f59e0b',
              10, '#ea580c',
              40, '#dc2626',
              100, '#b91c1c',
            ],
            'circle-radius': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 1.4,
              6, 2.6,
              10, 4.2,
              14, 7.0,
            ],
            'circle-stroke-width': [
              'interpolate',
              ['linear'],
              ['zoom'],
              3, 0.4,
              7, 0.9,
              12, 1.4,
            ],
            'circle-stroke-color': '#ffffff',
            'circle-opacity': 0.95,
          },
        },
        beforeId,
      );

      // Event Klik Titik Api: Buka Kartu Popup Detail
      const handleHotspotClick = (e: maplibregl.MapLayerMouseEvent) => {
        if (!e.features || !e.features[0]) return;
        const f = e.features[0];
        const props = f.properties || {};
        const coords = (f.geometry as GeoJSON.Point).coordinates;

        if (popupRef.current) popupRef.current.remove();

        const confidenceBadge =
          props.confidence === 'high'
            ? '<span style="color:#ef4444;font-weight:700;">Tinggi (High)</span>'
            : props.confidence === 'low'
            ? '<span style="color:#eab308;font-weight:700;">Rendah (Low)</span>'
            : '<span style="color:#f97316;font-weight:700;">Sedang (Nominal)</span>';

        const popupHtml = `
          <div style="
            font-family:'Outfit',-apple-system,BlinkMacSystemFont,sans-serif;
            padding:12px 14px;
            background:rgba(15,23,42,0.95);
            backdrop-filter:blur(16px);
            border-radius:12px;
            border:1px solid rgba(239,68,68,0.4);
            color:#fff;
            box-shadow:0 12px 30px rgba(0,0,0,0.8), 0 0 16px rgba(239,68,68,0.25);
            min-width:230px;
          ">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;">
              <span style="font-size:1.1rem;">🔥</span>
              <div style="font-weight:800;font-size:0.92rem;color:#f87171;">Titik Panas Karhutla</div>
            </div>
            <div style="font-size:0.75rem;display:flex;flex-direction:column;gap:5px;color:#cbd5e1;">
              <div><strong>Daya Radiasi (FRP):</strong> <span style="color:#f59e0b;font-weight:700;">${props.frp} MW</span></div>
              <div><strong>Suhu Sensor:</strong> <span>${props.brightness}°C</span></div>
              <div><strong>Waktu Deteksi:</strong> <span>${props.acqDate} · ${props.timeFormatted}</span></div>
              <div><strong>Waktu Melintas:</strong> <span>${props.daynight}</span></div>
              <div><strong>Keyakinan:</strong> ${confidenceBadge}</div>
              <div style="margin-top:4px;padding-top:4px;border-top:1px solid rgba(255,255,255,0.1);font-size:0.68rem;color:#94a3b8;">
                Satelit: <strong>${props.satellite}</strong>
              </div>
            </div>
          </div>
        `;

        const popup = new maplibregl.Popup({
          closeButton: true,
          closeOnClick: true,
          className: 'geo-hotspot-popup',
          maxWidth: '280px',
        })
          .setLngLat([coords[0], coords[1]])
          .setHTML(popupHtml)
          .addTo(map);

        popupRef.current = popup;
      };

      map.on('click', LYR_EMBER_CORE, handleHotspotClick);
      map.on('click', LYR_EMBER_HALO, handleHotspotClick);

      // Hover Pointer Cursor
      const setPointer = () => (map.getCanvas().style.cursor = 'pointer');
      const resetCursor = () => (map.getCanvas().style.cursor = '');

      map.on('mouseenter', LYR_EMBER_CORE, setPointer);
      map.on('mouseleave', LYR_EMBER_CORE, resetCursor);
      map.on('mouseenter', LYR_EMBER_HALO, setPointer);
      map.on('mouseleave', LYR_EMBER_HALO, resetCursor);
    };

    void initHotspots();

    return () => {
      cancelled = true;
      if (popupRef.current) popupRef.current.remove();
    };
  }, [map]);

  // Update visibilitas layer dinamis
  useEffect(() => {
    if (!map) return;
    const lyrIds = [LYR_EMBER_HALO, LYR_EMBER_CORE];

    lyrIds.forEach((id) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', visible ? 'visible' : 'none');
      }
    });

    if (!visible && popupRef.current) {
      popupRef.current.remove();
    }
  }, [map, visible]);

  return null;
};
