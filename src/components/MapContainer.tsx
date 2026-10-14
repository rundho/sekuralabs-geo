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

/**
 * Bangun style tunggal yang menyertakan semua raster source basemap (Dark, Satellite, Positron).
 * Mengganti basemap cukup dengan toggle layer visibility tanpa mereset style dokumen,
 * sehingga lapisan kustom (Hotspot Karhutla, Asap PM2.5, Garis Pantai, Angin) TIDAK AKAN HILANG.
 */
export function buildMapStyle(initialBasemap: BasemapType = 'dark'): maplibregl.StyleSpecification {
  return {
    version: 8,
    glyphs:
      'https://cdn.jsdelivr.net/gh/kylebarron/openmaptiles-fonts/fonts/{fontstack}/{range}.pbf',
    sources: {
      'basemap-base-dark-source': {
        type: 'raster',
        tiles: [BASEMAP_CONFIGS.dark.baseTile],
        tileSize: 256,
        attribution: BASEMAP_CONFIGS.dark.attribution,
      },
      'basemap-base-satellite-source': {
        type: 'raster',
        tiles: [BASEMAP_CONFIGS.satellite.baseTile],
        tileSize: 256,
        attribution: BASEMAP_CONFIGS.satellite.attribution,
      },
      'basemap-base-positron-source': {
        type: 'raster',
        tiles: [BASEMAP_CONFIGS.positron.baseTile],
        tileSize: 256,
        attribution: BASEMAP_CONFIGS.positron.attribution,
      },
    },
    layers: [
      {
        id: 'basemap-base-dark',
        type: 'raster',
        source: 'basemap-base-dark-source',
        minzoom: 0,
        maxzoom: 19,
        layout: {
          visibility: initialBasemap === 'dark' ? 'visible' : 'none',
        },
      },
      {
        id: 'basemap-base-satellite',
        type: 'raster',
        source: 'basemap-base-satellite-source',
        minzoom: 0,
        maxzoom: 19,
        layout: {
          visibility: initialBasemap === 'satellite' ? 'visible' : 'none',
        },
      },
      {
        id: 'basemap-base-positron',
        type: 'raster',
        source: 'basemap-base-positron-source',
        minzoom: 0,
        maxzoom: 19,
        layout: {
          visibility: initialBasemap === 'positron' ? 'visible' : 'none',
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
      style: buildMapStyle(basemap),
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

  // Update visibilitas basemap instan (0ms) tanpa memanggil map.setStyle()
  // Ini mencegah layer lain (Hotspots, Asap PM2.5, Garis Pantai) terhapus/hilang saat ganti basemap
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const basemapLayers: { id: string; type: BasemapType }[] = [
      { id: 'basemap-base-dark', type: 'dark' },
      { id: 'basemap-base-satellite', type: 'satellite' },
      { id: 'basemap-base-positron', type: 'positron' },
    ];

    basemapLayers.forEach(({ id, type }) => {
      if (map.getLayer(id)) {
        map.setLayoutProperty(id, 'visibility', basemap === type ? 'visible' : 'none');
      }
    });
  }, [basemap]);

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
