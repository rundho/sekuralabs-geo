import React, { useState } from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Zap, SlidersHorizontal, X } from 'lucide-react';
import {
  type SatelliteAnimationSpeed,
  type SatelliteLoopDuration,
  type SatelliteAnimationStyle,
  SATELLITE_SPEED_CONFIGS,
  SATELLITE_DURATIONS,
} from '../core/satellite';

interface TimelinePlayerProps {
  times: string[];
  currentStepIndex: number;
  playing: boolean;
  onStepChange: (index: number) => void;
  onTogglePlay: () => void;
  onJumpToLive: () => void;
  modelLabel?: string;
  isSatelliteLoop?: boolean;
  satelliteSpeed?: SatelliteAnimationSpeed;
  onSatelliteSpeedChange?: (speed: SatelliteAnimationSpeed) => void;
  satelliteDuration?: SatelliteLoopDuration;
  onSatelliteDurationChange?: (hours: SatelliteLoopDuration) => void;
  satelliteStyle?: SatelliteAnimationStyle;
  onSatelliteStyleChange?: (style: SatelliteAnimationStyle) => void;
}

const MONTH_NAMES_ID = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'
];

export const TimelinePlayer: React.FC<TimelinePlayerProps> = ({
  times,
  currentStepIndex,
  playing,
  onStepChange,
  onTogglePlay,
  onJumpToLive,
  modelLabel = 'CAMS 0.4°',
  isSatelliteLoop = false,
  satelliteSpeed = 'medium',
  onSatelliteSpeedChange,
  satelliteDuration = 3,
  onSatelliteDurationChange,
  satelliteStyle = 'smooth',
  onSatelliteStyleChange,
}) => {
  const [showSettings, setShowSettings] = useState(false);

  if (!times || times.length === 0) return null;

  const currentTimeStr = times[currentStepIndex] || times[0];

  // Parse ISO timestamp into WIB format
  const formatIndonesianTime = (rawIso: string) => {
    try {
      const cleanIso = rawIso.includes('T')
        ? rawIso.endsWith('Z') ? rawIso : `${rawIso}Z`
        : `${rawIso}:00Z`;
      const d = new Date(cleanIso);
      const utcH = d.getUTCHours();
      const utcM = d.getUTCMinutes();
      const wibH = (utcH + 7) % 24;
      const pad = (n: number) => String(n).padStart(2, '0');
      const day = d.getUTCDate();
      const month = MONTH_NAMES_ID[d.getUTCMonth()];
      const year = d.getUTCFullYear();

      return {
        timeFormatted: `${pad(wibH)}:${pad(utcM)} WIB`,
        dateFormatted: `${day} ${month} ${year}`,
      };
    } catch {
      return {
        timeFormatted: currentTimeStr,
        dateFormatted: 'Hari Ini',
      };
    }
  };

  const { timeFormatted, dateFormatted } = formatIndonesianTime(currentTimeStr);

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      onStepChange(currentStepIndex - 1);
    } else {
      onStepChange(times.length - 1);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < times.length - 1) {
      onStepChange(currentStepIndex + 1);
    } else {
      onStepChange(0);
    }
  };

  const isLive = currentStepIndex >= times.length - 2;

  return (
    <div className="timeline-player-container">
      {/* Floating Settings Popover (ala Zoom Earth) */}
      {isSatelliteLoop && showSettings && (
        <div className="timeline-settings-popover">
          <div className="timeline-settings-head">
            <span className="timeline-settings-title">
              <SlidersHorizontal size={14} color="#00e5ff" />
              Pengaturan Animasi Satelit
            </span>
            <button
              className="timeline-settings-close"
              onClick={() => setShowSettings(false)}
              aria-label="Tutup"
            >
              <X size={14} />
            </button>
          </div>

          {/* Kecepatan Animasi */}
          <div className="satellite-setting-group">
            <div className="satellite-setting-label">
              <span>Kecepatan Animasi</span>
              <span style={{ color: '#00e5ff' }}>
                {SATELLITE_SPEED_CONFIGS[satelliteSpeed].label}
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

          {/* Gaya Animasi Satelit */}
          <div className="satellite-setting-group">
            <div className="satellite-setting-label">
              <span>Gaya Animasi Satelit</span>
              <span style={{ color: '#00e5ff' }}>
                {satelliteStyle === 'smooth' ? 'Mulus' : 'Cepat'}
              </span>
            </div>
            <div className="setting-segment">
              <button
                type="button"
                className={`setting-segment-btn ${satelliteStyle === 'fast' ? 'active' : ''}`}
                onClick={() => onSatelliteStyleChange?.('fast')}
              >
                Cepat
              </button>
              <button
                type="button"
                className={`setting-segment-btn ${satelliteStyle === 'smooth' ? 'active' : ''}`}
                onClick={() => onSatelliteStyleChange?.('smooth')}
              >
                Mulus (Smooth)
              </button>
            </div>
          </div>

          {/* Rentang Durasi Loop Satelit */}
          <div className="satellite-setting-group">
            <div className="satellite-setting-label">
              <span>Rentang Durasi Loop</span>
              <span style={{ color: '#00e5ff' }}>{satelliteDuration} Jam</span>
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
        </div>
      )}

      <div className="player-card">
        {/* Main row: controls, time display, live button */}
        <div className="player-main-row">
          <div className="player-btn-group">
            {/* Step Backward */}
            <button
              className="player-btn"
              onClick={handlePrev}
              title={isSatelliteLoop ? 'Langkah Sebelumnya' : '1 Jam Sebelumnya'}
              aria-label="Previous Step"
            >
              <ChevronLeft size={18} />
            </button>

            {/* Play/Pause Button */}
            <button
              className="player-btn play-btn"
              onClick={onTogglePlay}
              title={playing ? 'Jeda Simulasi' : 'Mulai Putar Simulasi'}
              aria-label={playing ? 'Pause' : 'Play'}
            >
              {playing ? <Pause size={18} /> : <Play size={18} style={{ marginLeft: 2 }} />}
            </button>

            {/* Step Forward */}
            <button
              className="player-btn"
              onClick={handleNext}
              title={isSatelliteLoop ? 'Langkah Berikutnya' : '1 Jam Berikutnya'}
              aria-label="Next Step"
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Date & Time Display */}
          <div className="time-display-box">
            <span className="time-val">{timeFormatted}</span>
            <span className="time-date">{dateFormatted}</span>
          </div>

          {/* Jump to Live Button */}
          <button
            className="live-jump-btn"
            onClick={onJumpToLive}
            title="Kembali ke Waktu Terkini"
            style={{
              opacity: isLive ? 0.7 : 1,
              boxShadow: isLive ? 'none' : '0 0 10px rgba(16, 185, 129, 0.4)',
            }}
          >
            <Zap size={12} style={{ display: 'inline', marginRight: 4 }} />
            LIVE
          </button>
        </div>

        {/* Scrub Slider (Row 2 on mobile, inline on desktop) */}
        <div className="slider-track-wrap">
          <input
            type="range"
            className="timeline-slider"
            min={0}
            max={times.length - 1}
            value={currentStepIndex}
            onChange={(e) => onStepChange(parseInt(e.target.value, 10))}
            title="Geser linimasa perkiraan"
          />
        </div>

        {/* Model info pill (desktop only) */}
        <div
          className="model-pill"
          title={isSatelliteLoop ? 'Citra Satelit Geostasioner Himawari-9 (JMA/NASA GIBS)' : 'Model Resolusi CAMS 0.4° & GFS 10m'}
          style={isSatelliteLoop ? { borderColor: 'rgba(56, 189, 248, 0.4)', color: '#38bdf8' } : undefined}
        >
          {modelLabel}
        </div>

        {/* Quick Settings Button on Player (when in satellite mode) */}
        {isSatelliteLoop && (
          <button
            className={`player-settings-btn ${showSettings ? 'active' : ''}`}
            onClick={() => setShowSettings((v) => !v)}
            title="Pengaturan Animasi: Kecepatan, Gaya & Durasi"
            aria-label="Pengaturan Animasi Satelit"
          >
            <SlidersHorizontal size={13} />
            <span>{SATELLITE_SPEED_CONFIGS[satelliteSpeed].label}</span>
          </button>
        )}
      </div>
    </div>
  );
};
