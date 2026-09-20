import { useState } from 'react';
import { useKoraStore } from '../../../state/store';
import type { Account } from '../../../domain/user';
import type { Merchant, Order } from '../../../domain/marketplace';
import { formatUSD, formatVES, formatPercent, formatKRT } from '../../../lib/format';
import { BnplEvaluationCard } from '../../../components/BnplEvaluationCard';
import { useBnplFlow } from '../../../lib/useBnplFlow';
import { useInstallmentPreview } from '../../../lib/useInstallmentPreview';
import type { CartLine } from '../../../lib/useCartLines';
import { marketplaceService } from '../../../services/marketplaceService';

export interface CheckoutReceipt {
  lines: CartLine[];
  totalCents: number;
}

interface Props {
  account: Account;
  merchant: Merchant;
  lines: CartLine[];
  totalCents: number;
  onBack: () => void;
  /** `receipt` es una foto de `lines`/`totalCents` tomada ANTES de vaciar el
   * carrito — si se usaran los props en vivo, al llamar clearCart() el
   * carrito (y por lo tanto `lines`) queda vacío y la pantalla de éxito
   * se queda sin qué mostrar. */
  onPaid: (order: Order, receipt: CheckoutReceipt) => void;
}

type PayMethod = 'saldo_usd' | 'saldo_ves' | 'krt' | 'bnpl';

export function PaymentStep({ account, merchant, lines, totalCents, onBack, onPaid }: Props) {
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const krtBalances = useKoraStore((s) => s.krtBalances[account.id]);
  const clearCart = useKoraStore((s) => s.clearCart);
  const showToast = useKoraStore((s) => s.showToast);
  const { evaluation, submitting, requestEvaluation, confirmPlan, cancel } = useBnplFlow();

  const allBnplEligible = lines.length > 0 && lines.every((l) => l.product.bnplEligible);
  const krtNeededCents = Math.round(totalCents * bcvRate);
  const totalVesCents = Math.round(totalCents * bcvRate);

  // El saldo USD es el método "obvio" (primer botón, ya viene seleccionado),
  // pero si no alcanza para el total, quedaba deshabilitado sin avisar que
  // había una alternativa real — el comprador veía un botón "Pagar" muerto
  // y pensaba que la compra no funcionaba. Si USD no alcanza, se preselecciona
  // el primer método que sí cubre el total (Bs, Puntos o KORA Cuotas si el
  // producto lo admite), en ese orden; si ninguno alcanza, se deja en USD
  // para mostrar el faltante real, que es información correcta.
  const [method, setMethod] = useState<PayMethod>(() => {
    if (account.balanceUsdCents >= totalCents) return 'saldo_usd';
    if (account.balanceVesCents >= Math.round(totalCents * bcvRate)) return 'saldo_ves';
    if ((krtBalances?.STD ?? 0) >= Math.round(totalCents * bcvRate)) return 'krt';
    if (allBnplEligible) return 'bnpl';
    return 'saldo_usd';
  });
  const [installments, setInstallments] = useState(3);
  const [processing, setProcessing] = useState(false);

  const preview = useInstallmentPreview(method === 'bnpl' ? account.id : undefined, totalCents, installments);

  const handlePaySingle = async () => {
    setProcessing(true);
    try {
      const order = await marketplaceService.checkoutWithBalance({
        accountId: account.id,
        merchantId: merchant.id,
        items: lines.map((l) => l.item),
        totalCents,
        method: method === 'krt' ? 'krt' : 'saldo',
        currency: method === 'saldo_ves' ? 'VES' : 'USD',
      });
      clearCart();
      onPaid(order, { lines, totalCents });
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleConfirmBnpl = async () => {
    const plan = await confirmPlan(installments, 'mensual');
    if (!plan) return;
    const order = await marketplaceService.recordBnplOrder({
      accountId: account.id,
      merchantId: merchant.id,
      items: lines.map((l) => l.item),
      totalCents,
      installmentPlanId: plan.id,
    });
    clearCart();
    onPaid(order, { lines, totalCents });
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>¿Cómo querés pagar?</h3>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Elige uno de tus métodos disponibles en KORA.</p>

      <button className={`select-row ${method === 'saldo_usd' ? 'active' : ''}`} onClick={() => setMethod('saldo_usd')}>
        <span className="sr-icon">💵</span>
        <span className="sr-body">
          <span className="sr-title">Saldo USD</span>
          <span className="sr-sub" style={{ display: 'block' }}>
            Tienes {formatUSD(account.balanceUsdCents)}
          </span>
        </span>
        <span className="sr-check">✓</span>
      </button>
      <button className={`select-row ${method === 'saldo_ves' ? 'active' : ''}`} onClick={() => setMethod('saldo_ves')}>
        <span className="sr-icon">💴</span>
        <span className="sr-body">
          <span className="sr-title">Saldo en Bs</span>
          <span className="sr-sub" style={{ display: 'block' }}>
            Tienes {formatVES(account.balanceVesCents)}
          </span>
        </span>
        <span className="sr-check">✓</span>
      </button>
      <button className={`select-row ${method === 'krt' ? 'active' : ''}`} onClick={() => setMethod('krt')}>
        <span className="sr-icon">◉</span>
        <span className="sr-body">
          <span className="sr-title">Pagar con Puntos</span>
          <span className="sr-sub" style={{ display: 'block' }}>
            Tienes {formatKRT(krtBalances?.STD ?? 0)}
          </span>
        </span>
        <span className="sr-check">✓</span>
      </button>
      <button
        className={`select-row ${method === 'bnpl' ? 'active' : ''}`}
        disabled={!allBnplEligible}
        onClick={() => allBnplEligible && setMethod('bnpl')}
        title={allBnplEligible ? undefined : 'Uno o más productos del carrito no admiten KORA Cuotas'}
      >
        <span className="sr-icon">▤</span>
        <span className="sr-body">
          <span className="sr-title">KORA Cuotas</span>
          <span className="sr-sub" style={{ display: 'block' }}>
            {allBnplEligible ? 'Divide tu pago en cuotas' : 'No disponible para este pedido'}
          </span>
        </span>
        <span className="sr-check">✓</span>
      </button>

      {method === 'saldo_usd' && (
        <>
          <div className="sim-out">
            <div className="so-row">
              <span>Total a pagar</span>
              <b>{formatUSD(totalCents)}</b>
            </div>
            <div className="so-row">
              <span>Tu saldo USD</span>
              <b style={{ color: account.balanceUsdCents >= totalCents ? 'var(--ink)' : 'var(--red)' }}>{formatUSD(account.balanceUsdCents)}</b>
            </div>
          </div>
          <div className="checkout-actions">
            <button className="btn ghost" onClick={onBack}>
              Volver
            </button>
            <button className="btn full" disabled={processing || account.balanceUsdCents < totalCents} onClick={handlePaySingle}>
              {processing ? 'Procesando...' : `Pagar ${formatUSD(totalCents)}`}
            </button>
          </div>
        </>
      )}

      {method === 'saldo_ves' && (
        <>
          <div className="sim-out">
            <div className="so-row">
              <span>Total a pagar</span>
              <b>{formatVES(totalVesCents)}</b>
            </div>
            <div className="so-row">
              <span>Tu saldo Bs</span>
              <b style={{ color: account.balanceVesCents >= totalVesCents ? 'var(--ink)' : 'var(--red)' }}>{formatVES(account.balanceVesCents)}</b>
            </div>
          </div>
          <div className="checkout-actions">
            <button className="btn ghost" onClick={onBack}>
              Volver
            </button>
            <button className="btn full" disabled={processing || account.balanceVesCents < totalVesCents} onClick={handlePaySingle}>
              {processing ? 'Procesando...' : `Pagar ${formatVES(totalVesCents)}`}
            </button>
          </div>
        </>
      )}

      {method === 'krt' && krtBalances && (
        <>
          <div className="sim-out">
            <div className="so-row">
              <span>Total a pagar</span>
              <b>{formatKRT(krtNeededCents)}</b>
            </div>
            <div className="so-row">
              <span>Tu saldo de puntos disponibles</span>
              <b style={{ color: krtBalances.STD >= krtNeededCents ? 'var(--ink)' : 'var(--red)' }}>{formatKRT(krtBalances.STD)}</b>
            </div>
          </div>
          <div className="checkout-actions">
            <button className="btn ghost" onClick={onBack}>
              Volver
            </button>
            <button className="btn gold full" disabled={processing || krtBalances.STD < krtNeededCents} onClick={handlePaySingle}>
              {processing ? 'Procesando...' : `Pagar ${formatKRT(krtNeededCents)}`}
            </button>
          </div>
        </>
      )}

      {method === 'bnpl' && (
        <>
          <div className="in-group">
            <label className="in-label">
              CUOTAS · <span style={{ color: 'var(--accent2)' }}>{installments}</span>
            </label>
            <input
              type="range"
              className="slider"
              min={2}
              max={6}
              value={installments}
              onChange={(e) => setInstallments(Number(e.target.value))}
              disabled={!!evaluation}
            />
            <div className="slider-val">
              <span>2 cuotas</span>
              <span>6 cuotas</span>
            </div>
          </div>
          {preview && (
            <div className="sim-out">
              <div className="so-row">
                <span>Tasa mensual (según tu score)</span>
                <b>{formatPercent(preview.periodicRatePct)}</b>
              </div>
              <div className="so-row hl">
                <span>Cuota fija mensual</span>
                <b>{formatUSD(preview.installmentCents)}</b>
              </div>
              <div className="so-row">
                <span>Costo total del crédito</span>
                <b>{formatUSD(preview.feeTotalCents)}</b>
              </div>
              <div className="so-row">
                <span>Comisión que paga {merchant.name} (no tú)</span>
                <b>{formatPercent(merchant.bnplMerchantFeePct)}</b>
              </div>
            </div>
          )}
          {evaluation ? (
            <BnplEvaluationCard evaluation={evaluation} submitting={submitting} onConfirm={handleConfirmBnpl} onCancel={cancel} />
          ) : (
            <div className="checkout-actions">
              <button className="btn ghost" onClick={onBack}>
                Volver
              </button>
              <button className="btn full" disabled={submitting} onClick={() => requestEvaluation(account.id, totalCents, merchant.id)}>
                {submitting ? 'Evaluando...' : 'Solicitar KORA Cuotas'}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
