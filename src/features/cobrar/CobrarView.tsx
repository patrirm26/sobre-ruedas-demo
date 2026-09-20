import { useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { paymentService } from '../../services/paymentService';
import { bankAllianceService } from '../../services/bankAllianceService';
import { formatUSD, formatVES, formatPercent } from '../../lib/format';
import { useComingSoon } from '../../lib/comingSoon';

type Tab = 'qr' | 'movil' | 'link';
type Currency = 'USD' | 'VES';

const CURRENCY_FORMATTER: Record<Currency, (cents: number) => string> = { USD: formatUSD, VES: formatVES };

export function CobrarView() {
  const account = useKoraStore(selectActiveAccount);
  const showToast = useKoraStore((s) => s.showToast);
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const allyBanks = useKoraStore((s) => s.allyBanks);
  const qrCashbackPct = useKoraStore((s) => s.loyaltyRates.find((r) => r.channel === 'qr')?.cashbackPct ?? 0);
  const linkedAccounts = useKoraStore(
    useShallow((s) => (account ? s.linkedBankAccounts.filter((l) => l.accountId === account.id) : []))
  );
  const [tab, setTab] = useState<Tab>('qr');
  const [amount, setAmount] = useState(45);
  const [currency, setCurrency] = useState<Currency>('VES');
  const [concept, setConcept] = useState('Consumo mesa 4');
  const [processing, setProcessing] = useState(false);
  const [selectedLinkedId, setSelectedLinkedId] = useState<string | undefined>(undefined);
  const comingSoon = useComingSoon();

  const amountCents = Math.round(amount * 100);
  const selectedLinked = linkedAccounts.find((l) => l.id === selectedLinkedId) ?? linkedAccounts[0];
  const selectedBank = selectedLinked ? allyBanks.find((b) => b.id === selectedLinked.bankId) : undefined;

  const handleQrReceive = async () => {
    if (!account) return;
    setProcessing(true);
    try {
      await paymentService.receivePayment({ accountId: account.id, amountCents, currency, concept, channel: 'qr', cashbackPct: qrCashbackPct });
      showToast(`✅ Recibiste ${CURRENCY_FORMATTER[currency](amountCents)} · ${concept}`);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleMobileDeposit = async () => {
    if (!selectedLinked) return;
    setProcessing(true);
    try {
      await bankAllianceService.depositViaMobilePayment({ linkedAccountId: selectedLinked.id, amountCents, currency });
      showToast(`✅ Recibiste ${CURRENCY_FORMATTER[currency](amountCents)} por Pago Móvil`);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div className="tabs">
        <button className={`tab ${tab === 'qr' ? 'active' : ''}`} onClick={() => setTab('qr')}>
          Código QR
        </button>
        <button className={`tab ${tab === 'movil' ? 'active' : ''}`} onClick={() => setTab('movil')}>
          Pago Móvil
        </button>
        <button className={`tab ${tab === 'link' ? 'active' : ''}`} onClick={() => setTab('link')}>
          Link de cobro
        </button>
      </div>

      {tab === 'qr' && (
        <div className="grid2">
          <div className="card" style={{ padding: 24 }}>
            <div className="in-row">
              <div className="in-group">
                <label className="in-label">MONTO (OPCIONAL)</label>
                <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
              </div>
              <div className="in-group">
                <label className="in-label">MONEDA</label>
                <select className="in-field" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                  <option value="USD">USD</option>
                  <option value="VES">VES</option>
                </select>
              </div>
            </div>
            <div className="in-group">
              <label className="in-label">CONCEPTO</label>
              <input className="in-field" value={concept} onChange={(e) => setConcept(e.target.value)} />
            </div>
            <button className="btn full" style={{ marginTop: 10 }} disabled={processing || !account} onClick={handleQrReceive}>
              {processing ? 'Procesando...' : '▶ Simular pago recibido'}
            </button>
          </div>
          <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14 }}>
            <div className="qr-display">
              <div
                style={{
                  width: 190,
                  height: 190,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(8,1fr)',
                  gridTemplateRows: 'repeat(8,1fr)',
                }}
              >
                {Array.from({ length: 64 }).map((_, i) => (
                  <div key={i} style={{ background: (i * 7) % 5 < 2 ? '#000' : 'transparent' }} />
                ))}
              </div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: 27, fontWeight: 850 }}>{CURRENCY_FORMATTER[currency](amount * 100)}</div>
              <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 3 }}>{concept}</div>
            </div>
            <span className="pill p-gold">★ Este cobro te dará +{formatPercent(qrCashbackPct)} en puntos</span>
          </div>
        </div>
      )}

      {tab === 'movil' && (
        <div className="grid2">
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>Comparte estos datos y recibe al instante</h3>
            {linkedAccounts.length === 0 ? (
              <>
                <p style={{ fontSize: 13, color: 'var(--muted)', lineHeight: 1.6, marginBottom: 16 }}>
                  Todavía no vinculaste una cuenta bancaria — sin eso no hay datos reales de Pago Móvil para compartir.
                </p>
                <button className="btn full" onClick={() => setActiveView('alianzas')}>
                  Vincular mi banco
                </button>
              </>
            ) : (
              <>
                {linkedAccounts.length > 1 && (
                  <div className="in-group">
                    <label className="in-label">CUENTA A MOSTRAR</label>
                    <select className="in-field" value={selectedLinked?.id} onChange={(e) => setSelectedLinkedId(e.target.value)}>
                      {linkedAccounts.map((l) => {
                        const b = allyBanks.find((bk) => bk.id === l.bankId);
                        return (
                          <option key={l.id} value={l.id}>
                            {b?.name ?? 'Banco aliado'} •••• {l.accountNumber.slice(-4)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div className="copy-row">
                  <span>Banco</span>
                  <b>
                    {selectedBank?.name ?? 'Banco aliado'} · {selectedBank?.code}
                  </b>
                </div>
                <div className="copy-row">
                  <span>Cédula / RIF</span>
                  <b>
                    {selectedLinked?.holderIdDoc}{' '}
                    <button className="cbtn" onClick={() => comingSoon('Cédula/RIF copiado', 'Copiar al portapapeles.')}>
                      Copiar
                    </button>
                  </b>
                </div>
                <div className="copy-row">
                  <span>Teléfono</span>
                  <b>
                    {selectedLinked?.phone}{' '}
                    <button className="cbtn" onClick={() => comingSoon('Teléfono copiado', 'Copiar al portapapeles.')}>
                      Copiar
                    </button>
                  </b>
                </div>
                <div className="in-row" style={{ marginTop: 14 }}>
                  <div className="in-group">
                    <label className="in-label">MONTO</label>
                    <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
                  </div>
                  <div className="in-group">
                    <label className="in-label">MONEDA</label>
                    <select className="in-field" value={currency} onChange={(e) => setCurrency(e.target.value as Currency)}>
                      <option value="USD">USD</option>
                      <option value="VES">VES</option>
                    </select>
                  </div>
                </div>
                <button className="btn full" style={{ marginTop: 10 }} disabled={processing || !account} onClick={handleMobileDeposit}>
                  {processing ? 'Procesando...' : '▶ Simular Pago Móvil entrante'}
                </button>
              </>
            )}
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 10 }}>Así funciona</h3>
            <div className="steps">
              {[
                ['Tu cliente hace el Pago Móvil', 'Desde la app de cualquier banco venezolano'],
                ['KORA lo detecta y verifica', 'Sin capturas de pantalla ni confirmaciones manuales'],
                ['Se acredita a tu saldo', 'Identificado con tu referencia, en segundos'],
                ['Te avisamos al instante', 'Notificación push + WhatsApp con el comprobante'],
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
          </div>
        </div>
      )}

      {tab === 'link' && (
        <div className="grid2">
          <div className="card" style={{ padding: 24 }}>
            <div className="in-group">
              <label className="in-label">MONTO</label>
              <input className="in-field" type="number" defaultValue={120} />
            </div>
            <div className="in-group">
              <label className="in-label">DESCRIPCIÓN</label>
              <input className="in-field" type="text" defaultValue="Consultoría de diseño · Junio" />
            </div>
            <button className="btn full" onClick={() => showToast('✅ Link creado y copiado — kora.app/pay/consultoria-jun')}>
              Crear y copiar link
            </button>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>Tus links activos</h3>
            <div className="copy-row">
              <span style={{ color: 'var(--accent2)', fontFamily: 'var(--mono)', fontSize: 12 }}>kora.app/pay/gc-dis-mai</span>
              <b>$120 · 0/1 usos</b>
            </div>
            <div className="copy-row">
              <span style={{ color: 'var(--accent2)', fontFamily: 'var(--mono)', fontSize: 12 }}>kora.app/pay/taller-corolla</span>
              <b>$60 · 3/∞ usos</b>
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 14, lineHeight: 1.6 }}>
              Quien recibe tu link no necesita tener cuenta KORA: paga con su banco y tú recibes en tu saldo.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
