import React from 'react';
import { Wind, CloudRain, Flame, Radio, Moon, Globe, Sun, X, Sliders, MapPin, Satellite, Clock, Play } from 'lucide-react';
import type { BasemapType } from './MapContainer';
import {
  type SatelliteMode,
  type SatelliteAnimationSpeed,
  type SatelliteLoopDuration,
  type SatelliteAnimationStyle,
  SATELLITE_MODES,
  SATELLITE_DURATIONS,
  SATELLITE_SPEED_CONFIGS,
} from '../core/satellite';

interface LayerControlDrawerProps {
  open: boolean;
  onClose: () => void;
  basemap: BasemapType;
  onBasemapChange: (bm: BasemapType) => void;
  showLabels: boolean;
  onToggleShowLabels: (show: boolean) => void;
  stationsVisible: boolean;
  onToggleStations: (v: boolean) => void;
  pm25Visible: boolean;
  onTogglePm25: (v: boolean) => void;
  pm25Opacity: number;
  onPm25OpacityChange: (op: number) => void;
  windVisible: boolean;
  onToggleWind: (v: boolean) => void;
  windSpeedMultiplier: number;
  onWindSpeedMultiplierChange: (spd: number) => void;
  hotspotsVisible: boolean;
  onToggleHotspots: (v: boolean) => void;
  hotspotsCount?: number;
  satelliteVisible: boolean;
  onToggleSatellite: (v: boolean) => void;
  satelliteOpacity: number;
  onSatelliteOpacityChange: (op: number) => void;
  satelliteMode: SatelliteMode;
  onSatelliteModeChange: (mode: SatelliteMode) => void;
  satelliteLoopActive: boolean;
  onToggleSatelliteLoop: (loop: boolean) => void;
  satelliteSpeed?: SatelliteAnimationSpeed;
  onSatelliteSpeedChange?: (speed: SatelliteAnimationSpeed) => void;
  satelliteDuration?: SatelliteLoopDuration;
  onSatelliteDurationChange?: (hours: SatelliteLoopDuration) => void;
  satelliteStyle?: SatelliteAnimationStyle;
  onSatelliteStyleChange?: (style: SatelliteAnimationStyle) => void;
}

export const LayerControlDrawer: React.FC<LayerControlDrawerProps> = ({
  open,
  onClose,
  basemap,
  onBasemapChange,
  showLabels,
  onToggleShowLabels,
  stationsVisible,
  onToggleStations,
  pm25Visible,
  onTogglePm25,
  pm25Opacity,
  onPm25OpacityChange,
  windVisible,
  onToggleWind,
  windSpeedMultiplier,
  onWindSpeedMultiplierChange,
  hotspotsVisible,
  onToggleHotspots,
  hotspotsCount,
  satelliteVisible,
  onToggleSatellite,
  satelliteOpacity,
  onSatelliteOpacityChange,
  satelliteMode,
  onSatelliteModeChange,
  satelliteLoopActive,
  onToggleSatelliteLoop,
  satelliteSpeed = 'medium',
  onSatelliteSpeedChange,
  satelliteDuration = 3,
  onSatelliteDurationChange,
  satelliteStyle = 'smooth',
  onSatelliteStyleChange,
}) => {
  return (
    <aside className={`geo-sidebar ${open ? '' : 'collapsed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-title">
          <Sliders size={16} color="#00e5ff" />
          <span>Pengaturan Peta & Lapisan</span>
        </div>
        <button className="icon-btn" onClick={onClose} title="Tutup Menu">
          <X size={16} />
        </button>
      </div>

      <div className="sidebar-content">
        {/* Basemap Selection */}
        <div>
          <div className="section-label">PETA DASAR (BASEMAP)</div>
          <div className="basemap-grid">
            <button
              className={`basemap-btn ${basemap === 'dark' ? 'active' : ''}`}
              onClick={() => onBasemapChange('dark')}
            >
              <Moon size={14} />
              <span>Mode Gelap</span>
            </button>
            <button
              className={`basemap-btn ${basemap === 'satellite' ? 'active' : ''}`}
              onClick={() => onBasemapChange('satellite')}
            >
              <Globe size={14} />
              <span>Satelit Esri</span>
            </button>
            <button
              className={`basemap-btn ${basemap === 'positron' ? 'active' : ''}`}
              onClick={() => onBasemapChange('positron')}
              style={{ gridColumn: 'span 2' }}
            >
              <Sun size={14} />
              <span>Mode Terang (Positron)</span>
            </button>
          </div>
        </div>

        {/* Labels & Boundaries Toggle */}
        <div>
          <div className="section-label">BATAS & NAMA WILAYAH</div>
          <div className="layer-card">
            <div className="layer-head">
              <div className="layer-info">
                <div className="layer-icon-box" style={{ background: 'rgba(0, 229, 255, 0.15)', color: '#00e5ff' }}>
                  <MapPin size={18} />
                </div>
                <div className="layer-text">
                  <h4>Nama Kota & Batas Wilayah</h4>
                  <p>Kota, pulau, batas negara & provinsi</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={showLabels}
                  onChange={(e) => onToggleShowLabels(e.target.checked)}
                />
                <span className="slider-toggle" />
              </label>
            </div>
          </div>
        </div>

        {/* Active Layer: Udara & Asap (PM2.5 + Angin) */}
        <div>
          <div className="section-label">LAPISAN AKTIF (V1.0)</div>

          <div className="layer-card">
            <div className="layer-head">
              <div className="layer-info">
                <div className="layer-icon-box">
                  <Wind size={18} />
                </div>
                <div className="layer-text">
                  <h4>Udara & Asap (PM2.5)</h4>
                  <p>Model CAMS ~0.4° Bicubic</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={pm25Visible}
                  onChange={(e) => onTogglePm25(e.target.checked)}
                />
                <span className="slider-toggle" />
              </label>
            </div>

            {pm25Visible && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div className="control-row">
                  <span>Opasitas Asap (PM2.5):</span>
                  <span>{Math.round(pm25Opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={0.2}
                  max={1.0}
                  step={0.05}
                  value={pm25Opacity}
                  onChange={(e) => onPm25OpacityChange(parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="layer-card" style={{ marginTop: 10 }}>
            <div className="layer-head">
              <div className="layer-info">
                <div className="layer-icon-box" style={{ background: 'rgba(16, 185, 129, 0.15)', color: '#10b981' }}>
                  <Radio size={18} />
                </div>
                <div className="layer-text">
                  <h4>Aliran Angin 10m</h4>
                  <p>5.000 partikel vektor GFS</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={windVisible}
                  onChange={(e) => onToggleWind(e.target.checked)}
                />
                <span className="slider-toggle" />
              </label>
            </div>

            {windVisible && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 4 }}>
                <div className="control-row">
                  <span>Kecepatan Aliran:</span>
                  <span>{windSpeedMultiplier}x</span>
                </div>
                <input
                  type="range"
                  className="range-slider"
                  min={0.5}
                  max={2.5}
                  step={0.25}
                  value={windSpeedMultiplier}
                  onChange={(e) => onWindSpeedMultiplierChange(parseFloat(e.target.value))}
                />
              </div>
            )}
          </div>

          <div className="layer-card" style={{ marginTop: 10 }}>
            <div className="layer-head">
              <div className="layer-info">
                <div className="layer-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <Radio size={18} />
                </div>
                <div className="layer-text">
                  <h4>Stasiun Kualitas Udara</h4>
                  <p>Sampling Model CAMS di titik stasiun darat</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={stationsVisible}
                  onChange={(e) => onToggleStations(e.target.checked)}
                />
                <span className="slider-toggle" />
              </label>
            </div>
          </div>

          {/* Active Layer: Titik Panas Karhutla (NASA FIRMS VIIRS 375m) */}
          <div className="layer-card" style={{ marginTop: 10 }}>
            <div
              className="layer-head"
              style={{ cursor: 'pointer' }}
              onClick={() => onToggleHotspots(!hotspotsVisible)}
            >
              <div className="layer-info">
                <div className="layer-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <Flame size={18} />
                </div>
                <div className="layer-text">
                  <h4>Titik Panas Karhutla</h4>
                  <p>Satelit NASA VIIRS 375m (24 Jam NRT)</p>
                </div>
              </div>
              <label className="switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  id="toggle-hotspots"
                  checked={hotspotsVisible}
                  onChange={(e) => onToggleHotspots(e.target.checked)}
                />
                <span className="slider-toggle" />
              </label>
            </div>

            {hotspotsVisible && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: 2,
                  padding: '6px 10px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  borderRadius: '8px',
                  border: '1px solid rgba(239, 68, 68, 0.25)',
                  fontSize: '0.74rem',
                }}
              >
                <span style={{ color: '#94a3b8' }}>Status Deteksi:</span>
                <span
                  style={{
                    color: '#f87171',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  🔥 {hotspotsCount ? `${hotspotsCount.toLocaleString()} Titik Aktif` : 'Memuat data...'}
                </span>
              </div>
            )}
          </div>
          {/* Active Layer: Citra Satelit Awan & Asap (JMA Himawari-9 / NASA GIBS) */}
          <div className="layer-card" style={{ marginTop: 10 }}>
            <div
              className="layer-head"
              style={{ cursor: 'pointer' }}
              onClick={() => onToggleSatellite(!satelliteVisible)}
            >
              <div className="layer-info">
                <div className="layer-icon-box" style={{ background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8' }}>
                  <Satellite size={18} />
                </div>
                <div className="layer-text">
                  <h4>Satelit Awan & Asap</h4>
                  <p>Himawari-9 Live 10m (JMA / NASA)</p>
                </div>
              </div>
              <label className="switch" onClick={(e) => e.stopPropagation()}>
                <input
                  type="checkbox"
                  id="toggle-satellite"
                  checked={satelliteVisible}
                  onChange={(e) => onToggleSatellite(e.target.checked)}
                />
                <span className="slider-toggle" />
              </label>
            </div>

            {satelliteVisible && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
                {/* Opasitas Slider */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div className="control-row">
                    <span>Opasitas Citra Satelit:</span>
                    <span>{Math.round(satelliteOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    className="range-slider"
                    min={0.1}
                    max={1.0}
                    step={0.05}
                    value={satelliteOpacity}
                    onChange={(e) => onSatelliteOpacityChange(parseFloat(e.target.value))}
                  />
                </div>

                {/* Pemilihan Mode Spektral Satelit */}
                <div>
                  <div className="control-row" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                      MODE SPEKTRAL SATELIT
                    </span>
                  </div>
                  <div className="satellite-mode-grid">
                    {SATELLITE_MODES.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`satellite-mode-btn ${satelliteMode === opt.id ? 'active' : ''}`}
                        onClick={() => onSatelliteModeChange(opt.id)}
                        title={opt.description}
                      >
                        <span className="satellite-mode-name">{opt.label}</span>
                        <span className="satellite-mode-badge">{opt.badge}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Toggle Mode Linimasa: Garis Waktu Utama vs Loop 10-Menit Zoom Earth */}
                <div>
                  <div className="control-row" style={{ marginBottom: 4 }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                      KONTROL LINIMASA PEMUTAR
                    </span>
                  </div>
                  <div className="timeline-mode-toggle">
                    <button
                      type="button"
                      className={`timeline-mode-btn ${!satelliteLoopActive ? 'active' : ''}`}
                      onClick={() => onToggleSatelliteLoop(false)}
                      title="Garis waktu mengikuti model udara CAMS (per jam)"
                    >
                      <Clock size={13} />
                      <span>Sinkron Utama</span>
                    </button>
                    <button
                      type="button"
                      className={`timeline-mode-btn ${satelliteLoopActive ? 'active' : ''}`}
                      onClick={() => onToggleSatelliteLoop(true)}
                      title="Animasi cepat interval 10 menit (3 jam terakhir, Zoom Earth style)"
                    >
                      <Play size={13} />
                      <span>Loop 10-Menit</span>
                    </button>
                  </div>
                </div>

                {/* Pengaturan Animasi Satelit Lengkap (Persis Zoom Earth) */}
                {satelliteLoopActive && (
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                      marginTop: 6,
                      padding: '10px 12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      borderRadius: '10px',
                      border: '1px solid rgba(255, 255, 255, 0.07)',
                    }}
                  >
                    {/* Kecepatan Animasi */}
                    <div className="satellite-setting-group">
                      <div className="satellite-setting-label">
                        <span>KECEPATAN ANIMASI</span>
                        <span style={{ color: '#00e5ff', textTransform: 'capitalize' }}>
                          {SATELLITE_SPEED_CONFIGS[satelliteSpeed || 'medium'].label}
                        </span>
                      </div>
                      <div className="setting-segment">
                        {(['slow', 'medium', 'fast'] as SatelliteAnimationSpeed[]).map((spd) => (
                          <button
                            key={spd}
                            type="button"
                            className={`setting-segment-btn ${satelliteSpeed === spd ? 'active' : ''}`}
                            onClick={() => onSatelliteSpeedChange?.(spd)}
                          >
                            {SATELLITE_SPEED_CONFIGS[spd].label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Rentang Durasi Loop Satelit */}
                    <div className="satellite-setting-group">
                      <div className="satellite-setting-label">
                        <span>RENTANG LOOP SATELIT</span>
                        <span style={{ color: '#00e5ff' }}>{satelliteDuration || 3} Jam</span>
                      </div>
                      <div className="setting-segment">
                        {SATELLITE_DURATIONS.map((dur) => (
                          <button
                            key={dur.hours}
                            type="button"
                            className={`setting-segment-btn ${satelliteDuration === dur.hours ? 'active' : ''}`}
                            onClick={() => onSatelliteDurationChange?.(dur.hours)}
                          >
                            {dur.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Gaya Animasi Satelit (Mulus vs Cepat) */}
                    <div className="satellite-setting-group">
                      <div className="satellite-setting-label">
                        <span>GAYA ANIMASI SATELIT</span>
                        <span style={{ color: '#00e5ff' }}>
                          {satelliteStyle === 'smooth' ? 'Mulus (Crossfade)' : 'Cepat (Langsung)'}
                        </span>
                      </div>
                      <div className="setting-segment">
                        <button
                          type="button"
                          className={`setting-segment-btn ${satelliteStyle === 'fast' ? 'active' : ''}`}
                          onClick={() => onSatelliteStyleChange?.('fast')}
                          title="Pergantian frame langsung tanpa crossfade"
                        >
                          Cepat
                        </button>
                        <button
                          type="button"
                          className={`setting-segment-btn ${satelliteStyle === 'smooth' ? 'active' : ''}`}
                          onClick={() => onSatelliteStyleChange?.('smooth')}
                          title="Interpolasi crossfade halus antar frame (Zoom Earth)"
                        >
                          Mulus (Smooth)
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Future Scope Layers (v2.1+) */}
        <div>
          <div className="section-label">LAPISAN BERIKUTNYA (V2.1+)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="future-layer-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CloudRain size={16} color="#60a5fa" />
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Radar Hujan Presipitasi (BMKG)</span>
              </div>
              <span className="soon-tag">Segera Hadir</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
