import assert from 'node:assert/strict';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import test from 'node:test';
import { qualityPolicy } from '../../quality/policy.mjs';
import { inspectLayout } from '../oci.mjs';
import { CHECKS, hash, REPOSITORY } from '../policy.mjs';
import { requirePublishedTag, validateEvidence } from '../publication.mjs';
import { layoutFixture } from './fixtures.mjs';

test('discovery tag must resolve to the qualified OCI digest', () => {
  const digest = `sha256:${'a'.repeat(64)}`;
  const response = (status, actual) =>
    new Response(null, {
      status,
      headers: { 'docker-content-digest': actual },
    });
  assert.doesNotThrow(() => requirePublishedTag(response(200, digest), digest));
  assert.throws(() =>
    requirePublishedTag(response(200, `sha256:${'b'.repeat(64)}`), digest),
  );
  assert.throws(() => requirePublishedTag(response(404, digest), digest));
});

function evidence() {
  const f = layoutFixture();
  const reports = join(f.directory, 'reports');
  mkdirSync(reports);
  const artifact = inspectLayout(f.layout, f.revision);
  const source = { repository: REPOSITORY, revision: f.revision, dirty: false };
  const now = Date.now();
  const values = {
    bundle: {
      passed: true,
      files: 2,
      modules: 2,
      graphDigest: artifact.config,
      javascriptBytes: 100,
      javascriptGzipBytes: 50,
      cssBytes: 50,
      cssGzipBytes: 25,
      map: {
        javascriptBytes: 200,
        javascriptGzipBytes: 100,
        cssBytes: 100,
        cssGzipBytes: 50,
      },
    },
    scan: {
      SchemaVersion: 2,
      Metadata: { ImageID: artifact.config, OS: { Family: 'alpine' } },
      Results: [
        {
          Class: 'os-pkgs',
          Packages: [{ Name: 'musl' }, { Name: 'nginx', Version: '1.30.6-r1' }],
        },
      ],
    },
    scanner: {
      Version: '0.76.0',
      VulnerabilityDB: {
        Version: 2,
        UpdatedAt: new Date(now - 1000).toISOString(),
        NextUpdate: new Date(now + 100000).toISOString(),
      },
    },
  };
  const save = (name, value) =>
    writeFileSync(join(reports, `${name}.json`), JSON.stringify(value));
  for (const [name, value] of Object.entries(values)) save(name, value);
  for (const name of ['sbom', 'provenance'])
    writeFileSync(join(reports, `${name}.json`), artifact[name].bytes);
  const receipt = (name) => ({
    digest: `sha256:${hash(readFileSync(join(reports, `${name}.json`)))}`,
  });
  const record = {
    format: 'fleetiq-ux-image-qualification.v1',
    outcome: 'passed',
    source,
    platform: 'linux/amd64',
    image: {
      digest: artifact.digest,
      config: artifact.config,
      manifest: artifact.manifest,
    },
    bundle: receipt('bundle'),
    scan: { ...receipt('scan'), outcome: 'passed' },
    sbom: receipt('sbom'),
    provenance: receipt('provenance'),
    checks: [...CHECKS],
  };
  save('qualification', record);
  return { ...f, source, now, record, values, save };
}
test('publication requires identical clean source and all bound original evidence', () => {
  const f = evidence();
  try {
    assert.equal(
      validateEvidence(f.directory, f.source, f.now).artifact.digest,
      f.record.image.digest,
    );
    assert.throws(() =>
      validateEvidence(f.directory, { ...f.source, dirty: true }, f.now),
    );
    assert.throws(() =>
      validateEvidence(
        f.directory,
        { ...f.source, revision: 'b'.repeat(40) },
        f.now,
      ),
    );
    assert.throws(() =>
      validateEvidence(f.directory, f.source, f.now + 86400001),
    );
    for (const name of ['bundle', 'scan', 'sbom', 'provenance']) {
      const path = join(f.directory, 'reports', `${name}.json`);
      const bytes = readFileSync(path);
      writeFileSync(path, Buffer.concat([bytes, Buffer.from(' ')]));
      assert.throws(() => validateEvidence(f.directory, f.source, f.now));
      writeFileSync(path, bytes);
    }
    f.save('qualification', { ...f.record, checks: CHECKS.slice(1) });
    assert.throws(() => validateEvidence(f.directory, f.source, f.now));
  } finally {
    f.cleanup();
  }
});
test('rehashing a scan finding or excessive bundle does not bypass semantic gates', () => {
  const f = evidence();
  try {
    f.values.scan.Results[0].Vulnerabilities = [{ Severity: 'CRITICAL' }];
    f.save('scan', f.values.scan);
    f.record.scan.digest = `sha256:${hash(readFileSync(join(f.directory, 'reports/scan.json')))}`;
    f.save('qualification', f.record);
    assert.throws(() => validateEvidence(f.directory, f.source, f.now));
    delete f.values.scan.Results[0].Vulnerabilities;
    f.save('scan', f.values.scan);
    f.record.scan.digest = `sha256:${hash(readFileSync(join(f.directory, 'reports/scan.json')))}`;
    f.values.bundle.javascriptBytes = Number.MAX_SAFE_INTEGER;
    f.save('bundle', f.values.bundle);
    f.record.bundle.digest = `sha256:${hash(readFileSync(join(f.directory, 'reports/bundle.json')))}`;
    f.save('qualification', f.record);
    assert.throws(() => validateEvidence(f.directory, f.source, f.now));
  } finally {
    f.cleanup();
  }
});

for (const key of Object.keys(qualityPolicy.bundle.map)) {
  for (const defect of ['missing', 'over-budget']) {
    test(`publication rejects rehashed lazy map ${key} ${defect}`, () => {
      const f = evidence();
      try {
        // Establish a valid receipt first so an unrelated stale fixture cannot
        // make this negative control pass before the map check is exercised.
        assert.equal(
          validateEvidence(f.directory, f.source, f.now).artifact.digest,
          f.record.image.digest,
        );
        if (defect === 'missing') delete f.values.bundle.map[key];
        else f.values.bundle.map[key] = qualityPolicy.bundle.map[key] + 1;
        f.save('bundle', f.values.bundle);
        f.record.bundle.digest = `sha256:${hash(readFileSync(join(f.directory, 'reports/bundle.json')))}`;
        f.save('qualification', f.record);
        assert.throws(
          () => validateEvidence(f.directory, f.source, f.now),
          /Lazy map bundle evidence/,
        );
      } finally {
        f.cleanup();
      }
    });
  }
}

test('publication rejects a rehashed receipt with the entire map group omitted', () => {
  const f = evidence();
  try {
    assert.equal(
      validateEvidence(f.directory, f.source, f.now).artifact.digest,
      f.record.image.digest,
    );
    delete f.values.bundle.map;
    f.save('bundle', f.values.bundle);
    f.record.bundle.digest = `sha256:${hash(readFileSync(join(f.directory, 'reports/bundle.json')))}`;
    f.save('qualification', f.record);
    assert.throws(
      () => validateEvidence(f.directory, f.source, f.now),
      /Lazy map bundle evidence/,
    );
  } finally {
    f.cleanup();
  }
});
