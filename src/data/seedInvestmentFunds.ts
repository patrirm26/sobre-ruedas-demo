import type { InvestmentFund, FundPosition } from '../domain/investmentFund';
import { computeAccrual } from '../services/investmentFundRules';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** 6 fondos ilustrativos `[AJUSTAR]` — tasas nominales anuales simples,
 * ordenados de menor a mayor riesgo/rendimiento. Los últimos 3 respaldan
 * activos reales (inmueble/vehículo/negocio) — antes vivían en un módulo
 * aparte de "Tokenización" con su propio modelo de unidades fraccionadas y
 * emisor ambiguo (¿el banco? ¿la empresa dueña del activo?); se fusionaron
 * acá porque Fondos ya resuelve esa pregunta con claridad: KORA cura y
 * ofrece, el usuario invierte plata y gana rendimiento — mismo mecanismo
 * de invertir/aportar/rescatar para los 6, sin un modelo nuevo que explicar. */
export const SEED_INVESTMENT_FUNDS: InvestmentFund[] = [
  {
    id: 'fund-liquidez-usd',
    name: 'Fondo KORA Liquidez USD',
    description: 'Instrumentos de muy corto plazo en USD — la opción más conservadora, pensada para no perder acceso rápido al dinero.',
    riskLevel: 'bajo',
    annualYieldPct: 6,
    minInvestmentCents: 10_00,
    currency: 'USD',
  },
  {
    id: 'fund-renta-fija-usd',
    name: 'Fondo KORA Renta Fija USD',
    description: 'Cartera diversificada de instrumentos de renta fija en USD — riesgo moderado a cambio de un rendimiento mayor que el de liquidez.',
    riskLevel: 'moderado',
    annualYieldPct: 9,
    minInvestmentCents: 50_00,
    currency: 'USD',
  },
  {
    id: 'fund-renta-variable',
    name: 'Fondo KORA Renta Variable',
    description: 'Exposición a instrumentos de mayor volatilidad — el rendimiento potencial más alto, con el riesgo que eso implica.',
    riskLevel: 'alto',
    annualYieldPct: 14,
    minInvestmentCents: 100_00,
    currency: 'USD',
  },
  {
    id: 'fund-inmobiliario-lospalosgrandes',
    name: 'Fondo Inmobiliario — Apartamento Los Palos Grandes',
    description: 'Respaldado por un apartamento de 2 habitaciones en zona residencial consolidada — el rendimiento viene de la renta mensual del inmueble.',
    riskLevel: 'moderado',
    annualYieldPct: 8,
    minInvestmentCents: 100_00,
    currency: 'USD',
  },
  {
    id: 'fund-flota-construexpress',
    name: 'Fondo Flota — Camioneta ConstruExpress',
    description: 'Respaldado por un vehículo de carga en operación logística — rendimiento ligado al ingreso por operación de la flota.',
    riskLevel: 'alto',
    annualYieldPct: 13,
    minInvestmentCents: 50_00,
    currency: 'USD',
  },
  {
    id: 'fund-comercio-bodegonavila',
    name: 'Fondo Comercio — Bodegón El Ávila',
    description: 'Respaldado por la operación del local comercial Bodegón El Ávila — rendimiento proporcional a sus ventas.',
    riskLevel: 'alto',
    annualYieldPct: 15,
    minInvestmentCents: 100_00,
    currency: 'USD',
  },
];

/** María arranca con 2 posiciones abiertas, para que la vista no cargue
 * vacía. El rendimiento se precalcula con `computeAccrual` (misma función
 * pura que usa el barrido en runtime) para que el número sembrado sea el
 * que ya correspondería a esos días, no un 0 artificial. */
const mariaLiquidezOpenedAt = offsetDaysIso(-60);
const mariaLiquidezAccrual = computeAccrual(
  { id: '', accountId: '', fundId: '', principalCents: 500_00, accruedYieldCents: 0, openedAt: mariaLiquidezOpenedAt, lastAccrualAt: mariaLiquidezOpenedAt },
  SEED_INVESTMENT_FUNDS[0],
  new Date().toISOString()
);

/** Antes vivía como "50 unidades a $100" en el módulo de Tokenización — ese
 * monto ($5.000) quedó desalineado con el resto de su perfil recalibrado
 * para la demo (VES 8.500 / USD 250 / KRT 1.200, ver seedUsers.ts), así que
 * se reescala a algo creíble para esa misma persona, con fecha de apertura
 * consistente con el resto de su seed histórico (offsetDaysIso(-90)). */
const mariaInmobiliarioOpenedAt = offsetDaysIso(-90);
const mariaInmobiliarioAccrual = computeAccrual(
  { id: '', accountId: '', fundId: '', principalCents: 300_00, accruedYieldCents: 0, openedAt: mariaInmobiliarioOpenedAt, lastAccrualAt: mariaInmobiliarioOpenedAt },
  SEED_INVESTMENT_FUNDS[3],
  new Date().toISOString()
);

export const SEED_FUND_POSITIONS: FundPosition[] = [
  {
    id: 'fund-position-maria-liquidez',
    accountId: 'account-maria',
    fundId: 'fund-liquidez-usd',
    principalCents: 500_00,
    accruedYieldCents: mariaLiquidezAccrual.accruedYieldCents,
    openedAt: mariaLiquidezOpenedAt,
    lastAccrualAt: mariaLiquidezAccrual.lastAccrualAt,
  },
  {
    id: 'fund-position-maria-inmobiliario',
    accountId: 'account-maria',
    fundId: 'fund-inmobiliario-lospalosgrandes',
    principalCents: 300_00,
    accruedYieldCents: mariaInmobiliarioAccrual.accruedYieldCents,
    openedAt: mariaInmobiliarioOpenedAt,
    lastAccrualAt: mariaInmobiliarioAccrual.lastAccrualAt,
  },
];
