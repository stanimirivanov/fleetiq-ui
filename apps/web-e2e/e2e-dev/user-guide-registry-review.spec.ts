import { expect, test } from '../fixtures/browser-quality-test';
import { RegistryReviewPage } from '../pages/registry-review.page';
import { UserGuideSession } from '../user-guide/user-guide-session';

/**
 * A read-only registry journey through synthetic development data. Each
 * recorded explanation follows an assertion of the state it describes.
 */
test('review asset structure, signal provenance, and time corrections', {
  tag: '@user-guide',
}, async ({ baseURL, browser }) => {
  const guide = await UserGuideSession.start(browser, {
    baseURL: baseURL ?? 'http://127.0.0.1:5173',
    dataMode: 'development-sample',
    order: 50,
    slug: 'registry-review',
    summary:
      'Review a synthetic asset hierarchy, inspect source-to-property bindings, and compare what was effective with what was known at a chosen time.',
    title: 'Review the asset registry and signal mapping',
  });

  try {
    const registry = new RegistryReviewPage(guide.page);
    const motorBinding = registry.mapping
      .getByRole('row')
      .filter({ hasText: 'sample-binding-motor-temperature' });
    const unknownSource = registry.mapping
      .getByRole('row')
      .filter({ hasText: 'can.unknown.027' });

    await test.step('Recognize the development-only registry', async () => {
      await registry.openSample();
      await expect(registry.heading).toBeVisible();
      await expect(guide.page.getByRole('banner')).toContainText('Sample data');
      for (const panel of [
        registry.catalogue,
        registry.structure,
        registry.mapping,
        registry.provenance,
        registry.unresolved,
      ]) {
        await expect(panel).toBeVisible();
      }
      await guide.result(registry.catalogue, {
        title: 'Start in the sample registry',
        body: 'This is a synthetic, read-only preview. Asset identities, relationships, and bindings here demonstrate the review workflow; they are not live fleet records or editable configuration.',
      });
    });

    await test.step('Select an asset and read its directed structure', async () => {
      await guide.action(
        registry.asset('Electric locomotive 417'),
        {
          title: 'Choose a sample asset',
          body: 'Select Electric locomotive 417 to focus the structure and mapping panels on one sample identity. This selection only changes the review URL.',
        },
        () => registry.selectAsset('Electric locomotive 417'),
      );
      await expect(guide.page).toHaveURL(/asset=asset-004/u);
      const directedEdge = registry.structure
        .getByRole('listitem')
        .filter({ hasText: 'sample-relationship-traction-417' });
      await expect(directedEdge).toContainText(
        'Electric locomotive 417 → Traction system',
      );
      await expect(directedEdge).toContainText('physical.contains v1');
      await expect(registry.structure).toContainText('Traction motor A');
      await expect(registry.structure).toContainText('Traction motor B');
      await guide.result(directedEdge, {
        title: 'Follow a directed relationship',
        body: 'The arrow reads from the locomotive to its traction system. The relationship type and version explain the modeled connection; this is richer than assuming a tracker and vehicle are the same thing.',
      });
    });

    await test.step('Focus a component and its mapped signal', async () => {
      await guide.action(
        registry.node('Traction motor A'),
        {
          title: 'Focus a modeled component',
          body: 'Choose Traction motor A in the sample hierarchy to connect the physical component with its signal mapping.',
        },
        () => registry.selectNode('Traction motor A'),
      );
      await expect(guide.page).toHaveURL(/node=sample-motor-417/u);
      await expect(motorBinding).toContainText('Traction motor A');
      await expect(motorBinding).toContainText('revision 2');
      await guide.result(motorBinding, {
        title: 'Read the target of the binding',
        body: 'This synthetic binding maps a gateway signal to the motor temperature property. Its revision is visible so a reviewer can distinguish corrected mapping knowledge from the signal value itself.',
      });
    });

    await test.step('Trace the source and review an ambiguous signal', async () => {
      await guide.action(
        registry.source('traction.motor.temperature'),
        {
          title: 'Trace the source signal',
          body: 'Open source provenance to see which sample gateway signal produced the selected component reading.',
        },
        () => registry.selectSource('traction.motor.temperature'),
      );
      await expect(guide.page).toHaveURL(/source=sample-gateway-417/u);
      await expect(registry.provenance).toContainText(
        'sample-binding-motor-temperature',
      );
      await guide.result(registry.provenance, {
        title: 'Check provenance before interpreting a reading',
        body: 'The source identity and binding revision provide the evidence trail. The registry is a review surface; no mapping is created or modified here.',
      });

      const ambiguous = registry.unresolved.getByRole('button', {
        name: /can.aux.current.*Ambiguous/u,
      });
      await expect(ambiguous).toBeVisible();
      await guide.action(
        ambiguous,
        {
          title: 'Inspect an ambiguous source',
          body: 'Some sample source signals have multiple possible targets. Inspect the ambiguity before treating the signal as an asset property.',
        },
        () => ambiguous.click(),
      );
      await expect(registry.provenance).toContainText(
        'sample-binding-aux-traction',
      );
      await expect(registry.provenance).toContainText(
        'sample-binding-aux-energy',
      );
      await expect(registry.provenance).toContainText(
        'does not choose a target',
      );
      await guide.result(registry.provenance, {
        title: 'Do not infer a target from ambiguity',
        body: 'Both synthetic candidate bindings remain visible. FleetIQ does not silently assign this signal to a motor or energy component.',
      });
    });

    await test.step('Compare current and earlier known mapping', async () => {
      await expect(motorBinding).toContainText('Traction motor A');
      await guide.action(
        registry.knownAt,
        {
          title: 'Review an earlier knowledge time',
          body: 'Keep the effective time at 6 October 2026, 10:00 UTC, but move known time back to 4 September 2026, 08:30 UTC. This asks what the registry believed before the correction.',
        },
        () => registry.applyReviewTimes('2026-10-06T10:00', '2026-09-04T08:30'),
      );
      await expect(guide.page).toHaveURL(/known_at_ms=1788510600000/u);
      await expect(motorBinding).toContainText('Traction motor B');
      await expect(motorBinding).toContainText('revision 1');
      await guide.result(motorBinding, {
        title: 'See the corrected assignment in context',
        body: 'At the earlier known time, the synthetic source points to Traction motor B with revision 1. The same effective time resolves to motor A after the recorded correction.',
      });
    });

    await test.step('Inspect the effective-time boundary', async () => {
      await guide.action(
        registry.effectiveAt,
        {
          title: 'Move to a past effective instant',
          body: 'Set the effective time to 09:55 and restore current knowledge. The sample unknown CAN signal is still mapped just before its modeled end.',
        },
        () => registry.applyReviewTimes('2026-10-06T09:55', '2026-10-06T10:00'),
      );
      await expect(unknownSource).toContainText(/mapped/i);
      await guide.result(unknownSource, {
        title: 'The earlier instant includes the binding',
        body: 'At 09:55 UTC the synthetic binding remains effective. Effective time describes when a mapping applies, while known time describes when that mapping was recorded.',
      });

      await guide.action(
        registry.effectiveAt,
        {
          title: 'Cross the half-open boundary',
          body: 'Advance the effective time to 09:56 UTC to check the exact boundary rather than assuming an ended interval still applies.',
        },
        () => registry.applyReviewTimes('2026-10-06T09:56', '2026-10-06T10:00'),
      );
      await expect(guide.page).toHaveURL(/effective_at_ms=1791280560000/u);
      await expect(unknownSource).toContainText(/unassigned/i);
      await expect(unknownSource).not.toContainText(
        'sample-binding-unknown-retired',
      );
      await guide.result(unknownSource, {
        title: 'The ended mapping no longer applies',
        body: 'At the end instant the sample signal is unassigned. This demonstrates a half-open effective interval without mutating any registry history.',
      });
    });

    await test.step('Recover the reviewed state from the URL', async () => {
      await guide.page.reload();
      await expect(guide.page).toHaveURL(/asset=asset-004/u);
      await expect(guide.page).toHaveURL(/effective_at_ms=1791280560000/u);
      await expect(unknownSource).toContainText(/unassigned/i);
      await guide.result(registry.effectiveAt, {
        title: 'Share or revisit the same review time',
        body: 'The URL preserves the sample asset and review times across a reload. A colleague can reproduce this read-only comparison, provided they use the same development sample preview.',
      });
    });

    await guide.finish();
  } catch (error: unknown) {
    await guide.abort();
    throw error;
  }
});
