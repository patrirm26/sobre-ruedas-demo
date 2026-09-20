import { useMemo, useState } from 'react';
import { useKoraStore } from '../../state/store';
import { ScoreCreditoDetail } from './ScoreCreditoDetail';

/** Punto de entrada del Back Office — a diferencia del resto de vistas de
 * staff (que listan TODOS los registros de una vez, ej. CardsView), acá
 * primero hay que elegir a QUÉ cliente mirar: el perfil es por cuenta, no
 * tiene sentido mostrar los cuatro a la vez. Solo se listan cuentas que ya
 * tienen un score calculado (`scoreSnapshots`) — sin eso no hay nada que
 * mostrar.
 *
 * `clients` se deriva con `useMemo` fuera del selector de Zustand a
 * propósito: mapear a objetos nuevos `{user, score}` DENTRO de un selector
 * con `useShallow` crea una referencia distinta en cada render (el shallow
 * compare es por elemento, no por contenido profundo), lo que dispara un
 * loop infinito de renders. */
export function ScoreCreditoBackofficeView() {
  const users = useKoraStore((s) => s.users);
  const scoreSnapshots = useKoraStore((s) => s.scoreSnapshots);
  const clients = useMemo(
    () =>
      Object.values(users)
        .filter((u) => u.primaryAccountId && scoreSnapshots[u.primaryAccountId])
        .map((u) => ({ user: u, score: scoreSnapshots[u.primaryAccountId!] })),
    [users, scoreSnapshots]
  );

  const [selectedAccountId, setSelectedAccountId] = useState<string | undefined>(clients[0]?.user.primaryAccountId);

  return (
    <>
      <div className="sec-h" style={{ marginTop: 0 }}>
        <h2>Clientes con score calculado</h2>
      </div>
      <div className="card" style={{ marginBottom: 20 }}>
        {clients.map(({ user, score }) => (
          <button
            key={user.id}
            className={`select-row ${selectedAccountId === user.primaryAccountId ? 'active' : ''}`}
            onClick={() => setSelectedAccountId(user.primaryAccountId)}
          >
            <span className="sr-icon">👤</span>
            <span className="sr-body">
              <span className="sr-title">{user.name}</span>
              <span className="sr-sub" style={{ display: 'block' }}>
                Score {score.value} · {score.band.replace('_', ' ')}
              </span>
            </span>
            <span className="sr-check">✓</span>
          </button>
        ))}
      </div>

      {selectedAccountId ? (
        <ScoreCreditoDetail accountId={selectedAccountId} />
      ) : (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--muted)', fontSize: 13 }}>
          Elige un cliente para ver su perfil de crédito.
        </div>
      )}
    </>
  );
}
