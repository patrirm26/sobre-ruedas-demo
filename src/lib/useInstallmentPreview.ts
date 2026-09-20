import { useEffect, useState } from 'react';
import { bnplService, type InstallmentPreview } from '../services/bnplService';

/** `simulateInstallments` es async (ver services/bnplService.ts: en
 * producción consulta el score real del servidor) — este hook reemplaza el
 * `useMemo` síncrono que usaban CreditosView/CheckoutModal antes de que
 * services/real/bnplService.real.ts existiera. */
export function useInstallmentPreview(
  accountId: string | undefined,
  amountCents: number,
  installmentsCount: number,
  downPaymentCents?: number
): InstallmentPreview | null {
  const [preview, setPreview] = useState<InstallmentPreview | null>(null);

  useEffect(() => {
    if (!accountId) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    bnplService.simulateInstallments({ accountId, amountCents, installmentsCount, downPaymentCents }).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [accountId, amountCents, installmentsCount, downPaymentCents]);

  return preview;
}
