import type { Page } from '@playwright/test';
import { Schema } from 'effect';
import contract from '../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json' with {
  type: 'json',
};
import {
  AlertDetail,
  AlertPage,
  AlertTransitionPage,
  CalculatorEvaluationEvidence,
  CalculatorOutputPage,
} from '../../web/src/generated/fleetiq-api';
import { installMetadataApi } from './metadata-api';
/** Synthetic test-owned records validated against the pinned contract, never shipped. */
export async function installAlertsApi(page: Page) {
  const metadata = await installMetadataApi(page, {
    tenants: [
      { tenant_id: 'tenant-a', actions: ['alerts.read'] },
      { tenant_id: 'tenant-b', actions: ['alerts.read', 'telemetry.read'] },
    ],
  });
  const examples = contract.components.responses;
  const detail = structuredClone(
    examples.AlertDetailSucceeded.content['application/json'].example,
  );
  const evaluation = structuredClone(
    examples.CalculatorEvaluationEvidenceSucceeded.content['application/json']
      .example,
  );
  evaluation.evaluation.evaluation_id = 'evaluation-b';
  evaluation.evaluation.window.end_at_ms = '2000';
  const outputs = structuredClone(
    examples.CalculatorOutputPageSucceeded.content['application/json'].example,
  );
  const first = outputs.outputs[0];
  if (!first) throw new Error('Missing pinned output example');
  first.evaluation_id = 'evaluation-b';
  let annotation: {
    version: string;
    actor_id: string;
    recorded_at_ms: string;
  } | null = null;
  let resolved = false;
  const currentTransition = () => ({
    ...detail.alert.latest_transition,
    version: resolved ? '3' : detail.alert.version,
    phase: resolved ? 'resolved' : detail.alert.phase,
    event_at_ms: resolved ? '3000' : detail.alert.latest_transition.event_at_ms,
    acknowledgement: resolved ? null : annotation,
  });
  const currentDetail = () => ({
    ...detail,
    alert: {
      ...detail.alert,
      version: resolved ? '3' : detail.alert.version,
      phase: resolved ? 'resolved' : detail.alert.phase,
      last_event_at_ms: resolved ? '3000' : detail.alert.last_event_at_ms,
      latest_transition: currentTransition(),
    },
  });
  const requests: {
    method: string;
    path: string;
    search: string;
    authorization?: string;
  }[] = [];
  let alertStatus = 200,
    evidenceStatus = 200,
    malformed = false,
    empty = false;
  let hold: Promise<void> | undefined;
  await page.route(
    /\/api\/v1\/tenants\/[^/]+\/(?:alerts|assets\/[^/]+\/calculator-evaluations)(?:\/|\?|$)/u,
    async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      requests.push({
        method: req.method(),
        path: url.pathname,
        search: url.search,
        authorization: req.headers().authorization,
      });
      const isEvaluation = url.pathname.includes('/calculator-evaluations/'),
        status = isEvaluation ? evidenceStatus : alertStatus;
      if (hold && !isEvaluation && !url.pathname.includes('/revisions/'))
        await hold;
      if (status !== 200)
        return route.fulfill({
          status,
          contentType: 'application/problem+json',
          body: JSON.stringify({
            type: 'about:blank',
            title: 'Unavailable',
            status,
          }),
        });
      const reply = (body: unknown) =>
        route.fulfill({
          contentType: 'application/json',
          headers: { 'cache-control': 'no-store' },
          body: JSON.stringify(body),
        });
      if (malformed && !isEvaluation)
        return reply({
          alerts: [{ untrusted: 'do-not-render' }],
          next_after: null,
        });
      if (url.pathname.endsWith('/outputs'))
        return reply(Schema.decodeUnknownSync(CalculatorOutputPage)(outputs));
      if (isEvaluation)
        return reply(
          Schema.decodeUnknownSync(CalculatorEvaluationEvidence)(evaluation),
        );
      if (url.pathname.endsWith('/transitions'))
        return reply(
          Schema.decodeUnknownSync(AlertTransitionPage)({
            transitions: resolved
              ? [
                  {
                    ...detail.alert.latest_transition,
                    acknowledgement: annotation,
                  },
                  currentTransition(),
                ]
              : [currentTransition()],
            next_after: url.searchParams.has('after') ? null : 'v1.01',
          }),
        );
      if (url.pathname.includes('/revisions/'))
        return reply(Schema.decodeUnknownSync(AlertDetail)(currentDetail()));
      const phase = url.searchParams.get('phase'),
        continued = url.searchParams.has('after');
      const alert = {
        ...detail.alert,
        rule_id: continued ? 'voltage-next' : 'voltage-high',
      };
      return reply(
        Schema.decodeUnknownSync(AlertPage)({
          alerts:
            empty ||
            (!phase && resolved) ||
            (phase && phase !== (resolved ? 'resolved' : 'firing'))
              ? []
              : [alert],
          next_after: empty || phase || continued ? null : 'v1.00',
        }),
      );
    },
  );
  return {
    metadata,
    requests,
    annotate: (value: typeof annotation) => {
      annotation = value;
    },
    resolve: () => {
      resolved = true;
    },
    denyAlerts: (status: number) => {
      alertStatus = status;
    },
    denyEvidence: (status: number) => {
      evidenceStatus = status;
    },
    malformed: () => {
      malformed = true;
    },
    empty: () => {
      empty = true;
    },
    holdQueue: () => {
      let release = () => {};
      hold = new Promise<void>((r) => {
        release = r;
      });
      return () => {
        hold = undefined;
        release();
      };
    },
  };
}
