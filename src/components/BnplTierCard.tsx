import { BNPL_TIERS, computeLevelFromScore, getTierByLevel, getNextTier } from '../data/bnplTiers';
import { formatUSD, formatVES, formatPercent } from '../lib/format';
import { useKoraStore } from '../state/store';
import type { ScoreSnapshot } from '../domain/score';

interface BnplTierCardProps {
  score: ScoreSnapshot;
  compact?: boolean;
  onClick?: () => void;
}

/** Tarjeta de "Tu nivel BNPL" (Sprint 3) — nunca renderiza `score.value`.
 * El score sigue siendo el input real (ver src/data/bnplTiers.ts), pero acá
 * solo se traduce a nivel, cupo y "qué falta para subir", como pide Fase 1
 * §6.1: "el score no se muestra como número". */
export function BnplTierCard({ score, compact = false, onClick }: BnplTierCardProps) {
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const level = computeLevelFromScore(score.value);
  const tier = getTierByLevel(level);
  const next = getNextTier(level);
  const pointsToNext = next ? Math.max(0, next.minScore - score.value) : 0;

  return (
    <div className={`tier-card${compact ? ' compact' : ''}`} onClick={onClick} style={onClick ? { cursor: 'pointer' } : undefined}>
      <div className="tier-head">
        <h4>{tier ? `Nivel ${level} de 6` : 'Aún sin nivel BNPL'}</h4>
        {tier && (
          <span className="pill p-gold">
            Cupo {formatVES(Math.round(tier.capCents * bcvRate))} (≈ {formatUSD(tier.capCents)})
          </span>
        )}
      </div>

      <div className="tier-stepper">
        {BNPL_TIERS.map((t) => (
          <div key={t.level} className={`tier-dot${t.level <= level ? ' done' : ''}${t.level === level ? ' act' : ''}`}>
            {t.level}
          </div>
        ))}
      </div>

      {tier && !compact && (
        <div className="tier-details">
          <div className="prow">
            <span>Inicial requerida</span>
            <b>{formatPercent(tier.initialPct)}</b>
          </div>
          <div className="prow">
            <span>Cuotas disponibles</span>
            <b>{tier.installmentsAvailable.join(', ')}</b>
          </div>
        </div>
      )}

      {next ? (
        <p className="tier-note">
          Te faltan {pointsToNext} puntos para {tier ? `subir a Nivel ${next.level}` : 'desbloquear tu primer nivel de KORA Cuotas'} — paga
          tus cuotas a tiempo para subir más rápido.
        </p>
      ) : (
        <p className="tier-note">🎉 Estás en el nivel máximo de KORA Cuotas.</p>
      )}
    </div>
  );
}
