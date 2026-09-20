interface GaugeProps {
  value: number; // 0-100
  size?: number;
  strokeWidth?: number;
  color?: string;
  label?: string;
}

/** Anillo de progreso circular usado en Inicio/Créditos/Cuotas — migrado del
 * `.gauge` original (SVG rotado -90° + texto centrado absoluto). */
export function Gauge({ value, size = 76, strokeWidth = 7, color = 'var(--accent2)', label = 'SCORE' }: GaugeProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - Math.min(Math.max(value, 0), 100) / 100);

  return (
    <div className="gauge" style={{ width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--surface3)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="gtxt">
        <b>{Math.round(value)}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}
