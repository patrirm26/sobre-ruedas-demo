import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { ShippingAddress } from '../../domain/shipping';
import { SEED_ADDRESSES } from '../../data/seedAddresses';

export interface AddressSlice {
  addresses: Record<string, ShippingAddress[]>;
  addAddress: (address: ShippingAddress) => void;
}

const seedByAccount = SEED_ADDRESSES.reduce<Record<string, ShippingAddress[]>>((acc, addr) => {
  (acc[addr.accountId] ??= []).push(addr);
  return acc;
}, {});

export const createAddressSlice: StateCreator<StoreState, [], [], AddressSlice> = (set) => ({
  addresses: seedByAccount,

  addAddress: (address) =>
    set((state) => ({
      addresses: {
        ...state.addresses,
        [address.accountId]: [...(state.addresses[address.accountId] ?? []), address],
      },
    })),
});
