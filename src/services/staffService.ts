import type { BackofficeRole, StaffMember } from '../domain/staff';
import { isRealBackendEnabled } from './env';
import { mockStaffService } from './mocks/staffService.mock';
import { realStaffService } from './real/staffService.real';

export interface InviteStaffInput {
  name: string;
  email: string;
  role: BackofficeRole;
}

export interface InviteStaffResult {
  member: StaffMember;
  /** Contraseña temporal generada — este proyecto no tiene SMTP configurado
   * para invitar por email real, así que el admin la comparte a mano. */
  tempPassword: string;
}

export interface UpdateStaffInput {
  id: string;
  role?: BackofficeRole;
  active?: boolean;
}

export interface StaffService {
  /** Lista el staff del propio tenant. Solo accesible con rol 'admin'. */
  list(): Promise<StaffMember[]>;
  /** Da de alta un nuevo miembro de staff. Solo accesible con rol 'admin'. */
  invite(input: InviteStaffInput): Promise<InviteStaffResult>;
  /** Cambia rol y/o estado activo de un miembro existente. Solo 'admin'.
   * Bloquea que el único admin activo del tenant se desactive o se quite
   * el rol admin a sí mismo — dejaría al banco sin nadie que administre. */
  update(input: UpdateStaffInput): Promise<StaffMember>;
}

export const staffService: StaffService = isRealBackendEnabled() ? realStaffService : mockStaffService;
