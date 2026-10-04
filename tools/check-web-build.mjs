import assert from 'node:assert/strict';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const dist = new URL('../apps/web/dist/', import.meta.url);
const entries = await readdir(dist, { recursive: true, withFileTypes: true });
assert(
  !entries.some(
    (entry) => entry.isFile() && entry.name === 'mockServiceWorker.js',
  ),
  'Production build must not ship the MSW worker',
);

const markers = [
  'Primary machine',
  'urn:fleetiq:problem:unauthorized',
  'mockServiceWorker.js',
];
for (const entry of entries) {
  if (!entry.isFile() || !entry.name.endsWith('.js')) continue;
  const source = await readFile(join(entry.parentPath, entry.name), 'utf8');
  for (const marker of markers) {
    assert(
      !source.includes(marker),
      'Production JavaScript contains synthetic API mock data',
    );
  }
}
console.log(
  'Production web build excludes the worker and synthetic API fixtures',
);
