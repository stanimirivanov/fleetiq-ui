/** Hash browser-parsed inline bootstrap scripts; never permit arbitrary inline JS. */
import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const require = createRequire(
  new URL('../../apps/web/package.json', import.meta.url),
);
const { JSDOM } = require('jsdom');
export function inlineScriptHashes(html) {
  const dom = new JSDOM(html);
  try {
    return [...dom.window.document.querySelectorAll('script:not([src])')].map(
      (script) =>
        `'sha256-${createHash('sha256').update(script.textContent).digest('base64')}'`,
    );
  } finally {
    dom.window.close();
  }
}
export function cspFor(html) {
  return `default-src 'self'; script-src 'self' ${inlineScriptHashes(html).join(' ')}; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self'; worker-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'`;
}
if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  writeFileSync(
    process.argv[3],
    `add_header Content-Security-Policy "${cspFor(readFileSync(process.argv[2], 'utf8'))}" always;\n`,
  );
}
