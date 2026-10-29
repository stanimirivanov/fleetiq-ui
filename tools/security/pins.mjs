/** Reviewed official archive hashes; never trust a fetched checksum file. */
export const GITLEAKS_VERSION = '8.30.1';
export const RELEASES = {
  'linux-x64': [
    'linux_x64.tar.gz',
    '551f6fc83ea457d62a0d98237cbad105af8d557003051f41f3e7ca7b3f2470eb',
  ],
  'linux-arm64': [
    'linux_arm64.tar.gz',
    'e4a487ee7ccd7d3a7f7ec08657610aa3606637dab924210b3aee62570fb4b080',
  ],
};
export function releaseFor(
  platform = process.platform,
  architecture = process.arch,
) {
  const release = RELEASES[`${platform}-${architecture}`];
  if (!release)
    throw new Error('Pinned Gitleaks supports Linux x64 and arm64.');
  return {
    name: `gitleaks_${GITLEAKS_VERSION}_${release[0]}`,
    digest: release[1],
  };
}
