import { useState } from 'react';
import { useKoraStore } from '../../state/store';
import { selectActiveAccount } from '../../state/selectors';
import { useCartLines } from '../../lib/useCartLines';
import { useEscapeToClose } from '../../lib/useEscapeToClose';
import { SHIPPING_CARRIERS } from '../../domain/shipping';
import type { Order } from '../../domain/marketplace';
import { OrderSummary } from './checkout/OrderSummary';
import { AddressStep } from './checkout/AddressStep';
import { ShippingStep } from './checkout/ShippingStep';
import { PaymentStep, type CheckoutReceipt } from './checkout/PaymentStep';
import { SuccessStep } from './checkout/SuccessStep';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = 'address' | 'shipping' | 'payment' | 'success';
const STEPS: Step[] = ['address', 'shipping', 'payment', 'success'];

export function CheckoutModal({ onClose, onSuccess }: Props) {
  const account = useKoraStore(selectActiveAccount);
  const merchants = useKoraStore((s) => s.merchants);
  const addresses = useKoraStore((s) => (account ? s.addresses[account.id] : undefined));

  const lines = useCartLines();

  const [step, setStep] = useState<Step>('address');
  const [addressId, setAddressId] = useState<string | undefined>(addresses?.[0]?.id);
  const [carrierId, setCarrierId] = useState<string | undefined>(undefined);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  // Foto del pedido tomada justo antes de vaciar el carrito — la pantalla de
  // éxito la necesita porque para entonces `lines` (derivado del carrito en
  // vivo) ya está vacío.
  const [receipt, setReceipt] = useState<CheckoutReceipt | null>(null);

  const handleClose = () => (step === 'success' ? onSuccess() : onClose());
  useEscapeToClose(handleClose);

  const totalCents = lines.reduce((sum, l) => sum + l.product.priceCents * l.item.qty, 0);
  const merchantId = lines[0]?.product.merchantId;
  const merchant = merchantId ? merchants[merchantId] : undefined;
  const carrier = SHIPPING_CARRIERS.find((c) => c.id === carrierId);

  if (!account) return null;
  if (step !== 'success' && (lines.length === 0 || !merchant)) return null;

  const stepIndex = STEPS.indexOf(step);

  return (
    <div className="overlay show" onClick={(e) => e.target === e.currentTarget && handleClose()}>
      <div className="modal checkout" role="dialog" aria-modal="true">
        <div className="m-head">
          <div>
            <h3>{step === 'success' ? 'Pedido confirmado' : `Pagar en ${merchant?.name ?? ''}`}</h3>
            {step !== 'success' && (
              <p>
                {lines.length} producto{lines.length > 1 ? 's' : ''}
              </p>
            )}
          </div>
          <button className="m-x" onClick={handleClose} aria-label="Cerrar">
            ✕
          </button>
        </div>

        {step !== 'success' && (
          <div className="checkout-steps">
            {STEPS.slice(0, 3).map((s, i) => (
              <div key={s} className={`checkout-step-dot ${i < stepIndex ? 'done' : ''} ${i === stepIndex ? 'active' : ''}`} />
            ))}
          </div>
        )}

        {step === 'success' && receipt ? (
          <SuccessStep
            order={completedOrder!}
            lines={receipt.lines}
            totalCents={receipt.totalCents}
            carrierEtaLabel={carrier?.etaLabel ?? ''}
            onDone={onSuccess}
          />
        ) : merchant ? (
          <div className="checkout-grid">
            <div>
              {step === 'address' && (
                <AddressStep accountId={account.id} selectedId={addressId} onSelect={setAddressId} onContinue={() => setStep('shipping')} />
              )}
              {step === 'shipping' && (
                <ShippingStep
                  selectedId={carrierId}
                  onSelect={setCarrierId}
                  onBack={() => setStep('address')}
                  onContinue={() => setStep('payment')}
                />
              )}
              {step === 'payment' && (
                <PaymentStep
                  account={account}
                  merchant={merchant}
                  lines={lines}
                  totalCents={totalCents}
                  onBack={() => setStep('shipping')}
                  onPaid={(order, paidReceipt) => {
                    setCompletedOrder(order);
                    setReceipt(paidReceipt);
                    setStep('success');
                  }}
                />
              )}
            </div>
            <OrderSummary lines={lines} totalCents={totalCents} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
