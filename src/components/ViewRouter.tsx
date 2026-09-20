import { useKoraStore } from '../state/store';
import { HomeView } from '../features/home/HomeView';
import { ServicesView } from '../features/services/ServicesView';
import { HistorialView } from '../features/historial/HistorialView';
import { TokensView } from '../features/tokens/TokensView';
import { CreditosView } from '../features/creditos/CreditosView';
import { CuotasView } from '../features/cuotas/CuotasView';
import { GovtechView } from '../features/govtech/GovtechView';
import { CopilotView } from '../features/copilot/CopilotView';
import { CobrarView } from '../features/cobrar/CobrarView';
import { PagarView } from '../features/pagar/PagarView';
import { RemesasView } from '../features/remesas/RemesasView';
import { MarketplaceView } from '../features/marketplace/MarketplaceView';
import { ConsorcioView } from '../features/consorcio/ConsorcioView';
import { AlianzasBancariasView } from '../features/alianzas/AlianzasBancariasView';
import { FondosInversionView } from '../features/fondos/FondosInversionView';
import { TarjetaView } from '../features/tarjeta/TarjetaView';
import { PerfilView } from '../features/perfil/PerfilView';
import { FactoringConsumerView } from '../features/factoring/FactoringConsumerView';
import type { ViewId } from '../state/slices/uiSlice';

const VIEW_COMPONENTS: Record<ViewId, () => React.ReactElement | null> = {
  home: HomeView,
  services: ServicesView,
  historial: HistorialView,
  tokens: TokensView,
  creditos: CreditosView,
  cuotas: CuotasView,
  govtech: GovtechView,
  copilot: CopilotView,
  cobrar: CobrarView,
  pagar: PagarView,
  remesas: RemesasView,
  marketplace: MarketplaceView,
  consorcio: ConsorcioView,
  alianzas: AlianzasBancariasView,
  fondos: FondosInversionView,
  tarjeta: TarjetaView,
  perfil: PerfilView,
  factoring: FactoringConsumerView,
};

export function ViewRouter() {
  const activeView = useKoraStore((s) => s.activeView);
  const ActiveView = VIEW_COMPONENTS[activeView];

  return (
    <div className="content">
      <div className="view show" key={activeView}>
        <ActiveView />
      </div>
    </div>
  );
}
