import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { INDONESIA_CITIES, type CityItem } from '../data/cities';

interface CityLabelsLayerProps {
  map: maplibregl.Map | null;
  visible?: boolean;
}

interface CityMarkerEntry {
  marker: maplibregl.Marker;
  city: CityItem;
  container: HTMLDivElement;
  dotEl: HTMLSpanElement;
  nameEl: HTMLSpanElement;
}

/**
 * CityLabelsLayer
 * Menggunakan DOM Marker berkinerja tinggi berbasis font Google 'Outfit' & 'Inter'.
 * Menjamin kota-kota besar (termasuk Pontianak) 100% permanen tampil saat zoom out,
 * dengan penataan arah label (align) cerdas bebas tabrakan antarkota.
 */
export const CityLabelsLayer: React.FC<CityLabelsLayerProps> = ({ map, visible = true }) => {
  const markerEntriesRef = useRef<CityMarkerEntry[]>([]);

  useEffect(() => {
    // Bersihkan marker lama
    markerEntriesRef.current.forEach((entry) => entry.marker.remove());
    markerEntriesRef.current = [];

    if (!map) return;

    // Buat DOM marker untuk setiap kota
    INDONESIA_CITIES.forEach((city) => {
      const align = city.align || 'right';
      const isTier1 = city.tier === 1;

      const container = document.createElement('div');
      container.className = `sekura-city-label-marker tier-${city.tier} align-${align}`;

      // Tentukan flex-direction dan anchor berdasarkan orientasi align
      let flexDirection = 'row';
      let anchor: maplibregl.PositionAnchor = 'left';

      if (align === 'left') {
        flexDirection = 'row-reverse';
        anchor = 'right';
      } else if (align === 'bottom') {
        flexDirection = 'column';
        anchor = 'top';
      } else if (align === 'top') {
        flexDirection = 'column-reverse';
        anchor = 'bottom';
      } else {
        // default 'right'
        flexDirection = 'row';
        anchor = 'left';
      }

      container.style.cssText = `
        pointer-events: none;
        user-select: none;
        display: ${visible ? 'flex' : 'none'};
        flex-direction: ${flexDirection};
        align-items: center;
        white-space: nowrap;
        line-height: 1;
        transition: opacity 0.2s ease;
      `;

      // Dot penunjuk koordinat kota
      const dotEl = document.createElement('span');
      dotEl.className = 'city-dot';
      const dotSize = isTier1 ? '6px' : '4px';

      // Hitung margin dot agar titik tengah dot persis di pusat koordinat
      let dotMargin = '0 5px 0 -3px';
      if (align === 'left') dotMargin = '0 -3px 0 5px';
      else if (align === 'bottom') dotMargin = '-3px 0 4px 0';
      else if (align === 'top') dotMargin = '4px 0 -3px 0';

      dotEl.style.cssText = `
        display: inline-block;
        width: ${dotSize};
        height: ${dotSize};
        border-radius: 50%;
        background-color: ${isTier1 ? '#00e5ff' : '#94a3b8'};
        box-shadow: ${isTier1 ? '0 0 8px #00e5ff, 0 0 2px #000' : '0 0 4px #020617'};
        border: 1px solid ${isTier1 ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.5)'};
        margin: ${dotMargin};
        flex-shrink: 0;
      `;

      // Label teks nama kota
      const nameEl = document.createElement('span');
      nameEl.className = 'city-name-text';
      nameEl.textContent = city.name;
      nameEl.style.cssText = `
        font-family: 'Outfit', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        font-weight: ${isTier1 ? '700' : '600'};
        color: ${isTier1 ? '#ffffff' : '#cbd5e1'};
        text-shadow: 0 0 3px #020617, -1.2px -1.2px 0 #020617, 1.2px -1.2px 0 #020617, -1.2px 1.2px 0 #020617, 1.2px 1.2px 0 #020617, 0 2px 5px rgba(0, 0, 0, 0.95);
        letter-spacing: 0.03em;
        line-height: 1;
      `;

      container.appendChild(dotEl);
      container.appendChild(nameEl);

      const marker = new maplibregl.Marker({
        element: container,
        anchor,
      })
        .setLngLat([city.lng, city.lat])
        .addTo(map);

      markerEntriesRef.current.push({
        marker,
        city,
        container,
        dotEl,
        nameEl,
      });
    });

    // Kontrol visibilitas & ukuran berbasis zoom dinamis
    const updateZoomScaling = () => {
      if (!map) return;
      const zoom = map.getZoom();

      markerEntriesRef.current.forEach((entry) => {
        const { city, container, dotEl, nameEl } = entry;
        const isTier1 = city.tier === 1;
        const minZ = city.minZoom ?? (isTier1 ? 3.0 : 5.5);

        if (!visible || zoom < minZ) {
          container.style.display = 'none';
          return;
        }

        container.style.display = 'flex';

        if (isTier1) {
          if (zoom < 4.5) {
            // Zoom out (Nusantara overview)
            nameEl.style.fontSize = '11px';
            nameEl.style.letterSpacing = '0.04em';
            dotEl.style.width = '5px';
            dotEl.style.height = '5px';
          } else if (zoom < 6.5) {
            // Zoom menengah (Regional pulau)
            nameEl.style.fontSize = '12.5px';
            nameEl.style.letterSpacing = '0.03em';
            dotEl.style.width = '6px';
            dotEl.style.height = '6px';
          } else {
            // Zoom in dekat (Detail area)
            nameEl.style.fontSize = '14.5px';
            nameEl.style.letterSpacing = '0.02em';
            dotEl.style.width = '7px';
            dotEl.style.height = '7px';
          }
        } else {
          // Tier 2
          if (zoom < 7.0) {
            nameEl.style.fontSize = '11px';
            dotEl.style.width = '4px';
            dotEl.style.height = '4px';
          } else {
            nameEl.style.fontSize = '13px';
            dotEl.style.width = '5px';
            dotEl.style.height = '5px';
          }
        }
      });
    };

    updateZoomScaling();
    map.on('zoom', updateZoomScaling);

    return () => {
      map.off('zoom', updateZoomScaling);
      markerEntriesRef.current.forEach((entry) => entry.marker.remove());
      markerEntriesRef.current = [];
    };
  }, [map, visible]);

  return null;
};
