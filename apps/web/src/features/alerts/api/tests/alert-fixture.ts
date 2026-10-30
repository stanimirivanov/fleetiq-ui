import contract from '../../../../../../../contracts/http/fleetiq-v1-ui-baseline.openapi.json';
import {
  parseDetail,
  parseEvaluation,
  parseHistory,
  parseOutputs,
  parseQueue,
} from '../parse-alerts';
export const queueRequest = { tenant: 'tenant-a' };
export const detailRequest = {
  ...queueRequest,
  rule: 'voltage-high',
  revision: 1,
};
export const queueWire = structuredClone(
  contract.components.responses.AlertPageSucceeded.content['application/json']
    .example,
);
export const detailWire = structuredClone(
  contract.components.responses.AlertDetailSucceeded.content['application/json']
    .example,
);
export const historyWire = structuredClone(
  contract.components.responses.AlertTransitionPageSucceeded.content[
    'application/json'
  ].example,
);
export const evaluationWire = structuredClone(
  contract.components.responses.CalculatorEvaluationEvidenceSucceeded.content[
    'application/json'
  ].example,
);
evaluationWire.evaluation.evaluation_id = 'evaluation-b';
evaluationWire.evaluation.window.end_at_ms = '2000';
export const outputsWire = structuredClone(
  contract.components.responses.CalculatorOutputPageSucceeded.content[
    'application/json'
  ].example,
);
const firstOutput = outputsWire.outputs[0];
if (!firstOutput) throw new Error('Missing pinned output example');
firstOutput.evaluation_id = 'evaluation-b';
export const detail = parseDetail(detailWire, detailRequest);
export const evidenceRequest = {
  ...queueRequest,
  detail,
  transition: detail.alert.latest_transition,
};
export const evaluation = parseEvaluation(evaluationWire, evidenceRequest);
export const outputRequest = { ...evidenceRequest, evidence: evaluation };
export const queue = parseQueue(queueWire, queueRequest);
export const history = parseHistory(historyWire, { ...detailRequest, detail });
export const outputs = parseOutputs(outputsWire, outputRequest);
