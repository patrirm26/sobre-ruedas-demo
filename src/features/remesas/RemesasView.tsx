import { useEffect, useMemo, useState } from 'react';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { paymentService } from '../../services/paymentService';

interface Corridor {
  id: string;
  country: string;
  rate: number;
  currency: string;
  eta: string;
  feePct: number;
}

const CORRIDORS: Corridor[] = [
  { id: 'VE_AR', country: 'Venezuela → Argentina', rate: 1185, currency: 'ARS', eta: '~2 min', feePct: 1.8 },
  { id: 'VE_CO', country: 'Venezuela → Colombia', rate: 4031, currency: 'COP', eta: '~3 min', feePct: 1.5 },
  { id: 'VE_PE', country: 'Venezuela → Perú', rate: 3.71, currency: 'PEN', eta: '~5 min', feePct: 1.6 },
  { id: 'VE_CL', country: 'Venezuela → Chile', rate: 960, currency: 'CLP', eta: '~4 min', feePct: 1.7 },
];

export function RemesasView() {
  const account = useKoraStore(selectActiveAccount);
  const showToast = useKoraStore((s) => s.showToast);
  const [picked, setPicked] = useState<Corridor | null>(null);
  const [amount, setAmount] = useState(120);
  const [name, setName] = useState('Laura Martínez');
  const [secondsLeft, setSecondsLeft] = useState(900);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!picked) return;
    setSecondsLeft(900);
    const id = setInterval(() => setSecondsLeft((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [picked]);

  const { fee, receives } = useMemo(() => {
    if (!picked) return { fee: 0, receives: 0 };
    const feeUsd = amount * (picked.feePct / 100);
    return { fee: feeUsd, receives: (amount - feeUsd) * picked.rate };
  }, [picked, amount]);

  const lockLabel = `${String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:${String(secondsLeft % 60).padStart(2, '0')}`;

  const handleConfirm = async () => {
    if (!account || !picked) return;
    setProcessing(true);
    try {
      await paymentService.sendRemesa({
        accountId: account.id,
        amountUsdCents: Math.round(amount * 100),
        feePct: picked.feePct,
        rate: picked.rate,
        destCurrency: picked.currency,
        country: picked.country,
        recipientName: name,
      });
      showToast(`✅ Remesa enviada a ${name || 'tu familia'}`);
      setPicked(null);
    } catch (e) {
      showToast(`⚠️ ${(e as Error).message}`);
    } finally {
      setProcessing(false);
    }
  };

  if (picked) {
    return (
      <>
        <button className="btn ghost" style={{ padding: '9px 18px', fontSize: 13, marginBottom: 16 }} onClick={() => setPicked(null)}>
          ← Cambiar destino
        </button>
        <div className="grid2">
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 15, marginBottom: 14 }}>{picked.country}</h3>
            <div className="in-group">
              <label className="in-label">ENVÍAS (USD)</label>
              <input className="in-field" type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value) || 0)} />
            </div>
            <div className="in-group">
              <label className="in-label">NOMBRE DEL DESTINATARIO</label>
              <input className="in-field" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
          </div>
          <div className="card" style={{ padding: 24 }}>
            <div className="lock-pill">
              🔒 Tasa congelada para ti · expira en <b>{lockLabel}</b>
            </div>
            <div className="q-line">
              <span>Tasa</span>
              <b>
                {picked.rate.toLocaleString('es-VE')} {picked.currency}/USD
              </b>
            </div>
            <div className="q-line">
              <span>Comisión</span>
              <b>
                ${fee.toFixed(2)} ({picked.feePct}%)
              </b>
            </div>
            <div className="q-line">
              <span>Llega en</span>
              <b>{picked.eta}</b>
            </div>
            <div className="q-line big">
              <span>{name || 'Tu familia'} recibe</span>
              <b>
                {receives.toLocaleString('es-VE', { maximumFractionDigits: 0 })} {picked.currency}
              </b>
            </div>
            <button className="btn full" style={{ marginTop: 14 }} disabled={processing || !account} onClick={handleConfirm}>
              {processing ? 'Procesando...' : 'Confirmar y enviar'}
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>¿A dónde envías hoy?</h2>
        <span className="pill p-gold">★ Recibir remesas te da +0,3% en puntos</span>
      </div>
      <div className="grid2">
        {CORRIDORS.map((c) => (
          <div className="corr" key={c.id} onClick={() => setPicked(c)}>
            <div className="ci">
              <div className="cn">{c.country}</div>
              <div className="cr">
                {c.rate.toLocaleString('es-VE')} {c.currency} por dólar
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="ct">{c.eta}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
