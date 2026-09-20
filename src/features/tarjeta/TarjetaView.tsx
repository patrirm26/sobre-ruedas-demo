import { useEffect, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount, selectActiveUser } from '../../state/selectors';
import { formatUSD, formatVES, formatDate } from '../../lib/format';
import { cardService } from '../../services/cardService';
import { MIN_KYC_LEVEL_TO_ISSUE_CARD } from '../../services/cardRules';
import { KYC_LIMITS } from '../../services/kycLimits';
import { DigitalCard } from '../../components/DigitalCard';

const STATUS_PILL: Record<string, string> = { activa: 'p-green', congelada: 'p-amber', cancelada: 'p-red' };
const STATUS_LABEL: Record<string, string> = { activa: 'ACTIVA', congelada: 'CONGELADA', cancelada: 'CANCELADA' };

export function TarjetaView() {
  const account = useKoraStore(selectActiveAccount);
  const activeUser = useKoraStore(selectActiveUser);
  const showToast = useKoraStore((s) => s.showToast);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const card = useKoraStore(
    useShallow((s) => (account ? s.cards.find((c) => c.accountId === account.id && c.status !== 'cancelada') : undefined))
  );

  const [issuing, setIssuing] = useState(false);
  const [limitInput, setLimitInput] = useState(0);
  const [savingLimit, setSavingLimit] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [merchantName, setMerchantName] = useState('Panadería La Espiga');
  const [purchaseAmount, setPurchaseAmount] = useState(15);
  const [purchasing, setPurchasing] = useState(false);

  const cardDailyLimitCents = card?.dailyLimitCents;
  useEffect(() => {
    if (cardDailyLimitCents !== undefined) setLimitInput(cardDailyLimitCents / 100);
  }, [cardDailyLimitCents]);

  if (!account || !activeUser) return null;

  const maxDailyCents = KYC_LIMITS[activeUser.kycLevel].daily;
  const eligible = activeUser.kycLevel >= MIN_KYC_LEVEL_TO_ISSUE_CARD;
  const purchaseAmountCents = Math.round(purchaseAmount * 100);

  const handleIssue = async () => {
    setIssuing(true);
    try {
      await cardService.issueCard({ accountId: account.id });
      showToast('✅ Tarjeta KORA emitida');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setIssuing(false);
    }
  };

  const handleSaveLimit = async () => {
    if (!card) return;
    setSavingLimit(true);
    try {
      await cardService.setDailyLimit({ cardId: card.id, dailyLimitCents: Math.round(limitInput * 100) });
      showToast('✅ Límite diario actualizado');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSavingLimit(false);
    }
  };

  const handleToggleFreeze = async () => {
    if (!card) return;
    setFreezing(true);
    try {
      await cardService.setFrozen({ cardId: card.id, frozen: card.status !== 'congelada' });
      showToast(card.status === 'congelada' ? '✅ Tarjeta descongelada' : '❄️ Tarjeta congelada');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setFreezing(false);
    }
  };

  const handleCancel = async () => {
    if (!card) return;
    if (!window.confirm('¿Cancelar tu tarjeta KORA? Esta acción no se puede deshacer.')) return;
    setCanceling(true);
    try {
      await cardService.cancelCard({ cardId: card.id });
      showToast('✅ Tarjeta cancelada');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setCanceling(false);
    }
  };

  const handlePurchase = async () => {
    if (!card) return;
    setPurchasing(true);
    try {
      await cardService.purchase({ cardId: card.id, amountCents: purchaseAmountCents, merchantName });
      showToast(`✅ Compra de ${formatVES(Math.round(purchaseAmountCents * bcvRate))} (≈ ${formatUSD(purchaseAmountCents)}) en ${merchantName}`);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setPurchasing(false);
    }
  };

  if (!card) {
    return (
      <div className="card" style={{ padding: 24 }}>
        <h3 style={{ fontSize: 15, marginBottom: 8 }}>Solicita tu Tarjeta KORA</h3>
        <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
          Una tarjeta ligada a tu saldo en USD, con límite diario según tu nivel de verificación y cashback en puntos en
          cada compra.
        </p>
        {eligible ? (
          <button className="btn full" disabled={issuing} onClick={handleIssue}>
            {issuing ? 'Emitiendo...' : 'Solicitar tarjeta KORA'}
          </button>
        ) : (
          <div style={{ fontSize: 12.5, color: 'var(--red)' }}>
            Necesitas al menos verificación Nivel {MIN_KYC_LEVEL_TO_ISSUE_CARD} para emitir una tarjeta (tienes Nivel{' '}
            {activeUser.kycLevel}).
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div style={{ marginBottom: 20 }}>
        <DigitalCard card={card} holderName={activeUser.name} />
        <div style={{ marginTop: 14 }}>
          <span className={`pill ${STATUS_PILL[card.status]}`}>● {STATUS_LABEL[card.status]}</span>
        </div>
      </div>

      <div className="grid2">
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Controles</h3>
          <div className="in-group">
            <label className="in-label">
              LÍMITE DIARIO (USD) · MÁXIMO {formatVES(Math.round(maxDailyCents * bcvRate))} (≈ {formatUSD(maxDailyCents)})
            </label>
            <input
              className="in-field"
              type="number"
              value={limitInput}
              onChange={(e) => setLimitInput(Number(e.target.value) || 0)}
            />
          </div>
          <button className="btn ghost full" style={{ marginBottom: 10 }} disabled={savingLimit} onClick={handleSaveLimit}>
            {savingLimit ? 'Guardando...' : 'Guardar límite'}
          </button>
          <button
            className="btn ghost full"
            style={{ marginBottom: 10 }}
            disabled={freezing || card.status === 'cancelada'}
            onClick={handleToggleFreeze}
          >
            {freezing ? 'Procesando...' : card.status === 'congelada' ? '☀️ Descongelar tarjeta' : '❄️ Congelar tarjeta'}
          </button>
          <button
            className="btn ghost full"
            style={{ color: 'var(--red)' }}
            disabled={canceling || card.status === 'cancelada'}
            onClick={handleCancel}
          >
            {canceling ? 'Procesando...' : 'Cancelar tarjeta'}
          </button>
        </div>

        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 14 }}>Simular compra</h3>
          <div className="in-group">
            <label className="in-label">COMERCIO</label>
            <input className="in-field" value={merchantName} onChange={(e) => setMerchantName(e.target.value)} />
          </div>
          <div className="in-group">
            <label className="in-label">MONTO (USD)</label>
            <input
              className="in-field"
              type="number"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(Number(e.target.value) || 0)}
            />
          </div>
          <button className="btn full" disabled={purchasing} onClick={handlePurchase}>
            {purchasing
              ? 'Procesando...'
              : `Comprar ${formatVES(Math.round(purchaseAmountCents * bcvRate))} (≈ ${formatUSD(purchaseAmountCents)})`}
          </button>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 10, lineHeight: 1.5 }}>
            Emitida el {formatDate(card.issuedAt)}. Las compras descuentan tu saldo USD y dan cashback en puntos según la
            tasa configurada en Fidelización.
          </div>
        </div>
      </div>
    </>
  );
}
