import React from 'react';
import { PM25_BREAKPOINTS } from '../core/aqi';

interface LegendBarProps {
  visible: boolean;
}

export const LegendBar: React.FC<LegendBarProps> = ({ visible }) => {
  if (!visible) return null;

  return (
    <div className="geo-legend">
      <div className="legend-title">
        <span>Skala AQI (US EPA 2024) / PM2.5</span>
        <span style={{ fontSize: '0.66rem', color: '#94a3b8' }}>µg/m³</span>
      </div>

      <div className="legend-bar-gradient" />

      <div className="legend-ticks">
        <span>0</span>
        <span>50</span>
        <span>100</span>
        <span>150</span>
        <span>200</span>
        <span>300</span>
        <span>500+</span>
      </div>

      <div className="legend-categories">
        {PM25_BREAKPOINTS.slice(0, 4).map((bp) => (
          <div key={bp.category} className="legend-cat-item">
            <span className="cat-dot" style={{ backgroundColor: bp.color }} />
            <span>{bp.name}</span>
          </div>
        ))}
        {PM25_BREAKPOINTS.slice(4).map((bp) => (
          <div key={bp.category} className="legend-cat-item">
            <span className="cat-dot" style={{ backgroundColor: bp.color }} />
            <span>{bp.name}</span>
          </div>
        ))}
      </div>

      <div className="legend-attribution">
        Model CAMS 0.4° & GFS 10m · Hasil model komputasi atmosfer, bukan pengukuran alat darat.
      </div>
    </div>
  );
};
