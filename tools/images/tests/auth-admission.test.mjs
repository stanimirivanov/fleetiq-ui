import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const main = readFileSync(
  new URL('../../../packaging/nginx/nginx.conf.template', import.meta.url),
  'utf8',
);

test('only the two sign-in routes use shared peer and edge admission limits', () => {
  assert.match(
    main,
    /limit_req_zone \$binary_remote_addr zone=auth_peer:1m rate=5r\/s;/u,
  );
  assert.match(
    main,
    /limit_req_zone \$server_name zone=auth_edge:1m rate=20r\/s;/u,
  );
  for (const route of ['login', 'callback']) {
    const block = main.match(
      new RegExp(`location = /api/v1/auth/${route} \\{([^}]+)\\}`, 'u'),
    )?.[1];
    assert.ok(block, `Missing exact ${route} admission location`);
    assert.match(block, /limit_req zone=auth_peer burst=10 nodelay;/u);
    assert.match(block, /limit_req zone=auth_edge burst=24 nodelay;/u);
    assert.match(block, /limit_req_status 429;/u);
    assert.match(block, /include @@SCRATCH@@\/proxy.conf;/u);
  }
  assert.equal((main.match(/\blimit_req zone=/gu) ?? []).length, 4);
});
