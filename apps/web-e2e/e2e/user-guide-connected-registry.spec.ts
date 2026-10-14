import { expect, test } from '../fixtures/production-test';
import { ConnectedMetadataPage } from '../pages/connected-metadata.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('trace directed relationships and exact mappings at explicit review times', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 13,
      slug: 'connected-registry-review',
      title: 'Review temporal relationships and source mappings',
      summary:
        'Inspect directed relationships, exact source-to-property candidates, independent page cursors and effective/known-time boundaries without changing metadata.',
    },
    {},
    async (guide, api) => {
      const metadata = new ConnectedMetadataPage(guide.page, guide);

      await test.step('Open a bounded temporal metadata review', async () => {
        await metadata.openRegistry();
        await expect(metadata.identity).toContainText('power-system-1');
        await expect(metadata.relationships).toContainText('relationship-1');
        await expect(metadata.targetBindings).toContainText('binding-1');
        await guide.result(metadata.effectiveAt, {
          title: 'Review two different notions of time',
          body: 'This contract fixture uses 1500 effective and 2500 known Unix milliseconds to make interval boundaries explicit. Use actual review instants in a deployment. These cutoffs do not turn current asset identity into a historical read.',
        });
        await guide.result(metadata.identity, {
          title: 'Select one tenant-owned asset',
          body: 'The selected power system scopes the relationship and target-binding pages. The visible records are not a complete asset graph.',
        });
        await guide.result(metadata.relationships, {
          title: 'Read the direction of the relationship',
          body: 'The power-system source points to component-b through physical.contains. Direction, exact type version, revision and effective interval are part of the relationship evidence.',
        });
      });
      await test.step('Follow a binding to its exact source and pinned property', async () => {
        await expect(metadata.targetBindings).toContainText(
          'electrical.voltage v1',
        );
        await guide.result(metadata.targetBindings, {
          title: 'A device signal targets a semantic property',
          body: 'The binding pins electrical.voltage version 1 on the selected asset. The asset type separately lists version 3; read the exact reference on each record. Neither provides a measured voltage or device connectivity.',
        });
        await metadata.reviewSource('bus.voltage');
        await expect(guide.page).toHaveURL(/device_asset_id=gateway-1/u);
        await expect(guide.page).toHaveURL(/endpoint_id=can-primary/u);
        await expect(guide.page).toHaveURL(/signal_id=bus.voltage/u);
        await expect(metadata.sourceBindings).toContainText('binding-1');
        await expect(metadata.sourceBindings).toContainText('Supply voltage');
        await guide.result(metadata.sourceBindings, {
          title: 'Inspect the complete source tuple',
          body: 'gateway-1 / can-primary / bus.voltage identifies the reviewed source. A tracker can relay signals for other assets, so source device and target equipment are different concepts.',
        });
        await guide.result(
          metadata.sourceBindings.getByText('Supply voltage', { exact: true }),
          {
            title: 'Read the pinned target property',
            body: 'The selected candidate exposes the exact voltage definition and unit. Candidate metadata is not an attribution result for a particular observation.',
          },
        );
      });
      await test.step('Keep relationship, target and source cursors independent', async () => {
        await metadata.nextSnapshotPage('relationship');
        await expect(metadata.relationships).toContainText('relationship-2');
        await expect(metadata.targetBindings).toContainText('binding-1');
        await guide.result(metadata.relationships, {
          title: 'One panel advances without advancing the others',
          body: 'The relationship cursor now shows its next page. Target and source binding cursors remain independent and keep the same review cutoffs.',
        });
        await metadata.nextSnapshotPage('target binding');
        await expect(metadata.targetBindings).toContainText('binding-2');
        await expect(metadata.sourceBindings).toContainText('binding-1');
        await metadata.nextSnapshotPage('source binding');
        await expect(metadata.sourceBindings).toContainText('binding-2');
        await expect(metadata.sourceBindings).toContainText('assembly-a');
        await guide.result(metadata.sourceBindings, {
          title: 'A bounded source page can contain another target',
          body: 'Inspect each candidate target and property rather than assuming a one-to-one device/asset mapping. Traversing pages is not a cross-request database snapshot.',
        });
        await guide.page.goBack();
        await expect(guide.page).not.toHaveURL(/source_after=/u);
        await expect(guide.page).toHaveURL(
          /relationship_after=relationship-1/u,
        );
        await expect(guide.page).toHaveURL(/target_after=binding-1/u);
        await expect(metadata.sourceBindings).toContainText('binding-1');
        await guide.page.reload();
        await expect(metadata.sourceBindings).toContainText('binding-1');
        await guide.result(metadata.sourceBindings, {
          title: 'Restore the reviewed source from browser history',
          body: 'Back and reload preserve the exact source tuple, tenant, cutoffs and independent resource cursors in the URL.',
        });
      });
      await test.step('Compare knowledge and half-open effective boundaries', async () => {
        await metadata.applyReviewTimes('1500', '1500');
        await expect(metadata.relationships).not.toContainText(
          'relationship-1',
        );
        await expect(metadata.targetBindings).not.toContainText('binding-1');
        await guide.result(metadata.knownAt, {
          title: 'Earlier knowledge excludes later-recorded revisions',
          body: 'At this known cutoff, the controlled revisions had not been recorded. Empty results describe this review context, not the physical absence of equipment.',
        });
        await metadata.applyReviewTimes('1500', '2500');
        await expect(metadata.targetBindings).toContainText('binding-1');
        await metadata.applyReviewTimes('3000', '3500');
        await expect(metadata.targetBindings).not.toContainText('binding-1');
        await expect(metadata.relationships).not.toContainText(
          'relationship-1',
        );
        await expect(guide.page).not.toHaveURL(
          /relationship_after=|target_after=|source_after=/u,
        );
        await guide.result(metadata.targetBindings, {
          title: 'An interval excludes its end instant',
          body: 'The example interval is [1000, 3000) milliseconds. At 3000 the mapping no longer applies. Changing cutoffs clears old page cursors rather than reusing them in another context.',
        });
        const snapshots = api.requests.filter((request) =>
          /relationships|signal-bindings/u.test(request.path),
        );
        expect(snapshots.length).toBeGreaterThan(0);
        expect(
          snapshots.every((request) => {
            const query = new URLSearchParams(request.search);
            return (
              query.has('effective_at_ms') &&
              query.has('known_at_ms') &&
              query.get('limit') === '50'
            );
          }),
        ).toBe(true);
      });
    },
  );
});
