export type InvoiceStatus = 'pendiente' | 'rechazada' | 'anticipada' | 'cobrada';

export interface Invoice {
  id: string;
  merchantId: string;
  /** Cliente del comercio, externo a KORA — no es un usuario de la app. */
  debtorName: string;
  amountCents: number;
  issuedAt: string;
  dueDate: string;
  status: InvoiceStatus;
  advanceRequestId?: string;
}

export interface AdvanceRequest {
  id: string;
  invoiceId: string;
  merchantId: string;
  at: string;
  approved: boolean;
  reasonCodes: string[];
  /** % de la factura adelantado — solo tiene sentido si approved. */
  advanceRatePct: number;
  discountFeePct: number;
  /** Lo que se acredita de inmediato a la tesorería del comercio — 0 si no se aprobó. */
  advancedNowCents: number;
  feeCents: number;
}
