import { installBindingApi } from '../fixtures/binding-api';
import { expect, test } from '../fixtures/production-test';
import { BindingAuthoringPage } from '../pages/binding-authoring.page';
import { connectedGuide } from '../user-guide/connected-guide';

test('author exact signal attribution and review immutable binding corrections', {
  tag: '@user-guide',
}, async ({ browser, baseURL }) => {
  await connectedGuide(
    browser,
    baseURL,
    {
      order: 19,
      slug: 'connected-binding-authoring',
      title: 'Author and review signal-to-property attribution',
      summary:
        'Distinguish registered endpoints from sampled signals, select a pinned target property, append and correct temporal binding revisions, inspect immutable facts and resolve exact-source and revision conflicts.',
    },
    {
      tenants: [
        {
          tenant_id: 'tenant-a',
          actions: ['metadata.read', 'metadata.manage', 'protocol.manage'],
        },
      ],
    },
    async (guide) => {
      const api = await installBindingApi(guide.page),
        binding = new BindingAuthoringPage(guide.page);
      await binding.open();
      await test.step('Find a registered endpoint and an observed source tuple', async () => {
        await binding.chooseSource();
        await guide.result(binding.source(), {
          title: 'Keep registration and observation separate',
          body: 'The registered endpoint belongs to gateway-1. Observed tuples require protocol.manage in addition to metadata.read/manage. This bounded diagnostic sample is truncated and identifies its decoder; it does not establish complete sensor capabilities or device health. Custom protocol signal IDs may also be entered explicitly.',
        });
      });
      await test.step('Choose a compatible exact target property', async () => {
        await binding.chooseTarget();
        await guide.result(binding.target(), {
          title: 'Use the target asset’s pinned type',
          body: 'power-system-1 pins generic.power-system v2. Only its exact supported properties can be selected; choose electrical.voltage v3 and inspect its decimal kind and V canonical unit. A matching signal name is not proof of unit or value compatibility. No automatic transformation is added.',
        });
      });
      await test.step('Append revision 1 and inspect authoritative attribution', async () => {
        await binding.draft();
        await guide.action(
          binding.form(),
          {
            title: 'Append the directed source-to-property fact',
            body: 'authored-binding revision 1 maps gateway-1 / can-primary / bus.voltage to power-system-1 / electrical.voltage v3. Effective start 1000 is inclusive; a blank end is unbounded. The server supplies the original actor and recorded time.',
          },
          async () => binding.submit(),
        );
        await expect(binding.form()).toContainText('Committed: appended');
        const sources = guide.page.getByRole('list', {
          name: 'Source binding candidate records',
        });
        await expect(sources).toContainText('authored-binding');
        await guide.result(sources, {
          title: 'Review one exact source at explicit cutoffs',
          body: 'The acknowledged command refreshes target and exact-source snapshots at its effective start and recorded time. Candidates are metadata facts, not sensor inventory or a resolved telemetry decision. Changing a binding does not reprocess observations or rewrite existing readings and provenance.',
        });
      });
      await test.step('Correct the binding without losing original facts', async () => {
        await binding.prepare();
        await binding.draft('2', '3000');
        await binding.submit();
        await expect(binding.form()).toContainText('revision 2');
        await binding.exact('1');
        const exact = guide.page.getByRole('region', {
          name: 'Immutable binding revision',
          exact: true,
        });
        await expect(exact).toContainText('electrical.voltage v3');
        await guide.result(exact, {
          title: 'Read the immutable revision independently',
          body: 'Exact revision 1 still names the original target and open interval even though the source/target snapshots now select revision 2. This endpoint is not a latest-head or complete-history query. Its read representation exposes recorded time, not the actor; actor attribution remains visible on the acknowledged command receipt.',
        });
      });
      await test.step('Review conflicts and deliberate exact replay', async () => {
        await binding.prepare();
        await binding.draft('4', '3000');
        await binding.submit();
        await expect(binding.form()).toContainText('Conflict');
        await guide.result(binding.form(), {
          title: 'Never infer or increment the current head',
          body: 'Revision 4 skips the explicit successor and conflicts. Historical snapshots do not prove the latest head. Review current evidence, then choose revision 3 deliberately. If a response is lost, the captured request stays locked and Retry exact command replays only the original identity, revision and complete content.',
        });
        await binding.draft('3', '4000');
        await binding.submit();
        await expect(binding.form()).toContainText('revision 3');
        expect(api.commands).toHaveLength(4);
        await guide.result(binding.form(), {
          title: 'Confirm the acknowledged correction',
          body: 'The server preserves the original command receipt on exact replay and authorizes each attempt independently. This walkthrough uses synthetic contract responses; it does not qualify a deployed provider, live tracker, D06 or full-profile infrastructure.',
        });
      });
    },
  );
});
