import type { StateCreator } from 'zustand';
import type { StoreState } from '../store';
import type { RentalListing, RentalBooking } from '../../domain/rental';
import { SEED_RENTAL_LISTINGS } from '../../data/seedRentals';

export interface RentalSlice {
  rentalListings: RentalListing[];
  rentalBookings: RentalBooking[];
  addRentalBooking: (booking: RentalBooking) => void;
  updateRentalBooking: (id: string, patch: Partial<RentalBooking>) => void;
}

export const createRentalSlice: StateCreator<StoreState, [], [], RentalSlice> = (set) => ({
  rentalListings: SEED_RENTAL_LISTINGS,
  rentalBookings: [],

  addRentalBooking: (booking) => set((state) => ({ rentalBookings: [...state.rentalBookings, booking] })),

  updateRentalBooking: (id, patch) =>
    set((state) => ({
      rentalBookings: state.rentalBookings.map((b) => (b.id === id ? { ...b, ...patch } : b)),
    })),
});
