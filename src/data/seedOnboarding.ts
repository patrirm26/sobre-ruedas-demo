import type { MerchantOnboardingRequest } from '../domain/onboarding';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Solicitudes ilustrativas `[AJUSTAR]` para que Onboarding tenga algo real
 * que aprobar/rechazar en la demo — antes arrancaba con la cola vacía. */
export const SEED_MERCHANT_REQUESTS: MerchantOnboardingRequest[] = [
  {
    id: 'merchant-req-ferreteria',
    at: offsetDaysIso(-2),
    name: 'Ferretería Central',
    category: 'Ferretería',
    taxId: 'J-41205788-1',
    proposedBnplFeePct: 4.5,
    status: 'pendiente',
  },
  {
    id: 'merchant-req-panaderia',
    at: offsetDaysIso(-1),
    name: 'Panadería Doña Rosa',
    category: 'Alimentos',
    taxId: 'J-40887321-6',
    proposedBnplFeePct: 3.5,
    status: 'pendiente',
  },
];
