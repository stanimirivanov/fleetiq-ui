import { checkAssetContract } from './sensors/asset-contract.mjs';
import { runEntrypoint } from './sensors/entrypoint.mjs';

await runEntrypoint(import.meta.url, async () => {
  const result = await checkAssetContract({
    contractPath: new URL(
      '../contracts/http/fleetiq-v1-ui-baseline.openapi.json',
      import.meta.url,
    ),
    provenancePath: new URL('../contracts/http/source.json', import.meta.url),
  });
  console.log(
    `Pinned FleetIQ browser metadata contract matches ${result.commit}`,
  );
});
