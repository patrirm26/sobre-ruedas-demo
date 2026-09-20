import type { GovtechService } from '../govtechService';
import { useKoraStore } from '../../state/store';
import { simulateLatency } from '../delay';

export const mockGovtechService: GovtechService = {
  async consultarDeudas(entityId) {
    await simulateLatency();
    const state = useKoraStore.getState();
    // Simula la consulta: devuelve lo que ya se sabe de ese ente en el
    // catálogo sembrado — vacío es una respuesta real ("no debes nada"),
    // no un placeholder.
    return state.obligations.filter((o) => o.entityId === entityId);
  },
};
