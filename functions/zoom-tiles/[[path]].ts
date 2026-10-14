/**
 * Cloudflare Pages Function: /zoom-tiles/*
 * Proxy & Edge Cache untuk ubin citra satelit Himawari-9 GeoColor Zoom Earth.
 * Mengalirkan ubin satelit dengan header CORS ramah browser dan caching cepat pada Cloudflare Edge.
 */

export const onRequestGet: PagesFunction = async ({ request, params }) => {
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path as string) || '';
  const target = `https://tiles.zoom.earth/${path}`;

  try {
    const res = await fetch(target, {
      headers: {
        'Referer': 'https://zoom.earth/',
        'Origin': 'https://zoom.earth',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    headers.set('Cache-Control', 'public, max-age=86400, s-maxage=604800');

    return new Response(res.body, {
      status: res.status,
      headers,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
};
