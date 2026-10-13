import maplibregl from 'maplibre-gl';
import type { AirGridData } from '../core/airField';
import { sampleLayer } from '../core/airField';
import { calculateUsAqi } from '../core/aqi';
import { getWindDirection, mpsToKmh } from '../core/windEngine';
import { getHydratedStations } from '../core/iqair';

export function handleMapInspectionClick(
  e: maplibregl.MapMouseEvent,
  map: maplibregl.Map,
  grid: AirGridData | null,
) {
  if (!grid) return;

  const { lng, lat } = e.lngLat;

  // Sample PM2.5 from CAMS grid
  const pm25Val = sampleLayer(grid.pm25, grid.bbox, lng, lat);
  if (pm25Val == null) return; // Outside grid boundary

  const aqiRes = calculateUsAqi(pm25Val);
  if (!aqiRes) return;

  // Sample wind u & v
  const u = sampleLayer(grid.u, grid.bbox, lng, lat);
  const v = sampleLayer(grid.v, grid.bbox, lng, lat);
  const windMps = u != null && v != null ? Math.hypot(u, v) : null;
  const windKmh = windMps != null ? mpsToKmh(windMps) : null;
  const windDir = u != null && v != null ? getWindDirection(u, v) : null;

  // Cari stasiun darat IQAir terdekat (radius ~30 km / 0.28 derajat)
  const stations = getHydratedStations(grid);
  let closestStation = null;
  let minDiff = 0.28;

  for (const st of stations) {
    const d = Math.hypot(st.lng - lng, st.lat - lat);
    if (d < minDiff) {
      minDiff = d;
      closestStation = st;
    }
  }

  const html = `
    <div style="min-width: 200px;">
      <div style="display:flex; justify-content:space-between; align-items:baseline; margin-bottom:4px;">
        <div style="font-family:'Outfit',sans-serif; font-size:1.8rem; font-weight:700; line-height:1; color:${aqiRes.color}">
          ${aqiRes.aqi}
          <span style="font-size:0.75rem; font-weight:500; color:#94a3b8;">AQI</span>
        </div>
        <span style="font-size:0.75rem; font-weight:600; padding:2px 8px; border-radius:9999px; background:${aqiRes.bgRgba}; color:${aqiRes.color};">
          ${aqiRes.name}
        </span>
      </div>

      <div style="font-size:0.72rem; color:#94a3b8; margin-bottom:6px; display:flex; align-items:center; gap:4px;">
        <span style="display:inline-block; width:6px; height:6px; border-radius:50%; background:#38bdf8;"></span>
        <span>Model Atmosfer CAMS 0.4°</span>
      </div>

      <div style="font-size:0.75rem; color:#cbd5e1; margin-bottom:8px; line-height:1.35;">
        ${aqiRes.description}
      </div>

      <div style="display:flex; justify-content:space-between; font-size:0.78rem; padding:4px 0; border-top:1px solid rgba(255,255,255,0.08);">
        <span style="color:#94a3b8;">Konsentrasi PM2.5</span>
        <b style="color:#fff;">${pm25Val.toFixed(1)} µg/m³</b>
      </div>

      ${
        windKmh != null && windDir != null
          ? `
        <div style="display:flex; justify-content:space-between; font-size:0.78rem; padding:4px 0; border-top:1px solid rgba(255,255,255,0.08);">
          <span style="color:#94a3b8;">Kecepatan Angin</span>
          <b style="color:#fff;">${windKmh.toFixed(1)} km/j (${windDir})</b>
        </div>
      `
          : ''
      }

      ${
        closestStation
          ? `
        <div style="margin-top:8px; padding:6px 8px; border-radius:8px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); font-size:0.72rem;">
          <div style="color:#94a3b8; font-size:0.68rem; text-transform:uppercase; letter-spacing:0.04em;">Stasiun Darat IQAir Terdekat:</div>
          <div style="color:#fff; font-weight:600; margin:2px 0;">${closestStation.name}</div>
          <div style="display:flex; justify-content:space-between; align-items:center; margin-top:2px;">
            <span style="color:${closestStation.aqiData.color}; font-weight:700;">${closestStation.aqiData.aqi} AQI · ${closestStation.aqiData.name}</span>
            <span style="color:#cbd5e1; font-weight:600;">${closestStation.currentPm25} µg/m³</span>
          </div>
        </div>
      `
          : ''
      }

      <div style="font-family:'JetBrains Mono',monospace; font-size:0.68rem; color:#64748b; margin-top:6px; border-top:1px solid rgba(255,255,255,0.08); padding-top:4px;">
        ${lat.toFixed(4)}°, ${lng.toFixed(4)}° · Waktu: ${grid.validAt || 'Live'}
      </div>
    </div>
  `;

  new maplibregl.Popup({
    closeButton: true,
    maxWidth: '260px',
    className: 'sekura-inspection-popup',
  })
    .setLngLat(e.lngLat)
    .setHTML(html)
    .addTo(map);
}
