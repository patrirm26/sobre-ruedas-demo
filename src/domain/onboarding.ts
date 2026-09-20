export type MerchantOnboardingStatus = 'pendiente' | 'aprobado' | 'rechazado';

export interface MerchantOnboardingRequest {
  id: string;
  at: string;
  name: string;
  category: string;
  /** RIF/cédula del comercio solicitante — mismo formato que Alianzas Bancarias/GovTech. */
  taxId: string;
  proposedBnplFeePct: number;
  status: MerchantOnboardingStatus;
  resolvedAt?: string;
  /** Seteado al aprobar — referencia al Merchant real creado. */
  merchantId?: string;
}
