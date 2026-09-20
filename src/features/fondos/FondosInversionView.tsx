import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { formatUSD, formatVES, formatPercent } from '../../lib/format';
import { FundInvestModal } from './FundInvestModal';
import { FundWithdrawModal } from './FundWithdrawModal';
import type { InvestmentFund, FundRiskLevel } from '../../domain/investmentFund';

const RISK_PILL: Record<FundRiskLevel, { label: string; cls: string }> = {
  bajo: { label: 'Riesgo bajo', cls: 'p-green' },
  moderado: { label: 'Riesgo moderado', cls: 'p-amber' },
  alto: { label: 'Riesgo alto', cls: 'p-red' },
};

export function FondosInversionView() {
  const account = useKoraStore(selectActiveAccount);
  const funds = useKoraStore(useShallow((s) => s.funds));
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const bs = (usdCents: number) => formatVES(Math.round(usdCents * bcvRate));
  const positions = useKoraStore(
    useShallow((s) => (account ? s.fundPositions.filter((p) => p.accountId === account.id && (p.principalCents > 0 || p.accruedYieldCents > 0)) : []))
  );

  const [investFund, setInvestFund] = useState<InvestmentFund | null>(null);
  const [withdrawFund, setWithdrawFund] = useState<InvestmentFund | null>(null);

  if (!account) return null;

  const totals = positions.reduce(
    (acc, p) => {
      acc.principal += p.principalCents;
      acc.yield += p.accruedYieldCents;
      return acc;
    },
    { principal: 0, yield: 0 }
  );

  const withdrawPosition = withdrawFund ? positions.find((p) => p.fundId === withdrawFund.id) : undefined;

  return (
    <>
      <div className="condo-stats" style={{ marginBottom: 20 }}>
        <div className="cs">
          <b>{bs(totals.principal)}</b>
          <span>Total invertido (≈ {formatUSD(totals.principal)})</span>
        </div>
        <div className="cs">
          <b style={{ color: 'var(--green)' }}>{bs(totals.yield)}</b>
          <span>Rendimiento acumulado (≈ {formatUSD(totals.yield)})</span>
        </div>
        <div className="cs">
          <b>{bs(totals.principal + totals.yield)}</b>
          <span>Valor total (≈ {formatUSD(totals.principal + totals.yield)})</span>
        </div>
      </div>

      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Fondos disponibles</h2>
      </div>
      <div className="card">
        {funds.map((fund) => {
          const risk = RISK_PILL[fund.riskLevel];
          return (
            <div className="unit" key={fund.id}>
              <div className="ui">📈</div>
              <div className="ub">
                <div className="uid">{fund.name}</div>
                <div className="uo">
                  {formatPercent(fund.annualYieldPct)} anual · mínimo {bs(fund.minInvestmentCents)} (≈ {formatUSD(fund.minInvestmentCents)})
                </div>
              </div>
              <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span className={`pill ${risk.cls}`}>{risk.label}</span>
                <button className="cbtn" onClick={() => setInvestFund(fund)}>
                  Invertir
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="sec-h">
        <h2>Mis inversiones</h2>
      </div>
      {positions.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no invertiste en ningún fondo.
        </div>
      ) : (
        <div className="card">
          {positions.map((position) => {
            const fund = funds.find((f) => f.id === position.fundId);
            if (!fund) return null;
            const totalValueCents = position.principalCents + position.accruedYieldCents;
            return (
              <div className="unit" key={position.id}>
                <div className="ui">📈</div>
                <div className="ub">
                  <div className="uid">{fund.name}</div>
                  <div className="uo">
                    Principal {bs(position.principalCents)} · rendimiento{' '}
                    <span style={{ color: 'var(--green)' }}>{bs(position.accruedYieldCents)}</span>
                  </div>
                </div>
                <div className="ur" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ua">{bs(totalValueCents)}</div>
                  <button className="cbtn" onClick={() => setInvestFund(fund)}>
                    Aportar más
                  </button>
                  <button className="cbtn" onClick={() => setWithdrawFund(fund)}>
                    Rescatar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {investFund && <FundInvestModal fund={investFund} accountId={account.id} onClose={() => setInvestFund(null)} />}
      {withdrawFund && withdrawPosition && (
        <FundWithdrawModal fund={withdrawFund} position={withdrawPosition} accountId={account.id} onClose={() => setWithdrawFund(null)} />
      )}
    </>
  );
}
