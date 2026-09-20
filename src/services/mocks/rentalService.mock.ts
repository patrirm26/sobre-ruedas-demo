import { useKoraStore } from '../../state/store';
import { generateId } from '../../lib/ids';
import type { RentalBooking } from '../../domain/rental';
import type { RentalService, CreateBookingInput } from '../rentalService';
import { simulateLatency } from '../delay';

const DAY_MS = 86_400_000;

export const mockRentalService: RentalService = {
  async createBooking({ accountId, listingId, startDate, endDate }: CreateBookingInput): Promise<RentalBooking> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const account = state.accounts[accountId];
    const listing = state.rentalListings.find((l) => l.id === listingId);
    if (!account || !listing) throw new Error('Cuenta o vehículo no encontrado.');
    if (listing.mode === 'renting-corporativo') throw new Error('El renting corporativo se cotiza, no se reserva por fecha.');
    if (!listing.available) throw new Error('Este vehículo no está disponible.');
    if (!listing.dailyRateCents) throw new Error('Este listado no tiene tarifa diaria configurada.');

    const start = new Date(startDate);
    const end = new Date(endDate);
    const nights = Math.round((end.getTime() - start.getTime()) / DAY_MS);
    if (!(nights > 0)) throw new Error('La fecha de devolución debe ser posterior a la de retiro.');

    const totalCents = nights * listing.dailyRateCents;
    if (account.balanceUsdCents < totalCents) throw new Error('Saldo en USD insuficiente para esta reserva.');

    const booking: RentalBooking = {
      id: generateId('rbooking'),
      accountId,
      listingId,
      startDate,
      endDate,
      nights,
      totalCents,
      status: 'reservado',
      createdAt: state.simulatedNowIso,
    };
    state.addRentalBooking(booking);
    state.adjustBalance(accountId, 'USD', -totalCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId,
      at: state.simulatedNowIso,
      title: `Alquiler — ${listing.vehicleLabel}`,
      subtitle: `${listing.ownerName} · ${nights} día${nights > 1 ? 's' : ''}`,
      amountCents: totalCents,
      currency: 'USD',
      direction: 'out',
      category: 'alquiler',
      relatedEntityId: booking.id,
    });
    return booking;
  },

  async cancelBooking(bookingId: string): Promise<RentalBooking> {
    await simulateLatency();
    const state = useKoraStore.getState();
    const booking = state.rentalBookings.find((b) => b.id === bookingId);
    if (!booking) throw new Error('Reserva no encontrada.');
    if (booking.status !== 'reservado') throw new Error('Solo se pueden cancelar reservas pendientes.');
    const updated: RentalBooking = { ...booking, status: 'cancelado' };
    state.updateRentalBooking(bookingId, updated);
    // Reembolso completo — es una reserva futura que todavía no inició.
    state.adjustBalance(booking.accountId, 'USD', booking.totalCents);
    state.pushTransaction({
      id: generateId('tx'),
      accountId: booking.accountId,
      at: state.simulatedNowIso,
      title: 'Reembolso — reserva cancelada',
      subtitle: 'Alquiler',
      amountCents: booking.totalCents,
      currency: 'USD',
      direction: 'in',
      category: 'alquiler',
      relatedEntityId: booking.id,
    });
    return updated;
  },
};
