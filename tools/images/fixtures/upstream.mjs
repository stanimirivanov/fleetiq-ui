/** Synthetic HTTP peer qualifies edge behavior, never real OIDC/authorization. */
import { createServer } from 'node:http';

const server = createServer((request, response) => {
  const chunks = [];
  let length = 0;
  request.on('data', (chunk) => {
    length += chunk.length;
    if (length > 4096) request.destroy();
    else chunks.push(chunk);
  });
  request.on('end', () => {
    if (request.url === '/api/v1/auth/session') {
      response.writeHead(401, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      response.end('{}');
      return;
    }
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.setHeader('ETag', '"synthetic"');
    if (request.url === '/api/redirect') {
      response.writeHead(302, {
        Location: `https://${request.headers.host}/api/callback`,
      });
      response.end();
      return;
    }
    response.setHeader('Set-Cookie', [
      'fleetiq.session=fixture; Path=/; HttpOnly; Secure; SameSite=Lax',
      'fleetiq.csrf=fixture; Path=/; Secure; SameSite=Strict',
    ]);
    response.setHeader('Content-Type', 'application/json');
    response.end(
      JSON.stringify({
        path: request.url,
        method: request.method,
        headers: request.headers,
        body: Buffer.concat(chunks).toString('utf8'),
      }),
    );
  });
});
server.listen(8080, '0.0.0.0');
process.on('SIGTERM', () => server.close(() => process.exit(0)));
