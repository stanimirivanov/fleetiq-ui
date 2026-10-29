/** Security preflight uses the same build and scanner but cannot attest runtime behavior. */
export function qualificationMode(mode) {
  if (mode === 'full')
    return { format: 'fleetiq-ux-image-qualification.v1', securityOnly: false };
  if (mode !== 'security') throw new Error('Unknown image qualification mode.');
  return {
    format: 'fleetiq-ui-image-security.v1',
    securityOnly: true,
    checks: ['oci-metadata', 'runtime-security-scan', 'cleanup'],
    roles: ['scanner', 'node', 'edge', 'frontend', 'buildkit', 'sbom'],
  };
}
