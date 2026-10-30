import { Schema } from 'effect';
import type { BrowserApi } from '#shared/api';
import { RequestFailure } from '#shared/model';
import {
  AlertRuleHead,
  AlertRuleRevision,
} from '../../../generated/fleetiq-api';
import {
  type Activation,
  type RuleGateway,
  ruleIdentifier,
  uint,
  validDefinition,
  validScope,
} from '../model/alert-rules';

const invalid = (): never => {
  throw new RequestFailure('invalid-response');
};
function activation(a: Activation) {
  if (
    !uint(a.generation) ||
    (a.actor_id !== null && !ruleIdentifier(a.actor_id)) ||
    (a.revision !== null && !uint(a.revision, 1)) ||
    (a.generation === 0
      ? a.revision !== null || a.actor_id !== null || a.recorded_at_ms !== null
      : a.actor_id === null ||
        a.recorded_at_ms === null ||
        !Number.isSafeInteger(a.recorded_at_ms))
  )
    invalid();
}
export function createRuleGateway(api: BrowserApi): RuleGateway {
  const params = { Origin: api.origin, 'X-FleetIQ-CSRF': '1' as const };
  return {
    async head(r, o) {
      if (!validScope(r)) throw new RequestFailure('invalid-request');
      const w = await api.run(
        (c) => c.getAlertRuleHead(r.tenant, r.rule, undefined),
        o,
      );
      try {
        Schema.decodeUnknownSync(AlertRuleHead)(w);
      } catch {
        invalid();
      }
      activation(w.activation);
      if (
        w.activation.revision !== null &&
        w.activation.revision > w.latest_revision
      )
        invalid();
      return w;
    },
    async revision(r, o) {
      if (!validScope(r) || !uint(r.revision, 1))
        throw new RequestFailure('invalid-request');
      const w = await api.run(
        (c) =>
          c.getAlertRuleRevision(
            r.tenant,
            r.rule,
            String(r.revision),
            undefined,
          ),
        o,
      );
      try {
        Schema.decodeUnknownSync(AlertRuleRevision)(w);
      } catch {
        invalid();
      }
      if (
        w.revision !== r.revision ||
        !validDefinition(w.definition) ||
        !Number.isSafeInteger(w.recorded_at_ms) ||
        !ruleIdentifier(w.actor_id)
      )
        invalid();
      return w;
    },
    async command(r, o) {
      if (
        !validScope(r) ||
        (r.kind === 'append'
          ? !uint(r.revision, 1) || !validDefinition(r.definition)
          : !uint(r.expected_generation) ||
            (r.revision !== null && !uint(r.revision, 1)))
      )
        throw new RequestFailure('invalid-request');
      if (r.kind === 'append') {
        const w = await api.run(
          (c) =>
            c.createAlertRuleRevision(r.tenant, r.rule, String(r.revision), {
              params,
              payload: r.definition,
            }),
          o,
        );
        if (w.revision !== r.revision) invalid();
        return `Revision ${w.revision} retained. It is not activated by this command.`;
      }
      const w = await api.run(
        (c) =>
          c.changeAlertRuleActivation(r.tenant, r.rule, {
            params,
            payload: {
              expected_generation: r.expected_generation,
              revision: r.revision,
            },
          }),
        o,
      );
      activation(w);
      if (
        w.generation !== r.expected_generation + 1 ||
        w.revision !== r.revision
      )
        invalid();
      return `Activation receipt ${w.generation} retained. Re-read the current head; a retry receipt may be historical.`;
    },
  };
}
