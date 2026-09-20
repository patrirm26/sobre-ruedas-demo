import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { formatVES, formatUSD, formatKRT, formatDate, formatPercent } from '../../lib/format';
import { useComingSoon } from '../../lib/comingSoon';
import { TxRow } from '../../components/TxRow';
import { TokenLedger } from '../../components/TokenLedger';
import { TransferModal } from '../../components/TransferModal';
import { tokenService } from '../../services/tokenService';
import type { ReserveProof } from '../../domain/token';
import type { KrtSubBalance } from '../../domain/token';
import type { LoyaltyChannel } from '../../domain/loyalty';

/** `channel` = tasa real, leída en vivo de `loyaltyRates` (Loyalty, Back
 * Office) para no volver a desalinearse del valor configurado. `staticPct`
 * = copy ilustrativo para lo que todavía no es un canal centralizado
 * (Consorcio es un módulo stub; Market varía por producto, no por canal). */
const EARN_CARDS: { icon: string; bg: string; title: string; desc: string; channel?: LoyaltyChannel; staticPct?: string }[] = [
  { icon: '🏢', bg: 'color-mix(in srgb, var(--accent) 12%, transparent)', title: 'Cuota de Consorcio puntual', desc: 'Paga tu condominio, club o gremio antes del vencimiento.', staticPct: '1,0%' },
  { icon: '🛍', bg: 'rgba(214,69,80,.09)', title: 'Compra en el Marketplace', desc: 'Al confirmar la recepción de tu compra protegida.', staticPct: '0,5%' },
  { icon: '▣', bg: 'rgba(31,169,113,.1)', title: 'Pago QR en comercios aliados', desc: 'En comercios del programa de cashback KORA.', channel: 'qr' },
  { icon: '🌎', bg: 'color-mix(in srgb, var(--accent) 10%, transparent)', title: 'Remesa recibida', desc: 'Si recibes una remesa del exterior en tu cuenta KORA.', channel: 'remesa' },
  { icon: '◐', bg: 'rgba(230,160,25,.1)', title: 'Cuota de crédito en fecha', desc: 'Pagar puntual te premia y además sube tu KORA Score.', channel: 'cuotas' },
];

const SUB_BALANCE_META: { key: KrtSubBalance; cls: string; label: string; hint: string; detail: string }[] = [
  { key: 'STD', cls: 'std', label: 'Disponible', hint: 'Puntos disponibles · uso libre', detail: 'Se puede pagar, transferir a otros usuarios KORA y convertir a bolívares. Es también el único sub-saldo que sirve de garantía de crédito.' },
  { key: 'REW', cls: 'rew', label: 'Cashback', hint: 'Puntos cashback · solo pago', detail: 'Ganado como cashback automático. Solo sirve para pagar dentro de KORA — no se transfiere a otros usuarios ni se convierte a bolívares.' },
  { key: 'CRD', cls: 'crd', label: 'De crédito', hint: 'Puntos de crédito · desembolsos', detail: 'Destino de desembolsos de crédito recibidos en puntos en vez de bolívares.' },
  { key: 'COL', cls: 'col', label: 'En garantía', hint: 'Puntos en garantía · bloqueado', detail: 'Puntos disponibles bloqueados como garantía de un crédito "Con Garantía de Puntos". No se puede transferir ni usar mientras esté bloqueado — se libera automáticamente a medida que pagas las cuotas.' },
];

export function TokensView() {
  const account = useKoraStore(selectActiveAccount);
  const krtBalances = useKoraStore((s) => (account ? s.krtBalances[account.id] : undefined));
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const showToast = useKoraStore((s) => s.showToast);
  const openPlaceholder = useKoraStore((s) => s.openPlaceholder);
  const tokenTxs = useKoraStore(
    useShallow((s) => {
      if (!account) return [];
      return s.transactions.filter((tx) => tx.accountId === account.id && tx.category === 'token').slice(0, 4);
    })
  );
  const loyaltyRates = useKoraStore(useShallow((s) => s.loyaltyRates));
  const comingSoon = useComingSoon();

  const [mode, setMode] = useState<'buy' | 'sell'>('buy');
  const [amountIn, setAmountIn] = useState(5000);
  const [submitting, setSubmitting] = useState(false);
  const [showLedger, setShowLedger] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [reserve, setReserve] = useState<ReserveProof | null>(null);

  useEffect(() => {
    tokenService.getReserveProof().then(setReserve);
  }, [krtBalances]);

  if (!account || !krtBalances) return null;

  const totalKrtCents = krtBalances.STD + krtBalances.REW + krtBalances.CRD + krtBalances.COL;
  const feePct = 0.01;
  const amountOut = amountIn * (1 - feePct);

  const handleMintBurn = async () => {
    setSubmitting(true);
    try {
      if (mode === 'buy') {
        await tokenService.mint({ accountId: account.id, vesAmountCents: Math.round(amountIn * 100) });
        showToast('✅ Compra de puntos completada');
      } else {
        await tokenService.burn({ accountId: account.id, krtAmountCents: Math.round(amountIn * 100) });
        showToast('✅ Conversión a bolívares completada');
      }
      setAmountIn(0);
    } catch (e) {
      const message = (e as Error).message;
      if (message.startsWith('KYC_REQUIRED')) {
        openPlaceholder({ icon: '🪪', title: 'Verificación adicional requerida', body: message.replace('KYC_REQUIRED: ', '') });
      } else {
        showToast(`⚠️ ${message}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="krt-hero">
        <div className="krt-balance">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="kb-label">TU SALDO EN PUNTOS</div>
              <div className="kb-amt">
                {formatKRT(totalKrtCents).replace(' puntos', '')} <small>PUNTOS</small>
              </div>
              <div className="kb-eq">
                = {formatVES(totalKrtCents)} · ≈ {formatUSD(Math.round((totalKrtCents / bcvRate) * 100) / 100)} al BCV
                de hoy ({bcvRate.toFixed(2).replace('.', ',')})
              </div>
            </div>
            <span className="pill p-gold" style={{ flexShrink: 0 }}>
              1 punto = 1 Bs BCV
            </span>
          </div>
          <div className="kb-types">
            {SUB_BALANCE_META.map((meta) => (
              <div
                key={meta.key}
                className={`kb-type ${meta.cls}`}
                onClick={() => openPlaceholder({ icon: '◉', title: `Puntos · ${meta.label}`, body: meta.detail })}
              >
                <div className="kc">{meta.label}</div>
                <div className="ka">{formatKRT(krtBalances[meta.key]).replace(' puntos', '')}</div>
                <div className="kl">{meta.hint}</div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 9, marginTop: 14 }}>
            <button className="btn ghost" style={{ flex: 1, padding: 11, fontSize: 12.5 }} onClick={() => setShowTransfer(true)}>
              ⇄ Transferir puntos
            </button>
            <button className="btn ghost" style={{ flex: 1, padding: 11, fontSize: 12.5 }} onClick={() => comingSoon('Pagar con puntos', 'Elige "Pagar con puntos" en el checkout del Marketplace.')}>
              🛍 Pagar con puntos
            </button>
            <button className="btn ghost" style={{ flex: 1, padding: 11, fontSize: 12.5 }} onClick={() => setShowLedger(true)}>
              ≡ Mis movimientos
            </button>
          </div>
        </div>

        <div className="mintburn">
          <div className="mb-tabs">
            <button className={`mb-tab ${mode === 'buy' ? 'active' : ''}`} onClick={() => setMode('buy')}>
              Comprar puntos
            </button>
            <button className={`mb-tab ${mode === 'sell' ? 'active' : ''}`} onClick={() => setMode('sell')}>
              Convertir a Bs
            </button>
          </div>
          <div className="mb-io">
            <input type="number" value={amountIn} onChange={(e) => setAmountIn(Number(e.target.value) || 0)} />
            <span className="cur">{mode === 'buy' ? 'Bs (VES)' : 'Puntos'}</span>
          </div>
          <div className="mb-arrow">↓</div>
          <div className="mb-io" style={{ borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
            <input type="number" value={amountOut.toFixed(2)} readOnly style={{ color: 'var(--gold)' }} />
            <span className="cur" style={{ color: 'var(--gold)' }}>
              {mode === 'buy' ? 'Puntos' : 'Bs (VES)'}
            </span>
          </div>
          <div className="mb-detail">
            <span>Tasa del día (BCV 8:00 am)</span>
            <b>1 punto = 1,00 Bs</b>
          </div>
          <div className="mb-detail">
            <span>Comisión de conversión (1%)</span>
            <b>{formatVES(Math.round((amountIn - amountOut) * 100))}</b>
          </div>
          <div className="mb-detail">
            <span>{mode === 'buy' ? 'Saldo Bs disponible' : 'Saldo de puntos disponibles'}</span>
            <b>{mode === 'buy' ? formatVES(account.balanceVesCents) : formatKRT(krtBalances.STD)}</b>
          </div>
          <button className="btn gold full" style={{ marginTop: 13 }} disabled={submitting || amountIn <= 0} onClick={handleMintBurn}>
            {submitting
              ? 'Procesando...'
              : mode === 'buy'
                ? `Comprar ${formatKRT(Math.round(amountOut * 100)).replace(' puntos', '')} puntos`
                : `Convertir a ${formatVES(Math.round(amountOut * 100))}`}
          </button>
          <div style={{ fontSize: 10, color: 'var(--faint)', textAlign: 'center', marginTop: 9, lineHeight: 1.5 }}>
            Solo los puntos disponibles se convierten a bolívares. Tu cashback se usa para pagar.
          </div>
        </div>
      </div>

      {reserve && (
        <div className="card" style={{ padding: '16px 20px', marginTop: 8, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>
            🛡️ <b style={{ color: 'var(--ink)' }}>Proof of reserve (ilustrativo)</b> · al {formatDate(reserve.asOf)}
          </div>
          <div className="mono" style={{ fontSize: 12, marginLeft: 'auto', display: 'flex', gap: 18 }}>
            <span>
              En circulación: <b>{formatKRT(reserve.totalMintedCents)}</b>
            </span>
            <span>
              Respaldo: <b style={{ color: 'var(--green)' }}>{formatKRT(reserve.totalBackingCents)}</b>
            </span>
            <span>
              Ratio: <b style={{ color: 'var(--green)' }}>{reserve.ratioPct}%</b>
            </span>
          </div>
        </div>
      )}

      <div className="sec-h">
        <h2>Cashback automático — así ganas puntos</h2>
        <span className="pill p-gold">5 formas de ganar</span>
      </div>
      <div className="grid3">
        {EARN_CARDS.map((c) => {
          const pctLabel = c.channel
            ? formatPercent(loyaltyRates.find((r) => r.channel === c.channel)?.cashbackPct ?? 0)
            : c.staticPct;
          return (
            <div className="earn-card" key={c.title}>
              <div className="ei" style={{ background: c.bg }}>
                {c.icon}
              </div>
              <div>
                <b>{c.title}</b>
                <span>{c.desc}</span>
              </div>
              <div className="ep">{pctLabel}</div>
            </div>
          );
        })}
        <div className="earn-card" style={{ borderStyle: 'dashed', borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)' }}>
          <div className="ei" style={{ background: 'color-mix(in srgb, var(--accent) 12%, transparent)' }}>
            📈
          </div>
          <div>
            <b>Y tus puntos trabajan por ti</b>
            <span>Tu saldo de puntos disponibles pesa el 15% de tu KORA Score: más puntos, más crédito y mejor tasa.</span>
          </div>
        </div>
      </div>

      <div className="sec-h">
        <h2>Movimientos de puntos</h2>
        <button className="lnk" onClick={() => setShowLedger(true)}>
          Ver todo →
        </button>
      </div>
      <div className="card">
        {tokenTxs.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Aún no hay movimientos de puntos.
          </div>
        ) : (
          tokenTxs.map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>

      {showLedger && <TokenLedger accountId={account.id} onClose={() => setShowLedger(false)} />}
      {showTransfer && <TransferModal fromAccountId={account.id} onClose={() => setShowTransfer(false)} />}
    </>
  );
}
