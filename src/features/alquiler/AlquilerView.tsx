import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { rentalService } from '../../services/rentalService';
import { formatUSD, formatDate } from '../../lib/format';
import { BookingModal } from './BookingModal';
import type { RentalListing, RentalMode, RentalBookingStatus } from '../../domain/rental';

const MODE_TABS: { id: RentalMode; label: string }[] = [
  { id: 'corto-plazo', label: 'Corto plazo' },
  { id: 'renting-corporativo', label: 'Renting corporativo' },
  { id: 'p2p', label: 'P2P' },
];

const STATUS_PILL: Record<RentalBookingStatus, { label: string; cls: string }> = {
  reservado: { label: 'Reservado', cls: 'p-green' },
  'en curso': { label: 'En curso', cls: 'p-amber' },
  finalizado: { label: 'Finalizado', cls: 'p-amber' },
  cancelado: { label: 'Cancelado', cls: 'p-red' },
};

const categoryIcon = (category: string) => (category.toLowerCase().includes('moto') ? '🏍' : category.toLowerCase().includes('carga') ? '🚚' : '🚗');

export function AlquilerView() {
  const account = useKoraStore(selectActiveAccount);
  const [mode, setMode] = useState<RentalMode>('corto-plazo');
  const [bookingListing, setBookingListing] = useState<RentalListing | null>(null);
  const listings = useKoraStore(useShallow((s) => s.rentalListings.filter((l) => l.mode === mode)));
  const bookings = useKoraStore(
    useShallow((s) => (account ? s.rentalBookings.filter((b) => b.accountId === account.id) : []))
  );
  const listingsById = useKoraStore(useShallow((s) => Object.fromEntries(s.rentalListings.map((l) => [l.id, l]))));
  const showToast = useKoraStore((s) => s.showToast);

  if (!account) return null;

  const handleQuoteRequest = (listing: RentalListing) => {
    showToast(`✅ Solicitud enviada a ${listing.ownerName} — te contactan para cerrar el contrato de renting.`);
  };

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await rentalService.cancelBooking(bookingId);
      showToast('Reserva cancelada — reembolso aplicado a tu saldo');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    }
  };

  return (
    <>
      <div className="cats" style={{ marginBottom: 16 }}>
        {MODE_TABS.map((t) => (
          <button key={t.id} className={`cat ${mode === t.id ? 'active' : ''}`} onClick={() => setMode(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card">
        {listings.map((listing) => (
          <div className="unit" key={listing.id}>
            <div className="ui">{categoryIcon(listing.category)}</div>
            <div className="ub">
              <div className="uid">{listing.vehicleLabel}</div>
              <div className="uo">
                {listing.ownerName} · {listing.location}
                {listing.ratingStars ? ` · ★ ${listing.ratingStars.toFixed(1)}` : ''}
              </div>
            </div>
            <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="ua">
                {listing.mode === 'renting-corporativo'
                  ? `${formatUSD(listing.monthlyRateCents ?? 0)}/mes`
                  : `${formatUSD(listing.dailyRateCents ?? 0)}/día`}
              </div>
              {listing.mode === 'renting-corporativo' ? (
                <button className="cbtn" onClick={() => handleQuoteRequest(listing)}>
                  Solicitar cotización
                </button>
              ) : (
                <button className="btn" onClick={() => setBookingListing(listing)}>
                  Reservar
                </button>
              )}
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            No hay vehículos disponibles en esta modalidad todavía.
          </div>
        )}
      </div>

      {mode === 'renting-corporativo' && listings.some((l) => l.minTermMonths) && (
        <div style={{ fontSize: 11.5, color: 'var(--muted)', marginTop: 8 }}>
          Plazo mínimo {Math.min(...listings.filter((l) => l.minTermMonths).map((l) => l.minTermMonths!))} meses — incluye mantenimiento
          y seguro RCV. La solicitud queda como lead, el contrato se cierra fuera de la app.
        </div>
      )}

      <div className="sec-h">
        <h2>Mis reservas</h2>
      </div>
      {bookings.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no tienes reservas de alquiler.
        </div>
      ) : (
        <div className="card">
          {bookings.map((booking) => {
            const listing = listingsById[booking.listingId];
            const status = STATUS_PILL[booking.status];
            return (
              <div className="unit" key={booking.id}>
                <div className="ui">{listing ? categoryIcon(listing.category) : '🚗'}</div>
                <div className="ub">
                  <div className="uid">{listing?.vehicleLabel ?? 'Vehículo'}</div>
                  <div className="uo">
                    {formatDate(booking.startDate)} → {formatDate(booking.endDate)} · {booking.nights} día(s)
                  </div>
                </div>
                <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`pill ${status.cls}`}>{status.label}</span>
                  <div className="ua">{formatUSD(booking.totalCents)}</div>
                  {booking.status === 'reservado' && (
                    <button className="cbtn" onClick={() => handleCancelBooking(booking.id)}>
                      Cancelar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {bookingListing && (
        <BookingModal
          listing={bookingListing}
          accountId={account.id}
          balanceUsdCents={account.balanceUsdCents}
          onClose={() => setBookingListing(null)}
        />
      )}
    </>
  );
}
