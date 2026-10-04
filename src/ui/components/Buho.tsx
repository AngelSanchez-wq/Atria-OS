type EstadoBuho = 'reposo' | 'foco' | 'logro';

type BuhoProps = {
  estado: EstadoBuho;
  /** Ancho en píxeles; la altura se ajusta sola. */
  tamano: number;
};

const ARCHIVOS: Record<EstadoBuho, string> = {
  reposo: 'images/buho-reposo.png',
  foco: 'images/buho-foco.png',
  logro: 'images/buho-logro.png',
};

const TEXTOS_ALT: Record<EstadoBuho, string> = {
  reposo: 'Búho en reposo',
  foco: 'Búho concentrado',
  logro: 'Búho celebrando un logro',
};

export function Buho({ estado, tamano }: BuhoProps) {
  return (
    <img
      src={`${import.meta.env.BASE_URL}${ARCHIVOS[estado]}`}
      alt={TEXTOS_ALT[estado]}
      className="h-auto select-none"
      style={{ width: tamano }}
    />
  );
}
