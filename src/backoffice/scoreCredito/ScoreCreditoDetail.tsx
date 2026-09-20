import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { ScoreHero } from '../../components/ScoreHero';
import { formatUSD, formatVES, formatKRT, formatDate } from '../../lib/format';
import { useComingSoon } from '../../lib/comingSoon';
import { SEED_SCORE_HISTORY } from '../../data/seedScoreHistory';

interface Props {
  accountId: string;
}

/** Perfil de crédito consolidado de UN cliente — herramienta de staff, no
 * del cliente (ver AlianzasBancariasView-style: acá el operador elige a
 * quién mirar, ver `ScoreCreditoBackofficeView`). Mismo contenido que la
 * primera versión de este módulo (Gauge + factores + patrimonio +
 * historial), parametrizado por `accountId` en vez de leer la sesión
 * activa — la sesión activa en el Back Office es la del operador, no la
 * del cliente que se está revisando. */
export function ScoreCreditoDetail({ accountId }: Props) {
  const account = useKoraStore((s) => s.accounts[accountId]);
  const user = useKoraStore((s) => Object.values(s.users).find((u) => u.primaryAccountId === accountId));
  const score = useKoraStore((s) => s.scoreSnapshots[accountId]);
  const krtBalances = useKoraStore((s) => s.krtBalances[accountId]);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const allyBanks = useKoraStore((s) => s.allyBanks);
  const comingSoon = useComingSoon();

  const fundPositions = useKoraStore(useShallow((s) => s.fundPositions.filter((p) => p.accountId === accountId)));
  const funds = useKoraStore((s) => s.funds);
  const linkedAccounts = useKoraStore(useShallow((s) => s.linkedBankAccounts.filter((l) => l.accountId === accountId)));
  const plans = useKoraStore(useShallow((s) => Object.values(s.installmentPlans).filter((p) => p.accountId === accountId)));

  if (!account || !user || !score) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
        Este cliente todavía no tiene un score calculado.
      </div>
    );
  }

  const krtTotalCents = krtBalances ? krtBalances.STD + krtBalances.REW + krtBalances.CRD + krtBalances.COL : 0;
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));

  const fundsInvestedCents = fundPositions.reduce((sum, p) => sum + p.principalCents, 0);
  const fundsValueCents = fundPositions.reduce((sum, p) => sum + p.principalCents + p.accruedYieldCents, 0);

  const allInstallments = plans.flatMap((p) => p.installments);
  const paidInstallments = allInstallments.filter((i) => i.status === 'pagado');
  const paidOnTime = paidInstallments.filter((i) => i.lateFeeCents === 0);
  const onTimeRatePct = paidInstallments.length > 0 ? Math.round((paidOnTime.length / paidInstallments.length) * 100) : null;

  const history = SEED_SCORE_HISTORY[accountId] ?? [];

  return (
    <>
      <ScoreHero score={score} onSeeBands={() => comingSoon('Bandas de score', 'Tabla completa de bandas — vista dedicada pendiente.')} />

      {history.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Evolución del score</h2>
          </div>
          <div className="card" style={{ padding: '20px 24px' }}>
            <div className="score-history">
              {history.map((point, i) => (
                <div className="sh-col" key={point.label}>
                  <div className="sh-value">{point.value}</div>
                  <div className="sh-bar-track">
                    <div
                      className={`sh-bar-fill${i === history.length - 1 ? ' current' : ''}`}
                      style={{ height: `${point.value}%` }}
                    />
                  </div>
                  <div className="sh-label">{point.label}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      <div className="sec-h">
        <h2>Comportamiento crediticio</h2>
      </div>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{formatDate(user.createdAt)}</b>
          <span>Cliente desde</span>
        </div>
        <div className="cs">
          <b>{allInstallments.length}</b>
          <span>Cuotas generadas</span>
        </div>
        <div className="cs">
          <b style={{ color: onTimeRatePct === null ? 'var(--muted)' : onTimeRatePct >= 80 ? 'var(--green)' : 'var(--amber)' }}>
            {onTimeRatePct === null ? '—' : `${onTimeRatePct}%`}
          </b>
          <span>Cuotas pagadas a tiempo</span>
        </div>
      </div>

      <div className="sec-h">
        <h2>Patrimonio y cuentas</h2>
      </div>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{bs(account.balanceUsdCents + Math.round(account.balanceVesCents / bcvRate))}</b>
          <span>Saldo total en KORA</span>
        </div>
        <div className="cs">
          <b>{formatKRT(krtTotalCents)}</b>
          <span>Puntos disponibles</span>
        </div>
        <div className="cs">
          <b>{fundPositions.length > 0 ? bs(fundsValueCents) : '—'}</b>
          <span>{fundPositions.length > 0 ? `En Fondos (≈ ${formatUSD(fundsInvestedCents)} invertido)` : 'Sin inversiones en Fondos'}</span>
        </div>
      </div>

      <div className="sec-h">
        <h2>Cuentas bancarias vinculadas</h2>
      </div>
      {linkedAccounts.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Este cliente todavía no vinculó ninguna cuenta bancaria.
        </div>
      ) : (
        <div className="card">
          {linkedAccounts.map((linked) => {
            const bank = allyBanks.find((b) => b.id === linked.bankId);
            return (
              <div className="unit" key={linked.id}>
                <div className="ui">🏦</div>
                <div className="ub">
                  <div className="uid">{bank?.name ?? 'Banco aliado'}</div>
                  <div className="uo">Cuenta •••• {linked.accountNumber.slice(-4)} · vinculada {formatDate(linked.linkedAt)}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {fundPositions.length > 0 && (
        <>
          <div className="sec-h">
            <h2>Posiciones en Fondos</h2>
          </div>
          <div className="card">
            {fundPositions.map((position) => {
              const fund = funds.find((f) => f.id === position.fundId);
              if (!fund) return null;
              return (
                <div className="unit" key={position.id}>
                  <div className="ui">📈</div>
                  <div className="ub">
                    <div className="uid">{fund.name}</div>
                    <div className="uo">
                      Principal {bs(position.principalCents)} · rendimiento {bs(position.accruedYieldCents)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div style={{ fontSize: 10.5, color: 'var(--faint)', marginTop: 16, lineHeight: 1.6, padding: '0 4px' }}>
        ⚠ Este perfil consolida solo lo que el cliente tiene dentro de KORA (crédito, cuentas vinculadas,
        inversiones y puntos). No consulta un buró de crédito externo — eso requeriría una integración real con
        un servicio como Crediscore, que este sandbox no tiene contratada.
      </div>
    </>
  );
}
