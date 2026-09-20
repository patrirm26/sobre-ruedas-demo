import type { StaffMember } from '../../domain/staff';
import type { StaffService, InviteStaffInput, InviteStaffResult, UpdateStaffInput } from '../staffService';
import { invokeEdgeFunction } from '../../lib/invokeEdgeFunction';

export const realStaffService: StaffService = {
  list(): Promise<StaffMember[]> {
    return invokeEdgeFunction<StaffMember[]>('staff-list', {});
  },
  invite(input: InviteStaffInput): Promise<InviteStaffResult> {
    return invokeEdgeFunction<InviteStaffResult>('staff-invite', input);
  },
  update(input: UpdateStaffInput): Promise<StaffMember> {
    return invokeEdgeFunction<StaffMember>('staff-update-role', input);
  },
};
