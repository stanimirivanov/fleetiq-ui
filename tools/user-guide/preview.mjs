import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { createServer } from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ownedPath } from './owned-output.mjs';
import { validateReady } from './release.mjs';

const outputRoot = path.resolve(
  fileURLToPath(new URL('../../dist/user-guide/', import.meta.url)),
);
const port = Number.parseInt(process.env.GUIDE_PORT ?? '4174', 10);
if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
  throw new Error('GUIDE_PORT must be between 1 and 65535.');
}

const mime = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.png', 'image/png'],
  ['.webm', 'video/webm'],
  ['.md', 'text/markdown; charset=utf-8'],
]);

export const createGuideServer = () =>
  createServer(async (request, response) => {
    try {
      const url = new URL(request.url ?? '/', 'http://127.0.0.1');
      let target = path.resolve(
        outputRoot,
        decodeURIComponent(url.pathname).replace(/^\/+/, ''),
      );
      if (
        target !== outputRoot &&
        !target.startsWith(`${outputRoot}${path.sep}`)
      ) {
        response.writeHead(403).end();
        return;
      }

      if (request.method !== 'GET' && request.method !== 'HEAD') {
        response.writeHead(405).end();
        return;
      }
      if (target !== outputRoot)
        ownedPath(outputRoot, path.relative(outputRoot, target));
      let info = await stat(target);
      if (info.isDirectory()) {
        target = ownedPath(
          outputRoot,
          path.relative(outputRoot, path.join(target, 'index.html')),
        );
        info = await stat(target);
      }
      if (!info.isFile()) {
        response.writeHead(404).end();
        return;
      }

      const headers = {
        'Content-Type':
          mime.get(path.extname(target).toLowerCase()) ??
          'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'Content-Security-Policy':
          "default-src 'self'; img-src 'self'; media-src 'self'; style-src 'self'",
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'no-store',
      };
      const match = request.headers.range?.match(/^bytes=(\d+)-(\d*)$/);
      if (match) {
        const start = Number.parseInt(match[1], 10);
        const end = match[2] ? Number.parseInt(match[2], 10) : info.size - 1;
        if (
          !Number.isSafeInteger(start) ||
          !Number.isSafeInteger(end) ||
          start < 0 ||
          start > end ||
          start >= info.size
        ) {
          response
            .writeHead(416, {
              ...headers,
              'Content-Range': `bytes */${info.size}`,
            })
            .end();
          return;
        }
        const boundedEnd = Math.min(end, info.size - 1);
        response.writeHead(206, {
          ...headers,
          'Content-Range': `bytes ${start}-${boundedEnd}/${info.size}`,
          'Content-Length': boundedEnd - start + 1,
        });
        if (request.method === 'HEAD') response.end();
        else
          createReadStream(target, { start, end: boundedEnd }).pipe(response);
        return;
      }
      response.writeHead(200, { ...headers, 'Content-Length': info.size });
      if (request.method === 'HEAD') response.end();
      else createReadStream(target).pipe(response);
    } catch (error) {
      response.writeHead(error?.code === 'ENOENT' ? 404 : 400).end();
    }
  });

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  await validateReady(fileURLToPath(new URL('../../', import.meta.url)));
  createGuideServer().listen(port, '127.0.0.1', () => {
    console.log(`[ok] User guide at http://127.0.0.1:${port}`);
  });
}
