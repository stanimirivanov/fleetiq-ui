/** Synthetic test evidence only. Never imported by product code. */
export function diagnosticsEvidence(populated = false) {
  const frames = populated
    ? Array.from({ length: 64 }, (_, i) => ({
        message_id: `frame-${String(64 - i).padStart(3, '0')}`,
        package_id: 'teltonika.avl',
        package_version: '1',
        received_at_ms: 1700000000000 - i,
        processing:
          (
            [
              'decoded',
              'queued',
              'leased',
              'expired',
              'poisoned',
              'accepted',
            ] as const
          )[i % 6] ?? 'accepted',
        observation_count: i === 0 ? 128 : i % 6 === 0 ? 0 : null,
      }))
    : [];
  return {
    observed_at_ms: 1700000001000,
    connection_liveness: 'not_observed' as const,
    worker_liveness: 'not_observed' as const,
    coverage: {
      frame_limit: 64 as const,
      output_limit_per_frame: 64 as const,
      source_limit: 128 as const,
      frames_truncated: populated,
      observations_truncated: populated,
      sources_truncated: false,
    },
    frames,
    sources: populated
      ? [
          {
            package_id: 'teltonika.avl',
            package_version: '1',
            endpoint_id: 'can-primary',
            signal_id: 'battery.voltage',
          },
        ]
      : [],
  };
}
export const storedRelease = {
  package_id: 'teltonika.avl',
  package_version: '1',
  artifact_sha256: 'a'.repeat(64),
  artifact_size_bytes: 1024,
};
export const activeRoute = {
  device_asset_id: 'gateway-new',
  channel_id: 'tcp',
  revision: 1,
  selection: {
    package_id: 'teltonika.avl',
    package_version: '1',
    world: 'identity-v1' as const,
  },
  policy_version: 1,
  actor_id: 'operator-a',
  recorded_at_ms: 1700000000000,
};
