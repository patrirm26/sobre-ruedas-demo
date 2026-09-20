import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { formatUSD, formatDate } from '../../lib/format';
import { cardService } from '../../services/cardService';
import type { Card, CardStatus } from '../../domain/card';

const STATUS_PILL: Record<CardStatus, string> = { activa: 'p-green', congelada: 'p-amber', cancelada: 'p-red' };
const STATUS_LABEL: Record<CardStatus, string> = { activa: 'ACTIVA', congelada: 'CONGELADA', cancelada: 'CANCELADA' };

function CardRow({ card, ownerName }: { card: Card; ownerName: string }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [submitting, setSubmitting] = useState(false);

  const toggleFreeze = async () => {
    setSubmitting(true);
    try {
      await cardService.setFrozen({ cardId: card.id, frozen: card.status !== 'congelada' });
      showToast(card.status === 'congelada' ? '✅ Tarjeta descongelada' : '❄️ Tarjeta congelada por el operador');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const cancel = async () => {
    setSubmitting(true);
    try {
      await cardService.cancelCard({ cardId: card.id });
      showToast('✅ Tarjeta cancelada por el operador');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unit">
      <div className="ui">💳</div>
      <div className="ub">
        <div className="uid">
          {ownerName} · •••• {card.last4}
        </div>
        <div className="uo">
          Límite {formatUSD(card.dailyLimitCents)}/día · emitida {formatDate(card.issuedAt)}
        </div>
      </div>
      <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span className={`pill ${STATUS_PILL[card.status]}`}>{STATUS_LABEL[card.status]}</span>
        {card.status !== 'cancelada' && (
          <>
            <button className="cbtn" disabled={submitting} onClick={toggleFreeze}>
              {card.status === 'congelada' ? 'Descongelar' : 'Congelar'}
            </button>
            <button className="cbtn" disabled={submitting} onClick={cancel}>
              Cancelar
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function CardsView() {
  const users = useKoraStore((s) => s.users);
  const cards = useKoraStore(useShallow((s) => s.cards));

  const ownerName = (accountId: string) => Object.values(users).find((u) => u.primaryAccountId === accountId)?.name ?? 'Usuario';

  const totals = cards.reduce(
    (acc, c) => {
      acc.total += 1;
      if (c.status === 'activa') acc.activas += 1;
      if (c.status === 'congelada') acc.congeladas += 1;
      if (c.status === 'cancelada') acc.canceladas += 1;
      return acc;
    },
    { total: 0, activas: 0, congeladas: 0, canceladas: 0 }
  );

  return (
    <>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{totals.total}</b>
          <span>Tarjetas emitidas</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--green)' }}>{totals.activas}</b>
          <span>Activas</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--amber)' }}>{totals.congeladas}</b>
          <span>Congeladas</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--red)' }}>{totals.canceladas}</b>
          <span>Canceladas</span>
        </div>
      </div>

      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Tarjetas emitidas</h2>
      </div>
      {cards.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no se emitió ninguna tarjeta.
        </div>
      ) : (
        <div className="card">
          {cards.map((c) => (
            <CardRow key={c.id} card={c} ownerName={ownerName(c.accountId)} />
          ))}
        </div>
      )}
    </>
  );
}
