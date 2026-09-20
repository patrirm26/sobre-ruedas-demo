import { useState } from 'react';
import type { Card } from '../domain/card';

interface Props {
  card: Card;
  holderName: string;
}

/** Tarjeta digital de verdad — no el bloque de saldo genérico de antes.
 * El fondo es un motivo abstracto tech (gradiente asfalto→naranja + trazos
 * tipo circuito + la rueda de Sobre Ruedas como marca de agua), coherente
 * con la animación del ecosistema de pagos del login — no una foto ni una
 * escena figurativa. */
export function DigitalCard({ card, holderName }: Props) {
  const [showCvv, setShowCvv] = useState(false);
  const dimmed = card.status !== 'activa';

  return (
    <div className={`digital-card ${dimmed ? 'dimmed' : ''}`}>
      <svg className="dc-bg" viewBox="0 0 400 250" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="dcSky" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0d0f13" />
            <stop offset="55%" stopColor="#1a1d24" />
            <stop offset="100%" stopColor="#ff5a1f" />
          </linearGradient>
          <radialGradient id="dcGlow" cx="82%" cy="10%" r="60%">
            <stop offset="0%" stopColor="#ff8a52" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#ff8a52" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="250" fill="url(#dcSky)" />
        <rect width="400" height="250" fill="url(#dcGlow)" />

        {/* trazos tipo circuito — geometría, no figuración */}
        <g stroke="#ffb590" strokeWidth="1" fill="none" opacity="0.35">
          <path d="M0,40 L60,40 L80,60 L160,60" />
          <path d="M400,190 L330,190 L312,208 L230,208" />
          <path d="M20,250 L20,180 L45,155 L45,90" />
        </g>
        <g fill="#ffb590" opacity="0.55">
          <circle cx="80" cy="60" r="2.2" />
          <circle cx="160" cy="60" r="2.2" />
          <circle cx="45" cy="90" r="2.2" />
          <circle cx="230" cy="208" r="2.2" />
          <circle cx="312" cy="208" r="2.2" />
        </g>
        <g fill="#fff" opacity="0.6">
          <circle cx="55" cy="35" r="1.4" />
          <circle cx="300" cy="24" r="1.2" />
          <circle cx="340" cy="52" r="1.4" />
        </g>

        {/* marca de agua: rueda de Sobre Ruedas gigante, muy tenue */}
        <g transform="translate(205,60) scale(0.92)" opacity="0.1">
          <circle cx="115" cy="101" r="85" stroke="#fff" strokeWidth="10" fill="none" />
          <circle cx="115" cy="101" r="22" fill="#fff" />
          <path d="M115 20V60M115 142V182M40 145L70 128M160 74L190 57" stroke="#fff" strokeWidth="10" strokeLinecap="round" />
        </g>
      </svg>

      <div className="dc-row dc-top">
        <span className="dc-logo-badge dc-logo-badge--mark">
          <svg viewBox="0 0 40 40" fill="none" aria-hidden="true" style={{ width: '100%', height: '100%' }}>
            <circle cx="20" cy="20" r="16" stroke="#fff" strokeWidth="3" />
            <circle cx="20" cy="20" r="4.5" fill="#fff" />
            <path d="M20 9V15.5M20 24.5V31M10 26L15.5 22.6M24.5 17.4L30 14" stroke="#fff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        </span>
        <svg className="dc-contactless" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
          <path d="M8 8a6.5 6.5 0 010 8" />
          <path d="M11.3 5a11 11 0 010 14" />
          <path d="M14.6 2a15.5 15.5 0 010 20" />
        </svg>
      </div>

      <div className="dc-chip" aria-hidden="true" />

      <div className="dc-number">•••• •••• •••• {card.last4}</div>

      <div className="dc-row dc-bottom">
        <div className="dc-field">
          <span className="dc-field-label">Titular</span>
          <span className="dc-field-value dc-holder">{holderName.toUpperCase()}</span>
        </div>
        <div className="dc-field">
          <span className="dc-field-label">Vence</span>
          <span className="dc-field-value">
            {String(card.expiryMonth).padStart(2, '0')}/{String(card.expiryYear).slice(-2)}
          </span>
        </div>
        <div className="dc-field">
          <span className="dc-field-label">CVV</span>
          <button className="dc-cvv" onClick={() => setShowCvv((v) => !v)} aria-label={showCvv ? 'Ocultar CVV' : 'Ver CVV'}>
            {showCvv ? card.cvv : '•••'}
          </button>
        </div>
        <div className="dc-network">RUEDAS</div>
      </div>
    </div>
  );
}
