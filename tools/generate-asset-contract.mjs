import { fileURLToPath } from 'node:url';
import { generateAssetContract } from './sensors/asset-generation.mjs';
import { runEntrypoint } from './sensors/entrypoint.mjs';

await runEntrypoint(import.meta.url, async () => {
  const check = process.argv.includes('--check');
  await generateAssetContract({
    repositoryRoot: fileURLToPath(new URL('../', import.meta.url)),
    specPath: fileURLToPath(
      new URL(
        '../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
        import.meta.url,
      ),
    ),
    outputPath: fileURLToPath(
      new URL('../apps/web/src/generated/fleetiq-api.ts', import.meta.url),
    ),
    generatorPath: fileURLToPath(
      new URL(
        '../node_modules/@effect/openapi-generator/dist/bin.js',
        import.meta.url,
      ),
    ),
    check,
  });
  console.log(
    check
      ? 'Generated FleetIQ HTTP contract matches pinned OpenAPI'
      : 'Generated FleetIQ HTTP contract from pinned OpenAPI',
  );
});
