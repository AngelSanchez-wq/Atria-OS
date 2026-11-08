import { EstadoProceso } from '../../kernel/types';
import { GravedadEvento } from '../../kernel/logs/types';

export type PildoraEstadoProps = {
  estado?: EstadoProceso;
  gravedad?: GravedadEvento;
  texto?: string;
  className?: string;
};

const CLASES_POR_ESTADO: Record<EstadoProceso, string> = {
  'En ejecución': 'bg-soft text-accent-strong border border-accent/30',
  'Listo': 'bg-soft/70 text-accent-strong',
  'Bloqueado': 'bg-warm text-warm-ink border border-warm-line',
  'Pausado': 'bg-line text-muted',
  'Nuevo': 'bg-line/50 text-muted',
  'Terminado': 'bg-line/30 text-muted line-through',
};

export function PildoraEstado({
  estado,
  gravedad,
  texto,
  className = '',
}: PildoraEstadoProps) {
  if (gravedad === 'aviso' || texto === 'Aviso') {
    return (
      <span
        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-warm text-warm-ink border border-warm-line select-none ${className}`}
      >
        {texto ?? 'Aviso'}
      </span>
    );
  }

  const clases = (estado && CLASES_POR_ESTADO[estado]) || 'bg-line text-muted';

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${clases} ${className}`}
    >
      {texto ?? estado}
    </span>
  );
}
