import assert from 'node:assert/strict';
import test from 'node:test';
import { scanDiagnostic } from '../diagnostics.mjs';

test('scanner diagnostics expose counts and bounded IDs, never report text or secret matches', () => {
  const report = {
    Results: [
      {
        Target: 'private target',
        Secrets: [
          { Match: 'private credential', Code: { Lines: ['private source'] } },
        ],
        Vulnerabilities: [
          {
            Severity: 'HIGH',
            VulnerabilityID: 'CVE-2026-111943',
            PkgName: 'private package',
          },
          { Severity: 'CRITICAL', VulnerabilityID: 'private diagnostic bytes' },
          { Severity: 'LOW', VulnerabilityID: 'CVE-2026-9999' },
        ],
      },
    ],
  };
  const result = scanDiagnostic(report);
  assert.equal(result.findings, true);
  assert.match(result.message, /high=1, critical=1, secrets=1/u);
  assert.match(result.message, /CVE-2026-111943/u);
  assert.ok(!result.message.includes('private'));
  assert.ok(!result.message.includes('CVE-2026-9999'));
  const many = scanDiagnostic({
    Results: [
      {
        Vulnerabilities: Array.from({ length: 100 }, (_, n) => ({
          Severity: 'HIGH',
          VulnerabilityID: `CVE-2026-${1000 + n}`,
        })),
      },
    ],
  });
  assert.equal(many.message.match(/CVE-/gu).length, 8);
  assert.ok(many.message.length < 900);
});

test('absent, malformed and empty reports cannot produce a clean scanner result', () => {
  for (const report of [
    undefined,
    null,
    {},
    { Results: null },
    { Results: [] },
    { Results: [null] },
    { Results: [{ Vulnerabilities: [null] }] },
  ]) {
    assert.equal(scanDiagnostic(report).findings, false);
    assert.match(
      scanDiagnostic(report).message,
      /incomplete.*scanner-execution/u,
    );
  }
});
