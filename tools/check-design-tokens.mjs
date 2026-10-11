import { checkDesignTokens } from './sensors/design-tokens.mjs';
import { runEntrypoint } from './sensors/entrypoint.mjs';

await runEntrypoint(import.meta.url, async () => {
  await checkDesignTokens({
    stylesheetPath: new URL(
      '../apps/web/src/design-system/tokens.css',
      import.meta.url,
    ),
  });
  console.log('Light and dark semantic token contrast pairs pass.');
});
