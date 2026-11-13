import { handleApiRequest } from '../functions/api.js';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === '/api' || url.pathname === '/api/') {
      return await handleApiRequest(request, env, ctx);
    }
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      return await env.ASSETS.fetch(request);
    }
    return new Response('Not Found', { status: 404 });
  }
};

