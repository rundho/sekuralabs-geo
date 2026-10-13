/**
 * Cloudflare Pages Serverless Function: /api/hotspots
 * Mengambil data titik panas (wildfire hotspots) satelit NASA VIIRS 375m NRT
 * khusus wilayah Indonesia dengan edge-caching 15 menit.
 */

export const onRequestGet: PagesFunction = async ({ request }) => {
  const cacheHeaders = {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'public, max-age=900, s-maxage=900',
    'Access-Control-Allow-Origin': '*',
  };

  const url = new URL(request.url);

  try {
    const nasaUrl =
      'https://firms.modaps.eosdis.nasa.gov/data/active_fire/suomi-npp-viirs-c2/csv/SUOMI_VIIRS_C2_SouthEast_Asia_24h.csv';
    const nasaRes = await fetch(nasaUrl, {
      headers: { 'User-Agent': 'SekuralabsGeo/2.0' },
    });

    if (nasaRes.ok) {
      const csv = await nasaRes.text();
      const lines = csv.trim().split('\n');
      const results: any[] = [];

      for (let i = 1; i < lines.length; i++) {
        const p = lines[i].split(',');
        if (p.length < 12) continue;
        const lat = parseFloat(p[0]);
        const lng = parseFloat(p[1]);

        // Filter Bounding Box Indonesia (95.0E - 141.5E, 11.5S - 7.5N)
        if (lat >= -11.5 && lat <= 7.5 && lng >= 95.0 && lng <= 141.5) {
          const timeUtc = p[6].padStart(4, '0');
          const h = parseInt(timeUtc.slice(0, 2), 10);
          const m = timeUtc.slice(2, 4);
          const wibH = (h + 7) % 24;
          const timeFormatted = `${String(wibH).padStart(2, '0')}:${m} WIB`;

          results.push({
            id: `hp-${i}`,
            lat,
            lng,
            frp: parseFloat(p[11]) || 1.0,
            confidence: p[8] || 'nominal',
            acqDate: p[5],
            acqTime: timeUtc,
            timeFormatted,
            satellite: 'Suomi NPP (VIIRS 375m)',
            daynight: p[12]?.trim() || 'D',
            brightness: parseFloat(p[2]) || 300,
          });
        }
      }

      return new Response(
        JSON.stringify({
          updatedAt: new Date().toISOString(),
          source: 'NASA FIRMS VIIRS 375m (Live Edge)',
          count: results.length,
          hotspots: results,
        }),
        { headers: cacheHeaders }
      );
    }
  } catch (err: any) {
    console.warn('[Hotspots API] Error fetching NASA FIRMS live feed:', err);
  }

  // Fallback ke file snapshot lokal jika NASA timeout / offline
  try {
    const fallbackRes = await fetch(`${url.origin}/data/hotspots_live.json`);
    if (fallbackRes.ok) {
      const fallbackData = await fallbackRes.text();
      return new Response(fallbackData, { headers: cacheHeaders });
    }
  } catch {}

  return new Response(
    JSON.stringify({
      updatedAt: new Date().toISOString(),
      source: 'Sekuralabs Hotspots Fallback',
      count: 0,
      hotspots: [],
    }),
    { headers: cacheHeaders }
  );
};
