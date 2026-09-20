import type { StaffMember } from '../domain/staff';
import { SANDBOX_TENANT } from '../state/tenant';

const offsetDaysIso = (days: number) => new Date(Date.now() + days * 86_400_000).toISOString();

/** Staff demo del tenant sandbox — mismos ids que los perfiles 'operador' de
 * seedUsers.ts, uno por rol (menos 'operaciones', que se demuestra
 * invitando un miembro nuevo desde la sección Staff siendo admin). */
export const SEED_STAFF: StaffMember[] = [
  {
    id: 'user-operador',
    tenantId: SANDBOX_TENANT.id,
    name: 'Admin KORA',
    email: 'admin@kora.demo',
    role: 'admin',
    active: true,
    createdAt: offsetDaysIso(-720),
  },
  {
    id: 'user-ana-compliance',
    tenantId: SANDBOX_TENANT.id,
    name: 'Ana Cumplimiento',
    email: 'ana.compliance@kora.demo',
    role: 'compliance',
    active: true,
    createdAt: offsetDaysIso(-400),
  },
  {
    id: 'user-luis-reportes',
    tenantId: SANDBOX_TENANT.id,
    name: 'Luis Reportes',
    email: 'luis.reportes@kora.demo',
    role: 'reporting',
    active: true,
    createdAt: offsetDaysIso(-200),
  },
];
