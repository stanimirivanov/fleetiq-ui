import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { generateAssetContract } from './sensors/asset-generation.mjs';
import { runEntrypoint } from './sensors/entrypoint.mjs';

await runEntrypoint(import.meta.url, async () => {
  const check = process.argv.includes('--check');
  const result = await generateAssetContract({
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
    provenancePath: fileURLToPath(
      new URL(
        '../apps/web/src/generated/fleetiq-api.provenance.json',
        import.meta.url,
      ),
    ),
    generatorVersion: JSON.parse(
      readFileSync(
        new URL(
          '../node_modules/@effect/openapi-generator/package.json',
          import.meta.url,
        ),
        'utf8',
      ),
    ).version,
    check,
  });
  console.log(
    result.generatorDrift
      ? 'Generator maintenance output differs; committed client and pinned OpenAPI match generation provenance. Regenerate when updating the client.'
      : check
        ? 'Generated FleetIQ HTTP contract matches pinned OpenAPI'
        : 'Generated FleetIQ HTTP contract from pinned OpenAPI',
  );
});
