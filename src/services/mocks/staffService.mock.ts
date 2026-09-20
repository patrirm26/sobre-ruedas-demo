import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import { recordAudit } from '../../state/slices/auditSlice';
import { SANDBOX_TENANT } from '../../state/tenant';
import { BACKOFFICE_ROLE_LABEL, type StaffMember } from '../../domain/staff';
import type { StaffService, InviteStaffInput, InviteStaffResult, UpdateStaffInput } from '../staffService';
import { simulateLatency } from '../delay';

function generateTempPassword(): string {
  return Math.random().toString(36).slice(-6) + Math.random().toString(36).slice(-4).toUpperCase();
}

function countActiveAdmins(staffMembers: StaffMember[], excludingId?: string): number {
  return staffMembers.filter((m) => m.role === 'admin' && m.active && m.id !== excludingId).length;
}

export const mockStaffService: StaffService = {
  async list(): Promise<StaffMember[]> {
    await simulateLatency();
    return useKoraStore.getState().staffMembers;
  },

  async invite({ name, email, role }: InviteStaffInput): Promise<InviteStaffResult> {
    await simulateLatency();
    const state = useKoraStore.getState();
    if (!name.trim()) throw new Error('El nombre es obligatorio.');
    if (!email.trim()) throw new Error('El correo es obligatorio.');
    if (state.staffMembers.some((m) => m.email.toLowerCase() === email.trim().toLowerCase())) {
      throw new Error('Ya existe un miembro de staff con ese correo.');
    }

    const member: StaffMember = {
      id: generateId('staff'),
      tenantId: SANDBOX_TENANT.id,
      name: name.trim(),
      email: email.trim(),
      role,
      active: true,
      createdAt: state.simulatedNowIso,
    };
    state.addStaffMember(member);
    recordAudit({
      action: 'staff.invite',
      targetType: 'staff_member',
      targetId: member.id,
      detail: `Invitó a ${member.name} como ${BACKOFFICE_ROLE_LABEL[member.role]}`,
    });
    return { member, tempPassword: generateTempPassword() };
  },

  async update({ id, role, active }: UpdateStaffInput): Promise<StaffMember> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const current = state.staffMembers.find((m) => m.id === id);
    if (!current) throw new Error('Miembro de staff no encontrado.');

    const nextRole = role ?? current.role;
    const nextActive = active ?? current.active;
    const losesAdmin = current.role === 'admin' && current.active && (nextRole !== 'admin' || !nextActive);
    if (losesAdmin && countActiveAdmins(state.staffMembers, id) === 0) {
      throw new Error('No puedes quitar el último administrador activo del banco.');
    }

    state.updateStaffMember(id, { role: nextRole, active: nextActive });
    const changes: string[] = [];
    if (nextRole !== current.role) changes.push(`le cambió el rol a ${BACKOFFICE_ROLE_LABEL[nextRole]}`);
    if (nextActive !== current.active) changes.push(nextActive ? 'lo reactivó' : 'lo desactivó');
    recordAudit({
      action: 'staff.update_role',
      targetType: 'staff_member',
      targetId: id,
      detail: `A ${current.name}: ${changes.join(' · ') || 'sin cambios'}`,
    });
    return { ...current, role: nextRole, active: nextActive };
  },
};
