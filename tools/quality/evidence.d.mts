export interface SourceIdentity {
  revision: string;
  dirty: boolean;
  digest: string;
  files: number;
}
export function sourceIdentity(root: string): SourceIdentity;
export function writeQualityEvidence(
  root: string,
  kind: string,
  source: SourceIdentity,
  observations: unknown,
): string;
