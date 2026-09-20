import { SHIPPING_CARRIERS } from '../../../domain/shipping';

interface Props {
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

export function ShippingStep({ selectedId, onSelect, onBack, onContinue }: Props) {
  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>¿Con qué operador logístico querés recibir tu compra?</h3>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Todos con envío gratis en tu compra protegida.</p>

      {SHIPPING_CARRIERS.map((carrier) => (
        <button key={carrier.id} className={`select-row ${selectedId === carrier.id ? 'active' : ''}`} onClick={() => onSelect(carrier.id)}>
          <span className="sr-icon">🚚</span>
          <span className="sr-body">
            <span className="sr-title">{carrier.name}</span>
            <span className="sr-sub" style={{ display: 'block' }}>
              {carrier.etaLabel}
            </span>
          </span>
          <span style={{ fontSize: 11.5, fontWeight: 800, color: 'var(--green)' }}>Gratis</span>
          <span className="sr-check">✓</span>
        </button>
      ))}

      <div className="checkout-actions">
        <button className="btn ghost" onClick={onBack}>
          Volver
        </button>
        <button className="btn full" disabled={!selectedId} onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  );
}
