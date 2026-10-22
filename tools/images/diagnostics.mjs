/** Only bounded advisory identifiers/counts leave scanner reports; never matches or code. */
export function scanDiagnostic(scan) {
  let high = 0,
    critical = 0,
    secrets = 0;
  const ids = new Set();
  for (const result of Array.isArray(scan?.Results) ? scan.Results : []) {
    if (!result || typeof result !== 'object') continue;
    secrets += Array.isArray(result.Secrets) ? result.Secrets.length : 0;
    for (const finding of Array.isArray(result.Vulnerabilities)
      ? result.Vulnerabilities
      : []) {
      if (!finding || typeof finding !== 'object') continue;
      if (finding.Severity === 'HIGH') high++;
      else if (finding.Severity === 'CRITICAL') critical++;
      else continue;
      const id = finding.VulnerabilityID;
      if (
        typeof id === 'string' &&
        id.length <= 80 &&
        /^(?:CVE-\d{4}-\d{4,}|GO-\d{4}-\d{4,}|GHSA-[a-z0-9]{4}-[a-z0-9]{4}-[a-z0-9]{4})$/u.test(
          id,
        ) &&
        ids.size < 8
      )
        ids.add(id);
    }
  }
  const findings = high + critical + secrets > 0;
  return {
    findings,
    message: findings
      ? `Runtime security scan rejected (category=security-findings, high=${high}, critical=${critical}, secrets=${secrets}, advisories=${[...ids].sort().join(',') || 'none'}); inspect retained scan.json.`
      : 'Runtime security scan incomplete (category=scanner-execution); inspect scanner diagnostics and retained scan.json when present.',
  };
}
