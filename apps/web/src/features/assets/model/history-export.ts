import type { AssetReadOptions } from './asset-catalogue';
import type { HistoryRequest } from './property-values';

export type ExportScope = Pick<
  HistoryRequest,
  'tenantId' | 'assetId' | 'property' | 'start' | 'end' | 'restore'
>;
export type ExportCommand = ExportScope & { readonly key: string };
export interface ExportJob {
  readonly id: string;
  readonly state: 'pending' | 'ready' | 'cancelled' | 'expired';
  readonly expiresAt: string;
  readonly bytes: number;
}
export interface HistoryExports {
  create(command: ExportCommand, options: AssetReadOptions): Promise<ExportJob>;
  status(
    scope: ExportScope,
    id: string,
    options: AssetReadOptions,
  ): Promise<ExportJob>;
  cancel(
    scope: ExportScope,
    id: string,
    options: AssetReadOptions,
  ): Promise<ExportJob>;
  download(
    scope: ExportScope,
    job: ExportJob,
    options: AssetReadOptions,
  ): Promise<ArrayBuffer>;
}
