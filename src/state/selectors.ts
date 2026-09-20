import type { StoreState } from './store';

export function selectActiveUser(state: StoreState) {
  return state.users[state.activeUserId];
}

export function selectActiveAccount(state: StoreState) {
  const user = selectActiveUser(state);
  return user?.primaryAccountId ? state.accounts[user.primaryAccountId] : undefined;
}

/** Cupo BNPL/crédito disponible ahora mismo — se descuenta al usar, se libera al pagar. */
export function selectCreditAvailableCents(state: StoreState): number {
  const account = selectActiveAccount(state);
  if (!account) return 0;
  return account.creditLimitTotalCents - account.creditLimitUsedCents;
}

export function selectKrtTotalCents(state: StoreState): number {
  const account = selectActiveAccount(state);
  if (!account) return 0;
  const balances = state.krtBalances[account.id];
  if (!balances) return 0;
  return balances.STD + balances.REW + balances.CRD + balances.COL;
}

export function selectActiveScoreSnapshot(state: StoreState) {
  const account = selectActiveAccount(state);
  return account ? state.scoreSnapshots[account.id] : undefined;
}

/**
 * Devuelve un array NUEVO en cada llamada (filter/map/sort) — este selector y
 * `selectUpcomingInstallments` deben usarse envueltos en `useShallow` de
 * 'zustand/react/shallow' en el componente, o Zustand v5 entra en loop
 * infinito (useSyncExternalStore compara por referencia).
 */
export function selectAccountTransactions(state: StoreState) {
  const account = selectActiveAccount(state);
  if (!account) return [];
  return state.transactions.filter((tx) => tx.accountId === account.id);
}

/** Próximas cuotas del usuario activo (no pagadas), ordenadas por vencimiento.
 * Ver nota de `selectAccountTransactions` sobre `useShallow`. */
export function selectUpcomingInstallments(state: StoreState) {
  const account = selectActiveAccount(state);
  if (!account) return [];
  // Sin spread por cuota (`{...installment, planId}`) a propósito: crear un
  // objeto nuevo por cada cuota en cada render rompe la comparación shallow
  // de `useShallow` (las referencias nunca coinciden) y entra en loop
  // infinito — mismo tipo de bug que ya advierte el comentario de arriba,
  // pero un nivel más profundo (el array cambia de referencia igual, pero
  // antes también cambiaban sus elementos). `planId` no lo usa ningún caller
  // hoy (ver CopilotView.tsx) — si hiciera falta, agregarlo sin spread.
  return Object.values(state.installmentPlans)
    .filter((plan) => plan.accountId === account.id)
    .flatMap((plan) => plan.installments)
    .filter((installment) => installment.status !== 'pagado')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}
