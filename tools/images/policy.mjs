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
    go: 'golang',
    edge: 'caddy',
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
      text.includes(`FROM ${tools.go} AS edge-builder`) &&
      text.includes(`FROM ${tools.edge} AS runtime`),
    'Image bases differ from reviewed tools.',
  );
  for (const required of [
    'ARG BUILDKIT_SBOM_SCAN_STAGE=true',
    'pnpm@12.5.1 --ignore-scripts',
    'pnpm install --frozen-lockfile && pnpm build',
    'COPY packaging/caddy/go.mod packaging/caddy/go.sum ./',
    'GOTOOLCHAIN=local go mod download && GOTOOLCHAIN=local go mod verify',
    'COPY packaging/caddy/main.go ./',
    'CGO_ENABLED=0 GOTOOLCHAIN=local go build -mod=readonly -trimpath',
    'COPY --from=edge-builder /edge/caddy /usr/bin/caddy',
    'apk --no-network del curl',
    'for package in curl libcurl brotli-libs',
    'apk --no-network info -e "$package"',
    'command -v wget >/dev/null',
    'USER 10001:10001',
    'ENTRYPOINT ["/usr/local/bin/fleetiq-edge"]',
    'test -z "$(getcap /usr/bin/caddy)"',
  ])
    ensure(text.includes(required), 'Production image recipe drift.');
  ensure(
    !text.includes('VITE_') && !text.includes('GITHUB_TOKEN'),
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
    scan.Results?.some((r) => r.Class === 'os-pkgs' && r.Packages?.length) &&
      scan.Results.some((r) => r.Type === 'gobinary' && r.Packages?.length),
    'Missing runtime OS/Go binary coverage.',
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
