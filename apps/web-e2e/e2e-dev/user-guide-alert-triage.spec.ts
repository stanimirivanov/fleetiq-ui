import { expect, test } from '../fixtures/browser-quality-test';
import { AlertsPage } from '../pages/alerts.page';
import { UserGuideSession } from '../user-guide/user-guide-session';

/**
 * An assertion-first triage journey using synthetic development evidence.
 * Selection and filters are read-only; this guide never acknowledges alerts.
 */
test('triage sample alerts, inspect evidence, and recover selection', {
  tag: '@user-guide',
}, async ({ baseURL, browser }) => {
  const guide = await UserGuideSession.start(browser, {
    baseURL: baseURL ?? 'http://127.0.0.1:5173',
    dataMode: 'development-sample',
    order: 60,
    slug: 'alert-triage',
    summary:
      'Inspect the synthetic alert queue, assess evidence quality and freshness, filter the queue, and recover a shared selection.',
    title: 'Triage alerts and inspect their evidence',
  });

  try {
    const alerts = new AlertsPage(guide.page);

    await test.step('Recognize the sample queue and its default selection', async () => {
      await alerts.openSample();
      await expect(alerts.heading).toBeVisible();
      await expect(guide.page.getByRole('banner')).toContainText('Sample data');
      await expect(alerts.summary).toBeVisible();
      await expect(alerts.alertList.getByRole('listitem')).toHaveCount(6);
      await expect(
        alerts.alert('Inspection required', 'Diesel locomotive 206'),
      ).toHaveAttribute('aria-current', 'true');
      await guide.result(alerts.queue, {
        title: 'Start with a synthetic alert queue',
        body: 'These six alerts are development samples, not live incidents. The queue demonstrates review and prioritization; selecting a row does not acknowledge, dispatch, or mutate an alert.',
      });
    });

    await test.step('Assess freshness and quality before interpreting severity', async () => {
      await expect(alerts.selectedEvidence).toContainText(
        'Inspection required',
      );
      await expect(alerts.selectedEvidence).toContainText(/stale/i);
      await expect(alerts.selectedEvidence).toContainText(/suspect/i);
      await guide.result(alerts.selectedEvidence, {
        title: 'Read the evidence caveats',
        body: 'The selected sample alert shows stale and suspect evidence. Treat freshness and quality as part of the triage decision; a severity badge alone does not establish current asset condition.',
      });
    });

    await test.step('Compare the trend and exact readings', async () => {
      await expect(alerts.trend.getByRole('img')).toBeVisible();
      await guide.result(alerts.trend, {
        title: 'Use the trend for shape and timing',
        body: 'The chart gives a visual trend for synthetic readings. It is a review aid, not a live telemetry feed or a prediction.',
      });
      await guide.action(
        alerts.readingsDisclosure,
        {
          title: 'Open the readings table',
          body: 'Expand the table to inspect individual sample values and timestamps behind the chart.',
        },
        () => alerts.showReadingsTable(),
      );
      await expect(alerts.trend.getByRole('table')).toBeVisible();
      await guide.result(alerts.trend.getByRole('table'), {
        title: 'Verify the values behind the chart',
        body: 'The tabular view keeps the synthetic evidence inspectable without relying on the chart alone.',
      });
    });

    await test.step('Read the event sequence and open the linked asset', async () => {
      await expect(alerts.timeline).toBeVisible();
      await expect(alerts.timeline.getByRole('listitem').first()).toBeVisible();
      await guide.result(alerts.timeline, {
        title: 'Place the alert in a timeline',
        body: 'The event sequence gives context for the sample alert. Check time ordering and evidence before deciding what to investigate next.',
      });

      const assetLink = alerts.selectedEvidence.getByRole('link', {
        name: 'Open sample asset',
      });
      await expect(assetLink).toBeVisible();
      await guide.action(
        assetLink,
        {
          title: 'Open the related sample asset',
          body: 'Follow the asset link for more context about this synthetic incident. This navigates to the sample asset inspector; it does not create a work order.',
        },
        () => assetLink.click(),
      );
      await expect(guide.page).toHaveURL('/assets/asset-005?preview=sample');
      await guide.page.goBack();
      await expect(alerts.selectedEvidence).toContainText(
        'Inspection required',
      );
      await guide.result(alerts.selectedEvidence, {
        title: 'Return to the selected alert',
        body: 'Browser history returns to the same sample alert and its evidence, so the investigation can continue without losing context.',
      });
    });

    await test.step('Select another alert and recover it from the URL', async () => {
      const powerVariation = alerts.alert('Power variation', 'Primary machine');
      await guide.action(
        powerVariation,
        {
          title: 'Inspect a different sample alert',
          body: 'Choose Power variation on Primary machine. The selected alert is encoded in the URL so review context can survive navigation.',
        },
        () => alerts.select('Power variation', 'Primary machine'),
      );
      await expect(guide.page).toHaveURL(/alert=sample-alert-002/u);
      await expect(powerVariation).toHaveAttribute('aria-current', 'true');
      await expect(alerts.selectedEvidence).toContainText('Power variation');
      await guide.page.reload();
      await expect(powerVariation).toHaveAttribute('aria-current', 'true');
      await expect(alerts.selectedEvidence).toContainText('Power variation');
      await guide.result(alerts.selectedEvidence, {
        title: 'The URL restores the selection',
        body: 'Reloading keeps the selected synthetic alert. A shared URL reproduces the same read-only review state while the development preview is available.',
      });
    });

    await test.step('Distinguish missing evidence from a zero reading', async () => {
      const intermittent = alerts.alert(
        'Intermittent telemetry',
        'Yard shunter 08',
      );
      await guide.action(
        intermittent,
        {
          title: 'Inspect intermittent telemetry',
          body: 'Open the sample alert whose evidence is incomplete to see how missing readings are presented.',
        },
        () => alerts.select('Intermittent telemetry', 'Yard shunter 08'),
      );
      await expect(guide.page).toHaveURL(/alert=sample-alert-003/u);
      await expect(alerts.selectedEvidence).toContainText(/missing/i);
      await expect(alerts.selectedEvidence).not.toContainText('0 °C');
      await guide.result(alerts.selectedEvidence, {
        title: 'Missing is not zero',
        body: 'The sample evidence explicitly marks a missing reading. FleetIQ does not turn absent telemetry into a false zero value.',
      });
    });

    await test.step('Filter the queue while preserving context', async () => {
      await guide.action(
        alerts.search,
        {
          title: 'Search the sample queue',
          body: 'Search for Intermittent to narrow the synthetic queue. Filter state is reflected in the URL.',
        },
        () => alerts.search.fill('Intermittent'),
      );
      await expect(guide.page).toHaveURL(/q=Intermittent/u);
      await expect(alerts.alertList.getByRole('listitem')).toHaveCount(1);
      await guide.action(
        alerts.severity,
        {
          title: 'Combine severity and review-state filters',
          body: 'Choose Attention severity and Open review state to demonstrate how an operator can narrow a queue without changing an alert.',
        },
        async () => {
          await alerts.severity.selectOption('attention');
          await alerts.reviewState.selectOption('open');
        },
      );
      await expect(guide.page).toHaveURL(/severity=attention/u);
      await expect(guide.page).toHaveURL(/state=open/u);
      await expect(alerts.alertList.getByRole('listitem')).toHaveCount(1);
      await expect(alerts.selectedEvidence).toContainText(
        'Intermittent telemetry',
      );
      await guide.result(alerts.queue, {
        title: 'The filtered queue retains the evidence',
        body: 'The selected sample alert remains visible while search, severity, and review-state filters narrow the queue to one result.',
      });
    });

    await test.step('Recover from an empty filter and unknown selection', async () => {
      await guide.action(
        alerts.search,
        {
          title: 'Recognize an empty filtered queue',
          body: 'A search with no match shows an explicit empty state instead of inventing a result or hiding the active filter.',
        },
        () => alerts.search.fill('no such alert'),
      );
      await expect(alerts.queue).toContainText(
        'No sample alerts match these filters.',
      );
      await expect(alerts.alertList).toHaveCount(0);
      const clearFilters = alerts.queue.getByRole('button', {
        name: 'Clear filters',
      });
      await guide.action(
        clearFilters,
        {
          title: 'Clear the queue filters',
          body: 'Reset the synthetic queue filters to return to the complete set of sample alerts.',
        },
        () => clearFilters.click(),
      );
      await expect(alerts.alertList.getByRole('listitem')).toHaveCount(6);

      await alerts.openSample('&alert=not-an-alert');
      await expect(alerts.selectedEvidence).toContainText(
        /not in this queue|unknown|excluded/i,
      );
      await guide.result(alerts.selectedEvidence, {
        title: 'An invalid alert link is recoverable',
        body: 'If a shared sample URL names an alert outside this queue, the workspace explains the mismatch rather than silently presenting unrelated evidence.',
      });
      const clearSelection = alerts.selectedEvidence.getByRole('button', {
        name: 'Clear selection',
      });
      await guide.action(
        clearSelection,
        {
          title: 'Return to a valid selection',
          body: 'Clear the invalid URL selection to return to the first available sample alert. No alert record is edited.',
        },
        () => clearSelection.click(),
      );
      await expect(
        alerts.alert('Inspection required', 'Diesel locomotive 206'),
      ).toHaveAttribute('aria-current', 'true');
      await guide.result(alerts.selectedEvidence, {
        title: 'Continue triage from a valid alert',
        body: 'The review workspace is usable again with a valid synthetic selection and its evidence visible.',
      });
    });

    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
});
