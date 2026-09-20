/** Ambos = visible para persona y empresa. */
export type GovSegment = 'retail' | 'empresa' | 'ambos';

export interface GovEntity {
  id: string;
  name: string;
  category: string;
  segment: GovSegment;
  icon: string;
  description: string;
  /** Selecciona el adapter en services/real/govtech/*.ts (Sprint 5) —
   * ausente si el ente todavía no tiene uno: queda como catálogo
   * decorativo, igual que hoy los entes sin obligaciones asociadas. */
  adapterKey?: string;
}

export interface GovObligation {
  id: string;
  /** FK a GovEntity.id — reemplaza el `entity: string` libre anterior. */
  entityId: string;
  icon: string;
  color: string;
  name: string;
  /** En bolívares — mismo criterio de escala que Account.balanceVesCents. */
  amountCents: number;
  dueLabel: string;
  dueColor: string;
  paid: boolean;
}
