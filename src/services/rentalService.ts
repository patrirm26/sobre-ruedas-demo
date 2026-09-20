import type { RentalBooking } from '../domain/rental';
import { isRealBackendEnabled } from './env';
import { mockRentalService } from './mocks/rentalService.mock';
import { realRentalService } from './real/rentalService.real';

export interface CreateBookingInput {
  accountId: string;
  listingId: string;
  /** ISO date (yyyy-mm-dd). */
  startDate: string;
  endDate: string;
}

export interface RentalService {
  /** Solo aplica a listados de corto-plazo/P2P (tarifa diaria) — renting
   * corporativo se cotiza aparte, no reserva por fecha. */
  createBooking(input: CreateBookingInput): Promise<RentalBooking>;
  cancelBooking(bookingId: string): Promise<RentalBooking>;
}

export const rentalService: RentalService = isRealBackendEnabled() ? realRentalService : mockRentalService;
