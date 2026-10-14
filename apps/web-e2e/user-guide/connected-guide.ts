import type { Browser } from '@playwright/test';
import {
  installMetadataApi,
  type MetadataMockOptions,
} from '../fixtures/metadata-api';
import { type StartGuideOptions, UserGuideSession } from './user-guide-session';

type Definition = Omit<StartGuideOptions, 'baseURL' | 'dataMode'>;
type ContractFixture = Awaited<ReturnType<typeof installMetadataApi>>;

/** Own a production-UI demonstration with synthetic contract responses only. */
export async function connectedGuide(
  browser: Browser,
  baseURL: string | undefined,
  definition: Definition,
  options: MetadataMockOptions,
  journey: (guide: UserGuideSession, api: ContractFixture) => Promise<void>,
): Promise<void> {
  const guide = await UserGuideSession.start(browser, {
    ...definition,
    baseURL: baseURL ?? 'http://127.0.0.1:4173',
    dataMode: 'connected-contract',
  });
  try {
    const api = await installMetadataApi(guide.page, options);
    await journey(guide, api);
    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
}
