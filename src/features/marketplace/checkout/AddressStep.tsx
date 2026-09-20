import { useState } from 'react';
import { useKoraStore } from '../../../state/store';
import { generateId } from '../../../lib/ids';
import type { ShippingAddress } from '../../../domain/shipping';

interface Props {
  accountId: string;
  selectedId: string | undefined;
  onSelect: (id: string) => void;
  onContinue: () => void;
}

const emptyForm = { fullName: '', phone: '', line1: '', cityState: '', reference: '' };

export function AddressStep({ accountId, selectedId, onSelect, onContinue }: Props) {
  const addresses = useKoraStore((s) => s.addresses[accountId] ?? []);
  const addAddress = useKoraStore((s) => s.addAddress);

  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const canSave = form.fullName.trim() && form.phone.trim() && form.line1.trim() && form.cityState.trim();

  const handleSave = () => {
    if (!canSave) return;
    const address: ShippingAddress = {
      id: generateId('addr'),
      accountId,
      fullName: form.fullName.trim(),
      phone: form.phone.trim(),
      line1: form.line1.trim(),
      cityState: form.cityState.trim(),
      reference: form.reference.trim() || undefined,
    };
    addAddress(address);
    onSelect(address.id);
    setForm(emptyForm);
    setAdding(false);
  };

  return (
    <div>
      <h3 style={{ fontSize: 16, marginBottom: 4 }}>¿Dónde querés recibir tu compra?</h3>
      <p style={{ fontSize: 12.5, color: 'var(--muted)', marginBottom: 16 }}>Elige una dirección guardada o añade una nueva.</p>

      {addresses.map((addr) => (
        <button key={addr.id} className={`select-row ${selectedId === addr.id ? 'active' : ''}`} onClick={() => onSelect(addr.id)}>
          <span className="sr-icon">📍</span>
          <span className="sr-body">
            <span className="sr-title">{addr.fullName}</span>
            <span className="sr-sub" style={{ display: 'block' }}>
              {addr.line1} · {addr.cityState}
            </span>
            <span className="sr-sub" style={{ display: 'block' }}>
              {addr.phone}
            </span>
          </span>
          <span className="sr-check">✓</span>
        </button>
      ))}

      {adding ? (
        <div className="card" style={{ padding: 16, marginTop: 10 }}>
          <div className="in-row">
            <div className="in-group">
              <label className="in-label">NOMBRE DE QUIEN RECIBE</label>
              <input className="in-field" value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
            </div>
            <div className="in-group">
              <label className="in-label">TELÉFONO</label>
              <input className="in-field" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
          </div>
          <div className="in-group">
            <label className="in-label">DIRECCIÓN</label>
            <input
              className="in-field"
              placeholder="Calle, edificio, piso, apto"
              value={form.line1}
              onChange={(e) => setForm((f) => ({ ...f, line1: e.target.value }))}
            />
          </div>
          <div className="in-group">
            <label className="in-label">MUNICIPIO, CIUDAD, ESTADO</label>
            <input className="in-field" value={form.cityState} onChange={(e) => setForm((f) => ({ ...f, cityState: e.target.value }))} />
          </div>
          <div className="in-group">
            <label className="in-label">PUNTO DE REFERENCIA (OPCIONAL)</label>
            <input className="in-field" value={form.reference} onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: 9 }}>
            <button className="btn" style={{ flex: 1 }} disabled={!canSave} onClick={handleSave}>
              Guardar dirección
            </button>
            <button className="btn ghost" onClick={() => setAdding(false)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button className="btn ghost full" style={{ marginTop: 10 }} onClick={() => setAdding(true)}>
          + Añadir nueva dirección
        </button>
      )}

      <div className="checkout-actions">
        <button className="btn full" disabled={!selectedId} onClick={onContinue}>
          Continuar
        </button>
      </div>
    </div>
  );
}
