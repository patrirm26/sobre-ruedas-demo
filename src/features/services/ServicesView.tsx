import { useKoraStore } from '../../state/store';
import { selectActiveUser } from '../../state/selectors';
import type { ViewId } from '../../state/slices/uiSlice';
import type { AccountType } from '../../domain/user';

interface ServiceCard {
  view: ViewId;
  featured?: boolean;
  icon: string;
  bg: string;
  title: string;
  description: string;
  tags: { label: string; cls: string }[];
  /** Igual criterio que navConfig.tsx — ausente = visible para cualquier tipo de cuenta. */
  requiresAccountType?: AccountType;
}

const SERVICES: ServiceCard[] = [
  {
    view: 'tokens',
    icon: '◉',
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    title: 'Puntos',
    description:
      'Tu dinero venezolano en puntos, 1 punto = 1 bolívar al BCV del día. Gana cashback automático de 5 formas distintas, paga en el marketplace, transfiere a otros usuarios y mejora tu acceso a crédito.',
    tags: [
      { label: '5 CASHBACKS', cls: 'p-gold' },
      { label: '1 PUNTO = 1 Bs BCV', cls: 'p-gold' },
    ],
  },
  {
    view: 'creditos',
    icon: '◐',
    bg: 'rgba(230,160,25,.1)',
    title: 'KORA Créditos',
    description:
      'El primer crédito digital de Venezuela basado en tu comportamiento. Sin buró, sin garantes, sin papeleo. Tu KORA Score decide tu cupo y tu tasa.',
    tags: [
      { label: 'TASA DESDE 2,5%', cls: 'p-amber' },
      { label: 'HASTA $2.000', cls: 'p-amber' },
    ],
  },
  {
    view: 'cuotas',
    featured: true,
    icon: '▤',
    bg: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    title: 'KORA Cuotas',
    description:
      'Divide tus pagos al Estado, tus compras del marketplace y tus cuotas de comunidad en partes que sí puedes pagar. Sin buró, sin garantes — tu comportamiento en KORA es tu aval.',
    tags: [
      { label: 'DESDE SCORE 30', cls: 'p-blue' },
      { label: 'HASTA 12 CUOTAS', cls: 'p-blue' },
    ],
  },
  {
    view: 'govtech',
    featured: true,
    icon: '🏛',
    bg: 'rgba(214,69,80,.09)',
    title: 'Pagos al Estado',
    description:
      'Paga tus impuestos, aranceles, multas y trámites sin colas: tributos, registros, licencias, seguro social, vivienda y tu alcaldía — todo desde KORA, con comprobante al instante.',
    tags: [
      { label: 'SIN COLAS', cls: 'p-red' },
      { label: '+PUNTOS POR PAGAR', cls: 'p-gold' },
      { label: 'DIFIÉRELO EN CUOTAS', cls: 'p-violet' },
    ],
  },
  {
    view: 'copilot',
    featured: true,
    icon: '✦',
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    title: 'KORA Copilot',
    description:
      'Tu asistente con inteligencia artificial: te recuerda tus vencimientos con el Estado, te explica tu score, te dice qué crédito te conviene y responde por texto o por voz.',
    tags: [
      { label: 'GRATIS PARA TODOS', cls: 'p-violet' },
      { label: 'HABLA O ESCRIBE', cls: 'p-violet' },
    ],
  },
  {
    view: 'cobrar',
    icon: '▣',
    bg: 'rgba(31,169,113,.1)',
    title: 'Cobrar con QR',
    description:
      'Genera un código QR al instante y cobra desde cualquier banco. Tu cliente escanea, confirma y el dinero llega a tu cuenta en segundos.',
    tags: [
      { label: 'AL INSTANTE', cls: 'p-green' },
      { label: '+0,5% EN PUNTOS', cls: 'p-green' },
    ],
  },
  {
    view: 'cobrar',
    icon: '📲',
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    title: 'Pago Móvil',
    description:
      'Recibe Pago Móvil de cualquier banco venezolano. Se acredita y concilia solo — sin capturas de pantalla, sin confirmar manualmente, sin esperas.',
    tags: [
      { label: 'TODOS LOS BANCOS', cls: 'p-violet' },
      { label: 'AUTOMÁTICO', cls: 'p-violet' },
    ],
  },
  {
    view: 'cobrar',
    icon: '🔗',
    bg: 'rgba(31,169,113,.1)',
    title: 'Links de pago',
    description: 'Crea un link y cóbrale a cualquiera, tenga o no cuenta KORA. Ideal para freelancers y ventas por redes.',
    tags: [
      { label: 'SIN CUENTA', cls: 'p-green' },
      { label: 'EXPIRACIÓN FLEXIBLE', cls: 'p-green' },
    ],
  },
  {
    view: 'remesas',
    icon: '🌎',
    bg: 'color-mix(in srgb, var(--accent) 10%, transparent)',
    title: 'Remesas',
    description:
      'Envía dinero entre Venezuela, Argentina, Colombia, Perú y Chile con la tasa congelada por 15 minutos. Tu familia lo recibe en minutos, no en días.',
    tags: [
      { label: 'TASA CONGELADA 15 MIN', cls: 'p-blue' },
      { label: 'DESDE 1%', cls: 'p-blue' },
    ],
  },
  {
    view: 'consorcio',
    requiresAccountType: 'empresa',
    icon: '🏢',
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    title: 'Gestión Cobros y Pagos',
    description:
      'Administra los cobros de tu condominio, gremio, club o colegio. Cada miembro paga con su QR único y tú ves todo conciliado en tiempo real.',
    tags: [
      { label: 'COBRO RECURRENTE', cls: 'p-violet' },
      { label: 'CONCILIACIÓN AUTO', cls: 'p-violet' },
    ],
  },
  {
    view: 'marketplace',
    icon: '🛍',
    bg: 'rgba(214,69,80,.09)',
    title: 'Marketplace',
    description:
      'Vehículos nuevos, usados (C2C y C2B), motos, bicicletas y repuestos. Los usados van protegidos con Escrow: tu dinero se libera solo cuando confirmas el traspaso.',
    tags: [
      { label: 'ESCROW EN USADOS', cls: 'p-red' },
      { label: '+PUNTOS POR COMPRA', cls: 'p-gold' },
    ],
  },
  {
    view: 'alquiler',
    icon: '🔑',
    bg: 'color-mix(in srgb, var(--accent) 12%, transparent)',
    title: 'Alquiler',
    description:
      'Rent-a-car de corto plazo, renting corporativo para tu flota y alquiler entre particulares (P2P). Reserva por fecha y paga desde tu saldo.',
    tags: [
      { label: 'CORTO PLAZO', cls: 'p-blue' },
      { label: 'RENTING CORPORATIVO', cls: 'p-blue' },
      { label: 'P2P', cls: 'p-blue' },
    ],
  },
  {
    view: 'seguros',
    icon: '🛡',
    bg: 'rgba(31,169,113,.1)',
    title: 'Seguros',
    description:
      'Emite tu RCV obligatorio en un clic, contrata cobertura ampliada con daños propios y robo, o activa un microseguro pay-per-use solo los días que usas el carro.',
    tags: [
      { label: 'RCV EN 1 CLIC', cls: 'p-green' },
      { label: 'PAY-PER-USE', cls: 'p-green' },
    ],
  },
];

export function ServicesView() {
  const setActiveView = useKoraStore((s) => s.setActiveView);
  const activeUser = useKoraStore(selectActiveUser);
  const visibleServices = SERVICES.filter(
    (svc) => !svc.requiresAccountType || svc.requiresAccountType === activeUser?.accountType
  );

  return (
    <div className="svc-grid">
      {visibleServices.map((svc) => (
        <button
          key={svc.title}
          className={`svc ${svc.featured ? 'featured' : ''}`}
          onClick={() => setActiveView(svc.view)}
        >
          <span className="go">→</span>
          {svc.featured && <span className="star pill p-gold">★ NUEVO</span>}
          <div className="si" style={{ background: svc.bg }}>
            {svc.icon}
          </div>
          <h3>{svc.title}</h3>
          <p>{svc.description}</p>
          <div className="meta">
            {svc.tags.map((tag) => (
              <span key={tag.label} className={`pill ${tag.cls}`}>
                {tag.label}
              </span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}
