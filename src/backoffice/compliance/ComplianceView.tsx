import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { formatUSD, formatDate } from '../../lib/format';
import { complianceService } from '../../services/complianceService';
import { KYC_LIMITS } from '../../services/kycLimits';
import type { ComplianceAlert, VerificationRequest } from '../../domain/compliance';

function AlertRow({ alert, userName }: { alert: ComplianceAlert; userName: string }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [resolution, setResolution] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleResolve = async () => {
    setSubmitting(true);
    try {
      await complianceService.resolveAlert({ alertId: alert.id, resolution });
      showToast('✅ Alerta resuelta');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unit">
      <div className="ui">⚠️</div>
      <div className="ub">
        <div className="uid">{userName}</div>
        <div className="uo">
          {alert.message} · {formatDate(alert.at)}
        </div>
      </div>
      <div className="ur" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input
          className="in-field"
          style={{ width: 180, padding: '6px 10px', fontSize: 12 }}
          placeholder="Nota de resolución"
          value={resolution}
          onChange={(e) => setResolution(e.target.value)}
        />
        <button className="cbtn" disabled={submitting} onClick={handleResolve}>
          Resolver
        </button>
      </div>
    </div>
  );
}

function VerificationRow({ request, userName }: { request: VerificationRequest; userName: string }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [submitting, setSubmitting] = useState(false);

  const resolve = async (approve: boolean) => {
    setSubmitting(true);
    try {
      await complianceService.resolveVerificationRequest({ requestId: request.id, approve });
      showToast(approve ? '✅ Verificación aprobada — nivel actualizado' : '✅ Verificación rechazada');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unit">
      <div className="ui">🪪</div>
      <div className="ub">
        <div className="uid">{userName}</div>
        <div className="uo">
          Nivel {request.currentLevel} → Nivel {request.requestedLevel} · {formatDate(request.at)}
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

export function ComplianceView() {
  const users = useKoraStore((s) => s.users);
  const alerts = useKoraStore(useShallow((s) => s.alerts.filter((a) => a.status === 'abierta')));
  const verificationRequests = useKoraStore(useShallow((s) => s.verificationRequests.filter((r) => r.status === 'pendiente')));
  const consumerUsers = Object.values(users).filter((u) => u.accountType !== 'operador');

  const userName = (userId: string) => users[userId]?.name ?? 'Usuario';

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Alertas AML</h2>
      </div>
      {alerts.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
          Sin alertas abiertas.
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          {alerts.map((a) => (
            <AlertRow key={a.id} alert={a} userName={userName(a.userId)} />
          ))}
        </div>
      )}

      <div className="sec-h">
        <h2>Solicitudes de verificación</h2>
      </div>
      {verificationRequests.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
          Sin solicitudes pendientes.
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          {verificationRequests.map((r) => (
            <VerificationRow key={r.id} request={r} userName={userName(r.userId)} />
          ))}
        </div>
      )}

      <div className="sec-h">
        <h2>Usuarios y niveles</h2>
      </div>
      <div className="card">
        {consumerUsers.map((u) => {
          const limits = KYC_LIMITS[u.kycLevel];
          return (
            <div className="unit" key={u.id}>
              <div className="ui">{u.name.charAt(0).toUpperCase()}</div>
              <div className="ub">
                <div className="uid">{u.name}</div>
                <div className="uo">
                  Nivel {u.kycLevel} de 3 · límite mensual {formatUSD(limits.monthly)} · Puntos {formatUSD(limits.krtMonthly)}/mes
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
