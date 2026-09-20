import type { BnplRequest, InstallmentPlan, InstallmentFrequency } from '../domain/credit';
import type { AmortizationRow } from '../lib/finance';
import { isRealBackendEnabled } from './env';
import { mockBnplService } from './mocks/bnplService.mock';
import { realBnplService } from './real/bnplService.real';

export interface EvaluateInput {
  accountId: string;
  amountCents: number;
  /** null = crédito de libre disponibilidad, no atado a una compra. */
  merchantId: string | null;
  /** Ver BnplRequest.originLabel en domain/credit.ts. */
  originLabel?: string;
  /** Solo CreditosView la usa (confirmado con la usuaria: Marketplace/Pagar/
   * GovTech siguen resolviendo al instante) — en vez de auto-decidir por
   * score/cupo, la solicitud queda `status:'pending'` para que el Back
   * Office la apruebe o rechace. Requiere `installmentsCount`/`frequency`
   * (y opcionalmente `useCollateral`) porque no habrá un segundo momento
   * con el usuario presente para elegirlos. */
  manualReview?: boolean;
  installmentsCount?: number;
  frequency?: InstallmentFrequency;
  useCollateral?: boolean;
}

export interface SimulateInstallmentsInput {
  accountId: string;
  amountCents: number;
  installmentsCount: number;
  downPaymentCents?: number;
}

export interface InstallmentPreview {
  financedCents: number;
  installmentCents: number;
  /** Incluye la prima del seguro de desgravamen (ver `insurancePremiumCents`). */
  feeTotalCents: number;
  effectiveRatePct: number;
  periodicRatePct: number;
  schedule: AmortizationRow[];
  /** Prima del seguro de desgravamen — automática, ya sumada a `feeTotalCents`,
   * se desglosa acá para mostrarla con transparencia antes de confirmar. */
  insurancePremiumCents: number;
}

export interface CreatePlanInput {
  bnplRequestId: string;
  installmentsCount: number;
  frequency: InstallmentFrequency;
  downPaymentCents?: number;
  /** Días hasta la primera cuota — 30 por defecto (mensual estándar). */
  firstDueInDays?: number;
  /** Si es true, bloquea KRT-STD como garantía (120% del principal) vía
   * tokenService antes de desembolsar — para el producto "Con Garantía KRT". */
  useCollateral?: boolean;
}

export interface BnplService {
  /** Underwriting simulado en el punto de venta: aprobado/rechazado/parcial,
   * con reasonCodes visibles — nunca una aprobación ciega. */
  evaluate(input: EvaluateInput): Promise<BnplRequest>;
  /** Preview de "cuánto pagarás" antes de solicitar. En el sandbox es un
   * cálculo puro sin red; en producción consulta el score real del server
   * (por eso es async en ambos casos — una sola firma para los dos). */
  simulateInstallments(input: SimulateInstallmentsInput): Promise<InstallmentPreview>;
  /** Crea el plan a partir de una solicitud ya aprobada/parcial, descuenta el
   * cupo, registra la transacción de desembolso y sube el score (factor diversificación). */
  createPlan(input: CreatePlanInput): Promise<InstallmentPlan>;
  /** Paga una cuota: libera cupo por su porción de capital, registra la
   * transacción y ajusta el score (a tiempo sube, en mora baja más). */
  payInstallment(planId: string, installmentId: string): Promise<InstallmentPlan>;
  /** Recorre todos los planes y recalcula el estado de cada cuota contra el
   * reloj simulado — se llama después de "avanzar tiempo" en el sandbox. */
  recalculateStatuses(): Promise<void>;
  /** Resuelve una solicitud que quedó `status:'pending'` por revisión manual
   * (ver EvaluateInput.manualReview) — acción exclusiva del Back Office.
   * Aprobar crea y desembolsa el plan con los términos guardados en la
   * solicitud (mismo camino que `createPlan`, sin duplicar lógica). */
  resolveManualRequest(input: { requestId: string; approve: boolean }): Promise<BnplRequest>;
}

export const bnplService: BnplService = isRealBackendEnabled() ? realBnplService : mockBnplService;
