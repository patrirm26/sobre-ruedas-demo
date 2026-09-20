const RING1 = Array.from({ length: 6 }, (_, i) => (i * 360) / 6);
const RING2 = Array.from({ length: 9 }, (_, i) => (i * 360) / 9 + 18);

function polar(radius: number, deg: number) {
  const rad = (deg * Math.PI) / 180;
  return { x: 300 + radius * Math.cos(rad), y: 300 + radius * Math.sin(rad) };
}

/** Animación de fondo del login — una red de nodos orbitando un halo
 * central, con líneas "fluyendo" (dash animado) que representan
 * transacciones moviéndose por el ecosistema. Todo en SVG + CSS, sin
 * librerías ni JS de animación: dos grupos <g> rotando a velocidades
 * distintas (ver .pe-ring1/.pe-ring2 en components.css) y un dash-offset
 * animado en cada spoke. Reemplaza la foto de Los Próceres, que era
 * específica de Venezuela y no encajaba con un producto white-label
 * genérico. Deliberadamente sin el símbolo KORA en el centro — el logo
 * ya está arriba, en `.ll-top`. */
export function PaymentEcosystemAnimation() {
  return (
    <svg className="payment-ecosystem" viewBox="0 0 600 600" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="peCoreGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#4869ff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#4869ff" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="peBlobA" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#1b3fe0" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#1b3fe0" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="peBlobB" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#7fc4f2" stopOpacity="0.22" />
          <stop offset="100%" stopColor="#7fc4f2" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* atmósfera: manchas suaves flotando muy lento */}
      <circle className="pe-blob pe-blob-a" cx="140" cy="120" r="220" fill="url(#peBlobA)" />
      <circle className="pe-blob pe-blob-b" cx="480" cy="460" r="260" fill="url(#peBlobB)" />

      {/* trama de puntos tenue */}
      <g className="pe-grid" opacity="0.5">
        {Array.from({ length: 12 }, (_, r) =>
          Array.from({ length: 12 }, (_, c) => <circle key={`${r}-${c}`} cx={r * 55} cy={c * 55} r="1" fill="#ffffff" opacity="0.12" />)
        )}
      </g>

      {/* halo pulsante detrás del símbolo central */}
      <circle className="pe-core-glow" cx="300" cy="300" r="130" fill="url(#peCoreGlow)" />

      {/* anillo 2 (más lejos, más chico, gira al revés) */}
      <g className="pe-ring pe-ring2">
        {RING2.map((deg) => {
          const p = polar(240, deg);
          return (
            <g key={deg}>
              <line className="pe-spoke pe-spoke2" x1="300" y1="300" x2={p.x} y2={p.y} />
              <circle className="pe-node pe-node2" cx={p.x} cy={p.y} r="4" />
            </g>
          );
        })}
      </g>

      {/* anillo 1 (más cerca, más grande) */}
      <g className="pe-ring pe-ring1">
        {RING1.map((deg) => {
          const p = polar(150, deg);
          return (
            <g key={deg}>
              <line className="pe-spoke pe-spoke1" x1="300" y1="300" x2={p.x} y2={p.y} />
              <circle className="pe-node pe-node1" cx={p.x} cy={p.y} r="7" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}
