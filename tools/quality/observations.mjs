import { coverageScope } from './scope.mjs';

const exact = (value, keys) =>
  value &&
  typeof value === 'object' &&
  Object.keys(value).sort().join(',') === keys.slice().sort().join(',');
const number = (value) => Number.isFinite(value) && value >= 0;
const integer = (value) => Number.isSafeInteger(value) && value >= 0;
/** Reject payload-bearing additions; receipts contain only registered identifiers and numeric observations. */
export function validateObservation(kind, value) {
  let valid = false;
  if (kind === 'performance') {
    valid =
      exact(value, [
        'viewport',
        'browser',
        'workload',
        'samples',
        'resources',
      ]) &&
      ['desktop', 'narrow'].includes(value.viewport) &&
      /^\d+(?:\.\d+){1,4}$/u.test(value.browser) &&
      exact(value.workload, [
        'warmups',
        'samples',
        'catalogueRecords',
        'pageSize',
        'navigationMs',
        'filterMs',
        'heapGrowthBytes',
        'nodeGrowth',
      ]) &&
      Object.values(value.workload).every(number) &&
      Array.isArray(value.samples) &&
      value.samples.length === 5 &&
      value.samples.every(
        (sample) =>
          exact(sample, [
            'registryMs',
            'catalogueMs',
            'navigationMs',
            'filterMs',
          ]) && Object.values(sample).every(number),
      ) &&
      exact(value.resources, [
        'heapBefore',
        'heapAfter',
        'nodesBefore',
        'nodesAfter',
      ]) &&
      Object.values(value.resources).every(number);
  } else if (kind === 'accessibility') {
    valid =
      exact(value, ['viewport', 'theme', 'observations']) &&
      ['desktop', 'narrow'].includes(value.viewport) &&
      ['light', 'dark'].includes(value.theme) &&
      Array.isArray(value.observations) &&
      value.observations.length > 0 &&
      value.observations.length <= 3 &&
      value.observations.every(
        (entry) =>
          exact(entry, ['screen', 'violations']) &&
          [
            'catalogue',
            'inspector',
            'registry',
            'device-commissioning',
            'signed-out',
            'forbidden',
          ].includes(entry.screen) &&
          Array.isArray(entry.violations) &&
          entry.violations.length <= 100 &&
          entry.violations.every(
            (rule) =>
              exact(rule, ['id', 'count']) &&
              /^[a-z0-9-]{1,80}$/u.test(rule.id) &&
              integer(rule.count),
          ),
      );
  } else if (kind === 'coverage') {
    valid =
      exact(value, ['passed', 'files', 'obligations']) &&
      value.passed === true &&
      integer(value.obligations) &&
      Array.isArray(value.files) &&
      value.files.length === coverageScope.length &&
      value.files.every(
        (entry) =>
          exact(entry, ['file', 'metrics']) &&
          coverageScope.includes(entry.file) &&
          exact(entry.metrics, [
            'lines',
            'statements',
            'branches',
            'functions',
          ]) &&
          Object.values(entry.metrics).every(
            (metric) =>
              exact(metric, ['total', 'covered']) &&
              integer(metric.total) &&
              integer(metric.covered) &&
              metric.covered <= metric.total,
          ),
      );
  } else if (kind === 'mutations') {
    valid =
      Array.isArray(value) &&
      value.length === 6 &&
      value.every(
        (entry) =>
          exact(entry, ['id', 'kind', 'assertion']) &&
          [
            'logout-hides-protected-content',
            'metadata-cancellation',
            'metadata-stale-completion',
          ].includes(entry.id) &&
          ['positive-control', 'deliberate-regression'].includes(entry.kind) &&
          ['passed', 'killed'].includes(entry.assertion),
      );
  }
  if (!valid)
    throw new Error(
      'Quality observation is incomplete, malformed or contains unregistered payload fields.',
    );
}
