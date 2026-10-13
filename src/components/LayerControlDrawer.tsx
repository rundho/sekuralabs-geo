import React from 'react';
import { Wind, CloudRain, Flame, Radio, Moon, Globe, Sun, X, Sliders, MapPin } from 'lucide-react';
import type { BasemapType } from './MapContainer';

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
            <div className="layer-head">
              <div className="layer-info">
                <div className="layer-icon-box" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                  <Flame size={18} />
                </div>
                <div className="layer-text">
                  <h4>Titik Panas Karhutla</h4>
                  <p>Satelit NASA VIIRS 375m (24 Jam NRT)</p>
                </div>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
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
        </div>

        {/* Future Scope Layers (v2.1+) */}
        <div>
          <div className="section-label">LAPISAN BERIKUTNYA (V2.1+)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="future-layer-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CloudRain size={16} color="#60a5fa" />
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Radar Hujan (BMKG)</span>
              </div>
              <span className="soon-tag">Segera Hadir</span>
            </div>

            <div className="future-layer-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Globe size={16} color="#34d399" />
                <span style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>Satelit Himawari-9</span>
              </div>
              <span className="soon-tag">Segera Hadir</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};
