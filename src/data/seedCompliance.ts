import type { ComplianceAlert, VerificationRequest } from '../domain/compliance';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Alertas y solicitudes ilustrativas `[AJUSTAR]` para que el rol Compliance
 * tenga algo real que resolver en la demo — antes arrancaba con las dos
 * colas vacías, sin ninguna acción posible para ese perfil. */
export const SEED_COMPLIANCE_ALERTS: ComplianceAlert[] = [
  {
    id: 'alert-diego-1',
    at: offsetDaysIso(-2),
    userId: 'user-diego',
    message: 'Volumen de transacciones inusualmente alto para su nivel de verificación — revisar patrón.',
    status: 'abierta',
  },
  {
    id: 'alert-carlos-1',
    at: offsetDaysIso(-1),
    userId: 'user-carlos',
    message: 'Plan de cuotas con mora activa — evaluar si corresponde reportar como operación sospechosa.',
    status: 'abierta',
  },
];

export const SEED_VERIFICATION_REQUESTS: VerificationRequest[] = [
  {
    id: 'verif-diego-1',
    at: offsetDaysIso(-3),
    userId: 'user-diego',
    currentLevel: 1,
    requestedLevel: 2,
    status: 'pendiente',
  },
  {
    id: 'verif-carlos-1',
    at: offsetDaysIso(-1),
    userId: 'user-carlos',
    currentLevel: 2,
    requestedLevel: 3,
    status: 'pendiente',
  },
];
