import React from 'react';
import { X, Radio, Wind, Droplets, Thermometer, ShieldAlert, ExternalLink } from 'lucide-react';
import type { HydratedAirStation } from '../core/iqair';

interface StationDetailCardProps {
  station: HydratedAirStation | null;
  onClose: () => void;
}

export const StationDetailCard: React.FC<StationDetailCardProps> = ({ station, onClose }) => {
  if (!station) return null;

  const { aqiData } = station;

  return (
    <div
      style={{
        position: 'absolute',
        top: 'calc(var(--header-height) + 24px)',
        left: '20px',
        width: '320px',
        maxWidth: 'calc(100vw - 40px)',
        zIndex: 35,
        background: 'rgba(10, 16, 31, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        borderRadius: '16px',
        boxShadow: '0 16px 40px rgba(0, 0, 0, 0.75), 0 0 20px rgba(0, 229, 255, 0.15)',
        overflow: 'hidden',
        animation: 'fadeIn 0.22s ease-out',
        pointerEvents: 'auto',
      }}
    >
      {/* Header with Station Tag and Close Button */}
      <div
        style={{
          padding: '12px 16px 8px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '3px 8px',
            borderRadius: '9999px',
            background: 'rgba(0, 229, 255, 0.15)',
            border: '1px solid rgba(0, 229, 255, 0.35)',
            color: '#00e5ff',
            fontSize: '0.68rem',
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
          }}
        >
          <Radio size={12} />
          <span>Stasiun {station.stationType}</span>
        </div>

        <button
          className="icon-btn"
          onClick={onClose}
          style={{ width: '28px', height: '28px' }}
          title="Tutup Kartu Stasiun"
        >
          <X size={14} />
        </button>
      </div>

      {/* Station Name & Location */}
      <div style={{ padding: '0 16px 12px 16px' }}>
        <h3
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#fff',
            lineHeight: 1.2,
            marginBottom: '4px',
          }}
        >
          {station.name}
        </h3>
        <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
          {station.city}, {station.state}, {station.country}
        </p>
        <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
          {station.lastUpdated}
        </span>
      </div>

      {/* Main AQI Banner (IQAir Card Style) */}
      <div style={{ padding: '0 16px 14px 16px' }}>
        <div
          style={{
            background: aqiData.bgRgba,
            border: `1px solid ${aqiData.color}`,
            borderRadius: '14px',
            padding: '14px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            boxShadow: `0 0 20px ${aqiData.bgRgba}`,
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '2.4rem',
                  fontWeight: 800,
                  color: aqiData.color,
                  lineHeight: 1,
                }}
              >
                {aqiData.aqi}
              </span>
              <span style={{ fontSize: '0.72rem', fontWeight: 600, color: '#94a3b8' }}>
                AQI US
              </span>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  color: aqiData.color,
                }}
              >
                {aqiData.name}
              </div>
              <ShieldAlert size={20} color={aqiData.color} style={{ display: 'inline' }} />
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              paddingTop: '8px',
              fontSize: '0.78rem',
            }}
          >
            <span style={{ color: '#cbd5e1' }}>Polutan utama: <strong>PM2.5</strong></span>
            <b style={{ color: '#fff' }}>{station.currentPm25} µg/m³</b>
          </div>
        </div>
      </div>

      {/* Weather Parameters Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr 1fr',
          gap: '8px',
          padding: '0 16px 14px 16px',
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px', color: '#f59e0b' }}>
            <Thermometer size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Suhu</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {station.temperature}°C
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px', color: '#00e5ff' }}>
            <Droplets size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Kelembapan</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {station.humidity}%
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            borderRadius: '10px',
            padding: '8px',
            textAlign: 'center',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '2px', color: '#10b981' }}>
            <Wind size={14} />
          </div>
          <div style={{ fontSize: '0.65rem', color: '#94a3b8' }}>Angin</div>
          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>
            {station.windSpeedKmh ?? 6} km/j
          </div>
        </div>
      </div>

      {/* Attribution Footer */}
      <div
        style={{
          padding: '10px 16px',
          background: 'rgba(0, 0, 0, 0.35)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.68rem',
          color: '#64748b',
          lineHeight: 1.4,
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <div><span style={{ color: '#94a3b8' }}>Model:</span> CAMS 0.4° & GFS 10m (Interpolasi Grid)</div>
          <div><span style={{ color: '#94a3b8' }}>Lokasi:</span> {station.attribution}</div>
        </div>
      </div>
    </div>
  );
};
