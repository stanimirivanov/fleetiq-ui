export interface PerformanceSample {
  navigationMs: number;
  filterMs: number;
}
export interface ResourceSamples {
  heapBefore: number;
  heapAfter: number;
  nodesBefore: number;
  nodesAfter: number;
}
export interface PerformanceLimits {
  warmups: number;
  samples: number;
  catalogueRecords: number;
  pageSize: number;
  navigationMs: number;
  filterMs: number;
  heapGrowthBytes: number;
  nodeGrowth: number;
}
export const qualityPolicy: {
  schemaVersion: number;
  performance: PerformanceLimits;
};
export const repositoryRoot: string;
export function assessPerformance(
  samples: PerformanceSample[],
  resources: ResourceSamples,
  limits?: PerformanceLimits,
): { passed: boolean; maxNavigationMs: number; maxFilterMs: number };
export function requireUnrecordedMeasurement(
  trace: unknown,
  video: unknown,
): void;
export function requireNoPageErrors(count: number): void;
