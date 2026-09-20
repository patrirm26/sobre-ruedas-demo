import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import {
  selectActiveAccount,
  selectActiveUser,
  selectActiveScoreSnapshot,
  selectKrtTotalCents,
  selectCreditAvailableCents,
  selectAccountTransactions,
} from '../../state/selectors';
import { formatUSD, formatVES, formatKRT } from '../../lib/format';
import { BnplTierCard } from '../../components/BnplTierCard';
import { TxRow } from '../../components/TxRow';
import { ConvertModal } from './ConvertModal';
import type { ViewId } from '../../state/slices/uiSlice';
import { IconPay, IconCollect, IconMarket, IconBank, IconInstallment } from '../../components/icons';

// "QR" (uno de los 4 tiles del brief de la demo) todavía no existe como
// flujo propio — Pagar con QR se construye mañana (viernes, ver
// Plan_5_Dias_Demo_Martes.md). Hoy los 4 tiles apuntan solo a vistas que
// ya funcionan de verdad, para no dejar un botón que no lleve a nada.
const PRIMARY_ACTIONS: { view: ViewId; label: string; icon: typeof IconPay }[] = [
  { view: 'pagar', label: 'Enviar', icon: IconPay },
  { view: 'cobrar', label: 'Recibir', icon: IconCollect },
  { view: 'cuotas', label: 'Cuotas', icon: IconInstallment },
  { view: 'marketplace', label: 'Tienda', icon: IconMarket },
];

type DisplayCurrency = 'USD' | 'VES' | 'KRT' | 'CUPO';

const CURRENCY_TABS: { key: DisplayCurrency; label: string }[] = [
  { key: 'USD', label: 'USD' },
  { key: 'VES', label: 'VES' },
  { key: 'KRT', label: 'Puntos' },
  { key: 'CUPO', label: 'Cupo' },
];

export function HomeView() {
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const score = useKoraStore(selectActiveScoreSnapshot);
  const krtTotalCents = useKoraStore(selectKrtTotalCents);
  const creditAvailableCents = useKoraStore(selectCreditAvailableCents);
  const transactions = useKoraStore(useShallow(selectAccountTransactions));
  const upcomingObligations = useKoraStore(useShallow((s) => s.obligations.filter((o) => !o.paid).slice(0, 3)));
  const govEntities = useKoraStore(useShallow((s) => s.govEntities));
  const fundPositions = useKoraStore(
    useShallow((s) => (account ? s.fundPositions.filter((p) => p.accountId === account.id) : []))
  );

  const [displayCurrency, setDisplayCurrency] = useState<DisplayCurrency>('VES');
  // Prompt contextual de verificación (Sprint 8) — dismiss local, no
  // persiste entre sesiones a propósito: es un recordatorio de baja
  // fricción, no un estado que valga la pena guardar.
  const [verifyDismissed, setVerifyDismissed] = useState(false);
  const [showConvert, setShowConvert] = useState(false);

  if (!account) return null;

  const totalUsdCents = account.balanceUsdCents + Math.round(account.balanceVesCents / bcvRate);
  const bigAmount: Record<DisplayCurrency, string> = {
    USD: formatUSD(totalUsdCents),
    VES: formatVES(account.balanceVesCents),
    KRT: formatKRT(krtTotalCents),
    CUPO: formatUSD(creditAvailableCents),
  };
  const rendingTotalCents = fundPositions.reduce((sum, p) => sum + p.principalCents + p.accruedYieldCents, 0);

  return (
    <>
      {activeUser && activeUser.kycLevel < 3 && !verifyDismissed && (
        <div className="verify-banner">
          <div>
            <b>Verifícate para desbloquear más cupo y beneficios</b> — te toma un par de minutos.
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="lnk" onClick={() => setActiveView('perfil')}>
              Ver mi nivel →
            </button>
            <button className="verify-banner-close" onClick={() => setVerifyDismissed(true)} aria-label="Cerrar">
              ✕
            </button>
          </div>
        </div>
      )}
      <div className="hero">
        <div className="bal-card">
          <div className="bal-tabs-row" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="acct-tabs" style={{ flex: 1, marginBottom: 0 }}>
              {CURRENCY_TABS.map((t) => (
                <button
                  key={t.key}
                  className={`acct-tab ${displayCurrency === t.key ? 'active' : ''}`}
                  onClick={() => setDisplayCurrency(t.key)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <button className="btn ghost" style={{ padding: '10px 14px', fontSize: 12, flexShrink: 0 }} onClick={() => setShowConvert(true)}>
              ⇄ <span className="bal-convert-label">Convertir</span>
            </button>
          </div>
          <div className="bal-label">Tienes en {CURRENCY_TABS.find((t) => t.key === displayCurrency)?.label}</div>
          <div className="bal-amt">{bigAmount[displayCurrency]}</div>
          <div className="bal-delta">{formatKRT(krtTotalCents)} disponibles</div>
          <div className="bal-wallets">
            <div className="bw ves">
              <div className="c">VES</div>
              <div className="a">{formatVES(account.balanceVesCents)}</div>
            </div>
            <div className="bw usd">
              <div className="c">USD</div>
              <div className="a">{formatUSD(account.balanceUsdCents)}</div>
            </div>
            <div className="bw krt">
              <div className="c">Puntos</div>
              <div className="a">{formatKRT(krtTotalCents)}</div>
            </div>
            <div className="bw usdt">
              <div className="c">CUPO</div>
              <div className="a">{formatUSD(creditAvailableCents)}</div>
            </div>
          </div>
        </div>
        <div className="right-stack">
          {score && <BnplTierCard score={score} compact onClick={() => setActiveView('creditos')} />}
          <div className="krt-mini" onClick={() => setActiveView('tokens')}>
            <div className="krt-big">K</div>
            <div>
              <h4>{formatKRT(krtTotalCents)}</h4>
              <p>= {formatVES(krtTotalCents)} · 5 formas de ganar cashback</p>
            </div>
          </div>
          <div className="score-mini" onClick={() => setActiveView('alianzas')}>
            <div className="krt-big">
              <IconBank width={22} height={22} />
            </div>
            <div>
              <h4>Fondear o retirar</h4>
              <p>Vincula tu banco y mueve dinero por Pago Móvil o transferencia</p>
            </div>
          </div>
          {fundPositions.length > 0 && (
            <div className="score-mini" onClick={() => setActiveView('fondos')}>
              <div className="krt-big" style={{ background: 'var(--green)' }}>
                📈
              </div>
              <div>
                <h4>Tu saldo que rinde</h4>
                <p>
                  {formatVES(Math.round(rendingTotalCents * bcvRate))} (≈ {formatUSD(rendingTotalCents)}) en Fondos · sigue
                  creciendo con el tiempo
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
      {showConvert && <ConvertModal onClose={() => setShowConvert(false)} />}

      <div className="sec-h">
        <h2>Acciones primarias</h2>
        <button className="lnk" onClick={() => setActiveView('services')}>
          Ver todos los servicios →
        </button>
      </div>
      <div className="primary-actions">
        {PRIMARY_ACTIONS.map((a) => (
          <button key={a.view} className="primary-action" onClick={() => setActiveView(a.view)}>
            <div className="qi">
              <a.icon width={22} height={22} />
            </div>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      <div className="sec-h">
        <h2>Próximas obligaciones con el Estado</h2>
        <button className="lnk" onClick={() => setActiveView('govtech')}>
          Ver todas →
        </button>
      </div>
      <div className="card">
        {upcomingObligations.map((o) => (
          <div className="oblig" key={o.id}>
            <div className="oi" style={{ background: o.color }}>
              {o.icon}
            </div>
            <div className="ob">
              <div className="on">{o.name}</div>
              <div className="od">{govEntities.find((e) => e.id === o.entityId)?.name ?? o.entityId}</div>
            </div>
            <div className="oa">
              <div className="om">{formatVES(o.amountCents)}</div>
              <div className="ov" style={{ color: o.dueColor }}>
                {o.dueLabel}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="sec-h">
        <h2>Actividad reciente</h2>
        <button className="lnk" onClick={() => setActiveView('historial')}>
          Ver todo →
        </button>
      </div>
      <div className="card">
        {transactions.length === 0 ? (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
            Aún no hay movimientos en esta cuenta.
          </div>
        ) : (
          transactions.slice(0, 4).map((tx) => <TxRow key={tx.id} tx={tx} />)
        )}
      </div>
    </>
  );
}
