import type { ConfigEnv, Plugin, ServerOptions } from 'vite';

/** Opt-in development transport only; the edge owns API/TLS and production/test configuration stays untouched. */
export function connectedDevelopment(
  value: string | undefined,
  command: ConfigEnv['command'],
  mode: string,
  isPreview = false,
): { server?: ServerOptions; plugin?: Plugin } {
  if (!value || command !== 'serve' || mode === 'test' || isPreview) return {};
  let url: URL;
  try {
    url = new URL(value);
    const loopback = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (
      value !== value.trim() ||
      /[%\\?#]/u.test(value) ||
      !/^https?:\/\/[^/]+\/?$/u.test(value) ||
      url.username ||
      url.password ||
      url.pathname !== '/' ||
      (!loopback && url.hostname !== 'fleet.fleetiq.test') ||
      (!loopback && url.protocol !== 'https:') ||
      (url.port && Number(url.port) < 1)
    )
      throw new Error();
  } catch {
    throw new Error('Invalid connected development origin');
  }
  return {
    server: {
      origin: url.origin,
      strictPort: true,
      allowedHosts: [url.hostname],
      cors: { origin: url.origin },
      // Explicit clientPort prevents Vite's direct WebSocket fallback around the edge.
      ws: {
        protocol: url.protocol === 'https:' ? 'wss' : 'ws',
        host: url.hostname,
        clientPort: Number(url.port || (url.protocol === 'https:' ? 443 : 80)),
        path: '/__fleetiq_hmr',
      },
    },
    plugin: {
      name: 'fleetiq-connected-api-boundary',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          if (!/^\/api(?:\/|\?|$)/u.test(request.url ?? '')) return next();
          response.writeHead(503, {
            'Content-Type': 'application/problem+json',
            'Cache-Control': 'no-store',
          });
          response.end(
            JSON.stringify({
              type: 'about:blank',
              title: 'Connected API requires edge routing',
              status: 503,
            }),
          );
        });
      },
    },
  };
}
