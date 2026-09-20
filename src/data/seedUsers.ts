import type { User, Account } from '../domain/user';
import type { ScoreSnapshot } from '../domain/score';
import type { KrtBalances } from '../domain/token';
import type { BnplRequest, InstallmentPlan, Installment } from '../domain/credit';
import type { Transaction } from '../domain/transaction';
import { getScoreBand } from './scoreBands';
import { SEED_MERCHANTS } from './seedMerchants';
import { generateAmortizationSchedule, totalFeeCents } from '../lib/finance';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Tres perfiles con historiales deliberadamente distintos, para poder mostrar
 * casos de uso completos en una demo (ver sección 6 del brief de producto):
 * score alto, usuario nuevo sin historial, y usuario con una cuota en mora. */
export const SEED_USERS: User[] = [
  {
    id: 'user-maria',
    createdAt: offsetDaysIso(-540),
    name: 'María Fernández',
    accountType: 'persona',
    kycLevel: 3,
    primaryAccountId: 'account-maria',
  },
  {
    id: 'user-diego',
    createdAt: offsetDaysIso(-9),
    name: 'Diego Torres',
    accountType: 'persona',
    kycLevel: 1,
    primaryAccountId: 'account-diego',
  },
  {
    id: 'user-carlos',
    createdAt: offsetDaysIso(-300),
    name: 'Carlos Silva',
    accountType: 'persona',
    kycLevel: 2,
    primaryAccountId: 'account-carlos',
  },
  {
    id: 'user-operador',
    createdAt: offsetDaysIso(-720),
    name: 'Admin KORA',
    accountType: 'operador',
    kycLevel: 0, // no aplica a un operador de Back Office
    // Sin primaryAccountId a propósito — un operador no tiene billetera personal.
  },
  // Roles y permisos de staff (ver src/data/seedStaff.ts): dos perfiles más
  // para demostrar que el Back Office filtra secciones por rol, no solo
  // por accountType — 'Admin KORA' arriba es el admin demo (ve las 9
  // secciones, el único perfil con acceso total al Back Office).
  {
    id: 'user-ana-compliance',
    createdAt: offsetDaysIso(-400),
    name: 'Ana Cumplimiento',
    accountType: 'operador',
    kycLevel: 0,
  },
  {
    id: 'user-luis-reportes',
    createdAt: offsetDaysIso(-200),
    name: 'Luis Reportes',
    accountType: 'operador',
    kycLevel: 0,
  },
  {
    id: 'user-elavila',
    createdAt: offsetDaysIso(-180),
    name: 'Comercial El Ávila C.A.',
    accountType: 'empresa',
    kycLevel: 2,
    primaryAccountId: 'account-elavila',
    businessProfile: {
      razonSocial: 'Comercial El Ávila C.A.',
      rif: 'J-40312589-4', // [AJUSTAR] ilustrativo, formato válido (isValidIdDoc)
      representanteLegal: 'Ana Beatriz Gómez',
    },
  },
];

export const DEFAULT_ACTIVE_USER_ID = 'user-maria';

// ── Cuenta de María: plan BNPL sano (2 de 6 cuotas ya pagadas, sin mora),
// mismo cálculo que el de Carlos — cupo usado depende del saldo pendiente
// real del cronograma, no de un número adivinado. Narrativa del demo del
// martes (ver Plan_5_Dias_Demo_Martes.md): Nivel BNPL 3 de 6. ──
const MARIA_MERCHANT = SEED_MERCHANTS.find((m) => m.id === 'merchant-hogarfacil')!;
const MARIA_PRINCIPAL_CENTS = 30_000; // USD 300.00
const MARIA_PERIODIC_RATE = 0.035; // 3.5% mensual — [AJUSTAR] tasa ilustrativa
const MARIA_INSTALLMENTS = 6;
const mariaSchedule = generateAmortizationSchedule(MARIA_PRINCIPAL_CENTS, MARIA_PERIODIC_RATE, MARIA_INSTALLMENTS);
const mariaFeeTotalCents = totalFeeCents(MARIA_PRINCIPAL_CENTS, MARIA_PERIODIC_RATE, MARIA_INSTALLMENTS);
const mariaMerchantFeeCents = Math.round((MARIA_PRINCIPAL_CENTS * MARIA_MERCHANT.bnplMerchantFeePct) / 100);
// Cupo aún comprometido = saldo pendiente después de las 2 cuotas ya pagadas.
const mariaOutstandingCents = mariaSchedule[1].balanceCents;

// ── Cuenta de Carlos: se calcula antes que SEED_ACCOUNTS porque el cupo usado
// depende del saldo pendiente real del plan BNPL en mora (ver más abajo). ──
const CARLOS_MERCHANT = SEED_MERCHANTS.find((m) => m.id === 'merchant-tecnoplaza')!;
const CARLOS_PRINCIPAL_CENTS = 25_000; // USD 250.00
const CARLOS_PERIODIC_RATE = 0.035; // 3.5% mensual — [AJUSTAR] tasa ilustrativa
const CARLOS_INSTALLMENTS = 4;
const carlosSchedule = generateAmortizationSchedule(CARLOS_PRINCIPAL_CENTS, CARLOS_PERIODIC_RATE, CARLOS_INSTALLMENTS);
const carlosFeeTotalCents = totalFeeCents(CARLOS_PRINCIPAL_CENTS, CARLOS_PERIODIC_RATE, CARLOS_INSTALLMENTS);
const carlosMerchantFeeCents = Math.round((CARLOS_PRINCIPAL_CENTS * CARLOS_MERCHANT.bnplMerchantFeePct) / 100);
// Cupo aún comprometido = saldo pendiente después de la única cuota ya pagada.
const carlosOutstandingCents = carlosSchedule[0].balanceCents;

export const SEED_ACCOUNTS: Account[] = [
  {
    id: 'account-maria',
    userId: 'user-maria',
    label: 'Cuenta personal',
    // Bs 35.000,00 — subido de 8.500 para que alcance a pagar en Bs al
    // menos el producto más barato del Marketplace (Oster Batidora, $37)
    // ahora que el checkout soporta pago con saldo en Bs.
    balanceVesCents: 3_500_000,
    balanceUsdCents: 25_000, // USD 250,00
    creditLimitTotalCents: 40_000, // USD 400,00
    creditLimitUsedCents: mariaOutstandingCents,
  },
  {
    id: 'account-diego',
    userId: 'user-diego',
    label: 'Cuenta personal',
    balanceVesCents: 850_000, // Bs 8.500,00
    balanceUsdCents: 5_000, // USD 50,00
    creditLimitTotalCents: 15_000, // USD 150,00 — solo Micro Express
    creditLimitUsedCents: 0,
  },
  {
    id: 'account-carlos',
    userId: 'user-carlos',
    label: 'Cuenta personal',
    balanceVesCents: 3_200_000, // Bs 32.000,00
    balanceUsdCents: 18_000, // USD 180,00
    creditLimitTotalCents: 60_000, // USD 600,00
    creditLimitUsedCents: carlosOutstandingCents,
  },
  {
    id: 'account-elavila',
    userId: 'user-elavila',
    label: 'Comercial El Ávila C.A.',
    balanceVesCents: 4_500_000, // Bs 45.000,00
    balanceUsdCents: 120_000, // USD 1.200,00
    creditLimitTotalCents: 250_000, // USD 2.500,00
    creditLimitUsedCents: 0,
  },
];

export const SEED_SCORE_SNAPSHOTS: ScoreSnapshot[] = [
  {
    id: 'score-maria-1',
    accountId: 'account-maria',
    at: offsetDaysIso(0),
    value: 60, // Nivel BNPL 3 de 6 (demo martes — ver Plan_5_Dias_Demo_Martes.md)
    band: getScoreBand(60),
    factors: [
      { key: 'historialPagos', label: 'Historial de pagos', weight: 0.35, valuePct: 70 },
      { key: 'antiguedad', label: 'Antigüedad de la cuenta', weight: 0.15, valuePct: 65 },
      { key: 'usoCupo', label: 'Uso del cupo disponible', weight: 0.2, valuePct: 55 },
      { key: 'diversificacion', label: 'Diversificación de productos', weight: 0.15, valuePct: 50 },
      { key: 'saldoKrtStd', label: 'Saldo de puntos disponibles', weight: 0.15, valuePct: 45 },
    ],
  },
  {
    id: 'score-diego-1',
    accountId: 'account-diego',
    at: offsetDaysIso(0),
    value: 29,
    band: getScoreBand(29),
    factors: [
      { key: 'historialPagos', label: 'Historial de pagos', weight: 0.35, valuePct: 15 },
      { key: 'antiguedad', label: 'Antigüedad de la cuenta', weight: 0.15, valuePct: 5 },
      { key: 'usoCupo', label: 'Uso del cupo disponible', weight: 0.2, valuePct: 100 },
      { key: 'diversificacion', label: 'Diversificación de productos', weight: 0.15, valuePct: 0 },
      { key: 'saldoKrtStd', label: 'Saldo de puntos disponibles', weight: 0.15, valuePct: 20 },
    ],
  },
  {
    id: 'score-carlos-1',
    accountId: 'account-carlos',
    at: offsetDaysIso(0),
    value: 50,
    band: getScoreBand(50),
    factors: [
      { key: 'historialPagos', label: 'Historial de pagos', weight: 0.35, valuePct: 55 },
      { key: 'antiguedad', label: 'Antigüedad de la cuenta', weight: 0.15, valuePct: 60 },
      { key: 'usoCupo', label: 'Uso del cupo disponible', weight: 0.2, valuePct: 40 },
      { key: 'diversificacion', label: 'Diversificación de productos', weight: 0.15, valuePct: 50 },
      { key: 'saldoKrtStd', label: 'Saldo de puntos disponibles', weight: 0.15, valuePct: 40 },
    ],
  },
  {
    id: 'score-elavila-1',
    accountId: 'account-elavila',
    at: offsetDaysIso(0),
    value: 62,
    band: getScoreBand(62),
    factors: [
      { key: 'historialPagos', label: 'Historial de pagos', weight: 0.35, valuePct: 70 },
      { key: 'antiguedad', label: 'Antigüedad de la cuenta', weight: 0.15, valuePct: 55 },
      { key: 'usoCupo', label: 'Uso del cupo disponible', weight: 0.2, valuePct: 60 },
      { key: 'diversificacion', label: 'Diversificación de productos', weight: 0.15, valuePct: 40 },
      { key: 'saldoKrtStd', label: 'Saldo de puntos disponibles', weight: 0.15, valuePct: 30 },
    ],
  },
];

export const SEED_KRT_BALANCES: Record<string, KrtBalances> = {
  // Saldo recalibrado para la demo del martes (ver Plan_5_Dias_Demo_Martes.md)
  // — ya no alcanza para colateralizar un crédito grande con KRT (eso no es
  // uno de los 5 flujos reales de esa demo), sigue el número que pidió el brief.
  'account-maria': { STD: 1_200_00, REW: 87_00, CRD: 0, COL: 0 },
  'account-diego': { STD: 1_200_00, REW: 50_00, CRD: 0, COL: 0 },
  'account-carlos': { STD: 22_000_00, REW: 800_00, CRD: 0, COL: 0 },
  'account-elavila': { STD: 8_000_00, REW: 300_00, CRD: 0, COL: 0 },
};

export const SEED_BNPL_REQUESTS: BnplRequest[] = [
  {
    id: 'bnpl-req-maria-1',
    at: offsetDaysIso(-90),
    accountId: 'account-maria',
    merchantId: MARIA_MERCHANT.id,
    requestedAmountCents: MARIA_PRINCIPAL_CENTS,
    status: 'approved',
    reasonCodes: ['score_suficiente', 'cupo_ok'],
    approvedAmountCents: MARIA_PRINCIPAL_CENTS,
    scoreAtEvaluation: 60,
  },
  {
    id: 'bnpl-req-carlos-1',
    at: offsetDaysIso(-75),
    accountId: 'account-carlos',
    merchantId: CARLOS_MERCHANT.id,
    requestedAmountCents: CARLOS_PRINCIPAL_CENTS,
    status: 'approved',
    reasonCodes: ['score_suficiente', 'cupo_ok'],
    approvedAmountCents: CARLOS_PRINCIPAL_CENTS,
    scoreAtEvaluation: 60,
  },
  // Solicitud de KORA Créditos en revisión manual `[AJUSTAR]` — para que la
  // sección nueva del Back Office ("Solicitudes de crédito") no arranque
  // vacía. Diego tiene score bajo (29, ver score-diego-1) a propósito: es
  // justo el caso donde el algoritmo lo rechazaría de entrada, pero con
  // revisión manual el banco puede igual considerarlo.
  {
    id: 'bnpl-req-diego-pendiente',
    at: offsetDaysIso(-1),
    accountId: 'account-diego',
    merchantId: null,
    requestedAmountCents: 50_00,
    status: 'pending',
    reasonCodes: ['revision_manual'],
    scoreAtEvaluation: 29,
    installmentsCount: 3,
    frequency: 'mensual',
  },
];

const mariaInstallments: Installment[] = mariaSchedule.map((row, i) => {
  const dueDate = offsetDaysIso(-60 + i * 30);
  if (i < 2) {
    return {
      id: `installment-maria-1-${row.index}`,
      index: row.index,
      dueDate,
      amountCents: row.installmentCents,
      principalCents: row.principalCents,
      status: 'pagado',
      paidAt: dueDate,
      lateFeeCents: 0,
    };
  }
  return {
    id: `installment-maria-1-${row.index}`,
    index: row.index,
    dueDate,
    amountCents: row.installmentCents,
    principalCents: row.principalCents,
    status: 'al_dia',
    lateFeeCents: 0,
  };
});

const carlosInstallments: Installment[] = carlosSchedule.map((row, i) => {
  const dueDate = offsetDaysIso(-45 + i * 30);
  if (i === 0) {
    return {
      id: `installment-carlos-1-${row.index}`,
      index: row.index,
      dueDate,
      amountCents: row.installmentCents,
      principalCents: row.principalCents,
      status: 'pagado',
      paidAt: dueDate,
      lateFeeCents: 0,
    };
  }
  if (i === 1) {
    return {
      id: `installment-carlos-1-${row.index}`,
      index: row.index,
      dueDate,
      amountCents: row.installmentCents,
      principalCents: row.principalCents,
      status: 'mora',
      lateFeeCents: Math.round(row.installmentCents * 0.02),
    };
  }
  return {
    id: `installment-carlos-1-${row.index}`,
    index: row.index,
    dueDate,
    amountCents: row.installmentCents,
    principalCents: row.principalCents,
    status: 'al_dia',
    lateFeeCents: 0,
  };
});

export const SEED_INSTALLMENT_PLANS: InstallmentPlan[] = [
  {
    id: 'plan-maria-1',
    bnplRequestId: 'bnpl-req-maria-1',
    accountId: 'account-maria',
    merchantId: MARIA_MERCHANT.id,
    principalCents: MARIA_PRINCIPAL_CENTS,
    feeTotalCents: mariaFeeTotalCents,
    effectiveRatePct: Math.round((mariaFeeTotalCents / MARIA_PRINCIPAL_CENTS) * 1000) / 10,
    installmentsCount: MARIA_INSTALLMENTS,
    frequency: 'mensual',
    fixedInstallment: true,
    downPaymentCents: 0,
    firstDueDate: offsetDaysIso(-60),
    merchantFeeCents: mariaMerchantFeeCents,
    status: 'al_dia', // peor estado entre sus cuotas — sin mora
    installments: mariaInstallments,
    createdAt: offsetDaysIso(-90),
  },
  {
    id: 'plan-carlos-1',
    bnplRequestId: 'bnpl-req-carlos-1',
    accountId: 'account-carlos',
    merchantId: CARLOS_MERCHANT.id,
    principalCents: CARLOS_PRINCIPAL_CENTS,
    feeTotalCents: carlosFeeTotalCents,
    effectiveRatePct: Math.round((carlosFeeTotalCents / CARLOS_PRINCIPAL_CENTS) * 1000) / 10,
    installmentsCount: CARLOS_INSTALLMENTS,
    frequency: 'mensual',
    fixedInstallment: true,
    downPaymentCents: 0,
    firstDueDate: offsetDaysIso(-45),
    merchantFeeCents: carlosMerchantFeeCents,
    status: 'mora', // peor estado entre sus cuotas
    installments: carlosInstallments,
    createdAt: offsetDaysIso(-75),
  },
];

/** Transacciones generadas junto con los planes de María y Carlos, para que
 * los montos coincidan exactamente con el cronograma real (no números adivinados). */
export const SEED_CREDIT_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-maria-credito-1',
    accountId: 'account-maria',
    at: offsetDaysIso(-90),
    title: `Compra en ${MARIA_MERCHANT.name}`,
    subtitle: 'Tienda · KORA Cuotas 6x',
    amountCents: MARIA_PRINCIPAL_CENTS,
    currency: 'USD',
    direction: 'out',
    category: 'marketplace',
    relatedEntityId: 'plan-maria-1',
  },
  {
    id: 'tx-maria-credito-2',
    accountId: 'account-maria',
    at: offsetDaysIso(-60),
    title: 'Cuota 1/6 pagada',
    subtitle: `KORA Cuotas · ${MARIA_MERCHANT.name}`,
    amountCents: mariaSchedule[0].installmentCents,
    currency: 'USD',
    direction: 'out',
    category: 'credito',
    relatedEntityId: 'plan-maria-1',
  },
  {
    id: 'tx-maria-credito-3',
    accountId: 'account-maria',
    at: offsetDaysIso(-30),
    title: 'Cuota 2/6 pagada',
    subtitle: `KORA Cuotas · ${MARIA_MERCHANT.name}`,
    amountCents: mariaSchedule[1].installmentCents,
    currency: 'USD',
    direction: 'out',
    category: 'credito',
    relatedEntityId: 'plan-maria-1',
  },
  {
    id: 'tx-carlos-1',
    accountId: 'account-carlos',
    at: offsetDaysIso(-75),
    title: 'Compra en AutoNuevo Caracas',
    subtitle: 'Tienda · KORA Cuotas 4x',
    amountCents: CARLOS_PRINCIPAL_CENTS,
    currency: 'USD',
    direction: 'out',
    category: 'marketplace',
    relatedEntityId: 'plan-carlos-1',
  },
  {
    id: 'tx-carlos-2',
    accountId: 'account-carlos',
    at: offsetDaysIso(-45),
    title: 'Cuota 1/4 pagada',
    subtitle: 'KORA Cuotas · AutoNuevo Caracas',
    amountCents: carlosSchedule[0].installmentCents,
    currency: 'USD',
    direction: 'out',
    category: 'credito',
    relatedEntityId: 'plan-carlos-1',
  },
];
