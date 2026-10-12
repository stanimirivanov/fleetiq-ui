import { expect, test } from '../fixtures/browser-quality-test';
import { AssetInspectorPage } from '../pages/asset-inspector.page';
import { UserGuideSession } from '../user-guide/user-guide-session';

/**
 * A synthetic asset journey that verifies identity, provenance, gaps, and
 * playback before recording any guide narration.
 */
test('trace sample component evidence and recognize missing telemetry', {
  tag: '@user-guide',
}, async ({ baseURL, browser }) => {
  test.setTimeout(180_000);
  const guide = await UserGuideSession.start(browser, {
    baseURL: baseURL ?? 'http://127.0.0.1:5173',
    dataMode: 'development-sample',
    order: 40,
    slug: 'asset-inspector',
    title: 'Trace evidence in the sample asset inspector',
    summary:
      'Follow a synthetic locomotive component through topology, source attribution, history gaps, and signal playback, then inspect missing evidence.',
  });

  try {
    const inspector = new AssetInspectorPage(guide.page, guide);

    await test.step('Open a clearly labelled synthetic locomotive', async () => {
      await inspector.openSample('asset-004');
      await expect(inspector.heading).toHaveText('Electric locomotive 417');
      await expect(guide.page.getByRole('banner')).toContainText('Sample data');
      for (const panel of [
        inspector.topology,
        inspector.componentEvidence,
        inspector.context,
      ]) {
        await expect(panel).toBeVisible();
        await expect(
          panel.getByText('Sample data', { exact: true }).first(),
        ).toBeVisible();
      }
      for (const component of [
        'Traction motor A',
        'Battery management system',
        'Telemetry gateway',
      ]) {
        await expect(inspector.node(component)).toBeVisible();
      }
      await inspector.documentTopology();
    });

    await test.step('Read attributed motor evidence and its source', async () => {
      await expect(inspector.componentEvidence).toContainText(
        'Motor temperature',
      );
      await expect(inspector.componentEvidence).toContainText(
        'Illustrative band',
      );
      await expect(inspector.componentEvidence).toContainText(/event/i);
      await expect(inspector.componentEvidence).toContainText(/received/i);
      for (const label of [
        'Source device',
        'Endpoint',
        'Decoded signal',
        'Protocol package',
        'Binding',
        'Target property',
        'Effective from',
        'Quality',
        'Unassigned signals',
      ]) {
        await expect(inspector.context).toContainText(label);
      }
      await inspector.documentEvidence();
    });

    await test.step('Inspect the aligned history without filling gaps', async () => {
      await inspector.chooseHistoryWindow('1h');
      await expect(guide.page).toHaveURL(/window=1h/u);
      const motorHistory = inspector.historyPlot('Motor temperature');
      await expect(motorHistory).toBeVisible();
      await inspector.showReadingsTable('Motor temperature');
      await expect(motorHistory.getByRole('table')).toContainText('Gap');
      await expect(motorHistory.getByRole('table')).toContainText(
        'Event time (UTC)',
      );
      await guide.result(motorHistory, {
        title: 'Read the gap in sample history',
        body: 'The synthetic motor history marks a missing interval as Gap in its table. The sample chart does not interpolate across that interval.',
      });
    });

    await test.step('Connect physical relationships to events', async () => {
      await inspector.showTab('Details');
      await expect(guide.page).toHaveURL(/tab=details/u);
      await expect(inspector.componentEvidence).toContainText(
        'Physical relationship',
      );
      await expect(inspector.componentEvidence).toContainText(
        'Semantic signal targets',
      );
      await expect(inspector.componentEvidence).toContainText('Effective from');
      await guide.result(inspector.componentEvidence, {
        title: 'Review the sample relationship and target',
        body: 'The synthetic details connect the selected motor to its parent asset and show which semantic property receives its attributed signal.',
      });
      await inspector.showTab('Events');
      await expect(guide.page).toHaveURL(/tab=events/u);
      await expect(inspector.componentEvidence).toContainText(
        'Motor stream gap',
      );
      await guide.result(inspector.componentEvidence, {
        title: 'Read the sample event alongside the signal',
        body: 'The invented motor stream-gap event explains why the sample history contains missing evidence. It is not a live alert.',
      });
    });

    await test.step('Rehearse a synthetic signal stream without changing the snapshot', async () => {
      await inspector.showTab('Overview');
      await expect(inspector.playback).toContainText(
        'Connection: Ready to play',
      );
      await expect(inspector.playback).toContainText(
        'Sample data · simulation',
      );
      const fixedReading = inspector.componentEvidence
        .getByRole('article')
        .filter({ hasText: 'Illustrative band' })
        .first();
      const before = await fixedReading.textContent();
      await inspector.startPlayback();
      await expect(inspector.playback).toContainText(
        'Connection: Playback complete',
        { timeout: 25_000 },
      );
      const temperature = inspector.playbackReading('Motor temperature');
      await expect(temperature).toContainText('Freshness · stale');
      await expect(temperature).toContainText('Late arrival');
      expect(await fixedReading.textContent()).toBe(before);
      await inspector.documentPlayback();
    });

    await test.step('Select the battery system and follow its own attribution', async () => {
      await inspector.selectNode('Battery management system');
      await expect(guide.page).toHaveURL(/component=sample-bms-417/u);
      await expect(inspector.componentEvidence).toContainText(
        'Battery bus voltage',
      );
      await expect(inspector.context).toContainText('Target property');
      await guide.result(inspector.context, {
        title: 'Attribution follows the selected component',
        body: 'Selecting a different synthetic physical node changes the sample readings and provenance to the battery management system.',
      });
    });

    await test.step('Treat a component without attributed readings as unknown', async () => {
      await inspector.selectNode('Traction motor B');
      await expect(guide.page).toHaveURL(/component=sample-motor-b-417/u);
      await expect(inspector.componentEvidence).toContainText(
        'No attributed readings',
      );
      await expect(inspector.context).toContainText(
        'No attributed signal source',
      );
      await expect(inspector.playback).toHaveCount(0);
      await inspector.documentMissingEvidence();
    });

    await test.step('Keep missing trailer telemetry missing through playback', async () => {
      await inspector.openSample('asset-008');
      await expect(inspector.heading).toHaveText('Refrigerated trailer 11');
      await expect(inspector.node('Refrigeration unit')).toBeVisible();
      await expect(inspector.componentEvidence).toContainText('No observation');
      await expect(inspector.componentEvidence).not.toContainText('0 °C');
      await expect(inspector.playback).toContainText(
        'Connection: Ready to play',
      );
      const freezer = inspector.playbackReading('Freezer air temperature');
      await expect(freezer).toContainText('No played observation');
      await inspector.startPlayback();
      await expect(inspector.playback).toContainText(
        'Connection: Playback complete',
        { timeout: 15_000 },
      );
      await expect(freezer).toContainText('Freshness · missing');
      await expect(freezer).not.toContainText('0 °C');
      await guide.result(inspector.playback, {
        title: 'A synthetic replay cannot invent missing telemetry',
        body: 'The sample trailer has no freezer temperature observation. After invented playback events, the reading is still marked missing rather than zero.',
      });
    });

    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
});
