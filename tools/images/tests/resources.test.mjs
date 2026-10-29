import assert from 'node:assert/strict';
import test from 'node:test';
import { assertOwnedVolume } from '../resources.mjs';

test('TLS volume cleanup requires both registered name and exact owner', () => {
  const owner = {
    volumes: ['fixture-tls'],
    label: 'fixture-owner',
    id: 'owner-a',
  };
  const metadata = {
    Name: 'fixture-tls',
    Labels: { 'fixture-owner': 'owner-a' },
  };
  assert.doesNotThrow(() => assertOwnedVolume(metadata, 'fixture-tls', owner));
  for (const candidate of [
    { ...metadata, Name: 'other-volume' },
    { ...metadata, Labels: { 'fixture-owner': 'owner-b' } },
    { ...metadata, Labels: {} },
  ])
    assert.throws(() => assertOwnedVolume(candidate, 'fixture-tls', owner));
  assert.throws(() =>
    assertOwnedVolume(metadata, 'fixture-tls', { ...owner, volumes: [] }),
  );
});
