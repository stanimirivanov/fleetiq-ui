/** Exercise the configured registry CLI against an owned loopback registry, without a daemon. */
import { once } from 'node:events';
import { createServer } from 'node:http';
import { ensure, hash } from './policy.mjs';
import { verifyRemoteImage } from './prerequisites.mjs';
import { docker } from './process.mjs';

export async function qualifyRemoteProbe(execute = docker) {
  const bytes = JSON.stringify({
    schemaVersion: 2,
    mediaType: 'application/vnd.oci.image.manifest.v1+json',
    config: {
      mediaType: 'application/vnd.oci.image.config.v1+json',
      digest: `sha256:${'a'.repeat(64)}`,
      size: 2,
    },
    layers: [],
  });
  const digest = `sha256:${hash(bytes)}`;
  let available = true,
    requests = 0;
  const server = createServer((request, response) => {
    if (request.url === '/v2/') {
      response.end('{}');
      return;
    }
    if (request.url !== `/v2/fixture/manifests/${digest}`) {
      response.writeHead(404).end();
      return;
    }
    requests++;
    response.setHeader(
      'content-type',
      'application/vnd.oci.image.manifest.v1+json',
    );
    response.setHeader('Docker-Content-Digest', digest);
    response.statusCode = available ? 200 : 404;
    response.end(
      available
        ? bytes
        : JSON.stringify({
            errors: [
              {
                code: 'MANIFEST_UNKNOWN',
                message: 'Removed synthetic manifest',
              },
            ],
          }),
    );
  });
  try {
    server.listen(0, '127.0.0.1');
    await once(server, 'listening');
    const reference = `127.0.0.1:${server.address().port}/fixture@${digest}`;
    // Expected rejection is private, not a failing production registry diagnostic.
    const command = (args, options) =>
      execute(args, { ...options, diagnostics: false });
    await verifyRemoteImage('fixture', reference, command);
    ensure(requests > 0, 'Remote probe did not contact the fixture registry.');
    available = false;
    const before = requests;
    let rejected = false;
    try {
      await verifyRemoteImage('fixture', reference, command);
    } catch (error) {
      rejected = error.code === 'remote-manifest-unavailable';
    }
    ensure(
      rejected && requests > before,
      'Remote probe accepted removed content or reused cached metadata.',
    );
    console.log(
      'Remote manifest CLI controls passed: present accepted, removed rejected.',
    );
  } finally {
    server.closeAllConnections();
    await new Promise((resolve) => server.close(resolve));
  }
}
