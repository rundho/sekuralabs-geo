/**
 * Cloudflare Pages Function: /air/*
 * Proxy & Edge Cache untuk data Copernicus CAMS dari Cloudflare R2 bucket.
 * Menghilangkan masalah CORS pada browser client.
 */

export const onRequestGet: PagesFunction = async ({ request, params }) => {
  const path = Array.isArray(params.path) ? params.path.join('/') : (params.path as string) || '';
  const url = new URL(request.url);
  const target = `https://pub-e71bae449b864ca78974083cc5663453.r2.dev/air/${path}${url.search}`;

  try {
    const res = await fetch(target, {
      headers: {
        'User-Agent': 'SekuralabsGeo-Proxy/2.0',
      },
    });

    const headers = new Headers(res.headers);
    headers.set('Access-Control-Allow-Origin', '*');
    headers.set('Cache-Control', 'public, max-age=120, s-maxage=600');

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
