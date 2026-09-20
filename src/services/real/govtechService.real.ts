import type { GovtechService } from '../govtechService';
import { getSupabaseClient } from '../../lib/supabaseClient';
import { GOVTECH_ADAPTERS } from './govtech';

export const realGovtechService: GovtechService = {
  async consultarDeudas(entityId) {
    const { data: entity, error } = await getSupabaseClient()
      .from('gov_entities')
      .select('adapter_key')
      .eq('id', entityId)
      .maybeSingle();
    if (error) throw new Error(error.message);

    const adapterKey = entity?.adapter_key as string | null | undefined;
    const adapter = adapterKey ? GOVTECH_ADAPTERS[adapterKey] : undefined;
    if (!adapter) {
      throw new Error('Not implemented: este ente todavía no tiene un adapter — ver services/real/govtech/.');
    }
    return adapter(entityId);
  },
};
