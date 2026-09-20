export type RentalMode = 'corto-plazo' | 'renting-corporativo' | 'p2p';

export interface RentalListing {
  id: string;
  ownerName: string;
  mode: RentalMode;
  vehicleLabel: string;
  category: string;
  imageUrl: string;
  location: string;
  /** corto-plazo / p2p — tarifa diaria. */
  dailyRateCents?: number;
  /** renting-corporativo — tarifa mensual + plazo mínimo. */
  monthlyRateCents?: number;
  minTermMonths?: number;
  ratingStars?: number;
  available: boolean;
}

export type RentalBookingStatus = 'reservado' | 'en curso' | 'finalizado' | 'cancelado';

export interface RentalBooking {
  id: string;
  accountId: string;
  listingId: string;
  /** ISO date (yyyy-mm-dd), sin hora — reservas por día completo. */
  startDate: string;
  endDate: string;
  nights: number;
  totalCents: number;
  status: RentalBookingStatus;
  createdAt: string;
}
