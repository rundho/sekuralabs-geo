import React, { useEffect, useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import type { AirGridData } from '../core/airField';
import { WindSampler, type WindParticle } from '../core/windEngine';

interface WindParticlesProps {
  map: maplibregl.Map | null;
  grid: AirGridData | null;
  visible: boolean;
  particleCount?: number;
  speedMultiplier?: number;
}

const DEFAULT_PARTICLE_COUNT = 4800;
const MAX_AGE = 130;
const TARGET_PX_PER_FRAME = 1.75;
const FADE_ALPHA = 0.06;

export const WindParticles: React.FC<WindParticlesProps> = ({
  map,
  grid,
  visible,
  particleCount = DEFAULT_PARTICLE_COUNT,
  speedMultiplier = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const samplerRef = useRef<WindSampler | null>(null);

  useEffect(() => {
    if (!grid) {
      samplerRef.current = null;
      return;
    }
    samplerRef.current = new WindSampler(grid);
  }, [grid]);

  useEffect(() => {
    if (!map || !visible) {
      if (canvasRef.current) {
        canvasRef.current.remove();
        canvasRef.current = null;
      }
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      return;
    }

    const container = map.getContainer();
    const canvas = document.createElement('canvas');
    canvas.style.cssText =
      'position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:5;';
    container.appendChild(canvas);
    canvasRef.current = canvas;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let particles: WindParticle[] = [];
    let moving = false;
    let degPerStep = 0;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      canvas.width = Math.max(1, Math.round(cw * dpr));
      canvas.height = Math.max(1, Math.round(ch * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const rescale = () => {
      const b = map.getBounds();
      const span = b.getEast() - b.getWest();
      const degPerPx = span / Math.max(1, container.clientWidth);
      const maxSpeed = samplerRef.current?.maxSpeed || 15;
      degPerStep = (TARGET_PX_PER_FRAME * degPerPx * speedMultiplier) / maxSpeed;
    };

    const seed = (p: WindParticle) => {
      const b = map.getBounds();
      const west = b.getWest();
      const east = b.getEast();
      const south = b.getSouth();
      const north = b.getNorth();
      p.lon = west + Math.random() * (east - west);
      p.lat = south + Math.random() * (north - south);
      p.age = Math.floor(Math.random() * MAX_AGE);
    };

    resize();
    rescale();

    particles = Array.from({ length: particleCount }, () => {
      const p: WindParticle = { lon: 0, lat: 0, age: 0 };
      seed(p);
      return p;
    });

    const clear = () => {
      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.restore();
    };

    const onMoveStart = () => {
      moving = true;
      clear();
    };

    const onMoveEnd = () => {
      moving = false;
      rescale();
      for (const p of particles) seed(p);
    };

    map.on('movestart', onMoveStart);
    map.on('moveend', onMoveEnd);

    const onResize = () => {
      resize();
      rescale();
      clear();
    };
    window.addEventListener('resize', onResize);

    // Animation frame loop
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      if (moving || !samplerRef.current) return;

      const cw = container.clientWidth;
      const ch = container.clientHeight;

      // Soft fading trail
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = `rgba(0,0,0,${FADE_ALPHA})`;
      ctx.fillRect(0, 0, cw, ch);
      ctx.globalCompositeOperation = 'source-over';

      ctx.lineWidth = 1.0;
      ctx.strokeStyle = 'rgba(240, 249, 255, 0.48)';
      ctx.beginPath();

      const sampler = samplerRef.current;

      for (const p of particles) {
        const uv = sampler.sample(p.lon, p.lat);
        if (!uv || p.age++ > MAX_AGE) {
          seed(p);
          continue;
        }

        const from = map.project([p.lon, p.lat]);
        const cos = Math.max(0.25, Math.cos((p.lat * Math.PI) / 180));
        p.lon += (uv[0] * degPerStep) / cos;
        p.lat += uv[1] * degPerStep;
        const to = map.project([p.lon, p.lat]);

        if (to.x < -30 || to.x > cw + 30 || to.y < -30 || to.y > ch + 30) {
          p.age = MAX_AGE + 1;
          continue;
        }

        ctx.moveTo(from.x, from.y);
        ctx.lineTo(to.x, to.y);
      }

      ctx.stroke();
    };

    rafRef.current = requestAnimationFrame(animate);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      map.off('movestart', onMoveStart);
      map.off('moveend', onMoveEnd);
      window.removeEventListener('resize', onResize);
      canvas.remove();
      canvasRef.current = null;
    };
  }, [map, visible, particleCount, speedMultiplier]);

  return null;
};
