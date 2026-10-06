import { EstadoProceso } from '../../kernel/types';

type PildoraEstadoProps = {
  estado: EstadoProceso;
};

const CLASES_POR_ESTADO: Record<EstadoProceso, string> = {
  'En ejecución': 'bg-soft text-accent-strong border border-accent/30',
  'Listo': 'bg-soft/70 text-accent-strong',
  'Bloqueado': 'bg-warm text-warm-ink border border-warm-line',
  'Pausado': 'bg-line text-muted',
  'Nuevo': 'bg-line/50 text-muted',
  'Terminado': 'bg-line/30 text-muted line-through',
};

export function PildoraEstado({ estado }: PildoraEstadoProps) {
  const clases = CLASES_POR_ESTADO[estado] || 'bg-line text-muted';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${clases}`}
    >
      {estado}
    </span>
  );
}
