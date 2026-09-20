import { useEffect } from 'react';
import { useKoraStore } from '../state/store';
import { fetchOfficialBcvRate } from '../services/bcvRateService';

function isSameRealDay(iso: string | null): boolean {
  if (!iso) return false;
  return new Date(iso).toDateString() === new Date().toDateString();
}

/** Sincroniza la tasa BCV con la fuente oficial una vez por día real (no por
 * el reloj simulado del sandbox, que puede adelantarse arbitrariamente). Si
 * falla — sin conexión, CORS, etc. — se queda con la última tasa conocida y
 * lo marca como 'fallback' para que la UI lo muestre con transparencia. */
export function useSyncBcvRate() {
  const bcvRateFetchedAt = useKoraStore((s) => s.bcvRateFetchedAt);
  const setLiveBcvRate = useKoraStore((s) => s.setLiveBcvRate);
  const markBcvRateFallback = useKoraStore((s) => s.markBcvRateFallback);

  useEffect(() => {
    if (isSameRealDay(bcvRateFetchedAt)) return;

    let cancelled = false;
    fetchOfficialBcvRate()
      .then(({ rate, asOf }) => {
        if (!cancelled) setLiveBcvRate(rate, asOf);
      })
      .catch(() => {
        if (!cancelled) markBcvRateFallback();
      });

    return () => {
      cancelled = true;
    };
    // Re-correr cuando bcvRateFetchedAt cambia es seguro: tras un fetch exitoso
    // isSameRealDay ya da true y no dispara uno nuevo (sin loop).
  }, [bcvRateFetchedAt, setLiveBcvRate, markBcvRateFallback]);
}
