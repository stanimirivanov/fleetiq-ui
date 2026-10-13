import { requireUnrecordedMeasurement } from '../../../tools/quality/policy.mjs';
import { test } from './production-test';

/** Preserve production/error guards while enforcing recorder-free resource measurements. */
export const measurementTest = test.extend<{
  measurementRecordingGuard: undefined;
}>({
  measurementRecordingGuard: [
    async ({ trace, video }, use) => {
      requireUnrecordedMeasurement(trace, video);
      await use(undefined);
    },
    { auto: true },
  ],
});
