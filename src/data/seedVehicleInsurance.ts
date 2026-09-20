import type { VehicleInsurancePlan, VehiclePolicy } from '../domain/vehicleInsurance';

/** 3 planes ilustrativos `[AJUSTAR]` — RCV al precio piso legal, ampliada
 * como upsell con daños propios/robo, y microseguro pay-per-use como
 * entrada de bajo compromiso para quien no asegura el vehículo todo el año. */
export const SEED_VEHICLE_INSURANCE_PLANS: VehicleInsurancePlan[] = [
  {
    id: 'plan-rcv-basico',
    coverageType: 'rcv',
    name: 'RCV Obligatorio',
    description: 'Responsabilidad Civil de Vehículos — el mínimo exigido por ley para circular. Cubre daños a terceros.',
    priceCents: 4_500,
    priceUnit: 'anual',
    coverageCents: 500_000,
    provider: 'Seguros Ávila C.A.',
  },
  {
    id: 'plan-ampliada',
    coverageType: 'ampliada',
    name: 'Cobertura Ampliada',
    description: 'RCV + daños propios, robo e incendio. La opción completa para vehículos financiados o de mayor valor.',
    priceCents: 12_000,
    priceUnit: 'anual',
    coverageCents: 1_500_000,
    provider: 'Seguros Ávila C.A.',
  },
  {
    id: 'plan-payperuse',
    coverageType: 'payperuse',
    name: 'Microseguro Pay-per-Use',
    description: 'Actívalo solo los días que usas el carro — ideal para vehículos de uso ocasional o mientras decides tu póliza anual.',
    priceCents: 150,
    priceUnit: 'dia',
    coverageCents: 300_000,
    provider: 'Seguros Ávila C.A.',
  },
];

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** María ya tiene su RCV vigente (emitido hace 40 días) — para que la vista
 * no cargue vacía y se vea el estado "activa" desde el primer render. */
export const SEED_VEHICLE_POLICIES: VehiclePolicy[] = [
  {
    id: 'vpolicy-maria-rcv',
    accountId: 'account-maria',
    planId: 'plan-rcv-basico',
    coverageType: 'rcv',
    vehiclePlate: 'AC123BC',
    vehicleLabel: 'Toyota Corolla 2018',
    status: 'activa',
    premiumCents: 4_500,
    coverageCents: 500_000,
    startedAt: offsetDaysIso(-40),
    expiresAt: offsetDaysIso(325),
  },
];
