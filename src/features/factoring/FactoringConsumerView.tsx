import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveUser } from '../../state/selectors';
import { formatUSD, formatVES, formatDate } from '../../lib/format';
import { factoringService } from '../../services/factoringService';
import { describeReasonCode } from '../../services/reasonCodes';
import type { AdvanceRequest, InvoiceStatus } from '../../domain/factoring';

const STATUS_PILL: Record<InvoiceStatus, { label: string; cls: string }> = {
  pendiente: { label: 'Pendiente', cls: 'p-blue' },
  anticipada: { label: 'Anticipada', cls: 'p-amber' },
  cobrada: { label: 'Cobrada', cls: 'p-green' },
  rechazada: { label: 'Rechazada', cls: 'p-red' },
};

/** Factoring del lado consumidor (Sprint 4 — gate empresarial), sub-flujo de
 * Crédito para cuentas `empresa`. A diferencia de la vista de Back Office
 * (`FactoringView.tsx`, sin tocar — sigue viendo TODAS las facturas de TODOS
 * los comercios), acá solo se ven las facturas de los comercios de los que
 * el usuario activo es dueño (`Merchant.ownerUserId`), sin selector abierto. */
export function FactoringConsumerView() {
  const activeUser = useKoraStore(selectActiveUser);
  const allMerchants = useKoraStore((s) => s.merchants);
  const ownedMerchants = Object.values(allMerchants).filter((m) => m.ownerUserId === activeUser?.id);
  const [merchantId, setMerchantId] = useState(ownedMerchants[0]?.id ?? '');

  const invoices = useKoraStore(
    useShallow((s) =>
      s.invoices.filter((i) => i.merchantId === merchantId).sort((a, b) => new Date(b.issuedAt).getTime() - new Date(a.issuedAt).getTime())
    )
  );
  const walletCents = useKoraStore((s) => s.merchantWalletBalances[merchantId] ?? 0);
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));

  const [debtorName, setDebtorName] = useState('Cliente externo S.A.');
  const [amount, setAmount] = useState(1000);
  const [daysToDue, setDaysToDue] = useState(30);
  const [submittingInvoice, setSubmittingInvoice] = useState(false);
  const [advancingId, setAdvancingId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<AdvanceRequest | null>(null);

  if (ownedMerchants.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        Todavía no tienes un comercio afiliado a KORA — Factoring solo está disponible una vez que tu comercio esté
        dado de alta.
      </div>
    );
  }

  const totals = invoices.reduce(
    (acc, inv) => {
      acc.total += 1;
      if (inv.status === 'anticipada') acc.anticipada += inv.amountCents;
      if (inv.status === 'pendiente') acc.porCobrar += inv.amountCents;
      return acc;
    },
    { total: 0, anticipada: 0, porCobrar: 0 }
  );

  const handleSubmitInvoice = async () => {
    setSubmittingInvoice(true);
    try {
      await factoringService.submitInvoice({ merchantId, debtorName, amountCents: Math.round(amount * 100), daysToDue });
      showToast('✅ Factura cargada');
      setLastResult(null);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmittingInvoice(false);
    }
  };

  const handleRequestAdvance = async (invoiceId: string) => {
    setAdvancingId(invoiceId);
    try {
      const result = await factoringService.requestAdvance(invoiceId);
      setLastResult(result);
      showToast(
        result.approved ? `✅ Anticipo aprobado — ${bs(result.advancedNowCents)} (≈ ${formatUSD(result.advancedNowCents)})` : '⚠️ Anticipo rechazado'
      );
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setAdvancingId(null);
    }
  };

  return (
    <>
      {ownedMerchants.length > 1 && (
        <div className="in-group" style={{ maxWidth: 320 }}>
          <label className="in-label">TU COMERCIO</label>
          <select
            className="in-field"
            value={merchantId}
            onChange={(e) => {
              setMerchantId(e.target.value);
              setLastResult(null);
            }}
          >
            {ownedMerchants.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{totals.total}</b>
          <span>Facturas</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--amber)' }}>{bs(totals.anticipada)}</b>
          <span>Cartera anticipada (≈ {formatUSD(totals.anticipada)})</span>
        </div>
        <div className="cs">
          <b>{bs(totals.porCobrar)}</b>
          <span>Por cobrar (≈ {formatUSD(totals.porCobrar)})</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--green)' }}>{bs(walletCents)}</b>
          <span>Tesorería del comercio (≈ {formatUSD(walletCents)})</span>
        </div>
      </div>

      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Nueva factura</h2>
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="in-row">
          <div className="in-group">
            <label className="in-label">CLIENTE (DEUDOR)</label>
            <input className="in-field" value={debtorName} onChange={(e) => setDebtorName(e.target.value)} />
          </div>
          <div className="in-group">
            <label className="in-label">MONTO (USD)</label>
            <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
          </div>
        </div>
        <div className="in-group">
          <label className="in-label">DÍAS PARA VENCER</label>
          <input className="in-field" type="number" value={daysToDue} onChange={(e) => setDaysToDue(Number(e.target.value) || 0)} />
        </div>
        <button className="btn full" disabled={submittingInvoice} onClick={handleSubmitInvoice}>
          {submittingInvoice ? 'Cargando...' : 'Cargar factura'}
        </button>
      </div>

      {lastResult && (
        <div className="card" style={{ padding: 20, marginBottom: 20, border: '1px solid var(--accent-dim)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <b style={{ fontSize: 14 }}>Resultado de la solicitud de anticipo</b>
            <span className={`pill ${lastResult.approved ? 'p-green' : 'p-red'}`}>{lastResult.approved ? '✓ APROBADO' : '✕ RECHAZADO'}</span>
          </div>
          <ul style={{ listStyle: 'none', marginBottom: lastResult.approved ? 12 : 0 }}>
            {lastResult.reasonCodes.map((code) => (
              <li key={code} style={{ fontSize: 12, color: 'var(--muted)', padding: '3px 0', display: 'flex', gap: 7 }}>
                <span style={{ color: 'var(--accent2)' }}>·</span>
                {describeReasonCode(code)}
              </li>
            ))}
          </ul>
          {lastResult.approved && (
            <div style={{ fontSize: 13 }}>
              Adelanto neto:{' '}
              <b>
                {bs(lastResult.advancedNowCents)} (≈ {formatUSD(lastResult.advancedNowCents)})
              </b>{' '}
              ({lastResult.advanceRatePct}% de la factura, comisión de descuento{' '}
              {lastResult.discountFeePct}%)
            </div>
          )}
        </div>
      )}

      <div className="sec-h">
        <h2>Facturas cargadas</h2>
      </div>
      {invoices.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Este comercio todavía no tiene facturas cargadas.
        </div>
      ) : (
        <div className="card">
          {invoices.map((inv) => {
            const { label, cls } = STATUS_PILL[inv.status];
            return (
              <div className="unit" key={inv.id}>
                <div className="ui">🧾</div>
                <div className="ub">
                  <div className="uid">{inv.debtorName}</div>
                  <div className="uo">
                    {bs(inv.amountCents)} (≈ {formatUSD(inv.amountCents)}) · vence {formatDate(inv.dueDate)}
                  </div>
                </div>
                <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span className={`pill ${cls}`}>{label}</span>
                  {inv.status === 'pendiente' && (
                    <button className="cbtn" disabled={advancingId === inv.id} onClick={() => handleRequestAdvance(inv.id)}>
                      {advancingId === inv.id ? 'Evaluando...' : 'Solicitar anticipo'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
