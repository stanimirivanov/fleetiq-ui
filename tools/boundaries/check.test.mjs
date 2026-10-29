import assert from 'node:assert/strict';
import { readFileSync, renameSync, symlinkSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { boundaryFixture } from './fixtures.mjs';
import { assertBoundaryPolicy, BOUNDARY_POLICY } from './policy.mjs';

const negatives = [
  [
    'Effect pipe executor',
    "import { Effect } from 'effect'; export const probe = () => Effect.succeed(1).pipe(Effect.runPromise);",
    'unmanaged-effect-execution',
  ],
  [
    'transport callback reference',
    "export const probe = () => [fetch].map((request) => request('/data'));",
    'raw-browser-transport',
  ],
  [
    'aggregated Effect HTTP import',
    "import * as Http from 'effect/http'; export const probe = Http;",
    'network-client-import',
  ],
  [
    'Effect socket import',
    "import * as Socket from 'effect/socket'; export const probe = Socket;",
    'network-client-import',
  ],
  [
    'model worker execution',
    "export const probe = () => new Worker('/worker.js');",
    'model-browser-global',
    'apps/web/src/features/assets/model/probe.ts',
  ],
  [
    'bare fetch',
    "export const probe = () => fetch('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'qualified fetch',
    "export const probe = () => window.fetch('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'global bracket fetch',
    "export const probe = () => globalThis['fetch']('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'aliased fetch',
    "const request = fetch; export const probe = () => request('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'bound fetch alias',
    "const request = window.fetch.bind(window); export const probe = () => request('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'destructured fetch alias',
    "const { fetch: request } = globalThis; export const probe = () => request('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'qualified browser alias',
    "const browser = window; export const probe = () => browser.fetch('/api/v1/assets');",
    'raw-browser-transport',
  ],
  [
    'XMLHttpRequest',
    'export const probe = () => new XMLHttpRequest();',
    'raw-browser-transport',
  ],
  [
    'qualified EventSource',
    "export const probe = () => new window.EventSource('/events');",
    'raw-browser-transport',
  ],
  [
    'aliased WebSocket',
    "const Socket = globalThis.WebSocket; export const probe = () => new Socket('/socket');",
    'raw-browser-transport',
  ],
  [
    'navigator beacon',
    "export const probe = () => navigator.sendBeacon('/data', 'sample');",
    'raw-browser-transport',
  ],
  [
    'network package import',
    "import client from 'axios'; export const probe = client;",
    'network-client-import',
  ],
  [
    'Effect HTTP subpath import',
    "import type * as Http from 'effect/http/HttpClient'; export type Client = Http.HttpClient;",
    'network-client-import',
  ],
  [
    'dynamic network import',
    "export const probe = () => import('ky');",
    'network-client-import',
  ],
  [
    'network CommonJS import',
    "export const probe = () => require('undici');",
    'network-client-import',
  ],
  [
    'renamed Effect namespace',
    "import { Effect as E } from 'effect'; export const probe = () => E.runPromise(E.succeed(1));",
    'unmanaged-effect-execution',
  ],
  [
    'Effect root namespace',
    "import * as E from 'effect'; export const probe = () => E.Effect.runFork(E.Effect.succeed(1));",
    'unmanaged-effect-execution',
  ],
  [
    'Effect subpath namespace',
    "import * as E from 'effect/Effect'; export const probe = () => E.runSync(E.succeed(1));",
    'unmanaged-effect-execution',
  ],
  [
    'direct Effect executor',
    "import { runPromise as execute, succeed } from 'effect/Effect'; export const probe = () => execute(succeed(1));",
    'unmanaged-effect-execution',
  ],
  [
    'destructured Effect executor',
    "import { Effect as E } from 'effect'; const { runPromise: execute } = E; export const probe = () => execute(E.succeed(1));",
    'unmanaged-effect-execution',
  ],
  [
    'managed runtime outside owner',
    "import { ManagedRuntime } from 'effect'; const runtime = ManagedRuntime.make({}); export const probe = () => runtime.runPromise({});",
    'unmanaged-effect-execution',
  ],
  [
    'generated privilege does not cover neighbours',
    "import * as Http from 'effect/http/HttpClient'; export const probe = Http;",
    'network-client-import',
    'apps/web/src/generated/extra.ts',
  ],
  [
    'sample has no transport privilege',
    "export const probe = () => fetch('/data');",
    'raw-browser-transport',
    'apps/web/src/features/assets/api/sample-live-signal-service.ts',
  ],
  [
    'model browser object',
    'export const probe = () => document.title;',
    'model-browser-global',
    'apps/web/src/features/assets/model/probe.ts',
  ],
  [
    'model browser alias',
    'const browser = window; export const probe = () => browser.location.href;',
    'model-browser-global',
    'apps/web/src/shared/model/probe.ts',
  ],
  [
    'model scheduling',
    'export const probe = () => setTimeout(() => {}, 1);',
    'model-browser-global',
    'apps/web/src/features/assets/model/probe.ts',
  ],
];

test('real sensor permits owned transport, synthetic execution, ports and native auth navigation', (context) => {
  const result = boundaryFixture(context).run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Browser boundaries passed/u);
});

for (const [
  name,
  source,
  rule,
  file = 'apps/web/src/features/assets/api/probe.ts',
] of negatives) {
  test(`real sensor rejects ${name}`, (context) => {
    const fixture = boundaryFixture(context);
    fixture.write(file, `${source}\n`);
    const result = fixture.run();
    assert.equal(result.status, 1, result.stderr);
    assert.ok(result.stderr.includes(rule), result.stderr);
    assert.ok(!result.stdout.includes('passed'));
  });
}

test('symbol-resolved shadows and type-only Promise/AbortSignal contracts remain pure', (context) => {
  const fixture = boundaryFixture(context);
  fixture.write(
    'apps/web/src/features/assets/model/local.ts',
    'export function local(window: { title: string }, document: { id: string }) { return window.title + document.id; }\nexport interface Port { run(signal: AbortSignal): Promise<void>; }\n',
  );
  fixture.write(
    'apps/web/src/app/local.ts',
    "export function local(fetch: (input: string) => string) { return fetch('local'); }\n",
  );
  const result = fixture.run();
  assert.equal(result.status, 0, result.stderr);
});

test('known transport text inside comments and strings is not executable code', (context) => {
  const fixture = boundaryFixture(context);
  fixture.write(
    'apps/web/src/features/assets/model/text.ts',
    "export const label = 'window.fetch() Effect.runPromise()';\n// new WebSocket()\n",
  );
  assert.equal(fixture.run().status, 0);
});

test('syntax extraction failure cannot produce a clean pass', (context) => {
  const fixture = boundaryFixture(context);
  fixture.write(
    'apps/web/src/features/assets/model/broken.ts',
    'export const broken = ;\n',
  );
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /syntax extraction failed/u);
});

test('wrong registered adapter casing cannot produce a clean pass', (context) => {
  const fixture = boundaryFixture(context);
  const policy = 'tools/boundaries/policy.mjs';
  fixture.write(
    policy,
    readFileSync(path.join(fixture.root, policy), 'utf8').replace(
      'shared/api/browser-api.ts',
      'shared/api/Browser-api.ts',
    ),
  );
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /casing|does not exist/u);
});

test('missing registered owner cannot produce a clean pass', (context) => {
  const fixture = boundaryFixture(context);
  renameSync(
    path.join(fixture.root, 'apps/web/src'),
    path.join(fixture.root, 'apps/web/sources'),
  );
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /does not exist/u);
});

test('source junction or symlink escapes never enter AST extraction', (context) => {
  const fixture = boundaryFixture(context);
  symlinkSync(
    path.dirname(fixture.root),
    path.join(fixture.root, 'apps/web/src/escape'),
    'dir',
  );
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /rejects source symlinks/u);
});

test('disabled mandatory policy is rejected before a clean scan', (context) => {
  const fixture = boundaryFixture(context);
  const policy = 'tools/boundaries/policy.mjs';
  fixture.write(
    policy,
    readFileSync(path.join(fixture.root, policy), 'utf8').replace(
      'rules: REQUIRED_BOUNDARY_RULES,',
      'rules: [],',
    ),
  );
  const result = fixture.run();
  assert.equal(result.status, 1);
  assert.match(result.stderr, /every mandatory rule/u);
});

test('missing parser prerequisite is a failure, never a skipped scan', (context) => {
  const fixture = boundaryFixture(context);
  renameSync(
    path.join(fixture.root, 'node_modules'),
    path.join(fixture.root, 'unavailable-parser'),
  );
  const result = fixture.run();
  assert.notEqual(result.status, 0);
  assert.ok(!result.stdout.includes('passed'));
});

test('policy cannot grant anonymous or model/test privileges', () => {
  for (const invalid of [
    {
      ...BOUNDARY_POLICY,
      adapters: [{ ...BOUNDARY_POLICY.adapters[0], owner: '' }],
    },
    {
      ...BOUNDARY_POLICY,
      adapters: [
        {
          ...BOUNDARY_POLICY.adapters[0],
          file: 'apps/web/src/shared/model/escape.ts',
        },
      ],
    },
    {
      ...BOUNDARY_POLICY,
      adapters: [
        {
          ...BOUNDARY_POLICY.adapters[0],
          file: 'apps/web/src/shared/api/escape.test.ts',
        },
      ],
    },
  ])
    assert.throws(() => assertBoundaryPolicy(invalid), /privileges require/u);
});

test('map SDK imports require the exact lifecycle adapter', (context) => {
  const f = boundaryFixture(context);
  f.write(
    'apps/web/src/features/assets/ui/BadMap.tsx',
    "import {Map} from 'maplibre-gl'; export const bad=Map;",
  );
  const result = f.run();
  assert.notEqual(result.status, 0);
  assert.match(result.stderr, /network-client-import/);
});
