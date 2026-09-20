import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { rentalService } from '../../services/rentalService';
import { formatUSD } from '../../lib/format';
import { useEscapeToClose } from '../../lib/useEscapeToClose';
import type { RentalListing } from '../../domain/rental';

interface Props {
  listing: RentalListing;
  accountId: string;
  balanceUsdCents: number;
  onClose: () => void;
}

const toDateInput = (d: Date) => d.toISOString().slice(0, 10);

export function BookingModal({ listing, accountId, balanceUsdCents, onClose }: Props) {
  const today = new Date();
  const tomorrow = new Date(today.getTime() + 86_400_000);
  const [startDate, setStartDate] = useState(toDateInput(today));
  const [endDate, setEndDate] = useState(toDateInput(tomorrow));
  const [submitting, setSubmitting] = useState(false);
  const showToast = useKoraStore((s) => s.showToast);

  useEscapeToClose(onClose);

  const nights = Math.round((new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000);
  const totalCents = nights > 0 ? nights * (listing.dailyRateCents ?? 0) : 0;
  const canConfirm = nights > 0 && totalCents > 0 && totalCents <= balanceUsdCents;

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await rentalService.createBooking({ accountId, listingId: listing.id, startDate, endDate });
      showToast(`✅ Reservaste ${listing.vehicleLabel} — ${formatUSD(totalCents)}`);
      onClose();
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal="true">
        <div className="m-head">
          <div>
            <h3>{listing.vehicleLabel}</h3>
            <p>
              {listing.ownerName} · {listing.location}
            </p>
          </div>
          <button className="m-x" onClick={onClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
          <div className="in-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="in-label">RETIRO</label>
            <input
              className="in-field"
              type="date"
              value={startDate}
              min={toDateInput(today)}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="in-group" style={{ flex: 1, marginBottom: 0 }}>
            <label className="in-label">DEVOLUCIÓN</label>
            <input
              className="in-field"
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        <div className="sim-out">
          <div className="so-row">
            <span>Tarifa diaria</span>
            <b>{formatUSD(listing.dailyRateCents ?? 0)}</b>
          </div>
          <div className="so-row">
            <span>{nights > 0 ? nights : 0} día(s)</span>
            <b>{formatUSD(totalCents)}</b>
          </div>
          <div className="so-row">
            <span>Tu saldo USD</span>
            <b style={{ color: balanceUsdCents >= totalCents ? 'var(--ink)' : 'var(--red)' }}>{formatUSD(balanceUsdCents)}</b>
          </div>
        </div>

        <button className="btn full" style={{ marginTop: 14 }} disabled={!canConfirm || submitting} onClick={handleConfirm}>
          {submitting ? 'Reservando...' : `Reservar por ${formatUSD(totalCents)}`}
        </button>
      </div>
    </div>
  );
}
