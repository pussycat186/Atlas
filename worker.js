export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Only cache GET requests to specific paths
    if (request.method !== 'GET') {
      return this.forwardToOrigin(request);
    }
    
    const path = url.pathname;
    if (!path.startsWith('/prism') && !path.startsWith('/qtca/tick') && !path.startsWith('/qtca/summary')) {
      return this.forwardToOrigin(request);
    }
    
    // Skip SSE stream
    if (path.includes('/qtca/stream')) {
      return this.forwardToOrigin(request);
    }
    
    // Try cache first
    const cache = caches.default;
    const cacheKey = new Request(url.toString(), request);
    let response = await cache.match(cacheKey);
    
    if (response) {
      response = new Response(response.body, response);
      response.headers.set('CF-Cache-Status', 'HIT');
      return response;
    }
    
    // Forward to origin
    response = await this.forwardToOrigin(request);
    
    // Cache successful responses
    if (response.status === 200) {
      const responseClone = response.clone();
      responseClone.headers.set('Cache-Control', 'public, max-age=600, stale-while-revalidate=60');
      responseClone.headers.set('CF-Cache-Status', 'MISS');
      ctx.waitUntil(cache.put(cacheKey, responseClone));
    }
    
    return response;
  },
  
  async forwardToOrigin(request) {
    const url = new URL(request.url);
    url.hostname = 'atlas-admin-insights.vercel.app';
    
    return fetch(new Request(url.toString(), {
      method: request.method,
      headers: request.headers,
      body: request.body
    }));
  }
};