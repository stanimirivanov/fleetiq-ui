import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repositoryRoot = fileURLToPath(new URL('../../', import.meta.url));
const require = createRequire(import.meta.url);

const sourceFiles = {
  'apps/web/src/app/composition.ts':
    'export interface AppOnly { readonly id: string; }\nexport const appValue = 1;\n',
  'apps/web/src/app/public.ts':
    "import { AssetCard } from '#features/assets';\nimport { Button } from '#shared/ui';\nimport { runtime } from '#shared/api';\nimport { modelValue } from '#shared/model';\nexport const composition = [AssetCard, Button, runtime, modelValue];\n",
  'apps/web/src/features/assets/model/value.ts':
    'export interface Asset { readonly id: string; }\nexport const assetValue = 1;\n',
  'apps/web/src/features/assets/ui/AssetCard.tsx':
    "import type { Asset } from '../model/value';\nexport function AssetCard(props: { readonly asset: Asset }) { return <div>{props.asset.id}</div>; }\n",
  'apps/web/src/features/assets/api/reader.ts':
    "import type { Asset } from '../model/value';\nexport const readAsset = (asset: Asset) => asset.id;\n",
  'apps/web/src/features/assets/index.ts':
    "export { AssetCard } from './ui/AssetCard';\nexport type { Asset } from './model/value';\n",
  'apps/web/src/features/identity/model/session.ts':
    'export const session = 1;\n',
  'apps/web/src/features/identity/index.ts':
    "export { session } from './model/session';\n",
  'apps/web/src/shared/model/value.ts': 'export const modelValue = 1;\n',
  'apps/web/src/shared/model/index.ts':
    "export { modelValue } from './value';\n",
  'apps/web/src/shared/api/runtime.ts': 'export const runtime = 1;\n',
  'apps/web/src/shared/api/index.ts': "export { runtime } from './runtime';\n",
  'apps/web/src/shared/ui/Button.tsx':
    'export function Button() { return <button type="button">Action</button>; }\n',
  'apps/web/src/shared/ui/index.ts': "export { Button } from './Button';\n",
  'apps/web/src/generated/wire.ts':
    'export interface Wire { readonly id: string; }\nexport const wire = 1;\n',
};

/** Own all fixture files and cleanup; the product checkout is never a probe target. */
export function architectureFixture(context, options = {}) {
  const root = mkdtempSync(path.join(tmpdir(), 'fleetiq-architecture-test-'));
  context.after(() => {
    const parent = path.resolve(tmpdir()) + path.sep;
    if (!path.resolve(root).startsWith(parent))
      throw new Error('Unsafe fixture cleanup');
    rmSync(root, { recursive: true, force: true });
  });
  function write(relative, contents) {
    const target = path.resolve(root, relative);
    if (!target.startsWith(root + path.sep))
      throw new Error('Fixture path escapes owner');
    mkdirSync(path.dirname(target), { recursive: true });
    writeFileSync(target, contents, 'utf8');
  }
  const dependencyConfiguration = structuredClone(
    require(path.join(repositoryRoot, '.dependency-cruiser.cjs')),
  );
  const biomeConfiguration = JSON.parse(
    readFileSync(path.join(repositoryRoot, 'biome.json'), 'utf8'),
  );
  options.mutateDependencies?.(dependencyConfiguration);
  options.mutateBiome?.(biomeConfiguration);
  write(
    '.dependency-cruiser.cjs',
    `module.exports = ${JSON.stringify(dependencyConfiguration)};\n`,
  );
  write('biome.json', JSON.stringify(biomeConfiguration));
  write(
    'package.json',
    '{"name":"private-architecture-fixture","private":true}\n',
  );
  write(
    'apps/web/package.json',
    readFileSync(path.join(repositoryRoot, 'apps/web/package.json'), 'utf8'),
  );
  symlinkSync(
    path.join(repositoryRoot, 'node_modules'),
    path.join(root, 'node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  symlinkSync(
    path.join(repositoryRoot, 'apps/web/node_modules'),
    path.join(root, 'apps/web/node_modules'),
    process.platform === 'win32' ? 'junction' : 'dir',
  );
  for (const [file, contents] of Object.entries(sourceFiles))
    write(file, contents);
  return { root, write };
}
