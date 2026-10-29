/** Producer invariants are reviewable policy, not an independent attestation. */
import { createHash } from 'node:crypto';
import { lstatSync, readFileSync } from 'node:fs';
export const REPOSITORY = 'stanimirivanov/fleetiq-ui';
export const SOURCE = `https://github.com/${REPOSITORY}`;
export const IMAGE = `ghcr.io/${REPOSITORY}`;
export const SHA = /^[a-f0-9]{40}$/u;
export const DIGEST = /^sha256:[a-f0-9]{64}$/u;
export const SBOM_CATALOGERS =
  'image,file,+sbom-cataloger,+javascript-package-cataloger';
export const CHECKS = [
  'remote-manifest-probe',
  'oci-metadata',
  'production-bundle',
  'runtime-config',
  'proxy-http-contract',
  'built-browser',
  'external-tls',
  'upstream-failure',
  'invalid-configuration',
  'graceful-stop',
  'registry-roundtrip',
  'runtime-security-scan',
  'cleanup',
];
export const ensure = (ok, message) => {
  if (!ok) throw new Error(message);
};
export const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');
export function readJson(file) {
  const stat = lstatSync(file);
  ensure(
    stat.isFile() && !stat.isSymbolicLink() && stat.size < 32 * 1024 * 1024,
    'Expected bounded regular image evidence.',
  );
  return JSON.parse(readFileSync(file, 'utf8'));
}
export function validateTools(tools) {
  ensure(
    tools.format === 'fleetiq-image-tools.v1' &&
      tools.platform === 'linux/amd64',
    'Unsupported image tool contract.',
  );
  ensure(
    /^quay\.io\/containers\/skopeo:v\d+\.\d+\.\d+-immutable@sha256:[a-f0-9]{64}$/u.test(
      tools.transport,
    ),
    'Transport requires the upstream immutable channel and a reviewed digest.',
  );
  for (const [name, repo] of Object.entries({
    frontend: 'docker/dockerfile',
    buildkit: 'moby/buildkit',
    sbom: 'docker/buildkit-syft-scanner',
    transport: 'quay.io/containers/skopeo',
    scanner: 'aquasec/trivy',
    registry: 'registry',
    node: 'node',
    tls: 'alpine/openssl',
    edge: 'nginx',
  })) {
    const [tag, digest] = String(tools[name]).split('@');
    ensure(
      tag.split(':')[0] === repo && DIGEST.test(digest),
      'Tool requires its reviewed repository and digest.',
    );
  }
}
export function validateDockerfile(text, tools) {
  ensure(
    text.startsWith(`# syntax=${tools.frontend}\n`),
    'Dockerfile frontend differs from its reviewed digest.',
  );
  ensure(
    text.includes(`FROM ${tools.node} AS builder`) &&
      text.includes(`FROM ${tools.edge} AS runtime`),
    'Image bases differ from reviewed tools.',
  );
  for (const required of [
    'ARG BUILDKIT_SBOM_SCAN_STAGE=true',
    'pnpm@12.5.1 --ignore-scripts',
    'pnpm install --frozen-lockfile && pnpm build',
    'COPY packaging/nginx/ /etc/fleetiq/',
    'COPY --from=builder /tmp/csp.conf /usr/share/fleetiq/csp.conf',
    'command -v nginx >/dev/null',
    'command -v wget >/dev/null',
    'STOPSIGNAL SIGQUIT',
    'USER 10001:10001',
    'ENTRYPOINT ["/usr/local/bin/fleetiq-edge"]',
  ])
    ensure(text.includes(required), 'Production image recipe drift.');
  ensure(
    !text.includes('VITE_') &&
      !text.includes('GITHUB_TOKEN') &&
      !/caddy|golang:|go build|setcap|apk add/u.test(text),
    'Environment/credential build inputs are prohibited.',
  );
}
export function validateRuntime(config, revision) {
  ensure(
    config.os === 'linux' && config.architecture === 'amd64',
    'Unsupported image platform.',
  );
  ensure(
    config.config.User === '10001:10001' &&
      config.config.StopSignal === 'SIGQUIT' &&
      JSON.stringify(config.config.Entrypoint) ===
        '["/usr/local/bin/fleetiq-edge"]',
    'Runtime identity/entrypoint differs.',
  );
  ensure(
    config.config.Labels?.['org.opencontainers.image.source'] === SOURCE &&
      config.config.Labels?.['org.opencontainers.image.revision'] === revision,
    'Image source labels differ.',
  );
  ensure(
    !config.config.Env?.some(
      (v) => v.startsWith('FLEETIQ_') || v.startsWith('VITE_'),
    ),
    'Image contains environment-specific routing.',
  );
}
export function validateScan(scan, database, now = Date.now(), expectedConfig) {
  ensure(
    scan.SchemaVersion === 2 &&
      scan.Metadata?.ImageID === expectedConfig &&
      scan.Metadata?.OS?.Family === 'alpine',
    'Scan does not identify this runtime image.',
  );
  ensure(
    scan.Results?.some(
      (r) =>
        r.Class === 'os-pkgs' &&
        r.Packages?.some(
          (p) =>
            p.Name === 'nginx' &&
            typeof p.Version === 'string' &&
            p.Version.length > 0,
        ),
    ),
    'Missing package-owned native NGINX runtime coverage.',
  );
  ensure(
    !scan.Results.some((r) => r.Type === 'gobinary' && r.Packages?.length),
    'Unexpected Go binary in the native NGINX runtime.',
  );
  for (const result of scan.Results) {
    ensure(!result.Secrets?.length, 'Runtime secret finding.');
    ensure(
      !(result.Vulnerabilities ?? []).some((v) =>
        ['HIGH', 'CRITICAL'].includes(v.Severity),
      ),
      'High/critical runtime vulnerability.',
    );
  }
  const db = database.VulnerabilityDB;
  const updated = Date.parse(db?.UpdatedAt);
  ensure(
    database.Version === '0.76.0' &&
      db?.Version === 2 &&
      Number.isFinite(updated) &&
      now >= updated &&
      now - updated <= 86400000 &&
      Date.parse(db.NextUpdate) > now,
    'Scanner/database unavailable or stale.',
  );
}
export function validateQualification(record, revision) {
  ensure(
    record.format === 'fleetiq-ux-image-qualification.v1' &&
      record.outcome === 'passed',
    'Image qualification incomplete.',
  );
  ensure(
    SHA.test(revision) &&
      record.source?.revision === revision &&
      record.source.repository === REPOSITORY,
    'Qualification source differs.',
  );
  ensure(
    record.platform === 'linux/amd64' &&
      [
        record.image?.digest,
        record.image?.manifest,
        record.image?.config,
        record.bundle?.digest,
        record.scan?.digest,
        record.sbom?.digest,
        record.provenance?.digest,
      ].every((d) => DIGEST.test(d)),
    'Missing content-bound artifact evidence.',
  );
  ensure(
    JSON.stringify(record.checks) === JSON.stringify(CHECKS) &&
      record.scan.outcome === 'passed',
    'Required image checks missing.',
  );
}

/** Static drift sensor complements native nginx -t and actual HTTP/TLS probes. */
export function validateEdgeConfiguration(main, proxy, entrypoint) {
  for (const required of [
    'worker_processes 1;',
    'server_tokens off;',
    'fastcgi_temp_path /tmp/fastcgi;',
    'uwsgi_temp_path /tmp/uwsgi;',
    'scgi_temp_path /tmp/scgi;',
    'types { application/javascript mjs; }',
    'client_max_body_size 8m;',
    'access_log off;',
    'listen 127.0.0.1:8081;',
    'add_header_inherit merge;',
    'if ($fleet_host_allowed = 0) { return 421; }',
    'if ($http_host = "") { return 421; }',
    'include /usr/share/fleetiq/csp.conf;',
    'try_files $uri =404;',
    'try_files $uri /index.html;',
    'proxy_read_timeout 75s;',
  ])
    ensure(main.includes(required), 'NGINX main configuration drift.');
  const mapBlock = main.match(/location \/maps\/ \{([\s\S]*?)\n {4}\}/u)?.[1];
  ensure(
    mapBlock?.includes('try_files $uri =404;'),
    'NGINX map resources must not fall through to SPA.',
  );
  const liveBlock = main.match(
    /location ~ \^\/api\/v1\/tenants\/[^\n]+\{([\s\S]*?)\n {6}\}/u,
  )?.[1];
  ensure(
    liveBlock?.includes('include @@SCRATCH@@/proxy.conf;') &&
      liveBlock.includes('proxy_read_timeout 75s;'),
    'NGINX SSE location must own its proxy handler and idle bound.',
  );
  for (const required of [
    'proxy_set_header Host $http_host;',
    'proxy_set_header Origin $http_origin;',
    'proxy_set_header Forwarded "";',
    'proxy_set_header X-Forwarded-For $remote_addr;',
    'proxy_set_header X-Forwarded-Proto https;',
    'proxy_set_header X-Forwarded-Host "@@PUBLIC_AUTHORITY@@";',
    'proxy_hide_header Cache-Control;',
    'proxy_hide_header ETag;',
    'add_header Cache-Control no-store always;',
    'proxy_buffering off;',
    'proxy_request_buffering off;',
    'proxy_redirect off;',
    'proxy_pass http://@@API_UPSTREAM@@;',
  ])
    ensure(proxy.includes(required), 'NGINX proxy configuration drift.');
  ensure(
    entrypoint.includes('mktemp -d /tmp/fleetiq-edge.XXXXXXXXXX') &&
      entrypoint.includes('nginx -t -c "$scratch/nginx.conf"') &&
      entrypoint.includes('exec nginx -c "$scratch/nginx.conf"') &&
      !/\beval\s|envsubst\s/u.test(entrypoint.replace(/^#.*$/gmu, '')),
    'NGINX configuration renderer drift.',
  );
}
