import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import contract from '../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json' with {
  type: 'json',
};
import {
  AlertRuleActivationState,
  AlertRuleHead,
  AlertRuleRevision,
  AlertRuleRevisionReceipt,
} from '../../web/src/generated/fleetiq-api';
import { installAlertsApi } from './alerts-api';
export async function installAlertRulesApi(page: Page) {
  const alerts = await installAlertsApi(page);
  alerts.metadata.setTenants([
    {
      tenant_id: 'tenant-a',
      actions: [
        'alerts.read',
        'alerts.manage',
        'alerts.acknowledge',
        'telemetry.read',
      ],
    },
  ]);
  const definition =
    contract.components.responses.AlertDetailSucceeded.content[
      'application/json'
    ].example.definition;
  const definitions = new Map<number, typeof definition>([[1, definition]]),
    requests: { method: string; path: string; body: unknown; csrf?: string }[] =
      [];
  let selected: number | null = null,
    generation = 0,
    lost = false,
    denied = false,
    conflict = false;
  const activations = new Map<
    string,
    {
      generation: number;
      revision: number | null;
      actor_id: string;
      recorded_at_ms: number;
    }
  >();
  await page.route(
    /\/api\/v1\/tenants\/[^/]+\/alert-rules\//,
    async (route) => {
      const request = route.request(),
        url = new URL(request.url()),
        parts = url.pathname.split('/'),
        body = request.method() === 'PUT' ? request.postDataJSON() : undefined;
      requests.push({
        method: request.method(),
        path: url.pathname,
        body,
        csrf: request.headers()['x-fleetiq-csrf'],
      });
      const reply = (status: number, data: unknown) =>
        route.fulfill({
          status,
          contentType:
            status === 200 ? 'application/json' : 'application/problem+json',
          headers: { 'cache-control': 'no-store' },
          body: JSON.stringify(
            status === 200
              ? data
              : { type: 'about:blank', title: 'Failure', status },
          ),
        });
      if (request.method() === 'PUT' && (denied || conflict))
        return reply(denied ? 403 : 409, null);
      const activation = () => ({
        generation,
        revision: selected,
        actor_id: generation ? 'operator-a' : null,
        recorded_at_ms: generation ? 2000 : null,
      });
      if (parts.at(-1) === 'activation') {
        const key = JSON.stringify(body),
          prior = activations.get(key);
        if (prior)
          return reply(
            200,
            Schema.decodeUnknownSync(AlertRuleActivationState)(prior),
          );
        if (body.expected_generation !== generation) return reply(409, null);
        selected = body.revision;
        generation++;
        const receipt = {
          ...activation(),
          actor_id: 'operator-a',
          recorded_at_ms: 2000,
        };
        activations.set(key, receipt);
        if (lost) {
          lost = false;
          return reply(500, null);
        }
        return reply(
          200,
          Schema.decodeUnknownSync(AlertRuleActivationState)(receipt),
        );
      }
      if (parts.at(-2) === 'revisions') {
        const revision = Number(parts.at(-1)),
          stored = definitions.get(revision);
        if (request.method() === 'GET')
          return stored
            ? reply(
                200,
                Schema.decodeUnknownSync(AlertRuleRevision)({
                  revision,
                  definition: stored,
                  actor_id: 'operator-a',
                  recorded_at_ms: 2000,
                }),
              )
            : reply(404, null);
        if (stored && JSON.stringify(stored) !== JSON.stringify(body))
          return reply(409, null);
        definitions.set(revision, body);
        if (lost) {
          lost = false;
          return reply(500, null);
        }
        return reply(
          200,
          Schema.decodeUnknownSync(AlertRuleRevisionReceipt)({ revision }),
        );
      }
      return reply(
        200,
        Schema.decodeUnknownSync(AlertRuleHead)({
          latest_revision: Math.max(...definitions.keys()),
          activation: activation(),
        }),
      );
    },
  );
  return {
    alerts,
    requests,
    loseNext: () => {
      lost = true;
    },
    deny: (value = true) => {
      denied = value;
    },
    conflict: (value = true) => {
      conflict = value;
    },
    advance: () => {
      generation++;
      selected = null;
    },
  };
}
