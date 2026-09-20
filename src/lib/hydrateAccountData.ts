import { getSupabaseClient } from './supabaseClient';
import type { Transaction } from '../domain/transaction';
import type { InstallmentPlan, Installment } from '../domain/credit';
import type { KrtBalances, KrtLedgerEntry } from '../domain/token';
import type { Order } from '../domain/marketplace';

// deno-lint-ignore no-explicit-any
type Row = Record<string, any>;

/** Mismo mapeo snake_case → camelCase que `supabase/functions/_shared/mappers.ts`
 * usa server-side — se duplica acá porque el cliente (Vite) y las Edge
 * Functions (Deno) son runtimes/deploys separados, sin módulo compartido
 * entre ambos. Si esas tablas cambian de forma, hay que actualizar los dos. */

function mapTransactionRow(row: Row): Transaction {
  return {
    id: row.id,
    accountId: row.account_id,
    at: row.at,
    title: row.title,
    subtitle: row.subtitle,
    amountCents: row.amount_cents,
    currency: row.currency,
    direction: row.direction,
    category: row.category,
    krtDeltaCents: row.krt_delta_cents ?? undefined,
    relatedEntityId: row.related_entity_id ?? undefined,
  };
}

function mapInstallmentRow(row: Row): Installment {
  return {
    id: row.id,
    index: row.index,
    dueDate: row.due_date,
    amountCents: row.amount_cents,
    principalCents: row.principal_cents,
    status: row.status,
    paidAt: row.paid_at ?? undefined,
    lateFeeCents: row.late_fee_cents,
  };
}

function mapInstallmentPlanRow(row: Row): InstallmentPlan {
  return {
    id: row.id,
    bnplRequestId: row.bnpl_request_id,
    accountId: row.account_id,
    merchantId: row.merchant_id,
    principalCents: row.principal_cents,
    feeTotalCents: row.fee_total_cents,
    effectiveRatePct: row.effective_rate_pct,
    installmentsCount: row.installments_count,
    frequency: row.frequency,
    fixedInstallment: row.fixed_installment,
    downPaymentCents: row.down_payment_cents,
    firstDueDate: row.first_due_date,
    merchantFeeCents: row.merchant_fee_cents,
    status: row.status,
    installments: ((row.installments as Row[]) ?? []).map(mapInstallmentRow),
    collateral:
      row.collateral_locked_krt_cents != null
        ? { lockedKrtCents: row.collateral_locked_krt_cents, ratioPct: row.collateral_ratio_pct }
        : undefined,
    createdAt: row.created_at,
  };
}

function mapKrtBalancesRow(row: Row): KrtBalances {
  return { STD: row.std_cents, REW: row.rew_cents, CRD: row.crd_cents, COL: row.col_cents };
}

function mapKrtLedgerRow(row: Row): KrtLedgerEntry {
  return {
    id: row.id,
    at: row.at,
    type: row.type,
    from: row.from_account_id
      ? {
          accountId: row.from_account_id,
          subBalance: row.from_sub_balance,
          deltaCents: row.from_delta_cents,
          resultingBalanceCents: row.from_resulting_balance_cents,
        }
      : null,
    to: row.to_account_id
      ? {
          accountId: row.to_account_id,
          subBalance: row.to_sub_balance,
          deltaCents: row.to_delta_cents,
          resultingBalanceCents: row.to_resulting_balance_cents,
        }
      : null,
    relatedEntityId: row.related_entity_id ?? undefined,
    reason: row.reason,
  };
}

function mapOrderRow(row: Row): Order {
  return {
    id: row.id,
    accountId: row.account_id,
    merchantId: row.merchant_id,
    at: row.at,
    items: row.items,
    totalCents: row.total_cents,
    paymentMethod: row.payment_method,
    installmentPlanId: row.installment_plan_id ?? undefined,
  };
}

/** Único punto donde el frontend lee sus propios datos de dominio reales
 * (transacciones, planes de cuotas, saldo/ledger KRT, órdenes) — hoy solo
 * `auth-whoami` (ver hydrateSession.ts) hidrata user/account/score, nada
 * más. Sin Edge Functions nuevas: las policies RLS de cada tabla ("usuario
 * lee sus propias transacciones/planes/krt_balances/krt_ledger/órdenes",
 * ver initial_schema.sql) ya acotan el resultado al dueño de la cuenta —
 * mismo criterio que `TenantContext.tsx` usa para `tenants`. */
export async function fetchTransactions(accountId: string): Promise<Transaction[]> {
  const { data, error } = await getSupabaseClient()
    .from('transactions')
    .select('*')
    .eq('account_id', accountId)
    .order('at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapTransactionRow);
}

export async function fetchInstallmentPlans(accountId: string): Promise<InstallmentPlan[]> {
  const { data, error } = await getSupabaseClient()
    .from('installment_plans')
    .select('*, installments(*)')
    .eq('account_id', accountId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapInstallmentPlanRow);
}

export async function fetchKrtBalances(accountId: string): Promise<KrtBalances | null> {
  const { data, error } = await getSupabaseClient()
    .from('krt_balances')
    .select('*')
    .eq('account_id', accountId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapKrtBalancesRow(data) : null;
}

export async function fetchKrtLedger(accountId: string): Promise<KrtLedgerEntry[]> {
  const { data, error } = await getSupabaseClient()
    .from('krt_ledger')
    .select('*')
    .or(`from_account_id.eq.${accountId},to_account_id.eq.${accountId}`)
    .order('at', { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapKrtLedgerRow);
}

export async function fetchOrders(accountId: string): Promise<Order[]> {
  const { data, error } = await getSupabaseClient().from('orders').select('*').eq('account_id', accountId);
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapOrderRow);
}

export interface AccountData {
  transactions: Transaction[];
  installmentPlans: InstallmentPlan[];
  krtBalances: KrtBalances | null;
  krtLedger: KrtLedgerEntry[];
  orders: Order[];
}

export async function hydrateAccountData(accountId: string): Promise<AccountData> {
  const [transactions, installmentPlans, krtBalances, krtLedger, orders] = await Promise.all([
    fetchTransactions(accountId),
    fetchInstallmentPlans(accountId),
    fetchKrtBalances(accountId),
    fetchKrtLedger(accountId),
    fetchOrders(accountId),
  ]);
  return { transactions, installmentPlans, krtBalances, krtLedger, orders };
}
