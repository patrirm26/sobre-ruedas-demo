import { useEffect, useState } from 'react';
import { useKoraStore } from '../../state/store';
import { auditService } from '../../services/auditService';
import { BACKOFFICE_ROLE_LABEL, type BackofficeRole } from '../../domain/staff';
import type { AuditEntry } from '../../domain/audit';

const ROLE_PILL: Record<BackofficeRole, string> = {
  admin: 'p-violet',
  compliance: 'p-red',
  operaciones: 'p-blue',
  reporting: 'p-gold',
};

const auditDateFormatter = new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Bitácora de auditoría — solo lectura, solo alcanzable con rol 'admin'
 * (ver ROLE_SECTIONS en backofficeSlice.ts). Muestra quién hizo qué acción
 * y cuándo, tanto de las acciones reales (staff) como de las que todavía
 * viven en sandbox (Compliance/Onboarding/Cards/Loyalty/Decisioning). */
export function AuditView() {
  const showToast = useKoraStore((s) => s.showToast);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    auditService
      .list()
      .then(setEntries)
      .catch((e) => showToast(`⚠️ ${(e as Error).message}`))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Auditoría — quién hizo qué y cuándo</h2>
      </div>
      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Cargando…
        </div>
      ) : entries.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Todavía no hay acciones registradas.
        </div>
      ) : (
        <div className="card">
          {entries.map((entry) => (
            <div className="unit" key={entry.id}>
              <div className="ui">{entry.staffName.charAt(0).toUpperCase()}</div>
              <div className="ub">
                <div className="uid">
                  {entry.staffName} <span className={`pill ${ROLE_PILL[entry.role]}`} style={{ marginLeft: 6 }}>{BACKOFFICE_ROLE_LABEL[entry.role].toUpperCase()}</span>
                </div>
                <div className="uo">{entry.detail}</div>
              </div>
              <div className="ur">
                <div className="ud">{auditDateFormatter.format(new Date(entry.at))}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
