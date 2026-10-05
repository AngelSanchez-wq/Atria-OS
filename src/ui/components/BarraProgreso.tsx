type ColorBarra = 'acento' | 'calido';

type BarraProgresoProps = {
  /** Valor entre 0 y 100. */
  valor: number;
  color: ColorBarra;
  /** Texto para lectores de pantalla (aria-label). */
  etiqueta: string;
  className?: string;
};

const CLASE_RELLENO: Record<ColorBarra, string> = {
  acento: 'bg-accent',
  calido: 'bg-warm',
};

export function BarraProgreso({ valor, color, etiqueta, className = 'w-[200px]' }: BarraProgresoProps) {
  const valorSeguro = Math.min(100, Math.max(0, Math.round(valor)));

  return (
    <div
      role="progressbar"
      aria-label={etiqueta}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={valorSeguro}
      className={`h-[3px] overflow-hidden rounded-full bg-line ${className}`}
    >
      <div
        className={`h-full ${CLASE_RELLENO[color]}`}
        style={{ width: `${valorSeguro}%` }}
      />
    </div>
  );
}
