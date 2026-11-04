import type { WorkKind } from '../api/operations-gateway';

export const workFamilies = {
  replay: 'Protocol replay',
  calculator: 'Calculator',
  alert_evaluation: 'Alert evaluation',
  notification: 'Notification delivery',
} satisfies Record<WorkKind, string>;
