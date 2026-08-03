/**
 * Icono de Finanzas: signo de dólar con rayos alrededor ("sol de dinero").
 * Compatible con el uso de los iconos de Lucide en la navegación: acepta
 * `size`, `strokeWidth` y `className`, y hereda el color (currentColor).
 */
export function DollarSun({
  size = 24,
  strokeWidth = 2,
  className,
}: {
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Signo de dólar */}
      <line x1="12" y1="7.3" x2="12" y2="16.7" />
      <path d="M14.3 9.2c-.5-.8-1.3-1.3-2.3-1.3-1.3 0-2.3.7-2.3 1.8 0 1 .8 1.5 2.3 1.8 1.5.3 2.3.8 2.3 1.8 0 1.1-1 1.8-2.3 1.8-1 0-1.8-.5-2.3-1.3" />
      {/* Rayos */}
      <line x1="12" y1="2.5" x2="12" y2="4.8" />
      <line x1="12" y1="19.2" x2="12" y2="21.5" />
      <line x1="2.5" y1="12" x2="4.8" y2="12" />
      <line x1="19.2" y1="12" x2="21.5" y2="12" />
      <line x1="5.4" y1="5.4" x2="7" y2="7" />
      <line x1="17" y1="17" x2="18.6" y2="18.6" />
      <line x1="18.6" y1="5.4" x2="17" y2="7" />
      <line x1="7" y1="17" x2="5.4" y2="18.6" />
    </svg>
  );
}
