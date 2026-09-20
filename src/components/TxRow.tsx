import type { Transaction } from '../domain/transaction';
import { getTxDisplay } from '../features/historial/txDisplay';

export function TxRow({ tx }: { tx: Transaction }) {
  const { icon, bg, amountClass, amountLabel, krtLabel, dateLabel } = getTxDisplay(tx);

  return (
    <div className="tx">
      <div className="tx-ic" style={{ background: bg }}>
        {icon}
      </div>
      <div className="tx-body">
        <div className="tx-name">{tx.title}</div>
        <div className="tx-sub">
          {dateLabel} · {tx.subtitle}
        </div>
      </div>
      <div>
        {amountLabel && <div className={`tx-amt ${amountClass}`}>{amountLabel}</div>}
        {krtLabel && <div className="tx-krt">{krtLabel}</div>}
      </div>
    </div>
  );
}
