import type { BnplRequest } from '../domain/credit';
import { formatUSD } from '../lib/format';
import { describeReasonCode } from '../services/reasonCodes';

interface Props {
  evaluation: BnplRequest;
  submitting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const STATUS_LABEL: Record<BnplRequest['status'], { label: string; cls: string }> = {
  approved: { label: '✓ APROBADO', cls: 'p-green' },
  partial: { label: '◐ APROBADO PARCIAL', cls: 'p-amber' },
  rejected: { label: '✕ RECHAZADO', cls: 'p-red' },
  pending: { label: '… EVALUANDO', cls: 'p-blue' },
};

/** Resultado del underwriting simulado — nunca una aprobación ciega: siempre
 * muestra las reglas (reasonCodes) detrás de la decisión. */
export function BnplEvaluationCard({ evaluation, submitting, onConfirm, onCancel }: Props) {
  const { label, cls } = STATUS_LABEL[evaluation.status];
  const canConfirm = evaluation.status === 'approved' || evaluation.status === 'partial';

  return (
    <div className="card" style={{ padding: 20, marginTop: 14, border: '1px solid var(--accent-dim)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <b style={{ fontSize: 14 }}>Resultado de la solicitud</b>
        <span className={`pill ${cls}`}>{label}</span>
      </div>
      <ul style={{ listStyle: 'none', marginBottom: 12 }}>
        {evaluation.reasonCodes.map((code) => (
          <li key={code} style={{ fontSize: 12, color: 'var(--muted)', padding: '3px 0', display: 'flex', gap: 7 }}>
            <span style={{ color: 'var(--accent2)' }}>·</span>
            {describeReasonCode(code)}
          </li>
        ))}
      </ul>
      {canConfirm && evaluation.approvedAmountCents !== undefined && (
        <div style={{ fontSize: 13, marginBottom: 14 }}>
          Monto a financiar: <b>{formatUSD(evaluation.approvedAmountCents)}</b>
          {evaluation.approvedAmountCents < evaluation.requestedAmountCents && (
            <span style={{ color: 'var(--muted)' }}> (solicitaste {formatUSD(evaluation.requestedAmountCents)})</span>
          )}
        </div>
      )}
      <div style={{ display: 'flex', gap: 9 }}>
        {canConfirm && (
          <button className="btn" style={{ flex: 1 }} disabled={submitting} onClick={onConfirm}>
            {submitting ? 'Procesando...' : 'Confirmar y desembolsar'}
          </button>
        )}
        <button className="btn ghost" style={{ flex: canConfirm ? undefined : 1 }} disabled={submitting} onClick={onCancel}>
          {canConfirm ? 'Cancelar' : 'Cerrar'}
        </button>
      </div>
    </div>
  );
}
