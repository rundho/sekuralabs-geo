import React from 'react';
import { X, ExternalLink, ShieldCheck, Database, Globe } from 'lucide-react';

interface InfoModalProps {
  open: boolean;
  onClose: () => void;
}

export const InfoModal: React.FC<InfoModalProps> = ({ open, onClose }) => {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <div className="modal-title">Tentang SekuraLabs Geo</div>
          <button className="icon-btn" onClick={onClose} title="Tutup Modal">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          <p>
            <strong>SekuraLabs Geo</strong> adalah radar cuaca dan platform visualisasi geospasial generasi baru yang menghadirkan data pemodelan kualitas udara (PM2.5) dan pola aliran angin 10 meter secara interaktif, berkinerja tinggi, dan responsif.
          </p>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#00e5ff', fontWeight: 600 }}>
              <Database size={16} />
              <span>Sumber Data Resmi</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              • <strong>Kualitas Udara PM2.5</strong>: Copernicus Atmosphere Monitoring Service (CAMS) resolusi ~0.4° via Copernicus ADS.<br />
              • <strong>Aliran Angin 10 Meter</strong>: National Oceanic and Atmospheric Administration (NOAA) Global Forecast System (GFS).
            </p>
          </div>

          <div style={{ background: 'rgba(255,255,255,0.04)', padding: 12, borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#10b981', fontWeight: 600 }}>
              <ShieldCheck size={16} />
              <span>Standar US EPA AQI (Revisi 2024)</span>
            </div>
            <p style={{ fontSize: '0.8rem', color: '#cbd5e1' }}>
              Kategori indeks dihitung langsung dari konsentrasi PM2.5 menggunakan formula baku U.S. EPA (40 CFR Part 58 Appendix G) yang diperbarui pada Mei 2024 untuk sensitivitas kesehatan pernapasan yang lebih ketat.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 10, flexWrap: 'wrap', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={14} color="#00e5ff" />
              <span>Ditenagai oleh <strong>SekuraLabs Geo Intelligence Engine</strong> • Komputasi Atmosfer Real-Time</span>
            </div>
            <span style={{ fontSize: '0.68rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>Alpha 0.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};
