import React, { useState, useEffect, useCallback, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import { Plus, Minus, Navigation, Layers } from 'lucide-react';
import { fetchAirIndex, type AirIndexResponse } from './core/api';
import type { AirGridData } from './core/airField';
import { MapContainer, type BasemapType } from './components/MapContainer';
import { AirQualityLayer } from './components/AirQualityLayer';
import { WindParticles } from './components/WindParticles';
import { AirStationsLayer } from './components/AirStationsLayer';
import { HotspotsLayer } from './components/HotspotsLayer';
import { StationDetailCard } from './components/StationDetailCard';
import { TimelinePlayer } from './components/TimelinePlayer';
import { LayerControlDrawer } from './components/LayerControlDrawer';
import { LegendBar } from './components/LegendBar';
import { Header } from './components/Header';
import { InfoModal } from './components/InfoModal';
import { handleMapInspectionClick } from './components/LocationPopup';
import { fetchLiveIqairFeed, getHydratedStations, type HydratedAirStation } from './core/iqair';
import { CoastlineLayer } from './components/CoastlineLayer';
import { CityLabelsLayer } from './components/CityLabelsLayer';

export const App: React.FC = () => {
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const [index, setIndex] = useState<AirIndexResponse | null>(null);
  const [grid, setGrid] = useState<AirGridData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Layer settings
  const [basemap, setBasemap] = useState<BasemapType>('dark');
  const [showLabels, setShowLabels] = useState(true);
  const [stationsVisible, setStationsVisible] = useState(false);
  const [pm25Visible, setPm25Visible] = useState(true);
  const [pm25Opacity, setPm25Opacity] = useState(0.76);
  const [windVisible, setWindVisible] = useState(true);
  const [windSpeedMultiplier, setWindSpeedMultiplier] = useState(1.0);
  const [hotspotsVisible, setHotspotsVisible] = useState(false);
  const [hotspotsCount, setHotspotsCount] = useState(0);

  // Selected station for IQAir detail card
  const [selectedStation, setSelectedStation] = useState<HydratedAirStation | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [infoModalOpen, setInfoModalOpen] = useState(false);

  // Timeline state
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const playTimerRef = useRef<number | null>(null);

  // Load index data on mount
  useEffect(() => {
    let cancelled = false;

    const loadData = async () => {
      try {
        setLoading(true);
        // Sinkronisasi data pembacaan stasiun pemantau IQAir secara live
        await fetchLiveIqairFeed();
        const data = await fetchAirIndex();
        if (cancelled) return;

        setIndex(data);

        // Find closest step to now (or default to recent step)
        const nowMs = Date.now();
        let closestIdx = 0;
        let minDiff = Infinity;

        data.times.forEach((t, i) => {
          const stepMs = Date.parse(`${t}:00Z`);
          const diff = Math.abs(stepMs - nowMs);
          if (diff < minDiff) {
            minDiff = diff;
            closestIdx = i;
          }
        });

        setCurrentStepIndex(closestIdx);
        setLoading(false);
      } catch (err: any) {
        if (!cancelled) {
          console.error(err);
          setError(err?.message || 'Gagal memuat data kualitas udara');
          setLoading(false);
        }
      }
    };

    void loadData();

    // Polling sinkronisasi pembacaan stasiun pemantau IQAir setiap 5 menit secara otomatis
    const syncInterval = window.setInterval(async () => {
      const updated = await fetchLiveIqairFeed();
      if (updated) {
        setGrid((prev) => (prev ? { ...prev } : null));
      }
    }, 5 * 60 * 1000);

    return () => {
      cancelled = true;
      clearInterval(syncInterval);
    };
  }, []);

  // Playback timer loop
  useEffect(() => {
    if (!playing || !index || index.times.length === 0) {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
      return;
    }

    playTimerRef.current = window.setInterval(() => {
      setCurrentStepIndex((prev) => (prev + 1) % index.times.length);
    }, 1800);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [playing, index]);

  // Sinkronisasi data kartu stasiun yang sedang terbuka saat grid CAMS berganti jam
  useEffect(() => {
    if (!selectedStation || !grid) return;
    const freshList = getHydratedStations(grid);
    const updated = freshList.find((s) => s.id === selectedStation.id);
    if (updated) {
      setSelectedStation(updated);
    }
  }, [grid]);

  // Jump to live timestamp
  const handleJumpToLive = useCallback(() => {
    if (!index || index.times.length === 0) return;
    const nowMs = Date.now();
    let closestIdx = 0;
    let minDiff = Infinity;

    index.times.forEach((t, i) => {
      const stepMs = Date.parse(`${t}:00Z`);
      const diff = Math.abs(stepMs - nowMs);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });

    setCurrentStepIndex(closestIdx);
    setPlaying(false);
  }, [index]);

  // Map inspection click handler
  const handleMapClick = useCallback(
    (e: maplibregl.MapMouseEvent) => {
      if (!map) return;
      // Jangan buka popup inspeksi umum jika pengguna mengklik hotspot atau cluster
      try {
        const hotspotFeatures = map.queryRenderedFeatures(e.point, {
          layers: ['sekura-lyr-hotspots-core', 'sekura-lyr-hotspots-halo'].filter((id) =>
            Boolean(map.getLayer(id)),
          ),
        });
        if (hotspotFeatures.length > 0) return;
      } catch {}

      handleMapInspectionClick(e, map, grid);
    },
    [map, grid],
  );

  // Map navigation helpers
  const handleZoomIn = () => map?.zoomIn({ duration: 300 });
  const handleZoomOut = () => map?.zoomOut({ duration: 300 });
  const handleLocateMe = () => {
    if (!navigator.geolocation || !map) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        map.flyTo({
          center: [pos.coords.longitude, pos.coords.latitude],
          zoom: 8,
          duration: 1800,
        });
      },
      (err) => {
        console.warn('Geolocation error:', err);
      },
      { timeout: 8000 },
    );
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {/* Top Header */}
      <Header
        sidebarOpen={sidebarOpen}
        onToggleSidebar={() => setSidebarOpen((v) => !v)}
        onOpenInfo={() => setInfoModalOpen(true)}
      />

      {/* MapLibre Canvas Container */}
      <MapContainer
        basemap={basemap}
        showLabels={showLabels}
        onMapLoaded={setMap}
        onMapClick={handleMapClick}
      >
        {/* PM2.5 GPU CanvasSource Layer */}
        <AirQualityLayer
          map={map}
          index={index}
          currentStepIndex={currentStepIndex}
          opacity={pm25Opacity}
          visible={pm25Visible}
          playing={playing}
          onGridReady={setGrid}
        />

        {/* 60 FPS Wind Vector Particle Simulation */}
        <WindParticles
          map={map}
          grid={grid}
          visible={windVisible}
          speedMultiplier={windSpeedMultiplier}
        />

        {/* Stasiun Pemantau Kualitas Udara (IQAir Outdoor Stations) */}
        <AirStationsLayer
          map={map}
          grid={grid}
          visible={stationsVisible}
          onSelectStation={(station) => {
            setSelectedStation(station);
            setSidebarOpen(false); // Otomatis tutup sidebar agar kartu stasiun tampak jelas
          }}
        />

        {/* Lapisan Garis Pantai & Kontur Pulau Nusantara (High-contrast island boundaries) */}
        <CoastlineLayer map={map} visible={showLabels} />

        {/* Lapisan Label Nama Kota & Ibukota Vektor Presisi (Pontianak selalu tampak) */}
        <CityLabelsLayer map={map} visible={showLabels} />

        {/* Lapisan Titik Panas Karhutla (NASA FIRMS VIIRS 375m) */}
        <HotspotsLayer
          map={map}
          visible={hotspotsVisible}
          onCountChange={setHotspotsCount}
        />
      </MapContainer>

      {/* Kartu Detail Stasiun Kualitas Udara (IQAir Style) */}
      <StationDetailCard
        station={selectedStation}
        onClose={() => setSelectedStation(null)}
      />

      {/* Floating Side Control Drawer */}
      <LayerControlDrawer
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        basemap={basemap}
        onBasemapChange={setBasemap}
        showLabels={showLabels}
        onToggleShowLabels={setShowLabels}
        stationsVisible={stationsVisible}
        onToggleStations={setStationsVisible}
        pm25Visible={pm25Visible}
        onTogglePm25={setPm25Visible}
        pm25Opacity={pm25Opacity}
        onPm25OpacityChange={setPm25Opacity}
        windVisible={windVisible}
        onToggleWind={setWindVisible}
        windSpeedMultiplier={windSpeedMultiplier}
        onWindSpeedMultiplierChange={setWindSpeedMultiplier}
        hotspotsVisible={hotspotsVisible}
        onToggleHotspots={setHotspotsVisible}
        hotspotsCount={hotspotsCount}
      />

      {/* Right Quick Controls (Zoom, Geolocation, Layer Toggle) */}
      <div className="map-quick-controls">
        <button className="quick-btn" onClick={handleZoomIn} title="Perbesar Peta">
          <Plus size={18} />
        </button>
        <button className="quick-btn" onClick={handleZoomOut} title="Perkecil Peta">
          <Minus size={18} />
        </button>
        <button className="quick-btn" onClick={handleLocateMe} title="Pusatkan ke Lokasi Saya">
          <Navigation size={18} />
        </button>
        <button
          className={`quick-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen((v) => !v)}
          title="Pengaturan Lapisan"
        >
          <Layers size={18} />
        </button>
      </div>

      {/* Bottom Left Legend Bar */}
      <LegendBar visible={pm25Visible} />

      {/* Zoom Earth Style Bottom Timeline Player */}
      {index && (
        <TimelinePlayer
          times={index.times}
          currentStepIndex={currentStepIndex}
          playing={playing}
          onStepChange={(idx) => {
            setCurrentStepIndex(idx);
            setPlaying(false);
          }}
          onTogglePlay={() => setPlaying((p) => !p)}
          onJumpToLive={handleJumpToLive}
        />
      )}

      {/* Info & Methodology Modal */}
      <InfoModal open={infoModalOpen} onClose={() => setInfoModalOpen(false)} />

      {/* Loading Glow Indicator */}
      {loading && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 50,
            background: 'rgba(10, 16, 31, 0.88)',
            padding: '18px 24px',
            borderRadius: '16px',
            border: '1px solid rgba(0, 229, 255, 0.4)',
            boxShadow: '0 0 30px rgba(0, 229, 255, 0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            backdropFilter: 'blur(16px)',
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '3px solid rgba(0, 229, 255, 0.2)',
              borderTopColor: '#00e5ff',
              animation: 'radarSweep 0.8s linear infinite',
            }}
          />
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#f8fafc' }}>
            Menghubungkan ke Radar CAMS & NOAA GFS…
          </span>
        </div>
      )}

      {/* Error Banner if any */}
      {error && (
        <div
          style={{
            position: 'absolute',
            bottom: 90,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            background: 'rgba(136, 19, 55, 0.92)',
            padding: '10px 18px',
            borderRadius: '10px',
            color: '#fff',
            fontSize: '0.8rem',
            border: '1px solid #f43f5e',
          }}
        >
          {error}
        </div>
      )}
    </div>
  );
};
