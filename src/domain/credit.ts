export type BnplRequestStatus = 'pending' | 'approved' | 'partial' | 'rejected';

/** Máquina de estados de mora de una cuota o de un plan completo. */
export type InstallmentStatus = 'al_dia' | 'en_gracia' | 'mora' | 'default' | 'pagado';

export type InstallmentFrequency = 'mensual' | 'quincenal';

/** Todos los montos de este archivo (*Cents) están en USD, igual que Product.priceCents. */
export interface BnplRequest {
  id: string;
  at: string;
  accountId: string;
  /** null = crédito de libre disponibilidad, no atado a una compra concreta. */
  merchantId: string | null;
  requestedAmountCents: number;
  status: BnplRequestStatus;
  /** Reglas visibles que explican la decisión, ej. ['score_suficiente','cupo_ok']. */
  reasonCodes: string[];
  approvedAmountCents?: number;
  scoreAtEvaluation: number;
  /** Descripción legible del origen del financiamiento (ej. "Pago a 0414-228 4471",
   * "Impuesto Municipal") — para distinguirlo en "Tus planes activos" cuando
   * `merchantId` es null (crédito libre, Pagar y GovTech usan el mismo camino). */
  originLabel?: string;
  /** Términos elegidos por el usuario al solicitar — solo se usan cuando la
   * solicitud queda `status:'pending'` por revisión manual (CreditosView):
   * no hay un segundo momento donde el usuario esté presente para elegirlos
   * al confirmar, así que viajan desde acá. En el resto de los flujos
   * (instantáneos) no se usan. */
  installmentsCount?: number;
  frequency?: InstallmentFrequency;
  useCollateral?: boolean;
}

export interface Installment {
  id: string;
  index: number; // 1-based
  dueDate: string;
  /** Cuota completa (capital + interés) — lo que el usuario paga. */
  amountCents: number;
  /** Solo la porción de capital — lo que libera cupo al pagarse (amountCents incluye interés, que no cuenta). */
  principalCents: number;
  status: InstallmentStatus;
  paidAt?: string;
  lateFeeCents: number;
}

export interface InstallmentPlanCollateral {
  lockedKrtCents: number;
  ratioPct: number; // ej. 120
}

export interface InstallmentPlan {
  id: string;
  bnplRequestId: string;
  accountId: string;
  merchantId: string | null;
  principalCents: number;
  /** Costo total del crédito (interés + comisiones) visible antes de confirmar. */
  feeTotalCents: number;
  effectiveRatePct: number;
  installmentsCount: number;
  frequency: InstallmentFrequency;
  fixedInstallment: boolean;
  downPaymentCents: number;
  firstDueDate: string;
  /** Comisión que paga el comercio, separada de la tasa que paga el usuario. */
  merchantFeeCents: number;
  /** Estado global del plan, derivado del peor estado entre sus cuotas. */
  status: InstallmentStatus;
  installments: Installment[];
  collateral?: InstallmentPlanCollateral;
  createdAt: string;
  /** Copiado de BnplRequest.originLabel al crear el plan — ver esa nota. */
  originLabel?: string;
  /** Prima del seguro de desgravamen, ya incluida en `feeTotalCents` — ver
   * domain/insurance.ts. Opcional: los planes semilla creados antes de este
   * campo no lo llevan, solo los planes nuevos desde `createPlan()`. */
  insurancePremiumCents?: number;
}
