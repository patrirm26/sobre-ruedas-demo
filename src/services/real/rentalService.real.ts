import type { RentalService } from '../rentalService';

const NOT_IMPLEMENTED =
  'Not implemented: rentalService requiere un proveedor de flota/rent-a-car real (disponibilidad, cobro, contrato) — ver PRODUCTION_CHECKLIST.md.';

export const realRentalService: RentalService = {
  async createBooking() {
    throw new Error(NOT_IMPLEMENTED);
  },
  async cancelBooking() {
    throw new Error(NOT_IMPLEMENTED);
  },
};
