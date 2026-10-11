import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { temporary } from './owned.mjs';
import { command } from './process.mjs';

/** Never expose private matches, identity, detector errors, or credential filenames. */
export function safeReport(stdout, status, exceptions = []) {
  let findings;
  try {
    findings = JSON.parse(stdout);
  } catch {
    throw new Error('Secret detector report is malformed; no clean result.');
  }
  if (!Array.isArray(findings) || (status === 23) !== findings.length > 0)
    throw new Error('Secret detector result/status contradicts its findings.');
  for (const finding of findings) {
    if (
      !/^[-a-z0-9_]{1,120}$/iu.test(finding.RuleID) ||
      !Number.isSafeInteger(finding.StartLine) ||
      finding.StartLine < 1 ||
      typeof finding.File !== 'string' ||
      !finding.File ||
      typeof finding.Secret !== 'string' ||
      !finding.Secret
    )
      throw new Error('Secret detector report lacks qualified metadata.');
  }
  const secrets = [...new Set(findings.map((finding) => finding.Secret))].sort(
    (a, b) => b.length - a.length,
  );
  const redact = (value) =>
    secrets.reduce(
      (text, secret) => text.replaceAll(secret, 'REDACTED'),
      value,
    );
  const selected = findings.filter(
    (finding) =>
      !exceptions.some(
        (exception) =>
          exception.rule === finding.RuleID &&
          exception.path ===
            finding.File.replaceAll('\\', '/').replace(/^\.\//u, '') &&
          exception.value === finding.Secret,
      ),
  );
  const rules = [
    ...new Set(selected.map((finding) => redact(finding.RuleID))),
  ].sort();
  const locations = selected.map(
    (finding) =>
      `${JSON.stringify(redact(finding.File).slice(0, 240))}:${finding.StartLine}`,
  );
  return { findings: selected.length, rules, locations };
}
export function detectorScan(
  detector,
  directory,
  { history, run, exceptions = [] } = {},
) {
  const options = temporary();
  try {
    const config = path.join(options.root, 'defaults.toml');
    const ignores = path.join(options.root, 'empty-ignore');
    writeFileSync(config, '[extend]\nuseDefault = true\n');
    writeFileSync(ignores, '');
    const args = [
      history ? 'git' : 'dir',
      '.',
      '--config',
      config,
      '--gitleaks-ignore-path',
      ignores,
      '--ignore-gitleaks-allow',
      '--redact=0',
      '--no-banner',
      '--no-color',
      '--report-format',
      'json',
      '--report-path',
      '-',
      '--exit-code',
      '23',
      '--timeout',
      '120',
      '--max-archive-depth',
      '4',
      '--max-decode-depth',
      '5',
    ];
    if (history)
      args.push(
        '--log-opts',
        `--text --no-ext-diff --no-textconv --no-renames ${history}`,
      );
    const result = command(detector.executable, args, {
      cwd: directory,
      run,
      accepted: [0, 23],
    });
    // Private JSON exists only in a bounded in-memory pipe; stdout/stderr are
    // never forwarded or persisted. Redact values even if embedded in paths.
    const report = safeReport(result.stdout, result.status, exceptions);
    if (report.findings)
      throw new Error(
        `Secret scan rejected ${report.findings} finding(s), rules: ${report.rules.join(', ')}, locations: ${report.locations.join(', ')}; inspect privately and follow SECURITY.md.`,
      );
    return report;
  } finally {
    options.dispose();
  }
}
