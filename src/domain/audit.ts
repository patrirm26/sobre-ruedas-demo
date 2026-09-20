import type { BackofficeRole } from './staff';

export type AuditAction =
  | 'staff.invite'
  | 'staff.update_role'
  | 'compliance.resolve_alert'
  | 'compliance.resolve_verification'
  | 'onboarding.resolve_merchant'
  | 'cards.set_frozen'
  | 'cards.cancel'
  | 'loyalty.update_rate'
  | 'decisioning.update_split_rule'
  | 'reporting.export'
  | 'insurance.claim';

export interface AuditEntry {
  id: string;
  tenantId: string;
  staffId: string;
  staffName: string;
  role: BackofficeRole;
  action: AuditAction;
  targetType: string;
  targetId: string;
  /** Resumen legible, ej. "Congeló la tarjeta •••• 4821". */
  detail: string;
  at: string;
}
