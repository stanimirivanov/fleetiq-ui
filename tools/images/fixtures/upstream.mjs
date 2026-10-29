/** Synthetic HTTP peer qualifies edge behavior, never real OIDC/authorization. */
import { createServer } from 'node:http';

let liveResponse;
const server = createServer((request, response) => {
  const chunks = [];
  let length = 0;
  const uploading = request.url === '/api/upload';
  request.on('data', (chunk) => {
    length += chunk.length;
    if (length > (uploading ? 8 * 1024 * 1024 : 4096)) request.destroy();
    else if (!uploading) chunks.push(chunk);
  });
  request.on('end', () => {
    if (uploading) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ bytes: length }));
      return;
    }
    if (
      request.url ===
      '/api/v1/tenants/tenant-a/assets/asset-1/properties/temperature/versions/1/live'
    ) {
      response.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-store',
      });
      liveResponse = response;
      response.write('event: fixture\ndata: first\n\n');
      return;
    }
    if (request.url === '/api/finish-stream' && request.method === 'POST') {
      if (!liveResponse) {
        response.writeHead(409);
        response.end();
        return;
      }
      liveResponse.end('event: fixture\ndata: second\n\n');
      liveResponse = undefined;
      response.writeHead(204);
      response.end();
      return;
    }
    if (request.url === '/api/v1/auth/session') {
      response.writeHead(401, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store',
      });
      response.end('{}');
      return;
    }
    response.setHeader('Cache-Control', 'public, max-age=3600');
    response.setHeader('Server', 'synthetic-upstream/9');
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
