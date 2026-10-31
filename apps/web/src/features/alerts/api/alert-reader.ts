import { Effect } from 'effect';
import { type BrowserApi, normalizeRequestFailure } from '#shared/api';
import { RequestFailure } from '#shared/model';
import type { FleetIqApi } from '../../../generated/fleetiq-api';
import {
  ALERT_PAGE_SIZE,
  type AlertReader,
  cursor,
  identifier,
  phases,
  type ReadOptions,
  revision,
} from '../model/connected-alerts';
import { createAcknowledgementWriter } from './acknowledgement-writer';
import {
  parseDetail,
  parseEvaluation,
  parseHistory,
  parseOutputs,
  parseQueue,
} from './parse-alerts';
import { createRuleGateway } from './rule-gateway';
/** All execution uses the app-owned managed browser runtime. */
export function createAlertReader(api: BrowserApi): AlertReader {
  const valid = (ids: readonly string[], after?: string) => {
    if (!ids.every(identifier) || (after !== undefined && !cursor(after)))
      throw new RequestFailure('invalid-request');
  };
  const exact = (r: { tenant: string; rule: string; revision: number }) => {
    valid([r.tenant, r.rule]);
    if (!revision(r.revision)) throw new RequestFailure('invalid-request');
  };
  const read = <A, W, E>(
    op: (client: FleetIqApi) => Effect.Effect<W, E>,
    parse: (wire: W) => A,
    options?: ReadOptions,
  ): Promise<A> =>
    api.run(
      (client) =>
        Effect.flatMap(op(client), (wire) =>
          Effect.try({
            try: () => parse(wire),
            catch: normalizeRequestFailure,
          }),
        ),
      options,
    );
  return {
    rules: createRuleGateway(api),
    acknowledge: createAcknowledgementWriter(api),
    async queue(r, o) {
      valid([r.tenant], r.after);
      if (r.phase !== undefined && !phases.includes(r.phase))
        throw new RequestFailure('invalid-request');
      return read(
        (c) =>
          c.listAlerts(r.tenant, {
            params: { phase: r.phase, limit: ALERT_PAGE_SIZE, after: r.after },
          }),
        (w) => parseQueue(w, r),
        o,
      );
    },
    async detail(r, o) {
      exact(r);
      return read(
        (c) => c.getAlert(r.tenant, r.rule, String(r.revision), undefined),
        (w) => parseDetail(w, r),
        o,
      );
    },
    async history(r, o) {
      exact(r);
      valid([], r.after);
      return read(
        (c) =>
          c.listAlertTransitions(r.tenant, r.rule, String(r.revision), {
            params: { limit: ALERT_PAGE_SIZE, after: r.after },
          }),
        (w) => parseHistory(w, r),
        o,
      );
    },
    async evaluation(r, o) {
      valid([
        r.tenant,
        r.detail.definition.scope,
        r.transition.evidence.evaluation_id,
      ]);
      return read(
        (c) =>
          c.getCalculatorEvaluationEvidence(
            r.tenant,
            r.detail.definition.scope,
            r.transition.evidence.evaluation_id,
            undefined,
          ),
        (w) => parseEvaluation(w, r),
        o,
      );
    },
    async outputs(r, o) {
      valid(
        [
          r.tenant,
          r.detail.definition.scope,
          r.transition.evidence.evaluation_id,
        ],
        r.after,
      );
      return read(
        (c) =>
          c.listCalculatorEvaluationOutputs(
            r.tenant,
            r.detail.definition.scope,
            r.transition.evidence.evaluation_id,
            { params: { limit: ALERT_PAGE_SIZE, after: r.after } },
          ),
        (w) => parseOutputs(w, r),
        o,
      );
    },
  };
}
