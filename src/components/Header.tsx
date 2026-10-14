import React from 'react';
import { Layers, Info, Maximize, Minimize } from 'lucide-react';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  onOpenInfo: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  onOpenInfo,
}) => {
  const [isFullscreen, setIsFullscreen] = React.useState(false);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  return (
    <header className="geo-header">
      <div className="brand-wrap" onClick={onToggleSidebar} title="Buka/Tutup Lapisan Peta">
        <div className="brand-icon-box">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#00e5ff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" strokeOpacity="0.4"/>
            <path d="M12 2a10 10 0 0 1 10 10" stroke="#00e5ff"/>
            <circle cx="12" cy="12" r="4" stroke="#10b981"/>
            <path d="M12 8v4l3 3" stroke="#fff" strokeWidth="1.8"/>
          </svg>
        </div>
        <div className="brand-title">
          <span className="brand-name">SekuraLabs Geo</span>
          <span className="brand-badge">Alpha 0.1</span>
        </div>
      </div>

      <div className="header-actions">
        <div className="live-pill">
          <span className="live-dot" />
          <span>RADAR AKTIF</span>
        </div>

        <button
          className={`icon-btn ${sidebarOpen ? 'active' : ''}`}
          onClick={onToggleSidebar}
          title="Pengaturan Lapisan Cuaca & Kualitas Udara"
          aria-label="Toggle Layers"
        >
          <Layers size={18} />
        </button>

        <button
          className="icon-btn"
          onClick={onOpenInfo}
          title="Informasi Sumber Data & Metodologi"
          aria-label="Info Data"
        >
          <Info size={18} />
        </button>

        <button
          className="icon-btn fullscreen-btn"
          onClick={toggleFullscreen}
          title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
          aria-label="Fullscreen"
        >
          {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
        </button>
      </div>
    </header>
  );
};
