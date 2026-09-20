import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { formatUSD, formatDate } from '../../lib/format';
import { bnplService } from '../../services/bnplService';
import type { BnplRequest } from '../../domain/credit';

function RequestRow({ request, userName }: { request: BnplRequest; userName: string }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [submitting, setSubmitting] = useState(false);

  const resolve = async (approve: boolean) => {
    setSubmitting(true);
    try {
      await bnplService.resolveManualRequest({ requestId: request.id, approve });
      showToast(approve ? `✅ Crédito aprobado y desembolsado a ${userName}` : '✅ Solicitud rechazada');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unit">
      <div className="ui">◐</div>
      <div className="ub">
        <div className="uid">{userName}</div>
        <div className="uo">
          {formatUSD(request.requestedAmountCents)} · {request.installmentsCount} cuotas {request.frequency} ·
          score {request.scoreAtEvaluation} · {formatDate(request.at)}
          {request.useCollateral ? ' · con garantía de puntos' : ''}
        </div>
      </div>
      <div className="ur" style={{ display: 'flex', gap: 8 }}>
        <button className="cbtn" disabled={submitting} onClick={() => resolve(true)}>
          Aprobar
        </button>
        <button className="cbtn" disabled={submitting} onClick={() => resolve(false)}>
          Rechazar
        </button>
      </div>
    </div>
  );
}

export function CreditRequestsView() {
  const users = useKoraStore((s) => s.users);
  const pendingRequests = useKoraStore(useShallow((s) => Object.values(s.bnplRequests).filter((r) => r.status === 'pending')));

  const userName = (accountId: string) => Object.values(users).find((u) => u.primaryAccountId === accountId)?.name ?? 'Usuario';

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Solicitudes pendientes</h2>
      </div>
      {pendingRequests.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Sin solicitudes pendientes.
        </div>
      ) : (
        <div className="card">
          {pendingRequests.map((r) => (
            <RequestRow key={r.id} request={r} userName={userName(r.accountId)} />
          ))}
        </div>
      )}
    </>
  );
}
