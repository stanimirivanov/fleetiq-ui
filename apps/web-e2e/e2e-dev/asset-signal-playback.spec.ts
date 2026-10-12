import { expect, test } from '../fixtures/browser-quality-test';
import { AssetInspectorPage } from '../pages/asset-inspector.page';
import { ShellPage } from '../pages/shell.page';

type ObservedPlayback = HTMLElement & {
  __transcript?: string[];
  __observer?: MutationObserver;
};

test('synthetic rail playback exposes recovery and freshness without changing fixed evidence', async ({
  page,
}) => {
  const inspector = new AssetInspectorPage(page);
  await inspector.openSample('asset-004');

  await expect(inspector.playback).toContainText('Connection: Ready to play');
  await expect(inspector.playback).toContainText('Sample data · simulation');
  const fixedReading = inspector.componentEvidence
    .getByRole('article')
    .filter({
      hasText: 'Illustrative band',
    })
    .first();
  const fixedBefore = await fixedReading.textContent();

  // Capture short-lived states without making browser assertions depend on
  // Playwright polling speed or a timeout chosen for the demonstration.
  await inspector.playback.evaluate((section) => {
    const observed = section as ObservedPlayback;
    observed.__transcript = [];
    observed.__observer = new MutationObserver(() => {
      observed.__transcript?.push(section.textContent ?? '');
    });
    observed.__observer.observe(section, {
      subtree: true,
      childList: true,
      characterData: true,
    });
  });

  await inspector.startPlayback();
  await expect(inspector.playback).toContainText(
    'Connection: Playback complete',
    {
      timeout: 25_000,
    },
  );
  const temperature = inspector.playbackReading('Motor temperature');
  await expect(temperature.getByText('71', { exact: true })).toBeVisible();
  await expect(temperature).toContainText('Freshness · stale');
  await expect(temperature).toContainText('Late arrival');
  await expect(temperature).toContainText('sample-binding-motor-temperature');
  await expect(inspector.playbackReading('Traction power')).toContainText(
    'Freshness · stale',
  );
  expect(await fixedReading.textContent()).toBe(fixedBefore);

  const transcript = await inspector.playback.evaluate((section) => {
    const observed = section as ObservedPlayback;
    observed.__observer?.disconnect();
    return observed.__transcript ?? [];
  });
  for (const transition of [
    '1 duplicate ignored',
    'Recovery: Resnapshot required',
    'Connection: Reconnecting to sample stream',
    'Recovery: In sync',
  ]) {
    expect(transcript.some((text) => text.includes(transition))).toBe(true);
  }

  await inspector.replay();
  await expect(inspector.playback).toContainText(
    'Connection: Playback complete',
    {
      timeout: 25_000,
    },
  );
  expect(await fixedReading.textContent()).toBe(fixedBefore);
});

test('selection, tab changes, and navigation dispose the selected signal subscription', async ({
  page,
}) => {
  const inspector = new AssetInspectorPage(page);
  await inspector.openSample('asset-004');
  await inspector.startPlayback();
  await expect(inspector.playback).toContainText('Connection: Playing', {
    timeout: 10_000,
  });
  await inspector.stopPlayback();
  await expect(inspector.playback).toContainText(
    'Connection: Playback stopped',
  );
  await inspector.replay();
  await inspector.selectNode('Traction motor B');
  await expect(inspector.playback).toHaveCount(0);

  await inspector.selectNode('Battery management system');
  await expect(inspector.playback).toContainText(
    'No sample scenario for this component',
  );
  await expect(
    inspector.playback.getByRole('button', { name: 'Play', exact: true }),
  ).toBeDisabled();

  await inspector.selectNode('Traction motor A');
  await expect(inspector.playback).toContainText('Connection: Ready to play');
  await inspector.startPlayback();
  await inspector.componentEvidence
    .getByRole('tab', { name: 'Details' })
    .click();
  await expect(inspector.playback).toHaveCount(0);
  await inspector.componentEvidence
    .getByRole('tab', { name: 'Overview' })
    .click();
  await expect(inspector.playback).toContainText('Connection: Ready to play');

  await inspector.startPlayback();
  await page.goto('/assets?preview=sample');
  await expect(inspector.playback).toHaveCount(0);
});

test('missing trailer observation stays missing through playback in narrow dark layout', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const inspector = new AssetInspectorPage(page);
  const shell = new ShellPage(page);
  await inspector.openSample('asset-008');

  await expect(inspector.playback).toContainText('Connection: Ready to play');
  const freezer = inspector.playbackReading('Freezer air temperature');
  await expect(freezer).toContainText('No played observation');
  await inspector.startPlayback();
  await expect(inspector.playback).toContainText(
    'Connection: Playback complete',
    {
      timeout: 10_000,
    },
  );
  await expect(freezer).toContainText('Freshness · missing');
  await expect(freezer).not.toContainText('0 °C');

  await shell.themeButton.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
});
