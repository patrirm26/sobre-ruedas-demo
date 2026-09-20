import { useEffect, useState } from 'react';
import { useKoraStore } from '../../state/store';
import { securityEventService } from '../../services/securityEventService';
import type { SecurityEvent, SecurityEventType } from '../../domain/securityEvent';

const EVENT_LABEL: Record<SecurityEventType, string> = {
  auth_failed: 'Falla de autenticación',
  forbidden: 'Acceso denegado',
  rate_limited: 'Rate limit',
  unhandled_error: 'Error no manejado',
};

const EVENT_PILL: Record<SecurityEventType, string> = {
  auth_failed: 'p-gold',
  forbidden: 'p-red',
  rate_limited: 'p-blue',
  unhandled_error: 'p-violet',
};

const eventDateFormatter = new Intl.DateTimeFormat('es-VE', {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
});

/** Bitácora de seguridad — solo lectura, solo alcanzable con rol 'admin'
 * (ver ROLE_SECTIONS en backofficeSlice.ts). Muestra los intentos fallidos
 * (401/403/429) y errores no manejados de las Edge Functions — hoy esos
 * casos solo le llegaban al cliente como mensaje de error y se perdían
 * (ver PRODUCTION_CHECKLIST.md §4, migración `security_events`). */
export function SecurityView() {
  const showToast = useKoraStore((s) => s.showToast);
  const [events, setEvents] = useState<SecurityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    securityEventService
      .list()
      .then(setEvents)
      .catch((e) => showToast(`⚠️ ${(e as Error).message}`))
      .finally(() => setLoading(false));
  }, [showToast]);

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Seguridad — intentos fallidos y errores de las Edge Functions</h2>
      </div>
      {loading ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Cargando…
        </div>
      ) : events.length === 0 ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Sin eventos de seguridad registrados.
        </div>
      ) : (
        <div className="card">
          {events.map((event) => (
            <div className="unit" key={event.id}>
              <div className="ui">{event.functionName.charAt(0).toUpperCase()}</div>
              <div className="ub">
                <div className="uid">
                  {event.functionName}{' '}
                  <span className={`pill ${EVENT_PILL[event.eventType]}`} style={{ marginLeft: 6 }}>
                    {EVENT_LABEL[event.eventType].toUpperCase()}
                  </span>
                </div>
                <div className="uo">{event.detail}</div>
              </div>
              <div className="ur">
                <div className="ud">{eventDateFormatter.format(new Date(event.at))}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
