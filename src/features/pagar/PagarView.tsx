import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { paymentService } from '../../services/paymentService';
import { isValidPhone, isValidIdDoc } from '../../services/bankAllianceRules';
import { formatUSD, formatVES, formatKRT, formatPercent } from '../../lib/format';
import { useBnplFlow } from '../../lib/useBnplFlow';
import { useInstallmentPreview } from '../../lib/useInstallmentPreview';
import { BnplEvaluationCard } from '../../components/BnplEvaluationCard';
import type { TransactionCurrency } from '../../domain/transaction';

type Method = 'contacto' | 'movil';

const FREQUENT = [
  { icon: '👨', name: 'Andrés Rivas', sub: '0414-228 4471' },
  { icon: '👩', name: 'Rosa Pérez', sub: '0426-880 3241' },
  { icon: '🏪', name: 'Bodegón El Ávila', sub: '@bodegon-avila' },
];

const AMOUNT_FORMATTER: Record<TransactionCurrency, (cents: number) => string> = {
  USD: formatUSD,
  VES: formatVES,
  KRT: formatKRT,
};

export function PagarView() {
  const account = useKoraStore(selectActiveAccount);
  const showToast = useKoraStore((s) => s.showToast);
  const allyBanks = useKoraStore((s) => s.allyBanks);
  const bcvRate = useKoraStore((s) => s.bcvRateVesPerUsd);
  const [method, setMethod] = useState<Method>('contacto');
  const [to, setTo] = useState('0414-228 4471');
  const [amount, setAmount] = useState(75);
  const [currency, setCurrency] = useState<TransactionCurrency>('VES');
  const [concept, setConcept] = useState('Almuerzo La Castellana');
  const [processing, setProcessing] = useState(false);

  const [destBankId, setDestBankId] = useState(allyBanks[0]?.id ?? '');
  const [destPhone, setDestPhone] = useState('');
  const [destIdDoc, setDestIdDoc] = useState('');

  const [financeWithBnpl, setFinanceWithBnpl] = useState(false);
  const [installments, setInstallments] = useState(3);
  const { evaluation, submitting: bnplSubmitting, requestEvaluation, confirmPlan, cancel } = useBnplFlow();

  const amountCents = Math.round(amount * 100);
  const preview = useInstallmentPreview(financeWithBnpl ? account?.id : undefined, amountCents, installments);

  const selectMethod = (m: Method) => {
    setMethod(m);
    if (m === 'movil' && currency === 'KRT') setCurrency('VES');
  };

  const toggleFinance = () => {
    const next = !financeWithBnpl;
    setFinanceWithBnpl(next);
    if (next) setCurrency('USD');
    cancel();
  };

  /** Arma y valida el destino según el modo — null = inválido (ya se avisó por toast). */
  const resolveDestination = (): string | null => {
    if (method === 'contacto') return to;
    if (!isValidPhone(destPhone)) {
      showToast('⚠️ Teléfono inválido — usa un prefijo venezolano (0412/0414/0416/0424/0426) + 7 dígitos.');
      return null;
    }
    if (!isValidIdDoc(destIdDoc)) {
      showToast('⚠️ Cédula o RIF inválido — formato esperado V-12.345.678 o J-50123456-0.');
      return null;
    }
    const bank = allyBanks.find((b) => b.id === destBankId);
    return `${bank?.name ?? 'Banco aliado'} · ${destPhone} · ${destIdDoc}`;
  };

  const executeSend = async (destination: string) => {
    if (!account) return;
    setProcessing(true);
    try {
      await paymentService.sendPayment({ accountId: account.id, to: destination, amountCents, currency, concept });
      showToast(`✅ Pagaste ${AMOUNT_FORMATTER[currency](amountCents)} a ${destination}`);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    const destination = resolveDestination();
    if (destination === null) return;
    await executeSend(destination);
  };

  const handleRequestBnpl = async () => {
    if (!account) return;
    const destination = resolveDestination();
    if (destination === null) return;
    await requestEvaluation(account.id, amountCents, null, `Pago a ${destination}`);
  };

  const handleConfirmBnplThenPay = async () => {
    const destination = resolveDestination();
    if (destination === null) return;
    const plan = await confirmPlan(installments);
    if (!plan) return;
    await executeSend(destination);
  };

  const payLabel = processing ? 'Procesando...' : `Pagar ${AMOUNT_FORMATTER[currency](amountCents)}`;

  const financeToggle = (
    <div className="prow" style={{ cursor: 'pointer', marginTop: 4, marginBottom: financeWithBnpl ? 10 : 0 }} onClick={toggleFinance}>
      <span>▤ Financiar este pago con KORA Cuotas</span>
      <button className={`sw ${financeWithBnpl ? 'on' : ''}`} onClick={(e) => e.stopPropagation()} />
    </div>
  );

  const bnplBlock = financeWithBnpl && (
    <>
      <div className="in-group">
        <label className="in-label">
          CUOTAS · <span style={{ color: 'var(--accent2)' }}>{installments}</span>
        </label>
        <input
          type="range"
          className="slider"
          min={2}
          max={6}
          value={installments}
          onChange={(e) => setInstallments(Number(e.target.value))}
          disabled={!!evaluation}
        />
        <div className="slider-val">
          <span>2 cuotas</span>
          <span>6 cuotas</span>
        </div>
      </div>
      {preview && (
        <div className="sim-out">
          <div className="so-row">
            <span>Tasa mensual (según tu score)</span>
            <b>{formatPercent(preview.periodicRatePct)}</b>
          </div>
          <div className="so-row hl">
            <span>Cuota fija mensual</span>
            <b>
              {formatVES(Math.round(preview.installmentCents * bcvRate))} (≈ {formatUSD(preview.installmentCents)})
            </b>
          </div>
          <div className="so-row">
            <span>Costo total del crédito</span>
            <b>
              {formatVES(Math.round(preview.feeTotalCents * bcvRate))} (≈ {formatUSD(preview.feeTotalCents)})
            </b>
          </div>
          <div className="so-row">
            <span>🛡️ Seguro de desgravamen incluido</span>
            <b>
              {formatVES(Math.round(preview.insurancePremiumCents * bcvRate))} (≈ {formatUSD(preview.insurancePremiumCents)})
            </b>
          </div>
        </div>
      )}
      {evaluation ? (
        <BnplEvaluationCard evaluation={evaluation} submitting={bnplSubmitting} onConfirm={handleConfirmBnplThenPay} onCancel={cancel} />
      ) : (
        <button className="btn full" style={{ marginTop: 14 }} disabled={bnplSubmitting || !account} onClick={handleRequestBnpl}>
          {bnplSubmitting ? 'Evaluando...' : 'Solicitar KORA Cuotas'}
        </button>
      )}
    </>
  );

  return (
    <>
      <div className="tabs">
        <button className={`tab ${method === 'contacto' ? 'active' : ''}`} onClick={() => selectMethod('contacto')}>
          A un contacto KORA
        </button>
        <button className={`tab ${method === 'movil' ? 'active' : ''}`} onClick={() => selectMethod('movil')}>
          Por Pago Móvil
        </button>
      </div>
      <div className="grid2">
        <div className="card" style={{ padding: 24 }}>
          {method === 'contacto' ? (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 14 }}>Pagar a un contacto</h3>
              <div className="in-group">
                <label className="in-label">TELÉFONO O ALIAS</label>
                <input className="in-field" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div className="in-row">
                <div className="in-group">
                  <label className="in-label">MONTO</label>
                  <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                </div>
                <div className="in-group">
                  <label className="in-label">DESDE</label>
                  <select
                    className="in-field"
                    value={currency}
                    disabled={financeWithBnpl}
                    onChange={(e) => setCurrency(e.target.value as TransactionCurrency)}
                  >
                    <option value="USD">USD</option>
                    <option value="VES">VES</option>
                    <option value="KRT">Puntos</option>
                  </select>
                </div>
              </div>
              <div className="in-group">
                <label className="in-label">CONCEPTO</label>
                <input className="in-field" value={concept} onChange={(e) => setConcept(e.target.value)} />
              </div>
              {financeToggle}
              {financeWithBnpl ? (
                bnplBlock
              ) : (
                <button className="btn full" style={{ marginTop: 10 }} disabled={processing || !account} onClick={handlePay}>
                  {payLabel}
                </button>
              )}
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 14 }}>Pagar por Pago Móvil</h3>
              <div className="in-row">
                <div className="in-group">
                  <label className="in-label">BANCO DESTINO</label>
                  <select className="in-field" value={destBankId} onChange={(e) => setDestBankId(e.target.value)}>
                    {allyBanks.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} · {b.code}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="in-group">
                  <label className="in-label">TELÉFONO</label>
                  <input className="in-field" value={destPhone} onChange={(e) => setDestPhone(e.target.value)} placeholder="0412-5558821" />
                </div>
              </div>
              <div className="in-group">
                <label className="in-label">CÉDULA O RIF</label>
                <input className="in-field" value={destIdDoc} onChange={(e) => setDestIdDoc(e.target.value)} placeholder="V-12.345.678" />
              </div>
              <div className="in-row">
                <div className="in-group">
                  <label className="in-label">MONTO</label>
                  <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                </div>
                <div className="in-group">
                  <label className="in-label">MONEDA</label>
                  <select
                    className="in-field"
                    value={currency}
                    disabled={financeWithBnpl}
                    onChange={(e) => setCurrency(e.target.value as TransactionCurrency)}
                  >
                    <option value="USD">USD</option>
                    <option value="VES">VES</option>
                  </select>
                </div>
              </div>
              <div className="in-group">
                <label className="in-label">CONCEPTO</label>
                <input className="in-field" value={concept} onChange={(e) => setConcept(e.target.value)} />
              </div>
              {financeToggle}
              {financeWithBnpl ? (
                bnplBlock
              ) : (
                <button className="btn full" style={{ marginTop: 10 }} disabled={processing || !account} onClick={handlePay}>
                  {payLabel}
                </button>
              )}
            </>
          )}
        </div>
        <div className="card" style={{ padding: 24 }}>
          {method === 'contacto' ? (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 14 }}>Frecuentes</h3>
              {FREQUENT.map((c) => (
                <div className="tx" style={{ padding: '12px 0', cursor: 'pointer' }} key={c.name} onClick={() => setTo(c.sub)}>
                  <div className="tx-ic" style={{ background: 'var(--surface2)' }}>
                    {c.icon}
                  </div>
                  <div className="tx-body">
                    <div className="tx-name">{c.name}</div>
                    <div className="tx-sub">{c.sub}</div>
                  </div>
                </div>
              ))}
              <div
                style={{
                  marginTop: 14,
                  padding: '13px 15px',
                  background: 'color-mix(in srgb, var(--accent) 7%, transparent)',
                  border: '1px solid color-mix(in srgb, var(--accent) 18%, transparent)',
                  borderRadius: 12,
                  fontSize: 12,
                  color: 'var(--muted)',
                  lineHeight: 1.6,
                }}
              >
                💡 <b style={{ color: 'var(--gold)' }}>Tip:</b> si pagas con puntos, el comercio recibe su dinero normal y tú
                usas tus recompensas acumuladas.
              </div>
            </>
          ) : (
            <>
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Así funciona</h3>
              <div className="steps">
                {[
                  ['Elige el banco del destinatario', 'El mismo que usa para recibir Pago Móvil'],
                  ['Ingresa su teléfono y cédula/RIF', 'Los mismos datos que pedirías desde tu app bancaria'],
                  ['Confirma el monto', 'En USD o bolívares, sin comisión adicional'],
                  ['Listo', 'El pago queda registrado en tu Historial al instante'],
                ].map(([title, sub]) => (
                  <div className="step done" key={title}>
                    <div className="sd">✓</div>
                    <div>
                      <b>{title}</b>
                      <span>{sub}</span>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
