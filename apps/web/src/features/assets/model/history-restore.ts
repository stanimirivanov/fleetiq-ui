import type { AssetReadOptions } from './asset-catalogue';
import type { RestoreSelection } from './history-review-types';

export interface RestoreCommand {
  readonly tenantId: string;
  readonly manifestId: string;
  readonly expected: string;
}
export interface RestoreJob extends RestoreSelection {
  readonly state: 'pending' | 'ready' | 'cancelled' | 'expired';
}
export interface HistoryRestores {
  request(
    command: RestoreCommand,
    options: AssetReadOptions,
  ): Promise<RestoreJob>;
  status(
    tenantId: string,
    selection: RestoreSelection,
    options: AssetReadOptions,
  ): Promise<RestoreJob>;
}
