export interface ShippingAddress {
  id: string;
  accountId: string;
  fullName: string;
  phone: string;
  /** Calle/avenida/edificio/piso/apto — sin código postal, como en el
   * formato de direcciones venezolano real. */
  line1: string;
  /** "Municipio, Ciudad, Estado" */
  cityState: string;
  reference?: string;
}

export interface ShippingCarrier {
  id: string;
  name: string;
  etaLabel: string;
}

/** Los 4 courier reales que operan en Venezuela — todos con envío
 * gratis en KORA (mismo copy "Compra protegida" de la Tienda), difieren
 * solo en el tiempo de entrega estimado. */
export const SHIPPING_CARRIERS: ShippingCarrier[] = [
  { id: 'mrw', name: 'MRW', etaLabel: 'Llega en 1-2 días hábiles' },
  { id: 'zoom', name: 'Zoom', etaLabel: 'Llega en 2-3 días hábiles' },
  { id: 'tealca', name: 'Tealca', etaLabel: 'Llega en 2-4 días hábiles' },
  { id: 'domesa', name: 'Domesa', etaLabel: 'Llega en 3-5 días hábiles' },
];
