import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { StaffMember } from '../../domain/staff';
import { SEED_STAFF } from '../../data/seedStaff';

export interface StaffSlice {
  staffMembers: StaffMember[];
  addStaffMember: (member: StaffMember) => void;
  updateStaffMember: (id: string, patch: Partial<StaffMember>) => void;
}

export const createStaffSlice: StateCreator<StoreState, [], [], StaffSlice> = (set) => ({
  staffMembers: SEED_STAFF,

  addStaffMember: (member) => set((state) => ({ staffMembers: [...state.staffMembers, member] })),

  updateStaffMember: (id, patch) =>
    set((state) => ({ staffMembers: state.staffMembers.map((m) => (m.id === id ? { ...m, ...patch } : m)) })),
});
