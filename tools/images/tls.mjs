/** Bounded, offline fixture certificate generation; no host trust is changed. */
import { resolve } from 'node:path';
import { ensure } from './policy.mjs';
import { docker } from './process.mjs';
export async function fixtureCertificates(tools, resources) {
  const volume = await resources.volume('tls');
  const init = await resources.container(
    'tls-init',
    [
      '--user',
      '0:0',
      '--read-only',
      '--cap-drop',
      'ALL',
      '--cap-add',
      'CHOWN',
      '--security-opt',
      'no-new-privileges:true',
      '--memory',
      '64m',
      '--pids-limit',
      '32',
      '--volume',
      `${volume}:/tls`,
      '--volume',
      `${resolve('tools/images/fixtures')}:/fixture:ro`,
      '--entrypoint',
      '/bin/sh',
      tools.tls,
      '/fixture/tls-init.sh',
    ],
    'none',
  );
  ensure(
    (await docker(['wait', init], { timeout: 30000 })).trim() === '0',
    'Synthetic certificate generation failed.',
  );
  return volume;
}
