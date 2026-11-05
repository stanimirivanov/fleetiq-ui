import type { WorkKind } from '../model/recovery';

export const workFamilies = {
  replay: 'Protocol replay',
  calculator: 'Calculator',
  alert_evaluation: 'Alert evaluation',
  notification: 'Notification delivery',
} satisfies Record<WorkKind, string>;
