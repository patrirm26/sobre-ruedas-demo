import { Gauge } from './Gauge';
import { SCORE_BANDS } from '../data/scoreBands';
import type { ScoreSnapshot } from '../domain/score';

const FACTOR_COLORS: Record<string, string> = {
  historialPagos: 'var(--green)',
  antiguedad: 'var(--green)',
  usoCupo: 'var(--accent2)',
  diversificacion: 'var(--amber)',
  saldoKrtStd: 'var(--gold)',
};

interface Props {
  score: ScoreSnapshot;
  onSeeBands?: () => void;
}

/** Gauge + banda + desglose de factores — extraído de CreditosView.tsx para
 * reusarlo también en ScoreCreditoView.tsx sin duplicar el bloque (mismo
 * cálculo, misma UI, un solo lugar si cambia el modelo de factores). */
export function ScoreHero({ score, onSeeBands }: Props) {
  const bandInfo = SCORE_BANDS.find((b) => b.band === score.band);

  return (
    <div className="cred-hero">
      <div className="score-card">
        <h3>TU SCORE KORA</h3>
        <Gauge value={score.value} label={score.band} size={92} />
        <div className="score-level" style={{ color: '#4CAF50' }}>
          Banda: {score.band.replace('_', ' ')} ({bandInfo?.min}–{bandInfo?.max})
        </div>
        <div className="score-note">{bandInfo?.description}</div>
        {onSeeBands && (
          <button className="btn ghost" style={{ marginTop: 14, padding: '10px 18px', fontSize: 12.5 }} onClick={onSeeBands}>
            Ver todas las bandas
          </button>
        )}
      </div>
      <div className="factors">
        <h3>¿CÓMO SE CALCULA? — {score.factors.length} FACTORES</h3>
        {score.factors.map((f, i) => (
          <div className="factor" key={f.key}>
            <div className="f-head">
              <b>
                {i + 1} · {f.label}
              </b>
              <span>{Math.round(f.weight * 100)} pts</span>
            </div>
            <div className="f-bar">
              <div className="f-fill" style={{ width: `${f.valuePct}%`, background: FACTOR_COLORS[f.key] ?? 'var(--accent2)' }} />
            </div>
          </div>
        ))}
        <div style={{ fontSize: 10.5, color: 'var(--faint)', marginTop: 12, lineHeight: 1.6 }}>
          💡 Sube más rápido: compra puntos, usa más productos KORA y paga todo puntual. Tu score se recalcula con
          cada pago.
        </div>
      </div>
    </div>
  );
}
