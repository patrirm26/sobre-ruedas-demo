export type BackofficeRole = 'admin' | 'compliance' | 'operaciones' | 'reporting';

export const BACKOFFICE_ROLE_LABEL: Record<BackofficeRole, string> = {
  admin: 'Administrador',
  compliance: 'Cumplimiento',
  operaciones: 'Operaciones',
  reporting: 'Reportes',
};

export interface StaffMember {
  /** = auth.users.id / users.id del operador — mismo id que activeUser.id. */
  id: string;
  tenantId: string;
  name: string;
  email: string;
  role: BackofficeRole;
  active: boolean;
  createdAt: string;
}
