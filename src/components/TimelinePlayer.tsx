import React from 'react';
import { Play, Pause, ChevronLeft, ChevronRight, Zap } from 'lucide-react';

interface TimelinePlayerProps {
  times: string[];
  currentStepIndex: number;
  playing: boolean;
  onStepChange: (index: number) => void;
  onTogglePlay: () => void;
  onJumpToLive: () => void;
  modelLabel?: string;
  isSatelliteLoop?: boolean;
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
}) => {
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
      <div className="player-card">
        {/* Main row: controls, time display, live button */}
        <div className="player-main-row">
          <div className="player-btn-group">
            {/* Step Backward */}
            <button
              className="player-btn"
              onClick={handlePrev}
              title={isSatelliteLoop ? '10 Menit Sebelumnya' : '1 Jam Sebelumnya'}
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
              title={isSatelliteLoop ? '10 Menit Berikutnya' : '1 Jam Berikutnya'}
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
      </div>
    </div>
  );
};
