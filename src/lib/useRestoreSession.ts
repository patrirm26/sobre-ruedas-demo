import { useEffect } from 'react';
import { useKoraStore } from '../state/store';
import { isRealBackendEnabled } from '../services/env';
import { authService } from '../services/authService';
import { fetchWhoAmI } from './hydrateSession';
import { hydrateAccountData } from './hydrateAccountData';

/** Restaura la sesión real al recargar la página (Sprint 2 — auth real).
 * Solo aplica con isRealBackendEnabled(): el sandbox no tiene sesión de Supabase
 * Auth que restaurar, `loggedIn` arranca en false y se entra siempre por
 * AuthScreen, como siempre. Si hay una sesión persistida pero el signup
 * nunca completó (`account` null), no autologuea — se trata como sesión
 * inválida y el usuario debe volver a entrar. */
export function useRestoreSession() {
  const loggedIn = useKoraStore((s) => s.loggedIn);
  const login = useKoraStore((s) => s.login);
  const hydrateRealUser = useKoraStore((s) => s.hydrateRealUser);
  const hydrateTransactions = useKoraStore((s) => s.hydrateTransactions);
  const hydrateInstallmentPlans = useKoraStore((s) => s.hydrateInstallmentPlans);
  const setKrtBalances = useKoraStore((s) => s.setKrtBalances);
  const hydrateKrtLedger = useKoraStore((s) => s.hydrateKrtLedger);
  const hydrateOrders = useKoraStore((s) => s.hydrateOrders);

  useEffect(() => {
    if (!isRealBackendEnabled() || loggedIn) return;

    let cancelled = false;
    (async () => {
      const session = await authService.getSession();
      if (!session || cancelled) return;

      const whoami = await fetchWhoAmI();
      if (cancelled || !whoami.account) return;

      hydrateRealUser(whoami.user, whoami.account, whoami.scoreSnapshot);
      // Ver AuthScreen.tsx (handleSubmit/handleRealSignUp) — misma
      // secuencia: hidratar los datos propios ANTES de login() para que
      // nunca se muestre un frame con los datos semilla de María.
      const accountData = await hydrateAccountData(whoami.account.id);
      if (cancelled) return;
      hydrateTransactions(accountData.transactions);
      hydrateInstallmentPlans(accountData.installmentPlans);
      if (accountData.krtBalances) setKrtBalances(whoami.account.id, accountData.krtBalances);
      hydrateKrtLedger(accountData.krtLedger);
      hydrateOrders(accountData.orders);
      login();
    })();

    return () => {
      cancelled = true;
    };
  }, [
    loggedIn,
    login,
    hydrateRealUser,
    hydrateTransactions,
    hydrateInstallmentPlans,
    setKrtBalances,
    hydrateKrtLedger,
    hydrateOrders,
  ]);
}
