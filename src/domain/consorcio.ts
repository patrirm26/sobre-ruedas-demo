export type CondoUnitStatus = 'pagado' | 'pendiente';

export interface CondoUnit {
  id: string;
  /** El administrador (cuenta empresa) dueño de este edificio. */
  accountId: string;
  label: string;
  ownerName: string;
  feeCents: number;
  status: CondoUnitStatus;
  paidAt?: string;
  paymentMethod?: string;
}
