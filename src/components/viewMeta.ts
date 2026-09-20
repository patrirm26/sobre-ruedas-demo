import type { ViewId } from '../state/slices/uiSlice';

/** Título/subtítulo del topbar por vista — copy migrado del objeto VIEWS original.
 * "home" usa el nombre del usuario activo en vez de un saludo fijo. */
export const VIEW_META: Record<ViewId, { title: string; subtitle: string }> = {
  home: { title: 'Hola', subtitle: 'Tu dinero, tus puntos y tu crédito en un solo lugar' },
  services: { title: 'Servicios', subtitle: 'Todo lo que puedes hacer con KORA' },
  historial: { title: 'Actividad', subtitle: 'Todos tus movimientos en un solo lugar' },
  tokens: { title: 'Puntos', subtitle: 'Tu dinero en puntos · 1 punto = 1 Bs al BCV del día' },
  creditos: { title: 'KORA Créditos', subtitle: 'Crédito digital basado en tu comportamiento' },
  cobrar: { title: 'Cobrar', subtitle: 'QR, Pago Móvil y links de cobro' },
  pagar: { title: 'Pagar', subtitle: 'Envía dinero a cualquier persona o comercio' },
  remesas: { title: 'Remesas', subtitle: 'Envía a tu familia con la tasa congelada' },
  marketplace: { title: 'Marketplace', subtitle: 'Vehículos, motos, bicicletas y repuestos — con Escrow en usados' },
  consorcio: { title: 'Gestión Cobros y Pagos', subtitle: 'Condominios, gremios, clubes y colegios' },
  alianzas: { title: 'Alianzas Bancarias', subtitle: 'Vincula tu banco para fondear y retirar por Pago Móvil' },
  fondos: { title: 'Fondos de Inversión', subtitle: 'Haz crecer tu saldo en USD con rendimiento real' },
  tarjeta: { title: 'Mi Tarjeta KORA', subtitle: 'Tu tarjeta ligada al saldo en USD, con cashback en cada compra' },
  govtech: { title: 'Pagos al Estado', subtitle: 'INTT, SENIAT, impuestos y trámites vehiculares — sin colas' },
  cuotas: { title: 'KORA Cuotas', subtitle: 'Divide tus pagos en partes que sí calzan' },
  copilot: { title: 'KORA Copilot', subtitle: 'Tu asistente financiero con inteligencia artificial' },
  perfil: { title: 'Mi perfil', subtitle: 'Tus datos, tu verificación y tu seguridad' },
  factoring: { title: 'Factoring', subtitle: 'Adelanta el cobro de tus facturas' },
  seguros: { title: 'Seguros', subtitle: 'RCV en un clic, cobertura ampliada y microseguro pay-per-use' },
  alquiler: { title: 'Alquiler', subtitle: 'Corto plazo, renting corporativo y P2P' },
};
