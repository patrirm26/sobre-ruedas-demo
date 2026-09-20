import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { formatDate, formatPercent } from '../../lib/format';
import { onboardingService } from '../../services/onboardingService';
import type { MerchantOnboardingRequest } from '../../domain/onboarding';

function RequestRow({ request }: { request: MerchantOnboardingRequest }) {
  const showToast = useKoraStore((s) => s.showToast);
  const [submitting, setSubmitting] = useState(false);

  const resolve = async (approve: boolean) => {
    setSubmitting(true);
    try {
      await onboardingService.resolveMerchantRequest({ requestId: request.id, approve });
      showToast(approve ? `✅ ${request.name} dado de alta como comercio` : '✅ Solicitud rechazada');
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="unit">
      <div className="ui">🤝</div>
      <div className="ub">
        <div className="uid">{request.name}</div>
        <div className="uo">
          {request.category} · {request.taxId} · comisión propuesta {formatPercent(request.proposedBnplFeePct)} ·{' '}
          {formatDate(request.at)}
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

export function OnboardingView() {
  const showToast = useKoraStore((s) => s.showToast);
  const merchants = useKoraStore((s) => s.merchants);
  const pendingRequests = useKoraStore(useShallow((s) => s.merchantRequests.filter((r) => r.status === 'pendiente')));

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [taxId, setTaxId] = useState('');
  const [feePct, setFeePct] = useState(4);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      await onboardingService.submitMerchantRequest({ name, category, taxId, proposedBnplFeePct: feePct });
      showToast('✅ Solicitud registrada — queda pendiente de aprobación');
      setName('');
      setCategory('');
      setTaxId('');
      setFeePct(4);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Nueva solicitud de aliado</h2>
      </div>
      <div className="card" style={{ padding: 24, marginBottom: 20 }}>
        <div className="in-row">
          <div className="in-group">
            <label className="in-label">NOMBRE DEL COMERCIO</label>
            <input className="in-field" value={name} onChange={(e) => setName(e.target.value)} placeholder="ElectroCentro" />
          </div>
          <div className="in-group">
            <label className="in-label">CATEGORÍA</label>
            <input className="in-field" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Electrodomésticos" />
          </div>
        </div>
        <div className="in-row">
          <div className="in-group">
            <label className="in-label">RIF O CÉDULA</label>
            <input className="in-field" value={taxId} onChange={(e) => setTaxId(e.target.value)} placeholder="J-12345678-9" />
          </div>
          <div className="in-group">
            <label className="in-label">COMISIÓN BNPL PROPUESTA (%)</label>
            <input className="in-field" type="number" value={feePct} onChange={(e) => setFeePct(Number(e.target.value) || 0)} />
          </div>
        </div>
        <button className="btn full" disabled={submitting} onClick={handleSubmit}>
          {submitting ? 'Enviando...' : 'Registrar solicitud'}
        </button>
      </div>

      <div className="sec-h">
        <h2>Solicitudes pendientes</h2>
      </div>
      {pendingRequests.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13, marginBottom: 20 }}>
          Sin solicitudes pendientes.
        </div>
      ) : (
        <div className="card" style={{ marginBottom: 20 }}>
          {pendingRequests.map((r) => (
            <RequestRow key={r.id} request={r} />
          ))}
        </div>
      )}

      <div className="sec-h">
        <h2>Comercios activos</h2>
      </div>
      <div className="card">
        {Object.values(merchants).map((m) => (
          <div className="unit" key={m.id}>
            <div className="ui">🏪</div>
            <div className="ub">
              <div className="uid">{m.name}</div>
              <div className="uo">
                {m.category} · comisión BNPL {formatPercent(m.bnplMerchantFeePct)}
                {m.taxId ? ` · ${m.taxId}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
