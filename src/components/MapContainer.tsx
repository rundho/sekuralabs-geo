import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';

export type BasemapType = 'dark' | 'satellite' | 'positron';

interface MapContainerProps {
  basemap: BasemapType;
  showLabels?: boolean;
  onMapLoaded: (map: maplibregl.Map) => void;
  onMapClick?: (e: maplibregl.MapMouseEvent) => void;
  children?: React.ReactNode;
}

/**
 * Konfigurasi Basemap bebas API Key (100% tanpa watermark 'API KEY REQUIRED').
 * Menggunakan Esri Canvas & Imagery dengan layer referensi label kota & batas wilayah terpisah.
 */
export const BASEMAP_CONFIGS: Record<
  BasemapType,
  {
    baseTile: string;
    labelsTile: string;
    attribution: string;
  }
> = {
  dark: {
    baseTile:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labelsTile:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, Natural Earth',
  },
  satellite: {
    baseTile:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    labelsTile:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
  },
  positron: {
    baseTile:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    labelsTile:
      'https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ',
  },
};

export function buildMapStyle(
  type: BasemapType,
  showLabels = true,
): maplibregl.StyleSpecification {
  const cfg = BASEMAP_CONFIGS[type];
  return {
    version: 8,
    sources: {
      'basemap-base-source': {
        type: 'raster',
        tiles: [cfg.baseTile],
        tileSize: 256,
        attribution: cfg.attribution,
      },
      'basemap-labels-source': {
        type: 'raster',
        tiles: [cfg.labelsTile],
        tileSize: 256,
      },
    },
    layers: [
      {
        id: 'basemap-base',
        type: 'raster',
        source: 'basemap-base-source',
        minzoom: 0,
        maxzoom: 19,
      },
      {
        id: 'basemap-labels',
        type: 'raster',
        source: 'basemap-labels-source',
        minzoom: 0,
        maxzoom: 19,
        layout: {
          visibility: showLabels ? 'visible' : 'none',
        },
      },
    ],
  };
}

export const MapContainer: React.FC<MapContainerProps> = ({
  basemap,
  showLabels = true,
  onMapLoaded,
  onMapClick,
  children,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<maplibregl.Map | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: buildMapStyle(basemap, showLabels),
      center: [118.0, -1.2], // Centered at Indonesia / Nusantara
      zoom: 4.8,
      minZoom: 3,
      maxZoom: 16,
      pitchWithRotate: false,
      dragRotate: false,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        compact: true,
      }),
      'bottom-right',
    );

    map.on('load', () => {
      mapInstanceRef.current = map;
      onMapLoaded(map);
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update style when basemap changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    map.setStyle(buildMapStyle(basemap, showLabels));
  }, [basemap, showLabels]);

  // Click listener
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !onMapClick) return;

    map.on('click', onMapClick);
    return () => {
      map.off('click', onMapClick);
    };
  }, [onMapClick]);

  return (
    <div className="map-viewport" ref={mapContainerRef}>
      {children}
    </div>
  );
};
