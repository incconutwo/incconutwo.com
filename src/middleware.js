export async function onRequest({ request, url }, next) {
  // Only process API routes
  if (url.pathname.startsWith('/api/')) {
    const origin = request.headers.get('origin');
    const host = request.headers.get('host');
    const isOptions = request.method === 'OPTIONS';

    // 1. Handle HTTP OPTIONS preflight requests
    if (isOptions) {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': origin || '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // 2. Strict Origin verification for state-changing POST requests (e.g. /api/notify)
    if (request.method === 'POST') {
      if (origin && host) {
        try {
          const originHost = new URL(origin).host;
          // Allow same host or Vercel preview deployment hosts
          const isAllowedHost = (originHost === host) || 
                                originHost.endsWith('.vercel.app') || 
                                originHost.includes('localhost') || 
                                originHost.includes('127.0.0.1');

          if (!isAllowedHost) {
            return new Response(JSON.stringify({ error: 'Forbidden: Cross-origin request blocked.' }), {
              status: 403,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': `https://${host}`,
              },
            });
          }
        } catch (e) {
          // Invalid origin header format
          return new Response(JSON.stringify({ error: 'Invalid Origin header' }), {
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          });
        }
      }
    }

    // 3. Process request and attach explicit CORS headers to response
    const response = await next();
    const newHeaders = new Headers(response.headers);
    
    if (!newHeaders.has('Access-Control-Allow-Origin')) {
      newHeaders.set('Access-Control-Allow-Origin', origin || '*');
      newHeaders.set('Vary', 'Origin');
    }
    
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: newHeaders,
    });
  }

  return next();
}
