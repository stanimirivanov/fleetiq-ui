import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { createServer as httpServer, request, type Server } from 'node:http';
import type { Socket } from 'node:net';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createServer } from 'vite';
import { connectedDevelopment } from '../../web/connected-dev';

/** Test-owned proxy only: no live provider, product data, credential capture or reusable browser profile. */
export async function startConnectedFixture() {
  const root = mkdtempSync(join(tmpdir(), 'fleetiq-connected-dev-'));
  const sockets = new Set<Socket>();
  const observed = {
    session: false,
    stream: false,
    cookie: false,
    origin: false,
    csrf: false,
  };
  let origin = '',
    viteOrigin = '';
  const listen = (server: Server) =>
    new Promise<number>((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', () => {
        const address = server.address();
        if (!address || typeof address === 'string')
          return reject(new Error('Missing fixture address'));
        resolve(address.port);
      });
    });
  const api = httpServer((req, res) => {
    if (req.url === '/api/v1/auth/session') {
      observed.session = true;
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
        'Set-Cookie':
          'fixture-session=synthetic; HttpOnly; SameSite=Strict; Path=/',
      });
      res.end('{"ready":true}');
    } else if (req.url === '/api/v1/events') {
      observed.stream = true;
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
      });
      // Keep the response open: the browser must receive the first event before EOF.
      res.write('data: streamed\n\n');
    } else if (req.url === '/api/v1/auth/logout' && req.method === 'POST') {
      observed.cookie =
        req.headers.cookie?.includes('fixture-session=synthetic') ?? false;
      observed.origin = req.headers.origin === origin;
      observed.csrf = req.headers['x-fleetiq-csrf'] === '1';
      res.writeHead(204, {
        'Set-Cookie': 'fixture-session=; Max-Age=0; Path=/',
        'Cache-Control': 'no-store',
      });
      res.end();
    } else {
      res.writeHead(404);
      res.end();
    }
  });
  api.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  let apiOrigin = '';
  const relativePath = (path: string | undefined) =>
    Boolean(
      path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\'),
    );
  const edge = httpServer((req, res) => {
    if (!relativePath(req.url)) {
      res.writeHead(400);
      res.end();
      return;
    }
    const target = new URL(
      req.url ?? '/',
      req.url?.startsWith('/api/') ? apiOrigin : viteOrigin,
    );
    const upstream = request(
      target,
      { method: req.method, headers: req.headers },
      (response) => {
        res.writeHead(response.statusCode ?? 502, response.headers);
        response.on('error', () => res.destroy());
        response.pipe(res);
      },
    );
    upstream.on('error', () => {
      if (!res.headersSent && !res.destroyed) {
        res.writeHead(502);
        res.end();
      } else res.destroy();
    });
    res.on('close', () => upstream.destroy());
    req.pipe(upstream);
  });
  edge.on('connection', (socket) => {
    sockets.add(socket);
    socket.on('close', () => sockets.delete(socket));
  });
  edge.on('upgrade', (req, socket, head) => {
    if (!relativePath(req.url)) {
      socket.destroy();
      return;
    }
    const upstream = request(new URL(req.url ?? '/', viteOrigin), {
      headers: req.headers,
    });
    upstream.on('upgrade', (res, peer, initial) => {
      sockets.add(peer);
      peer.on('close', () => sockets.delete(peer));
      socket.write(
        `HTTP/1.1 ${res.statusCode} Switching Protocols\r\n${res.rawHeaders.reduce((lines, value, i) => lines + (i % 2 ? `${value}\r\n` : `${value}: `), '')}\r\n`,
      );
      if (initial.length) socket.write(initial);
      if (head.length) peer.write(head);
      socket.pipe(peer).pipe(socket);
    });
    upstream.on('error', () => socket.destroy());
    upstream.end();
  });
  let vite: Awaited<ReturnType<typeof createServer>> | undefined;
  const close = async () => {
    for (const socket of sockets) socket.destroy();
    await vite?.close();
    for (const server of [edge, api])
      if (server.listening)
        await new Promise<void>((resolve, reject) =>
          server.close((error) => (error ? reject(error) : resolve())),
        );
    rmSync(root, { recursive: true, force: true });
  };
  try {
    apiOrigin = `http://127.0.0.1:${await listen(api)}`;
    origin = `http://127.0.0.1:${await listen(edge)}`;
    writeFileSync(
      join(root, 'index.html'),
      '<h1>Synthetic connected transport</h1><p data-testid="session"></p><p data-testid="stream"></p><p data-testid="hmr"></p><button>Log out</button><script type="module" src="/fixture.js"></script>',
    );
    writeFileSync(join(root, 'message.js'), "export const message = 'before';");
    writeFileSync(
      join(root, 'fixture.js'),
      `import {message} from '/message.js';
  const text=(name,value)=>document.querySelector('[data-testid="'+name+'"]').textContent=value;
  document.documentElement.dataset.boot=crypto.randomUUID();text('hmr',message);
  fetch('/api/v1/auth/session',{credentials:'same-origin'}).then(r=>r.json()).then(value=>text('session',value.ready?'connected':'unavailable'));
  const stream=new EventSource('/api/v1/events');stream.onmessage=event=>{text('stream',event.data);stream.close();};
  document.querySelector('button').onclick=async()=>{const response=await fetch('/api/v1/auth/logout',{method:'POST',credentials:'same-origin',headers:{'X-FleetIQ-CSRF':'1'}});text('session',response.status===204?'logged out':'failed');};
  if(import.meta.hot)import.meta.hot.accept('/message.js',module=>{if(module)text('hmr',module.message);});`,
    );
    const connected = connectedDevelopment(origin, 'serve', 'development');
    vite = await createServer({
      root,
      configFile: false,
      plugins: [connected.plugin],
      server: { ...connected.server, host: '127.0.0.1', port: 0 },
      logLevel: 'silent',
    });
    await vite.listen();
    const address = vite.httpServer?.address();
    if (!address || typeof address === 'string')
      throw new Error('Missing Vite fixture address');
    viteOrigin = `http://127.0.0.1:${address.port}`;
    return {
      origin,
      probeMisrouting: async () =>
        new Promise<number | undefined>((resolve, reject) => {
          const edgeAddress = new URL(origin);
          const probe = request(
            {
              hostname: edgeAddress.hostname,
              port: edgeAddress.port,
              path: `${apiOrigin}/api/v1/auth/session`,
            },
            (response) => {
              response.resume();
              resolve(response.statusCode);
            },
          );
          probe.on('error', reject);
          probe.end();
        }),
      observed: () => ({ ...observed }),
      update: async () => {
        writeFileSync(
          join(root, 'message.js'),
          "export const message = 'after';",
        );
      },
      close,
    };
  } catch (error) {
    await close();
    throw error;
  }
}
