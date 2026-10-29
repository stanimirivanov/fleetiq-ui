import { installCommissioningApi } from '../fixtures/commissioning-api';
import { expect, test } from '../fixtures/production-test';
import { RegistryCommissioningPage } from '../pages/registry-commissioning.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('commission an asset and correct directed temporal relationships with audit review', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 18,
      slug: 'connected-registry-commissioning',
      title: 'Create assets and commission temporal relationships',
      summary:
        'Select exact definitions, register a tenant-owned identity and typed external identifier, append and correct directed half-open relationship facts, and resolve conflicts without overwriting history.',
    },
    {
      tenants: [
        {
          tenant_id: 'tenant-a',
          actions: ['metadata.read', 'metadata.manage'],
        },
      ],
    },
    async (guide) => {
      const api = await installCommissioningApi(guide.page),
        registry = new RegistryCommissioningPage(guide.page);
      await registry.open();
      await test.step('Discover and choose an immutable asset type', async () => {
        await registry.assetDraft();
        await registry
          .asset()
          .getByRole('button', { name: 'Next definitions' })
          .click();
        await registry
          .asset()
          .getByLabel('Exact asset type version', { exact: true })
          .selectOption({ label: 'Equipment · equipment v10' });
        await guide.result(registry.asset(), {
          title: 'Choose an exact installed version',
          body: 'This operator has both metadata.read and metadata.manage for tenant-a. Definition pages are bounded and versions sort numerically. Select equipment v10 explicitly; the UI never substitutes a latest-version alias. Read-only operators retain registry evidence without these forms.',
        });
      });
      await test.step('Register internal identity and external namespace', async () => {
        await registry
          .asset()
          .getByRole('button', { name: 'Add external identifier' })
          .click();
        await registry
          .asset()
          .getByLabel('Identifier 1 kind', { exact: true })
          .fill('serial');
        await registry
          .asset()
          .getByLabel('Identifier 1 authority', { exact: true })
          .fill('manufacturer');
        await registry
          .asset()
          .getByLabel('Identifier 1 value', { exact: true })
          .fill('serial-demo');
        await guide.action(
          registry.asset(),
          {
            title: 'Commit the asset registration',
            body: 'The internal asset ID is distinct from its typed serial namespace. The server attributes actor and recorded time. Registration is create-only: different existing content conflicts; an identical request returns its original registration receipt.',
          },
          async () => registry.submitAsset(),
        );
        await expect(registry.asset()).toContainText('Committed: registered');
        await guide.result(registry.asset(), {
          title: 'Read the immutable audit receipt',
          body: 'The acknowledged receipt names the original actor and server recording time. Registry reads are refreshed from the server at that receipt time. This is not an optimistic local asset or proof that a tracker is configured.',
        });
      });
      await test.step('Create a directed physical relationship', async () => {
        await registry.relationshipDraft();
        await guide.action(
          registry.relationship(),
          {
            title: 'Append relationship revision 1',
            body: 'commissioned-a is the source and gateway-1 is the target. Both must belong to this tenant. Select physical.contains v10 explicitly. The interval begins at inclusive Unix millisecond 1000; a blank end is open. Revision 1 creates a new relationship lineage.',
          },
          async () => registry.submitRelationship(),
        );
        await expect(
          guide.page.getByRole('list', {
            name: 'Directed relationship records',
          }),
        ).toContainText('revision 1');
      });
      await test.step('Correct a fact without rewriting history', async () => {
        await registry
          .relationship()
          .getByRole('button', { name: 'Prepare another command' })
          .click();
        await registry.relationshipDraft('2', '2000');
        await guide.action(
          registry.relationship(),
          {
            title: 'Append an exact successor',
            body: 'After reviewing the authoritative head, explicitly submit revision 2 with the half-open interval [1000, 2000). The end is exclusive. Physical effective time and server recorded time are separate clocks; correction appends history rather than editing revision 1.',
          },
          async () => registry.submitRelationship(),
        );
        const records = guide.page.getByRole('list', {
          name: 'Directed relationship records',
        });
        await expect(records).toContainText('revision 2');
        await guide.result(records, {
          title: 'Inspect the corrected server evidence',
          body: 'The refreshed source review uses effective start 1000 and the receipt recording time. The directed source/target, exact relationship definition, revision and interval come from the protected read API. A historical snapshot is not proof of the current head.',
        });
      });
      await test.step('Handle conflict and retry deliberately', async () => {
        await registry
          .relationship()
          .getByRole('button', { name: 'Prepare another command' })
          .click();
        await registry.relationshipDraft('4', '2000');
        await registry.submitRelationship();
        await expect(registry.relationship()).toContainText('Conflict');
        await guide.result(registry.relationship(), {
          title: 'Resolve the exact revision conflict',
          body: 'Revision 4 skips the current successor and is rejected. Review the latest authorized evidence before choosing revision 3 explicitly. FleetIQ never overwrites a fact or increments a conflicted revision automatically. A lost response instead locks the frozen command; review evidence before using Retry exact command.',
        });
        await registry.relationshipDraft('3', '3000');
        await registry.submitRelationship();
        await expect(registry.relationship()).toContainText('revision 3');
        await guide.result(registry.relationship(), {
          title: 'Confirm the acknowledged successor',
          body: 'The original actor and recorded time remain server-controlled. This guide uses synthetic contract responses, not a live customer installation, OIDC provider or hardware qualification. D06 and full-profile qualification remain deferred.',
        });
        expect(api.commands).toHaveLength(5);
      });
    },
  );
});
